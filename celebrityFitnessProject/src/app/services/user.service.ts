import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';

import { BehaviorSubject, catchError, firstValueFrom, from, lastValueFrom, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { User } from '../models/user';
import { AuthService } from './auth.service';
import { AuthStateService } from './authstate.service';
import { FormService } from '../shared/Multi-Step-Form/form/form.service';
import { CustomOAuthService } from './oauth.service';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase.config';
import { ImageUrlManagerService } from './imageurlmanager.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  baseURL: string = "http://localhost:3000/api/users"
  tokenKey: string = "token";
  tierKey: string = "tier";
  userIdKey: string = "userId";

  private oauthService!: CustomOAuthService;

  private isGoogleAuthEnabledSubject = new BehaviorSubject<boolean>(false);
  isGoogleAuthEnabled$ = this.isGoogleAuthEnabledSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private authStateService: AuthStateService, private injector: Injector,
    private imageUrlManager: ImageUrlManagerService
  ) {
    // this.oauthService.isAuthenticated$.subscribe(isAuthenticated => {
    //   this.isLoggedInSubject.next(isAuthenticated);
    // });
    this.authStateService.isAuthenticated$.subscribe(
      isAuthenticated => this.isLoggedInSubject.next(isAuthenticated && this.checkLocalStorageAuth())
    );
   }

  // private isLoggedInSubject = new BehaviorSubject<boolean>(this.isloggedIn());
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkInitialLoginState());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // Observable for components to subscribe to
  // isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // getUserId(): string | null {
  //   const currentUser = auth.currentUser;
  //   return currentUser ? currentUser.uid : null;
  // }

  private checkInitialLoginState(): boolean {
    return this.checkLocalStorageAuth() && this.authStateService.checkAuthStatus();
  }

  private getOAuthService(): CustomOAuthService {
    if (!this.oauthService) {
      this.oauthService = this.injector.get(CustomOAuthService);
    }
    return this.oauthService;
  }

  private checkLocalStorageAuth(): boolean {
    return !!localStorage.getItem(this.tokenKey) && 
           !!localStorage.getItem(this.userIdKey) && 
           (localStorage.getItem('isUserLoggedIn') === 'true' || 
            !!localStorage.getItem('user'));
  }

  checkEmailAvailability(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseURL}/check-email/${email}`);
  }

  signUp(newUser: User) {
    return this.http.post(`${this.baseURL}/`, newUser)
}

// login(email: string, password: string){
//   let request = { email, password };

//   return this.http.post(`${this.baseURL}/login`, request)
//     .pipe(tap((response: any) => {
//       localStorage.setItem(this.tokenKey, response.token);
//       localStorage.setItem(this.userIdKey , response.userId);
//       localStorage.setItem(this.tierKey, response.tier);
//       localStorage.setItem('billing', response.paymentFrequency);
//     }));
// }

// login(email: string, password: string) {
//   let request = { email, password };

//   return this.http.post(`${this.baseURL}/login`, request)
//     .pipe(tap((response: any) => {
//       this.updateLoginStatus(true);
//       this.handleSuccessfulAuth(response);
//       return response;
//     }));
// }

// login(email: string, password: string) {
//   let request = { email, password };

//   return this.http.post(`${this.baseURL}/login`, request).pipe(
//     switchMap(async (response: any) => {
//       // First handle your regular auth flow
//       this.updateLoginStatus(true);
//       this.handleSuccessfulAuth(response);

//       try {
//         // Then get a Firebase token and sign in
//         const firebaseToken = await this.getFirebaseToken(response.token);
//         await signInWithCustomToken(auth, firebaseToken);
//         console.log('Firebase auth successful');
//       } catch (error) {
//         console.error('Firebase auth error:', error);
//         // Don't fail the login if Firebase auth fails
//       }

//       return response;
//     }),
//     catchError(error => {
//       console.error('Login error:', error);
//       throw error;
//     })
//   );
// }

login(email: string, password: string) {
  let request = { email, password };

  return this.http.post(`${this.baseURL}/login`, request).pipe(
    tap((response: any) => {
      this.updateLoginStatus(true);
      this.handleSuccessfulAuth(response);
    }),
    catchError(error => {
      console.error('Login error:', error);
      return throwError(() => error); // Ensure the error is properly returned
    })
  );
}

async authenticateWithFirebase(backendToken: string): Promise<void> {
  try {
    const firebaseToken = await this.getFirebaseToken(backendToken);
    await signInWithCustomToken(auth, firebaseToken);
    console.log('Firebase auth successful');
  } catch (error) {
    console.error('Firebase auth error:', error);
    // Log the error but don’t disrupt the user's session
  }
}

async getFirebaseToken(backendToken: string): Promise<string> {
  try {
    const response = await fetch(`${this.baseURL}/auth/firebase-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${backendToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get Firebase token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.firebaseToken;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    throw error;
  }
}

async refreshFirebaseAuth(): Promise<void> {
  const token = localStorage.getItem(this.tokenKey);
  if (!token) {
    throw new Error('No auth token found');
  }

  try {
    const firebaseToken = await this.getFirebaseToken(token);
    const userCredential = await signInWithCustomToken(auth, firebaseToken);
    console.log('Firebase auth refreshed:', userCredential.user);
  } catch (error) {
    console.error('Failed to refresh Firebase auth:', error);
    throw error;
  }
}

private handleSuccessfulAuth(response: any) {
  localStorage.setItem(this.tokenKey, response.token);
  localStorage.setItem(this.userIdKey, response.userId);
  localStorage.setItem(this.tierKey, response.tier);
  localStorage.setItem('billing', response.paymentFrequency);
  localStorage.setItem('isUserLoggedIn', 'true');
  this.updateLoginStatus(true);
}

  loginWithGoogle(token: string): Observable<any> {
    return this.http.post<any>(`${this.baseURL}/login-google`, { token }).pipe(
      tap((response: any) => {
        this.authService.login(response.token, false); // We use false here because we want to log in the user
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('tier', response.tier);
        localStorage.setItem('billing', response.billing);
      })
    );
  }

// isloggedIn() {
//   return !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey) && localStorage.getItem('isUserLoggedIn') === 'true';
// }

// isloggedIn(): boolean {
//   const isLoggedIn = !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey) && localStorage.getItem('isUserLoggedIn') === 'true' || !!localStorage.getItem('user');
//   // console.log('UserService: isLoggedIn:', isLoggedIn);
//   return isLoggedIn;
// }

// isloggedIn(): Observable<boolean> {
//   const localStorageCheck = !!localStorage.getItem(this.tokenKey) && 
//                             !!localStorage.getItem(this.userIdKey) && 
//                             (localStorage.getItem('isUserLoggedIn') === 'true' || 
//                              !!localStorage.getItem('user'));

//   return this.authStateService.getAuthState().pipe(
//     take(1),
//     map(authState => {
//       const isLoggedIn = localStorageCheck && authState;
//       // console.log('UserService: isLoggedIn:', isLoggedIn);
//       return isLoggedIn;
//     })
//   );
// }

// isloggedIn(): Observable<boolean> {
//   return this.isLoggedIn$;
// }

isloggedIn(): Observable<boolean> {
  // Update current state before returning observable
  const currentState = this.authService.isAuthenticated();
  this.isLoggedInSubject.next(currentState);
  
  return this.isLoggedInSubject.asObservable().pipe(
      tap(isLoggedIn => {
          if (!isLoggedIn) {
              // Clear all auth-related tokens
              localStorage.removeItem('token');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('googleAuthToken');
              // this.isLoggedInSubject.next(false);
          }
      })
  );
}

// private checkInitialLoginState(): boolean {
//   return this.checkLocalStorageAuth() && 
//          this.authStateService.checkAuthStatus() && 
//          this.authService.isAuthenticated();
// }



logoutUser() {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem('billing');
  localStorage.removeItem(this.tierKey);
  localStorage.removeItem(this.userIdKey);
  // localStorage.removeItem("cart");
  // localStorage.removeItem("hasVisitedHomeBefore");
  localStorage.removeItem("hasVisitedProfileBefore");
  localStorage.removeItem("isUserLoggedIn");
  localStorage.removeItem("token");
  localStorage.removeItem("googleAuthToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("authToken");
  this.updateLoginStatus(false);
  this.setGoogleAuthEnabled(false);
  // this.authStateService.setAuthenticationState(false);
  this.authService.authStateSubject.next(false);

  const oauthService = this.getOAuthService();
    oauthService.logout().subscribe(() => {
      oauthService.setAuthenticationState(false);
    });
}

checkUserExists(email: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.baseURL}/check-user-exists/${email}`);
}

checkEmail(email: string): Observable<{exists: boolean, message: string}> {
  return this.http.post<{exists: boolean, message: string}>(`${this.baseURL}/check-email`, { email });
}

// getUserId() {
//   if (this.isloggedIn()) {
//     return localStorage.getItem(this.userIdKey) ?? "";
//   }
//   return "undefined";
// }

getUserId(): string {
  const userId = localStorage.getItem(this.userIdKey) || localStorage.getItem('user');
  
  if (userId) {
    if (userId.startsWith('{')) {
      // It's a JSON string, parse it
      try {
        const userObject = JSON.parse(userId);
        return userObject.userId || '';
      } catch (error) {
      }
    } else {
      return userId;
    }
  }
  
  return '';
}


// getUserId(): string | ''{
//   const currentUser = auth.currentUser;
//   return currentUser ? currentUser.uid : '';
// }

// getUser(userId: string): Observable<User> {
//   console.log('Getting user profile:', {
//     requestedId: userId,
//     authUserId: auth.currentUser?.uid,
//     isOwnProfile: userId === auth.currentUser?.uid
//   });
  
//   return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
// }

// signUpWithGoogle(userData: any): Observable<User> {
//   return this.http.post<User>(`${this.baseURL}/signup-google`, userData);
// }

// updateUser(updatedUser: User): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//     return this.http.put<User>(this.baseURL + "/" + updatedUser.userId, updatedUser, {headers: reqHeaders});
//   }

// updateUser(updatedUser: User): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   };
//   // Use the /data/ endpoint for all updates
//   return this.http.put<User>(`${this.baseURL}/data/${updatedUser.userId}`, updatedUser, { headers: reqHeaders })
//   .pipe(
//     tap(response => {
//       // Update the user in localStorage, preserving the imgUrl if it's not being updated
//       const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
//       const updatedStoredUser = {
//         ...storedUser,
//         ...response,
//         imgUrl: updatedUser.imgUrl || storedUser.imgUrl
//       };
//       localStorage.setItem('user', JSON.stringify(updatedStoredUser));
//     })
//   );
// // }

// updateUser(updatedUser: User): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   };

//   // Prepare the user data for the API
//   const userForApi = {
//     ...updatedUser,
//     profilePictureSettings: updatedUser.profilePictureSettings 
//       ? JSON.stringify(updatedUser.profilePictureSettings) 
//       : null
//   };

//   // Use the /data/ endpoint for all updates
//   return this.http.put<User>(`${this.baseURL}/data/${updatedUser.userId}`, userForApi, { headers: reqHeaders })
//     .pipe(
//       map(response => {
//         // Parse the profilePictureSettings if it exists in the response
//         if (typeof response.profilePictureSettings === 'string') {
//           response.profilePictureSettings = JSON.parse(response.profilePictureSettings);
//         }
//         // If profilePictureSettings come back as null, use the ones we sent
//         if (response.profilePictureSettings === null && updatedUser.profilePictureSettings) {
//           response.profilePictureSettings = updatedUser.profilePictureSettings;
//         }
//         return response;
//       }),
//       tap(response => {
//         // Update the user in localStorage, preserving the imgUrl if it's not being updated
//         console.log('Updated user:', response);
//         const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
//         const updatedStoredUser = {
//           ...storedUser,
//           ...response,
//           imgUrl: updatedUser.imgUrl || storedUser.imgUrl,
//           profilePictureSettings: response.profilePictureSettings || storedUser.profilePictureSettings
//         };
//         localStorage.setItem('user', JSON.stringify(updatedStoredUser));
//       })
//     );
// }

// async updateUser(updatedUser: User): Promise<User> {
//   try {
//     // Wait for and validate token
//     const token = await this.authService.waitForToken();
//     if (!token) {
//       throw new Error('Not authenticated');
//     }

//     const headers = {
//       Authorization: `Bearer ${token}`
//     };

//     // Prepare user data with proper profilePictureSettings handling
//     const userForApi = {
//       ...updatedUser,
//       profilePictureSettings: updatedUser.profilePictureSettings 
//         ? JSON.stringify(updatedUser.profilePictureSettings) 
//         : null
//     };

//     // Make API request with error handling
//     const response = await firstValueFrom(
//       this.http.put<User>(
//         `${this.baseURL}/data/${updatedUser.userId}`, 
//         userForApi, 
//         { headers }
//       ).pipe(
//         map(response => {
//           // Parse profilePictureSettings if it exists
//           if (typeof response.profilePictureSettings === 'string') {
//             try {
//               response.profilePictureSettings = JSON.parse(response.profilePictureSettings);
//             } catch (e) {
//               console.error('Error parsing profilePictureSettings:', e);
//               // Fallback to original settings if parsing fails
//               response.profilePictureSettings = updatedUser.profilePictureSettings;
//             }
//           }

//           // Use original settings if response settings are null
//           if (response.profilePictureSettings === null && updatedUser.profilePictureSettings) {
//             response.profilePictureSettings = updatedUser.profilePictureSettings;
//           }

//           return response;
//         }),
//         tap(response => {
//           // Update localStorage with proper merging of existing data
//           try {
//             const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
//             const updatedStoredUser = {
//               ...storedUser,
//               ...response,
//               // Preserve existing imgUrl if not being updated
//               imgUrl: updatedUser.imgUrl || storedUser.imgUrl,
//               // Preserve existing settings if not in response
//               profilePictureSettings: response.profilePictureSettings || 
//                                     updatedUser.profilePictureSettings || 
//                                     storedUser.profilePictureSettings
//             };
//             localStorage.setItem('user', JSON.stringify(updatedStoredUser));
//             console.log('Updated user in localStorage:', updatedStoredUser);
//           } catch (e) {
//             console.error('Error updating localStorage:', e);
//             // Don't fail the update if localStorage fails
//           }
//         })
//       )
//     );

//     return response;

//   } catch (error) {
//     console.error('Error updating user:', error);
    
//     // Handle specific error cases
//     if (error instanceof HttpErrorResponse) {
//       switch (error.status) {
//         case 401:
//           this.authService.logout();
//           throw new Error('Authentication expired');
//         case 403:
//           throw new Error('Not authorized to update user');
//         case 404:
//           throw new Error('User not found');
//         default:
//           throw new Error('Failed to update user');
//       }
//     }

//     // Re-throw original error if not HTTP error
//     throw error;
//   }
// }

updateUser(updatedUser: User): Observable<User> {
  // Create an observable from the token check
  return from(this.authService.waitForToken()).pipe(
    switchMap(token => {
      if (!token) {
        return throwError(() => new Error('Not authenticated'));
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      // Prepare user data with proper profilePictureSettings handling
      const userForApi = {
        ...updatedUser,
        profilePictureSettings: updatedUser.profilePictureSettings 
          ? JSON.stringify(updatedUser.profilePictureSettings) 
          : null
      };

      return this.http.put<User>(
        `${this.baseURL}/data/${updatedUser.userId}`, 
        userForApi, 
        { headers }
      ).pipe(
        map(response => {
          // Parse profilePictureSettings if it exists
          if (typeof response.profilePictureSettings === 'string') {
            try {
              response.profilePictureSettings = JSON.parse(response.profilePictureSettings);
            } catch (e) {
              console.error('Error parsing profilePictureSettings:', e);
              // Fallback to original settings if parsing fails
              response.profilePictureSettings = updatedUser.profilePictureSettings;
            }
          }

          // Use original settings if response settings are null
          if (response.profilePictureSettings === null && updatedUser.profilePictureSettings) {
            response.profilePictureSettings = updatedUser.profilePictureSettings;
          }

          return response;
        }),
        tap(response => {
          // Update localStorage with proper merging of existing data
          try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedStoredUser = {
              ...storedUser,
              ...response,
              // Preserve existing imgUrl if not being updated
              imgUrl: updatedUser.imgUrl || storedUser.imgUrl,
              // Preserve existing settings if not in response
              profilePictureSettings: response.profilePictureSettings || 
                                    updatedUser.profilePictureSettings || 
                                    storedUser.profilePictureSettings
            };
            localStorage.setItem('user', JSON.stringify(updatedStoredUser));
            console.log('Updated user in localStorage:', updatedStoredUser);
          } catch (e) {
            console.error('Error updating localStorage:', e);
            // Don't fail the update if localStorage fails
          }
        }),
        catchError(error => {
          console.error('Error updating user:', error);
          
          if (error instanceof HttpErrorResponse) {
            switch (error.status) {
              case 401:
                this.authService.logout();
                return throwError(() => new Error('Authentication expired'));
              case 403:
                return throwError(() => new Error('Not authorized to update user'));
              case 404:
                return throwError(() => new Error('User not found'));
              default:
                return throwError(() => new Error('Failed to update user'));
            }
          }
          return throwError(() => error);
        })
      );
    })
  );
}

async updateProfile(userData: any): Promise<any> {
  try {
    // Get current userId and token
    const userId = this.getUserId();
    const token = localStorage.getItem(this.tokenKey);
    
    if (!userId) {
      throw new Error('User ID not found');
    }
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Updating profile for user:', {
      userId,
      providedId: userData.id,
      imageUrl: userData.imgUrl
    });

    // Ensure we're using the correct user ID
    const dataToUpdate = {
      ...userData,
      userId: userId // Ensure userId is set
    };

    // Make the HTTP request with authorization header
    const response = await lastValueFrom(
      this.http.put(`${this.baseURL}/data/${userId}`, dataToUpdate, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Profile update error:', {
            status: error.status,
            message: error.message,
            error: error.error
          });
          throw error;
        })
      )
    );

    // Convert any image URLs in the response
    const updatedUser = response as any;
    if (updatedUser?.imgUrl) {
      updatedUser.imgUrl = await this.imageUrlManager.getDisplayUrl(
        userId,
        updatedUser.imgUrl
      );
    }

    // Update local storage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedStoredUser = {
      ...storedUser,
      ...updatedUser
    };
    localStorage.setItem('user', JSON.stringify(updatedStoredUser));

    return updatedUser;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

  checkPassword(userId: string, password: string): Observable<boolean> {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.post<boolean>(`${this.baseURL}/check-password/${userId}`, { password }, { headers: reqHeaders });
  }

  updatePassword(userId: string, newPassword: string): Observable<any> {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.put<any>(`${this.baseURL}/update-password/${userId}`, { newPassword }, { headers: reqHeaders });
  }

  getUser(userId: string): Observable<User> {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.get<User>(this.baseURL + "/" + userId, {headers: reqHeaders}).pipe(
      map(user => {
        if (typeof user.profilePictureSettings === 'string') {
          try {
            user.profilePictureSettings = JSON.parse(user.profilePictureSettings);
          } catch (e) {
            console.error('Error parsing profilePictureSettings:', e);
            user.profilePictureSettings = null;
          }
        }
        return user;
      })
    );
  }
  
deleteUser(userId: string) : Observable<any> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  }
  return this.http.delete<any>(this.baseURL + "/" + userId, {headers: reqHeaders});
}

updateLoginStatus(status: boolean) {
  this.isLoggedInSubject.next(status);
  this.authStateService.setAuthState(status);
}

setGoogleAuthEnabled(value: boolean) {
  this.isGoogleAuthEnabledSubject.next(value);
}

// saveProfilePicturePosition(userId: string, position: { x: number, y: number }) {
//   return this.http.post(`/api/user/${userId}/profile-picture-position`, position);
// }

// getProfilePicturePosition(userId: string) {
//   return this.http.get<{ x: number, y: number }>(`/api/user/${userId}/profile-picture-position`);
// }

requestPasswordReset(email: string): Observable<any> {
  return this.http.post(`${this.baseURL}/request-reset`, { email });
}

resetPassword(token: string, newPassword: string): Observable<any> {
  return this.http.post(`${this.baseURL}/reset-password/${token}`, { password: newPassword });
}

updateUserWithImage(userId: string, userData: User): Observable<User> {
  return this.http.patch<User>(`${this.baseURL}/users/${userId}`, {
    ...userData,
    imgUrl: userData.imgUrl,
    profilePictureSettings: userData.profilePictureSettings
  });
}

// Add method to delete old image if needed
deleteOldImage(userId: string, oldImageUrl: string): Observable<any> {
  return this.http.delete(`${this.baseURL}/users/${userId}/image`, {
    body: { imageUrl: oldImageUrl }
  });
}

async getUploadSignedUrl(userId: string, fileName: string, contentType: string): Promise<{ signedUrl: string }> {
  const storage = getStorage();
  const fileRef = ref(storage, `profileImages/${userId}/${Date.now()}-${fileName}`);
  
  // Return a promise that resolves with the reference path
  return Promise.resolve({ signedUrl: fileRef.fullPath });
}

updateProfileImage(userId: string, imageUrl: string): Observable<User> {
  const reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  };

  const updateData = {
    imgUrl: imageUrl,
    profilePictureSettings: {
      zoom: 1,
      x: 0,
      y: 0
    }
  };

  return this.http.put<User>(`${this.baseURL}/profile-image/${userId}`, updateData, { headers: reqHeaders })
    .pipe(
      map(response => {
        // Update local storage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          imgUrl: imageUrl,
          profilePictureSettings: updateData.profilePictureSettings
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return response;
      })
    );
}

// async updateProfilePicture(userId: string, fileName: string, profilePictureSettings: any): Promise<any> {
//   const token = await this.authService.getToken();
//   const headers = new HttpHeaders()
//     .set('Authorization', `Bearer ${token}`)
//     .set('Content-Type', 'application/json');

//   const body = {
//     fileName,
//     profilePictureSettings,
//   };

//   return this.http.put(`${this.baseURL}/images/profile-picture/${userId}`, body, { headers }).toPromise();
// }

// Helper method to handle image upload
uploadImage(userId: string, file: File): Observable<string> {
  return from(this.getUploadSignedUrl(userId, file.name, file.type)).pipe(
    switchMap(({ signedUrl }) => {
      const storage = getStorage();
      const storageRef = ref(storage, signedUrl);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Return a new Observable that tracks the upload
      return new Observable<string>(observer => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            observer.error(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              observer.next(downloadURL);
              observer.complete();
            } catch (error) {
              observer.error(error);
            }
          }
        );
      });
    })
  );
}
}
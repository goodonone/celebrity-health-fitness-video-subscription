import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';

import { BehaviorSubject, catchError, map, Observable, take, tap, throwError } from 'rxjs';
import { User } from '../models/user';
import { AuthService } from './auth.service';
import { AuthStateService } from './authstate.service';
import { FormService } from '../shared/Multi-Step-Form/form/form.service';
import { CustomOAuthService } from './oauth.service';



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

  constructor(private http: HttpClient, private authService: AuthService, private authStateService: AuthStateService, private injector: Injector) {
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

login(email: string, password: string) {
  let request = { email, password };

  return this.http.post(`${this.baseURL}/login`, request)
    .pipe(tap((response: any) => {
      this.updateLoginStatus(true);
      this.handleSuccessfulAuth(response);
      return response;
      // localStorage.setItem(this.tokenKey, response.token);
      // localStorage.setItem(this.userIdKey , response.userId);
      // localStorage.setItem(this.tierKey, response.tier);
      // localStorage.setItem('billing', response.paymentFrequency);

      // // Update login state after successful login
      // localStorage.setItem("isUserLoggedIn", "true");
    }));
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

isloggedIn(): Observable<boolean> {
  return this.isLoggedIn$;
}

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
  // console.log('UserService: getUserId called');
  const userId = localStorage.getItem(this.userIdKey) || localStorage.getItem('user');
  // console.log('UserService: userId from localStorage:', userId);
  
  if (userId) {
    if (userId.startsWith('{')) {
      // It's a JSON string, parse it
      try {
        const userObject = JSON.parse(userId);
        return userObject.userId || '';
      } catch (error) {
        // console.error('Error parsing user object:', error);
      }
    } else {
      // It's just the userId string
      return userId;
    }
  }
  
  // console.log('UserService: No userId found');
  return '';
}

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
// }

updateUser(updatedUser: User): Observable<User> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  };

  // Prepare the user data for the API
  const userForApi = {
    ...updatedUser,
    profilePictureSettings: updatedUser.profilePictureSettings 
      ? JSON.stringify(updatedUser.profilePictureSettings) 
      : null
  };

  // Use the /data/ endpoint for all updates
  return this.http.put<User>(`${this.baseURL}/data/${updatedUser.userId}`, userForApi, { headers: reqHeaders })
    .pipe(
      map(response => {
        // Parse the profilePictureSettings if it exists in the response
        if (typeof response.profilePictureSettings === 'string') {
          response.profilePictureSettings = JSON.parse(response.profilePictureSettings);
        }
        // If profilePictureSettings come back as null, use the ones we sent
        if (response.profilePictureSettings === null && updatedUser.profilePictureSettings) {
          response.profilePictureSettings = updatedUser.profilePictureSettings;
        }
        return response;
      }),
      tap(response => {
        // Update the user in localStorage, preserving the imgUrl if it's not being updated
        console.log('Updated user:', response);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedStoredUser = {
          ...storedUser,
          ...response,
          imgUrl: updatedUser.imgUrl || storedUser.imgUrl,
          profilePictureSettings: response.profilePictureSettings || storedUser.profilePictureSettings
        };
        localStorage.setItem('user', JSON.stringify(updatedStoredUser));
      })
    );
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


}
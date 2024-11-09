import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, delayWhen, filter, firstValueFrom, from, Observable, retryWhen, switchMap, take, tap, timeout, timer } from 'rxjs';
import { auth } from '../firebase.config';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { HttpClient } from '@angular/common/http';

interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private redirectUrl: string | null = null;
  public authStateSubject: BehaviorSubject<boolean>;
  public authState$: Observable<boolean>;
  private tokenPromise: Promise<string | null> | null = null;
  private tokenInitialized = new BehaviorSubject<boolean>(false);
  private maxRetries = 5;
  private retryDelay = 1000;
  private readonly baseUrl = 'http://localhost:3000';

  constructor(private router: Router, private http: HttpClient) {
    const isAuthenticated = this.checkInitialAuthState();
    this.authStateSubject = new BehaviorSubject<boolean>(isAuthenticated);
    this.authState$ = this.authStateSubject.asObservable();

    // Listen for Firebase auth state changes
    auth.onAuthStateChanged((user) => {
      console.log('Firebase auth state:', user ? 'logged in' : 'logged out');
      // Don't update main auth state here, as we're using JWT as primary auth
      if (user) {
        console.log('User ID:', user.uid);
        console.log('User email:', user.email);
      }
    });

     // Initialize token on construction
    this.initializeToken();
    // this.getToken()
  }

  // private async initializeToken() {
  //   try {
  //     const token = await this.getToken();
  //     if (token) {
  //       this.tokenInitialized.next(true);
  //       console.log('Token initialized successfully');
  //     } else {
  //       console.log('No token available during initialization');
  //     }
  //   } catch (error) {
  //     console.error('Error initializing token:', error);
  //   }
  // }

  // private async initializeToken() {
  //   try {
  //     const token = await this.getToken();
  //     if (token && !this.isTokenExpired(token)) {
  //       this.tokenInitialized.next(true);
  //       this.authStateSubject.next(true);
  //     } else {
  //       this.clearToken();
  //     }
  //   } catch (error) {
  //     console.error('Error initializing token:', error);
  //     this.clearToken();
  //   }
  // }

  private async initializeToken() {
    try {
      const token = await this.getToken();
      if (token && !this.isTokenExpired(token)) {
        this.tokenInitialized.next(true);
        this.authStateSubject.next(true);
      } else {
        this.clearToken();
        this.tokenInitialized.next(true); // Still mark as initialized even if no valid token
      }
    } catch (error) {
      console.error('Error initializing token:', error);
      this.clearToken();
      this.tokenInitialized.next(true); // Mark as initialized even on error
    }
  }

  // async waitForToken(): Promise<string> {
  //   // If token is already available, return it
  //   const currentToken = await this.getToken();
  //   if (currentToken) {
  //     return currentToken;
  //   }

  //   // Otherwise, wait for token with retry logic
  //   return new Promise((resolve, reject) => {
  //     let attempts = 0;
      
  //     const subscription = from(this.getToken()).pipe(
  //       retryWhen(errors => 
  //         errors.pipe(
  //           delayWhen(() => timer(this.retryDelay)),
  //           tap(() => {
  //             attempts++;
  //             console.log(`Retrying token retrieval (${attempts}/${this.maxRetries})`);
  //             if (attempts >= this.maxRetries) {
  //               throw new Error('Max retries reached waiting for token');
  //             }
  //           }),
  //           take(this.maxRetries)
  //         )
  //       )
  //     ).subscribe({
  //       next: (token) => {
  //         if (token) {
  //           resolve(token);
  //         } else {
  //           reject(new Error('Token not available'));
  //         }
  //         subscription.unsubscribe();
  //       },
  //       error: (error) => {
  //         reject(error);
  //         subscription.unsubscribe();
  //       }
  //     });

  //     // Cleanup subscription after timeout
  //     setTimeout(() => {
  //       subscription.unsubscribe();
  //       reject(new Error('Token initialization timeout'));
  //     }, this.maxRetries * this.retryDelay + 5000);
  //   });
  // }

  // async waitForToken(): Promise<string> {
  //   // First, try getting token directly
  //   const currentToken = await this.getToken();
  //   if (currentToken) {
  //     return currentToken;
  //   }

  //   // If no token, wait and retry
  //   return new Promise((resolve, reject) => {
  //     let attempts = 0;
  //     const checkToken = async () => {
  //       try {
  //         const token = await this.getToken();
  //         if (token) {
  //           resolve(token);
  //           return;
  //         }

  //         attempts++;
  //         if (attempts >= this.maxRetries) {
  //           reject(new Error('Max retries reached waiting for token'));
  //           return;
  //         }

  //         // Wait and try again
  //         setTimeout(checkToken, this.retryDelay);
  //       } catch (error) {
  //         reject(error);
  //       }
  //     };

  //     checkToken();

  //     // Set overall timeout
  //     setTimeout(() => {
  //       reject(new Error('Token initialization timeout'));
  //     }, this.maxRetries * this.retryDelay + 5000);
  //   });
  // }

  
// async getToken(): Promise<string | null> {
//   try {
//     if (!this.tokenPromise) {
//       this.tokenPromise = (async () => {
//         // Try both token locations
//         const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
//         if (!token) {
//           console.warn('No token found in localStorage');
//           return null;
//         }
//         // Verify token is not expired
//         if (this.isTokenExpired(token)) {
//           console.warn('Token is expired');
//           this.clearToken();
//           return null;
//         }
//         return token;
//       })();
//     }
//     return await this.tokenPromise;
//   } catch (error) {
//     console.error('Error getting token:', error);
//     this.tokenPromise = null;
//     return null;
//   }
// }

// async getToken(): Promise<string | null> {
//   try {
//     if (!this.tokenPromise) {
//       this.tokenPromise = (async () => {
//         // Try both token locations
//         const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
//         if (!token) {
//           return null;
//         }

//         // Verify token is not expired
//         if (this.isTokenExpired(token)) {
//           this.clearToken();
//           return null;
//         }

//         return token;
//       })();
//     }
//     return await this.tokenPromise;
//   } catch (error) {
//     console.error('Error getting token:', error);
//     this.tokenPromise = null;
//     return null;
//   }
// }

// async getToken(): Promise<string | null> {
//   try {
//     const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
//     if (!token) {
//       this.tokenPromise = null;
//       return null;
//     }

//     if (this.isTokenExpired(token)) {
//       this.clearToken();
//       this.tokenPromise = null;
//       return null;
//     }

//     this.tokenPromise = Promise.resolve(token);
//     return token;
//   } catch (error) {
//     console.error('Error getting token:', error);
//     this.tokenPromise = null;
//     return null;
//   }
// }

// async getToken(): Promise<string | null> {
//   try {
//     const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
//     if (!token) return null;

//     if (this.isTokenExpired(token)) {
//       // Try to refresh token
//       try {
//         await this.refreshToken();
//         return localStorage.getItem('auth_token') || localStorage.getItem('token');
//       } catch {
//         this.clearToken();
//         return null;
//       }
//     }

//     return token;
//   } catch (error) {
//     console.error('Error getting token:', error);
//     return null;
//   }
// }

async getToken(): Promise<string | null> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (!token) return null;

  if (this.isTokenExpired(token)) {
    try {
      await this.refreshToken();
      return localStorage.getItem('auth_token') || localStorage.getItem('token');
    } catch {
      this.clearToken();
      return null;
    }
  }

  return token;
}

// async waitForToken(): Promise<string> {
//   // First, try getting token directly
//   const currentToken = await this.getToken();
//   if (currentToken) {
//     return currentToken;
//   }

//   // If no token, wait and retry
//   return new Promise((resolve, reject) => {
//     let attempts = 0;
//     const checkToken = async () => {
//       try {
//         const token = await this.getToken();
//         if (token) {
//           resolve(token);
//           return;
//         }

//         attempts++;
//         if (attempts >= this.maxRetries) {
//           reject(new Error('Max retries reached waiting for token'));
//           return;
//         }

//         // Wait and try again
//         setTimeout(checkToken, this.retryDelay);
//       } catch (error) {
//         reject(error);
//       }
//     };

//     checkToken();

//     // Set overall timeout
//     setTimeout(() => {
//       reject(new Error('Token initialization timeout'));
//     }, this.maxRetries * this.retryDelay + 5000);
//   });
// }

// async waitForToken(): Promise<string> {
//   // First, try getting token directly
//   const currentToken = await this.getToken();
//   if (currentToken) {
//     return currentToken;
//   }

//   // If no token, wait and retry
//   return new Promise((resolve, reject) => {
//     let attempts = 0;
//     const checkToken = async () => {
//       try {
//         const token = await this.getToken();
//         if (token) {
//           resolve(token);
//           return;
//         }

//         attempts++;
//         if (attempts >= this.maxRetries) {
//           reject(new Error('Max retries reached waiting for token'));
//           return;
//         }

//         // Wait and try again
//         setTimeout(checkToken, this.retryDelay);
//       } catch (error) {
//         reject(error);
//       }
//     };

//     checkToken();

//     // Set overall timeout
//     setTimeout(() => {
//       reject(new Error('Token initialization timeout'));
//     }, this.maxRetries * this.retryDelay + 5000);
//   });
// }

// async waitForToken(): Promise<string> {
//   // First, try getting and validating token directly
//   try {
//       const currentToken = await this.getToken();
//       if (currentToken) {
//           // Check if token is expired by parsing it
//           const payload = this.parseJwt(currentToken);
//           if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
//               return currentToken;
//           } else {
//               this.clearToken();  // Clear expired token
//           }
//       }
//   } catch (error) {
//       console.error('Token validation failed:', error);
//       this.clearToken();
//   }

//   // If no valid token, wait and retry
//   return new Promise((resolve, reject) => {
//       let attempts = 0;
      
//       const checkToken = async () => {
//           try {
//               const token = await this.getToken();
//               if (token) {
//                   const payload = this.parseJwt(token);
//                   if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
//                       resolve(token);
//                       return;
//                   } else {
//                       this.clearToken();
//                   }
//               }

//               attempts++;
//               if (attempts >= this.maxRetries) {
//                   reject(new Error('Max retries reached waiting for valid token'));
//                   return;
//               }

//               // Wait and try again
//               setTimeout(checkToken, this.retryDelay);
//           } catch (error) {
//               reject(error);
//           }
//       };

//       checkToken();

//       // Set overall timeout
//       setTimeout(() => {
//           reject(new Error('Token initialization timeout'));
//       }, this.maxRetries * this.retryDelay + 5000);
//   });
// }
// async waitForToken(): Promise<string | null> {
//   // First, try getting and validating token directly
//   try {
//       const token = await this.getToken();
//       if (token) {
//           const payload = this.parseJwt(token);
//           if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
//               this.authStateSubject.next(true);
//               return token;
//           } else {
//               this.clearToken();  // Clear expired token
//           }
//       }
//   } catch (error) {
//       console.error('Initial token validation failed:', error);
//       this.clearToken();
//   }

//   // If no valid token found, wait and retry
//   return new Promise((resolve, reject) => {
//       let attempts = 0;
      
//       const checkToken = async () => {
//           try {
//               const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
//               if (token) {
//                   const payload = this.parseJwt(token);
//                   if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
//                       this.authStateSubject.next(true);
//                       resolve(token);
//                       return;
//                   } else {
//                       this.clearToken();
//                   }
//               }

//               attempts++;
//               if (attempts >= this.maxRetries) {
//                   console.log('Max retries reached waiting for token');
//                   resolve(null);  // Return null instead of rejecting
//                   return;
//               }

//               // Wait and try again
//               setTimeout(checkToken, this.retryDelay);
//           } catch (error) {
//               console.error('Token check failed:', error);
//               resolve(null);  // Return null instead of rejecting
//           }
//       };

//       checkToken();

//       // Set overall timeout
//       setTimeout(() => {
//           console.log('Token initialization timeout');
//           resolve(null);  // Return null instead of rejecting
//       }, this.maxRetries * this.retryDelay + 5000);
//   });
// }

// async waitForToken(): Promise<string | null> {
//   try {
//     // Check if token is already initialized
//     if (this.tokenInitialized.value) {
//       return await this.getToken();
//     }

//     // Wait for token initialization
//     return new Promise((resolve) => {
//       const subscription = this.tokenInitialized
//         .pipe(
//           filter(initialized => initialized),
//           take(1),
//           switchMap(() => from(this.getToken()))
//         )
//         .subscribe({
//           next: (token) => {
//             resolve(token);
//             subscription.unsubscribe();
//           },
//           error: () => {
//             resolve(null);
//             subscription.unsubscribe();
//           }
//         });

//       // Timeout after 5 seconds
//       setTimeout(() => {
//         subscription.unsubscribe();
//         resolve(null);
//       }, 5000);
//     });
//   } catch (error) {
//     console.error('Error in waitForToken:', error);
//     return null;
//   }
// }

async waitForToken(): Promise<string | null> {
  // If already initialized, return current token
  if (this.tokenInitialized.value) {
    return this.getToken();
  }

  // Wait for initialization with timeout
  try {
    await firstValueFrom(
      this.tokenInitialized.pipe(
        filter(initialized => initialized),
        take(1),
        timeout(5000) // 5 second timeout
      )
    );
    return this.getToken();
  } catch (error) {
    console.error('Token initialization timeout:', error);
    this.tokenInitialized.next(true); // Force initialization
    return null;
  }
}

setToken(token: string): void {
  // Store in both locations for compatibility
  localStorage.setItem('auth_token', token);
  localStorage.setItem('token', token);
  this.tokenPromise = Promise.resolve(token);
  this.tokenInitialized.next(true);
}

clearToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  this.tokenPromise = null;
  this.tokenInitialized.next(false);
}

private retrieveToken(): string | null {
  let token = localStorage.getItem('token');
  if (!token) {
    token = localStorage.getItem('googleAuthToken');
  }
  return token;
}

  private checkInitialAuthState(): boolean {
    const token = localStorage.getItem("token");
    return !!token && !this.isTokenExpired(token);
  }

  // isAuthenticated(): boolean {
  //   const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  //   const isAuth = !!token && !this.isTokenExpired(token);
  //   this.authStateSubject.next(isAuth);
  //   return isAuth;
  // }

  isAuthenticated(): boolean {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) return false;

    try {
        const payload = this.parseJwt(token);
        const isValid = !!payload && 
                       !!payload.userId && 
                       !!payload.exp && 
                       payload.exp * 1000 > Date.now();

        if (!isValid) {
            this.clearToken();
        }

        this.authStateSubject.next(isValid);
        return isValid;
    } catch (error) {
        console.error('Token validation failed:', error);
        this.clearToken();
        this.authStateSubject.next(false);
        return false;
    }
}


  // private isTokenExpired(token: string): boolean {
  //   try {
  //     const payload = this.parseJwt(token);
  //     if (payload && payload.exp) {
  //       return Date.now() >= payload.exp * 1000;
  //     }
  //   } catch (error) {
  //     console.error('Error checking token expiration:', error);
  //   }
  //   return true;
  // }

  // private isTokenExpired(token: string): boolean {
  //   try {
  //     const payload = this.parseJwt(token);
  //     if (payload && payload.exp) {
  //       const expTime = Number(payload.exp) * 1000;
  //       console.log(`Token expiration time: ${new Date(expTime)}`);
  //       return Date.now() >= expTime;
  //     }
  //   } catch (error) {
  //     console.error('Error checking token expiration:', error);
  //   }
  //   return true;
  // }
  // private isTokenExpired(token: string): boolean {
  //   try {
  //     const payload = this.parseJwt(token);
  //     if (payload && payload.exp) {
  //       return Date.now() >= payload.exp * 1000;
  //     }
  //   } catch (error) {
  //     console.error('Error checking token expiration:', error);
  //   }
  //   return true;
  // }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJwt(token);
      if (payload && payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime >= payload.exp;
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
    return true;
  }

  // private parseJwt(token: string): any {
  //   try {
  //     const base64Url = token.split('.')[1];
  //     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  //     const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
  //       return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  //     }).join(''));

  //     return JSON.parse(jsonPayload);
  //   } catch (error) {
  //     console.error('Error parsing token:', error);
  //     return null;
  //   }
  // }


  // private parseJwt(token: string): JWTPayload | null {
  //   try {
  //       const base64Url = token.split('.')[1];
  //       const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  //       const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
  //           return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  //       }).join(''));
  
  //       return JSON.parse(jsonPayload);
  //   } catch (error) {
  //       console.error('Error parsing JWT:', error);
  //       return null;
  //   }
  // }  

  private parseJwt(token: string): JWTPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      console.log('Decoded JWT payload:', payload); // Add this line
      return payload;
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }

  getRedirectUrl(): string | null {
    return this.redirectUrl;
  }

  async login(token: string, isGoogleAuth: boolean = false): Promise<void> {
    try {
      if (isGoogleAuth) {
        localStorage.setItem("googleAuthToken", token);
        this.authStateSubject.next(false);
      } else {
        localStorage.setItem("token", token);
        this.authStateSubject.next(true);

        // Get Firebase token and sign in
        try {
          const firebaseToken = await this.getFirebaseToken(token);
          await signInWithCustomToken(auth, firebaseToken);
          console.log('Firebase auth successful');
        } catch (error) {
          console.error('Firebase auth error:', error);
          // Don't fail the login if Firebase auth fails
        }

        const redirect = this.getRedirectUrl();
        if (redirect) {
          this.router.navigateByUrl(redirect);
          this.redirectUrl = null;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshFirebaseAuth(): Promise<void> {
    const token = localStorage.getItem("token");
    if (token && !this.isTokenExpired(token)) {
      try {
        const firebaseToken = await this.getFirebaseToken(token);
        const userCredential = await signInWithCustomToken(auth, firebaseToken);
        console.log('Firebase auth refreshed:', userCredential.user);
      } catch (error) {
        console.error('Failed to refresh Firebase auth:', error);
        throw error;
      }
    }
  }

  private async getFirebaseToken(token: string): Promise<string> {
    // Call your backend to get a Firebase custom token
    const response = await fetch('http://localhost:3000/api/users/auth/firebase-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get Firebase token');
    }

    const data = await response.json();
    return data.firebaseToken;
  }

  async logout(): Promise<void> {
    localStorage.removeItem("token");
    localStorage.removeItem("googleAuthToken");
    this.authStateSubject.next(false);
    
    // Sign out from Firebase
    try {
      await signOut(auth);
      console.log('Firebase sign out successful');
    } catch (error) {
      console.error('Firebase sign out error:', error);
      // Don't fail the logout if Firebase sign out fails
    }
  }

  // Helper method to check Firebase auth state
  async isFirebaseAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }

  // async refreshToken(): Promise<void> {
  //   try {
  //     // Get the current user ID
  //     const userId = this.getUserIdFromToken();
  //     if (!userId) {
  //       throw new Error('No user ID found');
  //     }

  //     // Call your refresh token endpoint
  //     const response = await this.http.post<{ token: string }>(
  //       `${this.baseUrl}/api/users/refresh-token`,
  //       { userId }
  //     ).toPromise();

  //     if (response?.token) {
  //       this.setToken(response.token);
  //     } else {
  //       throw new Error('No token received');
  //     }
  //   } catch (error) {
  //     console.error('Error refreshing token:', error);
  //     // Handle refresh failure - might need to redirect to login
  //     this.router.navigate(['/login']);
  //     throw error;
  //   }
  // }


  async refreshToken(): Promise<void> {
    try {
      // Get current userId from the expired token
      const userId = this.getUserIdFromToken();
      if (!userId) {
        throw new Error('No user ID found');
      }

      // Call refresh endpoint
      const response = await firstValueFrom(
        this.http.post<{ token: string }>(`${this.baseUrl}/users/refresh-token`, { userId })
      );

      if (response?.token) {
        // Update stored token
        localStorage.setItem('token', response.token);
        localStorage.setItem('auth_token', response.token);
        this.authStateSubject.next(true);
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout(); // Logout user if refresh fails
      this.router.navigate(['/login']);
      throw error;
    }
  }

  // DONT DELETE!
  getUserIdFromToken(): string | null {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      // Decode token payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.userId;
    } catch {
      return null;
    }
  }

  // getUserIdFromToken(): string | null {
  //   // console.log('AuthService: getUserIdFromToken called');
    
  //   // Check user object in localStorage
  //   const userString = localStorage.getItem('user');
  //   // console.log('AuthService: user string from localStorage:', userString);
  //   if (userString) {
  //     try {
  //       const user = JSON.parse(userString);
  //       // console.log('AuthService: parsed user object:', user);
  //       if (user && user.userId) {
  //         // console.log('AuthService: userId from user object:', user.userId);
  //         return user.userId;
  //       }
  //     } catch (error) {
  //       // console.error('Error parsing user data from localStorage:', error);
  //     }
  //   }

  //   // Check token
  //   const token = localStorage.getItem("token") || localStorage.getItem("googleAuthToken");
  //   // console.log('AuthService: token from localStorage:', token);
  //   if (token) {
  //     try {
  //       const payload = this.parseJwt(token);
  //       if (payload?.userId) {
  //           return payload.userId;
  //       }
  //     } catch (error) {
  //         console.error('Error parsing token:', error);
  //     }
  //   }

  //   // console.log('AuthService: No userId found');
  //   return null;
  // }
}

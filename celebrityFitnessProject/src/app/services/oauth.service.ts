// import { HttpClient } from '@angular/common/http';
// import { Injectable, NgZone } from '@angular/core';
// import { Router } from '@angular/router';
// import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
// import { BehaviorSubject, catchError, from, Observable, of, Subject, switchMap, tap, throwError } from 'rxjs';
// import { StateManagementService } from './statemanagement.service';
// import { FormService } from '../shared/Multi-Step-Form/form/form.service';
// import { UserService } from './user.service';
// // import { FormService } from '../shared/Multi-Step-Form/form/form.service';
// // import { AuthFormService } from './authform.service';

// // export const authConfig: AuthConfig = {
// //   issuer: 'https://accounts.google.com',
// //   strictDiscoveryDocumentValidation: false,
// //   redirectUri: 'http://localhost:3000/api/auth/google/callback',
// //   clientId: '1074496997874-99luq5p3fbtuk4g1m0jtbf70nh71n6u8.apps.googleusercontent.com',
// //   scope: 'openid profile email',
// //   responseType: 'token id_token',
// //   showDebugInformation: true,
// //   oidc: true,
// // };
  

// @Injectable({
//   providedIn: 'root'
// })
// export class CustomOAuthService {
//   private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
//   isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
//   // private popupClosedSubject = new Subject<void>();
//   // popupClosed$ = this.popupClosedSubject.asObservable();
//   private authResultSubject = new Subject<any>();
//   // authResult$ = this.authResultSubject.asObservable();
//   private popupRef: Window | null = null;
//   authResult$ = new Subject<any>();

//   private authErrorSubject = new Subject<string>();
//   authError$ = this.authErrorSubject.asObservable();

//   private popupClosedSubject = new Subject<void>();
//   popupClosed$ = this.popupClosedSubject.asObservable();
  
//   constructor( private http: HttpClient, private router: Router, private stateManagementService: StateManagementService, private formService: FormService, private zone: NgZone, private userService: UserService) {
//     window.addEventListener('message', this.handleAuthMessage.bind(this), false);
//   }

//   ngOnInit() {
//     this.checkForStoredAuthResult();
//   }

//   ngOnDestroy() {
//     window.removeEventListener('message', this.handleAuthMessage.bind(this), false);
//   }

// initiateLogin(isSignUp: boolean = false) {
//   const state = isSignUp ? 'signup' : 'login';
//   const authUrl = `http://localhost:3000/api/auth/google?state=${state}`;

//   const width = 500;
//   const height = 550;
//   const left = (window.screen.width / 2) - (width / 2);
//   const top = (window.screen.height / 2) - (height / 2);

//   const popup = window.open(
//     authUrl,
//     'google_oauth_popup',
//     `width=${width},height=${height},left=${left},top=${top}`
//   );

//   if (popup) {
//     let authFinished = false;
//     const timeoutDuration = 60000; // 1 minute timeout

//     const authTimeout = setTimeout(() => {
//       if (!authFinished) {
//         this.zone.run(() => {
//           this.popupClosedSubject.next();
//         });
//       }
//     }, timeoutDuration);

//     window.addEventListener('focus', () => {
//       if (!authFinished) {
//         // Check if the popup is closed when the main window regains focus
//         setTimeout(() => {
//           try {
//             if (!popup || popup.closed) {
//               authFinished = true;
//               clearTimeout(authTimeout);
//               this.zone.run(() => {
//                 this.popupClosedSubject.next();
//               });
//             }
//           } catch (e) {
//             // If we can't access popup.closed, assume it's closed
//             authFinished = true;
//             clearTimeout(authTimeout);
//             this.zone.run(() => {
//               this.popupClosedSubject.next();
//             });
//           }
//         }, 300);
//       }
//     });

//     window.addEventListener('message', (event) => {
//       if (event.origin !== 'http://localhost:3000') return;

//       const data = event.data;
//       this.zone.run(() => {
//         authFinished = true;
//         clearTimeout(authTimeout);

//         if (data.type === 'GOOGLE_AUTH_SUCCESS') {
//           const email = data.payload.user.email;
          
//           this.userService.checkUserExists(email).pipe(
//             switchMap(exists => {
//               if (isSignUp && exists) {
//                 return throwError('User already exists. Please log in instead.');
//               } else if (!isSignUp && !exists) {
//                 return throwError('User does not exist. Please sign up first.');
//               }
//               return of(data.payload);
//             })
//           ).subscribe(
//             payload => {
//               localStorage.setItem('authToken', payload.token);
//               localStorage.setItem('user', JSON.stringify(payload.user));
//               this.authResult$.next(payload.user);
//             },
//             error => {
//               console.error('Authentication error:', error);
//               this.authErrorSubject.next(error);
//             }
//           );
//         } else if (data.type === 'GOOGLE_AUTH_ERROR') {
//           this.authErrorSubject.next(data.error);
//         }
//       });
//     });
//   } else {
//     console.error('Failed to open popup window');
//     this.authErrorSubject.next('Failed to open authentication window');
//   }
// }

//   private handleMessage(event: MessageEvent): void {
//     if (event.origin !== 'http://localhost:3000') return;

//     const data = event.data;
//     this.zone.run(() => {
//       if (data.type === 'GOOGLE_AUTH_SUCCESS') {
//         const token = data.payload.token;
//         const user = data.payload.user;
//         localStorage.setItem('authToken', token);
//         localStorage.setItem('user', JSON.stringify(user));
//         this.authResultSubject.next(user);
//       } else if (data.type === 'GOOGLE_AUTH_ERROR') {
//         console.error('Authentication failed:', data.error);
//         this.authErrorSubject.next(data.error);
//       }
//     });
//   }


//   public checkForStoredAuthResult(): void {
//     const storedResult = localStorage.getItem('oauthResult');
//     if (storedResult) {
//       // console.log('CustomOAuthService: Found stored auth result');
//       const authResult = JSON.parse(storedResult);
//       this.handleAuthResult(authResult);
//       localStorage.removeItem('oauthResult');
//     }
//   }


//   private handleAuthResult(result: any): void {
//     if (result.type === 'GOOGLE_AUTH_SUCCESS') {
//       // console.log('CustomOAuthService: Handling successful auth');
//       this.handleSuccessfulAuth(result.payload);
//     } else if (result.type === 'GOOGLE_AUTH_ERROR') {
//       // console.log('CustomOAuthService: Handling auth error');
//       this.handleLoginError(result.error);
//     }
//   }

//   private handleAuthMessage(event: MessageEvent): void {
//     // Ignore Angular DevTools messages
//     // if (event.data.source && event.data.source.startsWith('angular-devtools')) {
//     //   return;
//     // }
  
//     console.log('Received message:', event.data, 'from origin:', event.origin);
    
//     if (event.origin === 'http://localhost:3000' && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
//       this.zone.run(() => {
//         this.handleSuccessfulAuth(event.data.payload);
//       });
//     } else if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
//       console.warn('Received GOOGLE_AUTH_SUCCESS from untrusted origin:', event.origin);
//     }
//   }


//   private handleAuthError(error: string): void {
//     console.error('Authentication error:', error);
//     this.isAuthenticatedSubject.next(false);
//     // Handle error (e.g., show error message to user)
//   }

//   private handleAuthSuccess(payload: any): void {
//     localStorage.setItem('token', payload.token);
//     this.isAuthenticatedSubject.next(true);
//     // Emit an event or call a method to update the form
//   }


//   checkForRedirectResult(): void {
//     const result = localStorage.getItem('oauthResult');
//     if (result) {
//       localStorage.removeItem('oauthResult');
//       const parsedResult = JSON.parse(result);
//       if (parsedResult.type === 'GOOGLE_AUTH_SUCCESS') {
//         this.handleAuthSuccess(parsedResult.payload);
//       } else if (parsedResult.type === 'GOOGLE_AUTH_ERROR') {
//         this.handleAuthError(parsedResult.error);
//       }
  
//       // Restore previous path if it was saved
//       const preAuthPath = localStorage.getItem('preAuthPath');
//       if (preAuthPath) {
//         localStorage.removeItem('preAuthPath');
//         // Use your router to navigate back to the previous path
//         // this.router.navigate([preAuthPath]);
//       }

//     }
//   }

//   public handleSuccessfulAuth(payload: any): void {
//     const { token, user } = payload;
//     localStorage.setItem('token', token);

//     // Check if user already exists in localStorage
//     const existingUserString = localStorage.getItem('user');
//     if (existingUserString) {
//       const existingUser = JSON.parse(existingUserString);
//       // Merge the existing user data with the new data, preserving the custom image if it exists
//       const updatedUser = {
//         ...existingUser,
//         ...user,
//         imgUrl: existingUser.imgUrl && !existingUser.imgUrl.startsWith('https://lh3.googleusercontent.com/')
//           ? existingUser.imgUrl
//           : user.imgUrl
//       };
//       localStorage.setItem('user', JSON.stringify(updatedUser));
//       // this.authResultSubject.next(user);
//     } else {
//       // If no existing user, store the new user data as is
//       localStorage.setItem('user', JSON.stringify(user));
//     }

//     this.stateManagementService.setAuthenticationStatus(true);
//     this.isAuthenticatedSubject.next(true);
//     this.authResultSubject.next(user);

//     if (this.router.url.includes('signup')) {
//       this.formService.updateFormWithGoogleData(user);
//     } else {
//       // We're in the login flow
//       this.router.navigate(['/content', user.userId]);
//     }
//   }


//   getUser(): Observable<any> {
//     return this.http.get('http://localhost:3000/api/user').pipe(
//       catchError(error => {
//         console.error('Error fetching user data:', error);
//         return from([null]);
//       })
//     );
//   }

//   logout(): Observable<any> {
//     return new Observable(observer => {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       this.isAuthenticatedSubject.next(false);
//       this.stateManagementService.setAuthenticationStatus(false);
//       observer.next({ success: true });
//       observer.complete();
//     });
//   }

//   private handleLoginError(error: string): void {
//     console.error('CustomOAuthService: Authentication error:', error);
//     this.isAuthenticatedSubject.next(false);
//     this.authResultSubject.next(null);
//     this.router.navigateByUrl("/error");
//   }

//   get token(): string | null {
//     return localStorage.getItem('token');
//   }

//   get isLoggedIn(): boolean {
//     return this.stateManagementService.getAuthenticationStatus();
//   }
// }


import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StateManagementService } from './statemanagement.service';
import { FormService } from '../shared/Multi-Step-Form/form/form.service';
import { UserService } from './user.service';
import { AuthStateService } from './authstate.service';

@Injectable({
  providedIn: 'root'
})
export class CustomOAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private authResultSubject = new Subject<any>();
  authResult$ = this.authResultSubject.asObservable();

  private authErrorSubject = new Subject<string>();
  authError$ = this.authErrorSubject.asObservable();

  private popupClosedSubject = new Subject<void>();
  popupClosed$ = this.popupClosedSubject.asObservable();

  private oauthSuccessSubject = new Subject<any>();
  oauthSuccess$ = this.oauthSuccessSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private stateManagementService: StateManagementService,
    private formService: FormService,
    private zone: NgZone,
    private userService: UserService,
    private authStateService: AuthStateService
  ) {
    window.addEventListener('message', this.handleAuthMessage.bind(this), false);
  }

  initiateLogin(isSignUp: boolean = false) {
    const state = isSignUp ? 'signup' : 'login';
    const authUrl = `http://localhost:3000/api/auth/google?state=${state}`;
  
    const width = 500;
    const height = 550;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
  
    const popup = window.open(
      authUrl,
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  
    if (popup) {
      const authTimeout = setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          this.zone.run(() => {
            this.authErrorSubject.next('Authentication timed out');
          });
        }
      }, 60000); // 1 minute timeout

      window.addEventListener('focus', () => {
        setTimeout(() => {
          if (popup.closed) {
            clearTimeout(authTimeout);
            this.zone.run(() => {
              this.popupClosedSubject.next();
            });
          }
        }, 300);
      });
    } else {
      console.error('Failed to open popup window');
      this.authErrorSubject.next('Failed to open authentication window');
    }
  }

  private handleAuthMessage(event: MessageEvent): void {
    if (event.origin !== 'http://localhost:3000') return;

    const data = event.data;
    this.zone.run(() => {
      if (data.type === 'GOOGLE_AUTH_SUCCESS') {
        this.handleSuccessfulAuth(data.payload);
      } else if (data.type === 'GOOGLE_AUTH_ERROR') {
        this.authErrorSubject.next(data.error);
      }
    });
  }

  public handleSuccessfulAuth(payload: any): void {

    const { token, user } = payload;
    localStorage.setItem('token', token);


    const existingUserString = localStorage.getItem('user');
    if (existingUserString) {
      const existingUser = JSON.parse(existingUserString);
      const updatedUser = {
        ...existingUser,
        ...user,
        imgUrl: existingUser.imgUrl && !existingUser.imgUrl.startsWith('https://lh3.googleusercontent.com/')
          ? existingUser.imgUrl
          : user.imgUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('user', JSON.stringify(user));
    }

    this.stateManagementService.setAuthenticationStatus(true);
    this.isAuthenticatedSubject.next(true);
    this.authResultSubject.next(user);
    this.authStateService.setAuthState(true);
    this.formService.updateFormWithGoogleData(payload.user);
    this.oauthSuccessSubject.next(payload.user);

    if (this.router.url.includes('signup')) {
      this.formService.updateFormWithGoogleData(user);
      this.oauthSuccessSubject.next(user);
    } else {
      this.router.navigate(['/content', user.userId]);
    }
  }

  getUser(): Observable<any> {
    return this.http.get('http://localhost:3000/api/user').pipe(
      catchError(error => {
        console.error('Error fetching user data:', error);
        return of(null);
      })
    );
  }

  logout(): Observable<any> {
    return new Observable(observer => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.isAuthenticatedSubject.next(false);
      this.authStateService.setAuthState(false);
      this.stateManagementService.setAuthenticationStatus(false);
      observer.next({ success: true });
      observer.complete();
    });
  }

  setAuthenticationState(isAuthenticated: boolean) {
    this.isAuthenticatedSubject.next(isAuthenticated);
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get isLoggedIn(): boolean {
    return this.stateManagementService.getAuthenticationStatus();
  }

  
}
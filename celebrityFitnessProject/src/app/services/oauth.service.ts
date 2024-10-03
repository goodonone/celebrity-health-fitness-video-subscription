import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, catchError, from, Observable, Subject, tap } from 'rxjs';
import { StateManagementService } from './statemanagement.service';
import { FormService } from '../shared/Multi-Step-Form/form/form.service';
// import { FormService } from '../shared/Multi-Step-Form/form/form.service';
// import { AuthFormService } from './authform.service';

// export const authConfig: AuthConfig = {
//   issuer: 'https://accounts.google.com',
//   strictDiscoveryDocumentValidation: false,
//   redirectUri: 'http://localhost:3000/api/auth/google/callback',
//   clientId: '1074496997874-99luq5p3fbtuk4g1m0jtbf70nh71n6u8.apps.googleusercontent.com',
//   scope: 'openid profile email',
//   responseType: 'token id_token',
//   showDebugInformation: true,
//   oidc: true,
// };
  

@Injectable({
  providedIn: 'root'
})
export class CustomOAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private popupClosedSubject = new Subject<void>();
  popupClosed$ = this.popupClosedSubject.asObservable();
  private authResultSubject = new Subject<any>();
  // authResult$ = this.authResultSubject.asObservable();
  private popupRef: Window | null = null;
  authResult$ = new Subject<any>();
  
  constructor( private http: HttpClient, private router: Router, private stateManagementService: StateManagementService, private formService: FormService, private zone: NgZone) {
    // this.configureOAuth();
    // this.checkAuthStatus();
    // window.addEventListener('message', this.handleAuthMessage.bind(this));
    
    window.addEventListener('message', this.handleAuthMessage.bind(this), false);
  }

  ngOnInit() {
    this.checkForStoredAuthResult();
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.handleAuthMessage.bind(this), false);
  }

  // initiateLogin(): void {
  //   console.log('CustomOAuthService: Initiating login');
  //   const width = 500;
  //   const height = 600;
  //   const left = (window.screen.width / 2) - (width / 2);
  //   const top = (window.screen.height / 2) - (height / 2);
  
  //   this.popupRef = window.open(
  //     '/api/auth/google',
  //     'Google Login',
  //     `width=${width},height=${height},left=${left},top=${top}`
  //   );

  //   if (this.popupRef) {
  //     const checkPopupClosed = setInterval(() => {
  //       if (this.popupRef && this.popupRef.closed) {
  //         clearInterval(checkPopupClosed);
  //         console.log('CustomOAuthService: Popup closed');
  //         this.checkForStoredAuthResult();
  //       }
  //     }, 1000);
  //   } else {
  //     console.log('CustomOAuthService: Popup blocked, attempting redirect');
  //     window.location.href = 'http://localhost:3000/api/auth/google';
  //   }
  // }

  initiateLogin(isSignUp: boolean = false) {
    // const authUrl = 'http://localhost:3000/api/auth/google';
    const authUrl = `http://localhost:3000/api/auth/google${isSignUp ? '?signup=true' : ''}`;

    // Open the popup window
    const popup = window.open(authUrl, 'google_oauth_popup', 'width=500,height=600');

    if (popup) {
      // Listen for messages from the popup
      window.addEventListener('message', this.handleMessage.bind(this), false);
    } else {
      console.error('Failed to open popup window');
    }
  }
  

  private handleMessage(event: MessageEvent) {
    if (event.origin !== 'http://localhost:3000') {
      console.warn('Received message from unexpected origin:', event.origin);
      return;
    }

    const data = event.data;
    if (data.type === 'GOOGLE_AUTH_SUCCESS') {
      this.zone.run(() => {
        // Store the token and user data as needed
        const token = data.payload.token;
        const user = data.payload.user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Emit the user data to subscribers
        this.authResult$.next(user);
      });
    } else if (data.type === 'GOOGLE_AUTH_ERROR') {
      this.zone.run(() => {
        console.error('Authentication failed:', data.error);
        this.authResult$.error(data.error);
      });
    }
  }

  public checkForStoredAuthResult(): void {
    const storedResult = localStorage.getItem('oauthResult');
    if (storedResult) {
      // console.log('CustomOAuthService: Found stored auth result');
      const authResult = JSON.parse(storedResult);
      this.handleAuthResult(authResult);
      localStorage.removeItem('oauthResult');
    }
  }


  private handleAuthResult(result: any): void {
    if (result.type === 'GOOGLE_AUTH_SUCCESS') {
      // console.log('CustomOAuthService: Handling successful auth');
      this.handleSuccessfulAuth(result.payload);
    } else if (result.type === 'GOOGLE_AUTH_ERROR') {
      // console.log('CustomOAuthService: Handling auth error');
      this.handleLoginError(result.error);
    }
  }

  private handleAuthMessage(event: MessageEvent): void {
    // console.log('CustomOAuthService: Received message', event);
    // console.log('Event origin:', event.origin);
    // Adjust or remove the origin check temporarily
    // if (event.origin !== 'http://localhost:3000') return;
    // Process the message regardless of origin for debugging purposes
    // if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
    //   this.zone.run(() => {
    //     this.handleSuccessfulAuth(event.data.payload);
    //   });
    // }
    if (event.origin === 'http://localhost:3000' && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      this.zone.run(() => {
        this.handleSuccessfulAuth(event.data.payload);
      });
    } else {
      console.warn('Received message from untrusted origin:', event.origin);
    }
  }

  // private handleAuthMessage(event: MessageEvent): void {
  //   console.log('CustomOAuthService: Received message', event);
  //   if (event.origin !== 'http://localhost:3000') return;
    
  //   if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
  //     this.zone.run(() => {
  //       this.handleSuccessfulAuth(event.data.payload);
  //     });
  //   }
  // }


  // private handlePopupClosed(): void {
  //   console.log('Authentication popup closed');
  //   // this.popupClosedSubject.next();
  // }

  private handlePopupClosed(): void {
    // console.log('Authentication popup closed');
    // Check localStorage for OAuth result
    const oauthResult = localStorage.getItem('oauthResult');
    if (oauthResult) {
      const parsedResult = JSON.parse(oauthResult);
      if (parsedResult.type === 'GOOGLE_AUTH_SUCCESS') {
        this.handleSuccessfulAuth(parsedResult.payload);
      } else if (parsedResult.type === 'GOOGLE_AUTH_ERROR') {
        this.handleLoginError(parsedResult.error);
      }
      localStorage.removeItem('oauthResult');
    }
  }

  private handleRedirect(): void {
    // Save current state if needed
    localStorage.setItem('preAuthPath', window.location.pathname);
    
    // Redirect to the OAuth URL
    window.location.href = 'http://localhost:3000/api/auth/google';
  }

  private handleAuthError(error: string): void {
    console.error('Authentication error:', error);
    this.isAuthenticatedSubject.next(false);
    // Handle error (e.g., show error message to user)
  }

  private handleAuthSuccess(payload: any): void {
    localStorage.setItem('token', payload.token);
    this.isAuthenticatedSubject.next(true);
    // Emit an event or call a method to update the form
  }


  checkForRedirectResult(): void {
    const result = localStorage.getItem('oauthResult');
    if (result) {
      localStorage.removeItem('oauthResult');
      const parsedResult = JSON.parse(result);
      if (parsedResult.type === 'GOOGLE_AUTH_SUCCESS') {
        this.handleAuthSuccess(parsedResult.payload);
      } else if (parsedResult.type === 'GOOGLE_AUTH_ERROR') {
        this.handleAuthError(parsedResult.error);
      }
  
      // Restore previous path if it was saved
      const preAuthPath = localStorage.getItem('preAuthPath');
      if (preAuthPath) {
        localStorage.removeItem('preAuthPath');
        // Use your router to navigate back to the previous path
        // this.router.navigate([preAuthPath]);
      }

    }
  }


  // public handleSuccessfulAuth(payload: any): void {
  //   // console.log('CustomOAuthService: Handling successful auth:', payload);
  //   const { token, user } = payload;
  //   localStorage.setItem('token', token);
  //   localStorage.setItem('user', JSON.stringify(user));
  //   // console.log('CustomOAuthService: User data stored in localStorage');
  //   this.stateManagementService.setAuthenticationStatus(true);
  //   this.isAuthenticatedSubject.next(true);
  //   this.authResultSubject.next(user);
  //   // console.log('CustomOAuthService: Auth result emitted');
  //   if (this.router.url.includes('signup')) {
  //     this.formService.updateFormWithGoogleData(user);
  //   } else {
  //     // We're in the login flow
  //     this.router.navigate(['/content', user.userId]);
  //   }
  // }

  public handleSuccessfulAuth(payload: any): void {
    const { token, user } = payload;
    localStorage.setItem('token', token);

    // Check if user already exists in localStorage
    const existingUserString = localStorage.getItem('user');
    if (existingUserString) {
      const existingUser = JSON.parse(existingUserString);
      // Merge the existing user data with the new data, preserving the custom image if it exists
      const updatedUser = {
        ...existingUser,
        ...user,
        imgUrl: existingUser.imgUrl && !existingUser.imgUrl.startsWith('https://lh3.googleusercontent.com/')
          ? existingUser.imgUrl
          : user.imgUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      // If no existing user, store the new user data as is
      localStorage.setItem('user', JSON.stringify(user));
    }

    this.stateManagementService.setAuthenticationStatus(true);
    this.isAuthenticatedSubject.next(true);
    this.authResultSubject.next(user);

    if (this.router.url.includes('signup')) {
      this.formService.updateFormWithGoogleData(user);
    } else {
      // We're in the login flow
      this.router.navigate(['/content', user.userId]);
    }
  }

  private checkAuthStatus() {
    const token = localStorage.getItem('token');
    this.stateManagementService.setAuthenticationStatus(!!token);
    this.isAuthenticatedSubject.next(!!token);
  }

  getUser(): Observable<any> {
    return this.http.get('http://localhost:3000/api/user').pipe(
      catchError(error => {
        console.error('Error fetching user data:', error);
        return from([null]);
      })
    );
  }


  // logout(): Observable<any> {
  //   return this.http.post('http://localhost:3000/api/auth/logout', {}).pipe(
  //     tap(() => {
  //       localStorage.removeItem('token');
  //       localStorage.removeItem('user');
  //       this.isAuthenticatedSubject.next(false);
  //       this.stateManagementService.setAuthenticationStatus(false);
  //     }),
  //     catchError(error => {
  //       console.error('Error during logout:', error);
  //       return from([{ success: false }]);
  //     })
  //   );
  // }

  logout(): Observable<any> {
    return new Observable(observer => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.isAuthenticatedSubject.next(false);
      this.stateManagementService.setAuthenticationStatus(false);
      observer.next({ success: true });
      observer.complete();
    });
  }

  private handleLoginError(error: string): void {
    console.error('CustomOAuthService: Authentication error:', error);
    this.isAuthenticatedSubject.next(false);
    this.authResultSubject.next(null);
    this.router.navigateByUrl("/error");
    // this.stateManagementService.setAuthenticationStatus(false);
    // Handle error (e.g., show error message to user)
    // this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
  }

  // get token() {
  //   return this.oauthService.getAccessToken();
  // }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  // get isLoggedIn(): boolean {
  //   return this.oauthService.hasValidAccessToken();
  // }

  get isLoggedIn(): boolean {
    return this.stateManagementService.getAuthenticationStatus();
  }
}

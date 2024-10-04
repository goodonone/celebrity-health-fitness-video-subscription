// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';
// import { CustomOAuthService } from './oauth.service';
// import { AuthService } from './auth.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthStateService {
//   private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
//   isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

//   constructor(private oauthService: CustomOAuthService, private authService: AuthService) {
//     this.checkAuthStatus();
//   }

//   checkAuthStatus() {
//     const isAuthenticated = this.oauthService.isLoggedIn;
//     this.isAuthenticatedSubject.next(isAuthenticated);
//     return isAuthenticated;
//   }
//   async login() {
//     try {
//       const success = await this.oauthService.loginWithPopup();
//       if (success) {
//         // The token will be handled in the AuthComponent's handleAuthMessage
//         this.checkAuthStatus();
//       }
//     } catch (error) {
//       console.error('Error during Google login:', error);
//     }
//   }

//   logout() {
//     this.oauthService.logout();
//     // this.authService.logout();
//     this.isAuthenticatedSubject.next(false);
//   }
// }

import { Injectable } from '@angular/core';
import { CustomOAuthService } from './oauth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  isAuthenticated$ = this.oauthService.isAuthenticated$;

  constructor(private oauthService: CustomOAuthService) {}

  checkAuthStatus(): boolean {
    return this.oauthService.isLoggedIn;
  }

  login() {
    this.oauthService.initiateLogin();
  }

  logout() {
    this.oauthService.logout().subscribe();
  }
}
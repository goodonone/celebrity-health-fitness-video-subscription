import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CustomOAuthService } from './oauth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private oauthService: CustomOAuthService) {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    const isAuthenticated = this.oauthService.isLoggedIn;
    this.isAuthenticatedSubject.next(isAuthenticated);
    return isAuthenticated;
  }

  login() {
    this.oauthService.loginWithPopup();
  }

  logout() {
    this.oauthService.logout();
    this.isAuthenticatedSubject.next(false);
  }
}
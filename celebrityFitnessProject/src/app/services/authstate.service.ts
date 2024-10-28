import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.getInitialAuthState());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {}

  private getInitialAuthState(): boolean {
    return !!localStorage.getItem('token') && !!localStorage.getItem('userId') && localStorage.getItem('isUserLoggedIn') === 'true';
  }

  setAuthState(isAuthenticated: boolean): void {
    this.isAuthenticatedSubject.next(isAuthenticated);
    localStorage.setItem('isUserLoggedIn', isAuthenticated ? 'true' : 'false');
  }

  getAuthState(): Observable<boolean> {
    return this.isAuthenticated$;
  }

  checkAuthStatus(): boolean {
    const isAuthenticated = this.getInitialAuthState();
    this.setAuthState(isAuthenticated);
    return isAuthenticated;
  }
}
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateManagementService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  setAuthenticationStatus(status: boolean) {
    this.isAuthenticatedSubject.next(status);
  }

  getAuthenticationStatus(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  
}
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedStateService {
  private currentUserIdSubject = new BehaviorSubject<string | null>(null);
  currentUserId$ = this.currentUserIdSubject.asObservable();

  setCurrentUserId(userId: string | null) {
    this.currentUserIdSubject.next(userId);
  }

  getCurrentUserId(): string | null {
    return this.currentUserIdSubject.value;
  }
}
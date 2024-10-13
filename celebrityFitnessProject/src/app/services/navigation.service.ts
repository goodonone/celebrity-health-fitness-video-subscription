import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(private router: Router) {}

  getNavigationEndEvents(): Observable<NavigationEnd> {
    return this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    );
  }

  isLeavingFormPages(url: string): boolean {
    return !url.includes('change-plan') && 
           !url.includes('sign-up') && 
           !url.includes('checkout') && 
           !url.includes('upgrade');
  }
  
}
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private redirectUrl: string | null = null;

  constructor(private router: Router) { }

  isAuthenticated(): boolean {
    const token = localStorage.getItem("userId");
    // Check if the token exists and is not expired
    return !!token && !this.isTokenExpired(token);
  }

  // Check if the token is expired
  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }

  getRedirectUrl(): string | null {
    return this.redirectUrl;
  }

  login(token: string): void {
    // Store the token securely
    localStorage.setItem("userId", token);
    const redirect = this.getRedirectUrl();
    this.router.navigateByUrl(redirect ? redirect : '/');
    this.redirectUrl = null; // Clear redirect URL
  }

  logout(): void {
    localStorage.removeItem("userId");
    this.router.navigate(['/sign-in']);
  }
}
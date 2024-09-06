// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private redirectUrl: string | null = null;

//   constructor(private router: Router) { }

//   isAuthenticated(): boolean {
//     const token = localStorage.getItem("userId");
//     // Check if the token exists and is not expired
//     return !!token && !this.isTokenExpired(token);
//   }

//   // Check if the token is expired
//   private isTokenExpired(token: string): boolean {
//     const payload = JSON.parse(atob(token.split('.')[1]));
//     return Date.now() >= payload.exp * 1000;
//   }

//   setRedirectUrl(url: string): void {
//     this.redirectUrl = url;
//   }

//   getRedirectUrl(): string | null {
//     return this.redirectUrl;
//   }

//   login(token: string): void {
//     // Store the token securely
//     localStorage.setItem("userId", token);
//     const redirect = this.getRedirectUrl();
//     this.router.navigateByUrl(redirect ? redirect : '/');
//     this.redirectUrl = null; // Clear redirect URL
//   }

//   logout(): void {
//     localStorage.removeItem("userId");
//     this.router.navigate(['/sign-in']);
//   }
// }

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private redirectUrl: string | null = null;

  constructor(private router: Router) {
    // console.log('AuthService initialized');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem("token"); // Changed from "userId" to "token"
    // console.log('Checking authentication, token exists:', !!token);
    const isAuth = !!token && !this.isTokenExpired(token);
    // console.log('Is authenticated:', isAuth);
    return isAuth;
  }

  private isTokenExpired(token: string): boolean {
    try {
      // console.log('Checking token expiration');
      const payload = this.parseJwt(token);
      if (payload && payload.exp) {
        const isExpired = Date.now() >= payload.exp * 1000;
        // console.log('Token expiration status:', isExpired);
        return isExpired;
      }
    } catch (error) {
      // console.error('Error checking token expiration:', error);
    }
    // console.log('Considering token as expired due to parsing error or missing expiration');
    return true;
  }

  private parseJwt(token: string): any {
    try {
      // console.log('Attempting to parse JWT');
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        throw new Error('Invalid token format');
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      // console.log('JWT parsed successfully');
      return payload;
    } catch (error) {
      // console.error('Error parsing token:', error);
      return null;
    }
  }

  setRedirectUrl(url: string): void {
    // console.log('Setting redirect URL:', url);
    this.redirectUrl = url;
  }

  getRedirectUrl(): string | null {
    // console.log('Getting redirect URL:', this.redirectUrl);
    return this.redirectUrl;
  }

  login(token: string): void {
    // console.log('Login method called with token:', token);
    localStorage.setItem("token", token); // Changed from "userId" to "token"
    const redirect = this.getRedirectUrl();
    // console.log('Redirecting to:', redirect || '/');
    if (redirect) {
      this.router.navigateByUrl(redirect);
      this.redirectUrl = null; // Clear redirect URL
    }
  }

  logout(): void {
    // console.log('Logout method called');
    localStorage.removeItem("token"); // Changed from "userId" to "token"
    this.router.navigate(['/sign-in']);
  }
}
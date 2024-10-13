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

// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private redirectUrl: string | null = null;

//   constructor(private router: Router) {
//     // console.log('AuthService initialized');
//   }

//   isAuthenticated(): boolean {
//     const token = localStorage.getItem("token"); // Changed from "userId" to "token"
//     // console.log('Checking authentication, token exists:', !!token);
//     const isAuth = !!token && !this.isTokenExpired(token);
//     // console.log('Is authenticated:', isAuth);
//     return isAuth;
//   }

//   private isTokenExpired(token: string): boolean {
//     try {
//       // console.log('Checking token expiration');
//       const payload = this.parseJwt(token);
//       if (payload && payload.exp) {
//         const isExpired = Date.now() >= payload.exp * 1000;
//         // console.log('Token expiration status:', isExpired);
//         return isExpired;
//       }
//     } catch (error) {
//       // console.error('Error checking token expiration:', error);
//     }
//     // console.log('Considering token as expired due to parsing error or missing expiration');
//     return true;
//   }

//   private parseJwt(token: string): any {
//     try {
//       // console.log('Attempting to parse JWT');
//       const parts = token.split('.');
//       if (parts.length !== 3) {
//         console.error('Invalid token format');
//         throw new Error('Invalid token format');
//       }

//       const base64Url = parts[1];
//       const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//       const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
//         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//       }).join(''));

//       const payload = JSON.parse(jsonPayload);
//       // console.log('JWT parsed successfully');
//       return payload;
//     } catch (error) {
//       // console.error('Error parsing token:', error);
//       return null;
//     }
//   }

//   setRedirectUrl(url: string): void {
//     // console.log('Setting redirect URL:', url);
//     this.redirectUrl = url;
//   }

//   getRedirectUrl(): string | null {
//     // console.log('Getting redirect URL:', this.redirectUrl);
//     return this.redirectUrl;
//   }

//   login(token: string): void {
//     // console.log('Login method called with token:', token);
//     localStorage.setItem("token", token); // Changed from "userId" to "token"
//     const redirect = this.getRedirectUrl();
//     // console.log('Redirecting to:', redirect || '/');
//     if (redirect) {
//       this.router.navigateByUrl(redirect);
//       this.redirectUrl = null; // Clear redirect URL
//     }
//   }

//   logout(): void {
//     // console.log('Logout method called');
//     localStorage.removeItem("token"); // Changed from "userId" to "token"
//     this.router.navigate(['/sign-in']);
//   }
// }

// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private redirectUrl: string | null = null;

//   constructor(private router: Router) {}

//   isAuthenticated(): boolean {
//     const token = localStorage.getItem("token");
//     return !!token && !this.isTokenExpired(token);
//   }

//   private isTokenExpired(token: string): boolean {
//     try {
//       const payload = this.parseJwt(token);
//       if (payload && payload.exp) {
//         return Date.now() >= payload.exp * 1000;
//       }
//     } catch (error) {
//       console.error('Error checking token expiration:', error);
//     }
//     return true;
//   }

//   private parseJwt(token: string): any {
//     try {
//       const base64Url = token.split('.')[1];
//       const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//       const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
//         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//       }).join(''));

//       return JSON.parse(jsonPayload);
//     } catch (error) {
//       console.error('Error parsing token:', error);
//       return null;
//     }
//   }

//   setRedirectUrl(url: string): void {
//     this.redirectUrl = url;
//   }

//   getRedirectUrl(): string | null {
//     return this.redirectUrl;
//   }

//   login(token: string): void {
//     localStorage.setItem("token", token);
//     const redirect = this.getRedirectUrl();
//     if (redirect) {
//       this.router.navigateByUrl(redirect);
//       this.redirectUrl = null;
//     }
//   }

//   logout(): void {
//     localStorage.removeItem("token");
//     this.router.navigate(['/sign-in']);
//   }

//   getUserIdFromToken(): string | null {
//     const token = localStorage.getItem("token");
//     if (token) {
//       const payload = this.parseJwt(token);
//       return payload?.userId || null;
//     }
//     return null;
//   }
// }


import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormService } from '../shared/Multi-Step-Form/form/form.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private redirectUrl: string | null = null;
  public authStateSubject: BehaviorSubject<boolean>;
  public authState$: Observable<boolean>;

  constructor(private router: Router) {
    const isAuthenticated = this.checkInitialAuthState();
    this.authStateSubject = new BehaviorSubject<boolean>(isAuthenticated);
    this.authState$ = this.authStateSubject.asObservable();
  }

  private checkInitialAuthState(): boolean {
    const token = localStorage.getItem("token");
    return !!token && !this.isTokenExpired(token);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    const isAuth = !!token && !this.isTokenExpired(token);
    this.authStateSubject.next(isAuth);
    return isAuth;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJwt(token);
      if (payload && payload.exp) {
        return Date.now() >= payload.exp * 1000;
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
    return true;
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }

  getRedirectUrl(): string | null {
    return this.redirectUrl;
  }

  // login(token: string): void {
  //   localStorage.setItem("token", token);
  //   this.authStateSubject.next(true);
  //   const redirect = this.getRedirectUrl();
  //   if (redirect) {
  //     this.router.navigateByUrl(redirect);
  //     this.redirectUrl = null;
  //   }
  // }

  login(token: string, isGoogleAuth: boolean = false): void {
    if (isGoogleAuth) {
      // For Google auth, store the token but don't set auth state to true
      localStorage.setItem("googleAuthToken", token);
      this.authStateSubject.next(false);
    } else {
      localStorage.setItem("token", token);
      this.authStateSubject.next(true);
      const redirect = this.getRedirectUrl();
      if (redirect) {
        this.router.navigateByUrl(redirect);
        this.redirectUrl = null;
      }
    }
  }

  // login(token: string, isGoogleAuth: boolean = false): void {
  //   localStorage.setItem("token", token);
  //   if (!isGoogleAuth) {
  //     // Only set auth state to true for non-Google auth logins
  //     this.authStateSubject.next(true);
  //     const redirect = this.getRedirectUrl();
  //     if (redirect) {
  //       this.router.navigateByUrl(redirect);
  //       this.redirectUrl = null;
  //     }
  //   } else {
  //     // For Google auth, store the token but don't set auth state to true
  //     localStorage.setItem("googleAuthToken", token);
  //   }
  // }

  // logout(): void {
  //   localStorage.removeItem("token");
  //   this.authStateSubject.next(false);
  //   this.router.navigate(['/sign-in']);
  // }

  // getUserIdFromToken(): string | null {
  //   const token = localStorage.getItem("token")||localStorage.getItem("googleAuthToken");
  //   if (token) {
  //     const payload = this.parseJwt(token);
  //     return payload?.userId || null;
  //   }
  //   return null;
  // }

  // getUserIdFromToken(): string | null {
  //   // First, try to get the userId from the stored user object
  //   const userString = localStorage.getItem('user');
  //   if (userString) {
  //     try {
  //       const user = JSON.parse(userString);
  //       if (user && user.userId) {
  //         return user.userId;
  //       }
  //     } catch (error) {
  //       console.error('Error parsing user data from localStorage:', error);
  //     }
  //   }

  //   // If not found in user object, try to get from the token
  //   const token = localStorage.getItem("token") || localStorage.getItem("googleAuthToken");
  //   if (token) {
  //     const payload = this.parseJwt(token);
  //     return payload?.userId || null;
  //   }

  //   return null;
  // }

  getUserIdFromToken(): string | null {
    // console.log('AuthService: getUserIdFromToken called');
    
    // Check user object in localStorage
    const userString = localStorage.getItem('user');
    // console.log('AuthService: user string from localStorage:', userString);
    if (userString) {
      try {
        const user = JSON.parse(userString);
        // console.log('AuthService: parsed user object:', user);
        if (user && user.userId) {
          // console.log('AuthService: userId from user object:', user.userId);
          return user.userId;
        }
      } catch (error) {
        // console.error('Error parsing user data from localStorage:', error);
      }
    }

    // Check token
    const token = localStorage.getItem("token") || localStorage.getItem("googleAuthToken");
    // console.log('AuthService: token from localStorage:', token);
    if (token) {
      const payload = this.parseJwt(token);
      // console.log('AuthService: parsed JWT payload:', payload);
      return payload?.userId || null;
    }

    // console.log('AuthService: No userId found');
    return null;
  }


  // clearAuthState(): void {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("googleAuthToken");
  //   this.authStateSubject.next(false);
  // }
}
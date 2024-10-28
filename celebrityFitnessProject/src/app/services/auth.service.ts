import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { auth } from '../firebase.config';
import { signInWithCustomToken, signOut } from 'firebase/auth';

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

    // Listen for Firebase auth state changes
    auth.onAuthStateChanged((user) => {
      console.log('Firebase auth state:', user ? 'logged in' : 'logged out');
      // Don't update main auth state here, as we're using JWT as primary auth
      if (user) {
        console.log('User ID:', user.uid);
        console.log('User email:', user.email);
      }
    });

    
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

  // login(token: string, isGoogleAuth: boolean = false): void {
  //   if (isGoogleAuth) {
  //     // For Google auth, store the token but don't set auth state to true
  //     localStorage.setItem("googleAuthToken", token);
  //     this.authStateSubject.next(false);
  //   } else {
  //     localStorage.setItem("token", token);
  //     this.authStateSubject.next(true);
  //     const redirect = this.getRedirectUrl();
  //     if (redirect) {
  //       this.router.navigateByUrl(redirect);
  //       this.redirectUrl = null;
  //     }
  //   }
  // }

  async login(token: string, isGoogleAuth: boolean = false): Promise<void> {
    try {
      if (isGoogleAuth) {
        localStorage.setItem("googleAuthToken", token);
        this.authStateSubject.next(false);
      } else {
        localStorage.setItem("token", token);
        this.authStateSubject.next(true);

        // Get Firebase token and sign in
        try {
          const firebaseToken = await this.getFirebaseToken(token);
          await signInWithCustomToken(auth, firebaseToken);
          console.log('Firebase auth successful');
        } catch (error) {
          console.error('Firebase auth error:', error);
          // Don't fail the login if Firebase auth fails
        }

        const redirect = this.getRedirectUrl();
        if (redirect) {
          this.router.navigateByUrl(redirect);
          this.redirectUrl = null;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshFirebaseAuth(): Promise<void> {
    const token = localStorage.getItem("token");
    if (token && !this.isTokenExpired(token)) {
      try {
        const firebaseToken = await this.getFirebaseToken(token);
        const userCredential = await signInWithCustomToken(auth, firebaseToken);
        console.log('Firebase auth refreshed:', userCredential.user);
      } catch (error) {
        console.error('Failed to refresh Firebase auth:', error);
        throw error;
      }
    }
  }

  private async getFirebaseToken(token: string): Promise<string> {
    // Call your backend to get a Firebase custom token
    const response = await fetch('http://localhost:3000/api/users/auth/firebase-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get Firebase token');
    }

    const data = await response.json();
    return data.firebaseToken;
  }



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

  async logout(): Promise<void> {
    localStorage.removeItem("token");
    localStorage.removeItem("googleAuthToken");
    this.authStateSubject.next(false);
    
    // Sign out from Firebase
    try {
      await signOut(auth);
      console.log('Firebase sign out successful');
    } catch (error) {
      console.error('Firebase sign out error:', error);
      // Don't fail the logout if Firebase sign out fails
    }
  }

  // Helper method to check Firebase auth state
  async isFirebaseAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }


  // clearAuthState(): void {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("googleAuthToken");
  //   this.authStateSubject.next(false);
  // }
}
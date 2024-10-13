import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { StateManagementService } from './statemanagement.service';
import { FormService } from '../shared/Multi-Step-Form/form/form.service';
import { UserService } from './user.service';
import { AuthStateService } from './authstate.service';

@Injectable({
  providedIn: 'root'
})
export class CustomOAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private authResultSubject = new Subject<any>();
  authResult$ = this.authResultSubject.asObservable();

  private authErrorSubject = new Subject<string>();
  authError$ = this.authErrorSubject.asObservable();

  private popupClosedSubject = new Subject<void>();
  popupClosed$ = this.popupClosedSubject.asObservable();

  private oauthSuccessSubject = new Subject<any>();
  oauthSuccess$ = this.oauthSuccessSubject.asObservable();

  private popup: Window | null = null;
  private popupCloser = new Subject<void>();

  private isLoadingSubjectLogin = new BehaviorSubject<boolean>(false);
  isLoadingLogin$ = this.isLoadingSubjectLogin.asObservable();

  private isLoadingSubjectSignup = new BehaviorSubject<boolean>(false);
  isLoadingSignup$ = this.isLoadingSubjectSignup.asObservable();

  closePopupTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private stateManagementService: StateManagementService,
    private formService: FormService,
    private zone: NgZone,
    private userService: UserService,
    private authStateService: AuthStateService,
  ) {
    window.addEventListener('message', this.handleAuthMessage.bind(this), false);
  }

  initiateLogin(isSignUp: boolean = false) {
    if(isSignUp) {
    this.isLoadingSubjectSignup.next(true);
    }
    else{
      this.isLoadingSubjectLogin.next(true);
    }
    const state = isSignUp ? 'signup' : 'login';
    const authUrl = `http://localhost:3000/api/auth/google?state=${state}`;
  
    const width = 500;
    const height = 550;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
  
    const popup = window.open(
      authUrl,
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // if (popup) {
    //   // this.isPopupOpen = true;
    //   // this.startPopupTimer();
    //   this.triggerLoadingSpinner();
    // } else {
    //   console.error('Failed to open popup window');
    //   this.authErrorSubject.next('Failed to open authentication window');
    //   // this.popupClosedSubject.next();
    //   this.isLoadingSubjectLogin.next(false);
    //   this.isLoadingSubjectSignup.next(false);
    // }

    if (popup) {
      const authTimeout = setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          this.zone.run(() => {
            this.authErrorSubject.next('Authentication timed out');
            // this.isLoadingSubjectLogin.next(false);
            // this.isLoadingSubjectSignup.next(false);
          });
        }
      }, 60000); // 1 minute timeout

      window.addEventListener('focus', () => {
        setTimeout(() => {
          if (popup.closed) {
            clearTimeout(authTimeout);
            this.zone.run(() => {
              this.popupClosedSubject.next();
            });
          }
        }, 300);
      });
    } else {
      console.error('Failed to open popup window');
      this.authErrorSubject.next('Failed to open authentication window');
      // this.isLoadingSubjectLogin.next(false);
      // this.isLoadingSubjectSignup.next(false);
    }

    // if(popup?.addEventListener.bind(popup) !== undefined) {
    //   popup?.addEventListener('beforeunload', () => {
    //     this.isLoadingSubjectLogin.next(false);
    //   this.isLoadingSubjectSignup.next(false);
    //   })
    // }

    // if (this.popup) {
    //   // Attach beforeunload event listener if supported
    //   if (this.popup?.addEventListener.bind(this.popup) !== undefined) {
    //     this.popup?.addEventListener('beforeunload', () => {
    //       console.log('Popup manually closed.');
    //       this.isLoadingSubjectLogin.next(false); // Revert spinner for login
    //       this.isLoadingSubjectSignup.next(false); // Revert spinner for signup
    //     });
    //   }

    //   // Fallback: Automatically reset the loading spinner after 15 seconds
    //   setTimeout(() => {
    //     this.isLoadingSubjectLogin.next(false);
    //     this.isLoadingSubjectSignup.next(false);
    //     if (this.popup) {
    //       this.popup.close();
    //       console.log('Popup closed automatically after 15 seconds.');
    //     }
    //   }, 15000); // 15 seconds timeout
    // } else {
    //   console.error('Failed to open popup window. Possible popup blocker.');
    //   this.isLoadingSubjectLogin.next(false);
    //   this.isLoadingSubjectSignup.next(false);
    // }
  }
  



    // private startPopupTimer() {
    //   // Clear any existing timer
    //   if (this.popupTimer) {
    //     clearTimeout(this.popupTimer);
    //   }
  
    //   // Set a new timer for 5 minutes
    //   this.popupTimer = setTimeout(() => {
    //     this.zone.run(() => {
    //       this.authErrorSubject.next('Authentication timed out');
    //       this.isPopupOpen = false;
    //       this.popupClosedSubject.next();
    //     });
    //   }, 300000); // 5 minutes
    // }
  
    // private checkPopupStatus() {
    //   if (this.popupCheckInterval) {
    //     clearInterval(this.popupCheckInterval);
    //   }
  
    //   this.popupCheckInterval = setInterval(() => {
    //     if (!this.isPopupOpen) {
    //       clearInterval(this.popupCheckInterval);
    //       return;
    //     }
  
    //     if (this.popup && this.popup.closed) {
    //       clearInterval(this.popupCheckInterval);
    //       this.zone.run(() => {
    //         this.isPopupOpen = false;
    //         this.popupClosedSubject.next();
    //       });
    //     }
    //   }, 500); // Check every 500ms
    // }

    // private checkPopupStatus() {
    //   this.popupCloser = new Subject<void>();
      
    //   timer(0, 500).pipe(
    //     takeUntil(this.popupCloser)
    //   ).subscribe(() => {
    //     if (!this.popup || this.popup.closed) {
    //       this.zone.run(() => {
    //         this.popupClosedSubject.next();
    //         // this.isLoadingSubject.next(false);
    //         console.log('Popup closed here!!!!');
    //         this.popupCloser.next();
    //         this.popupCloser.complete();
    //       });
    //     }
    //   });
  
    //   // Fallback: ensure popupClosedSubject is triggered after 5 minutes
    //   setTimeout(() => {
    //     if (!this.popupCloser.closed) {
    //       this.zone.run(() => {
    //         this.popupClosedSubject.next();
    //         this.isLoadingSubject.next(false);
    //         this.popupCloser.next();
    //         this.popupCloser.complete();
    //       });
    //     }
    //   }, 300000); // 5 minutes
    // }
  
    // private triggerLoadingSpinner() {

    //     if(this.router.url.includes('login')) {
    //       const closePopupTimer =setInterval(() => {
    //         this.isLoadingSubjectLogin.next(false);
    //       }, 10000)
    //       this.clearTimer(closePopupTimer);
    //     }
    //     else if(this.router.url.includes('sign-up')) {
    //        const closePopupTimer = setInterval(() => {
    //         this.isLoadingSubjectSignup.next(false);
    //       }, 15000)
    //       this.clearTimer(closePopupTimer);
    //     }
    // }

    // clearTimer(timer: any) {
    //   if (this.closePopupTimer) {
    //     clearTimeout(this.closePopupTimer);
    //     this.closePopupTimer = null;
    //     // console.log('Initial close timer cleared.');
    //   }
    // }

      // this.popupCheckInterval = setInterval(() => {
      // this.popupCloser = new Subject<void>();
      
      // timer(0, 500).pipe(
      //   takeUntil(this.popupCloser)
      // ).subscribe(() => {
      //   if (!this.popup || this.popup.closed) {
      //     this.zone.run(() => {
      //       // this.popupClosedSubject.next();
      //       console.log('Popup closed!');
            
      //       // Introduce a delay before setting isLoading to false
      //       timer(15000).subscribe(() => {
      //         if(this.isLoadingSubject.value === true) {
      //           this.isLoadingSubject.next(false);
      //           console.log('Loading state set to false');
      //         }
      //       });
  
      //       this.popupCloser.next();
      //       this.popupCloser.complete();
      //     });
      //   }
      // });

        // Fallback: ensure popupClosedSubject is triggered after 5 minutes
    // setTimeout(() => {
    //   if (!this.popupCloser.closed) {
    //     this.zone.run(() => {
    //       // this.popupClosedSubject.next();
    //       this.isLoadingSubject.next(false);
    //       console.log('Fallback: Loading state set to false');
    //       this.popupCloser.next();
    //       this.popupCloser.complete();
    //     });
    //   }
    // }, 300000); // 5 minutes
  // }

  
    // if (popup) {
    //   const authTimeout = setTimeout(() => {
    //     if (!popup.closed) {
    //       popup.close();
    //       this.zone.run(() => {
    //         this.authErrorSubject.next('Authentication timed out');
    //       });
    //     }
    //   }, 60000); // 1 minute timeout

    //   window.addEventListener('focus', () => {
    //     setTimeout(() => {
    //       if (popup.closed) {
    //         clearTimeout(authTimeout);
    //         this.zone.run(() => {
    //           this.popupClosedSubject.next();
    //         });
    //       }
    //     }, 300);
    //   });
    // } else {
    //   console.error('Failed to open popup window');
    //   this.authErrorSubject.next('Failed to open authentication window');
    // }
  // }

  private handleAuthMessage(event: MessageEvent): void {
    if (event.origin !== 'http://localhost:3000') return;

    //  // Clear the popup timer as we've received a message
    //  if (this.popupTimer) {
    //   clearTimeout(this.popupTimer);
    // }

    const data = event.data;
    this.zone.run(() => {
      if (data.type === 'GOOGLE_AUTH_SUCCESS') {
        this.handleSuccessfulAuth(data.payload);
      } else if (data.type === 'GOOGLE_AUTH_ERROR') {
        this.authErrorSubject.next(data.error);
      }
      // this.popupClosedSubject.next();
      timer(1000).subscribe(() => {
        this.isLoadingSubjectLogin.next(false);
        this.isLoadingSubjectSignup.next(false);
        console.log('Auth message received: Loading state set to false');
      });
      if (this.popupCloser && !this.popupCloser.closed) {
        this.popupCloser.next();
        this.popupCloser.complete();
      }
    });
  }

  public handleSuccessfulAuth(payload: any): void {

    const { token, user } = payload;
    localStorage.setItem('token', token);


    const existingUserString = localStorage.getItem('user');
    if (existingUserString) {
      const existingUser = JSON.parse(existingUserString);
      const updatedUser = {
        ...existingUser,
        ...user,
        imgUrl: existingUser.imgUrl && !existingUser.imgUrl.startsWith('https://lh3.googleusercontent.com/')
          ? existingUser.imgUrl
          : user.imgUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('user', JSON.stringify(user));
    }

    this.stateManagementService.setAuthenticationStatus(true);
    this.isAuthenticatedSubject.next(true);
    this.authResultSubject.next(user);
    this.authStateService.setAuthState(true);
    this.formService.updateFormWithGoogleData(payload.user);
    this.oauthSuccessSubject.next(payload.user);

    if (this.router.url.includes('sign-up')) {
      this.formService.updateFormWithGoogleData(user);
      this.oauthSuccessSubject.next(user);
    } else {
      this.router.navigate(['/content', user.userId]);
      // this.router.navigate(['/home']);
    }

  }

  getUser(): Observable<any> {
    return this.http.get('http://localhost:3000/api/user').pipe(
      catchError(error => {
        console.error('Error fetching user data:', error);
        return of(null);
      })
    );
  }

  logout(): Observable<any> {
    return new Observable(observer => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.isAuthenticatedSubject.next(false);
      this.authStateService.setAuthState(false);
      this.stateManagementService.setAuthenticationStatus(false);
      observer.next({ success: true });
      observer.complete();
    });
  }

  setAuthenticationState(isAuthenticated: boolean) {
    this.isAuthenticatedSubject.next(isAuthenticated);
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get isLoggedIn(): boolean {
    return this.stateManagementService.getAuthenticationStatus();
  }

  
}
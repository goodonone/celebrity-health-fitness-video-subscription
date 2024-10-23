import { ChangeDetectorRef, Component, HostListener, Input, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective } from '@angular/forms';
import { FormService } from '../../form.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { CustomOAuthService } from 'src/app/services/oauth.service';
import { AuthStateService } from 'src/app/services/authstate.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-step-one-personal-info',
  templateUrl: './step-one-personal-info.component.html',
  styleUrls: ['./step-one-personal-info.component.css'],
})

export class StepOnePersonalInfoComponent implements OnInit {
  stepForm!: FormGroup;

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  @Input() formGroupName!: string;
  passwordMismatch: boolean = false;
  isPopupVisible: boolean = false;
  passwordVisible = false;
  emailExists: boolean = false;
  isLoadingGoogle = false;
  isLoadingApple = false;
  private authSubscription!: Subscription;
  private loginTimeout: any;
  isGoogleAuthEnabled: boolean = false;


  // private popupClosedSubscription!: Subscription;

  private subscriptions: Subscription = new Subscription();

  private destroy$ = new Subject<void>();
  private formResetSubscription!: Subscription;

  isGoogleAuthEnabled$: Observable<boolean>;

  // isLoadingSignup$!: Observable<boolean>;

  // popupClosedSubject: Subject<void> = new Subject<void>();


  constructor(private inputFormGroup: FormGroupDirective, 
    private fb: FormBuilder, public formService: FormService, 
    private cdr: ChangeDetectorRef, private userService: UserService,
    private oauthService: CustomOAuthService,
    private authStateService: AuthStateService,
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
  ) {
      // this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      //   // The user has been logged in successfully after the redirect
      //   if (this.oauthService.isLoggedIn) {
      //     console.log('User logged in after redirect');
      //     // You can redirect the user or update your app state here
      //   }
      // });

      // this.popupClosedSubscription = this.oauthService.popupClosed$.subscribe(() => {
      //   this.handlePopupClosed();
      // });
      
      // this.isLoadingSignup$ = this.oauthService.isLoadingSignup$;
      this.isGoogleAuthEnabled$ = this.userService.isGoogleAuthEnabled$;
    }


  ngOnInit(): void {

  console.log('StepOnePersonalInfoComponent: Initializing');

  this.formService.setGoogleAuthEnabled(false);
  console.log('ngOnInit: isGoogleAuthEnabled at start:', this.isGoogleAuthEnabled);

  // After setting initial value
  // this.isGoogleAuthEnabled = this.stepForm.get('isGoogleAuth')?.value || false;
  this.isGoogleAuthEnabled = false;
  console.log('ngOnInit: isGoogleAuthEnabled after initialization:', this.isGoogleAuthEnabled);

  // this.stepForm = this.inputFormGroup.control.get(this.formGroupName) as FormGroup;
  this.stepForm = this.formService.multiStepForm.get('personalDetails') as FormGroup;
    
  // Disable password inputs on Google Auth
  // this.stepForm.get('isGoogleAuth')?.valueChanges.subscribe((value) => {
  //   this.isGoogleAuthEnabled = value;
  //   this.cdr.detectChanges();
  // });

    // this.subscriptions.add(
    //   this.stepForm.get('isGoogleAuth')?.valueChanges.subscribe((value) => {
    //     console.log('isGoogleAuth value changed:', value);
    //     if (this.authStateService.isAuthenticated$) {
    //       this.isGoogleAuthEnabled = value;
    //       console.log('isGoogleAuthEnabled set to:', this.isGoogleAuthEnabled);
    //       this.cdr.detectChanges();
    //     }
    //   })
    // );

    // this.subscriptions.add(
    //   this.formService.isGoogleAuthEnabled$.subscribe(value => {
    //     this.isGoogleAuthEnabled = value;
    //     this.cdr.detectChanges();
    //   })
    // );

    // this.subscriptions.add(
    //   this.formService.isGoogleAuthEnabled$.subscribe(value => {
    //     console.log('isGoogleAuthEnabled changed:', value);
    //     this.updatePasswordFieldsState(value);
    //     this.cdr.detectChanges();
    //   })
    // );

    // this.subscriptions.add(
    //   this.userService.isGoogleAuthEnabled$.subscribe(value => {
    //     console.log('isGoogleAuthEnabled changed:', value);
    //     this.isGoogleAuthEnabled = value;
    //     this.updatePasswordFieldsState(value);
    //     this.cdr.detectChanges();
    //   })
    // );

    this.subscriptions.add(
      this.isGoogleAuthEnabled$.subscribe(isEnabled => {
        this.updatePasswordFieldsState(isEnabled);
      })
    );

    this.subscriptions.add(
      this.isGoogleAuthEnabled$.subscribe(isEnabled => {
        console.log('isGoogleAuthEnabled changed:', isEnabled);
        this.updatePasswordFieldsState(isEnabled);
        this.cdr.detectChanges();
      })
    );

    // Subscribe to name input changes
    this.stepForm.get('name')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (typeof value === 'string') {
        const nameControl = this.stepForm.get('name');
        if (nameControl && nameControl.errors?.['pattern'] && !value.trim()) {
          // If the value is only spaces, set required error instead of pattern
          nameControl.setErrors({ 'required': true });
        }
      }
    });

    // Subscribe to email input changes
    this.stepForm.get('email')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (typeof value === 'string') {
        const emailControl = this.stepForm.get('email');
        if (emailControl && emailControl.errors?.['pattern'] && !value.trim()) {
          // If the value is only spaces, set required error instead of pattern
          emailControl.setErrors({ 'required': true });
        }
      }
    });
  

    // Subscribe to form reset events: enable password inputs on form reset
    // this.formResetSubscription = this.formService.formReset$.subscribe(() => {
    //   this.isGoogleAuthEnabled = false;
    //   // If you need to update the view immediately
    //   this.cdr.detectChanges();
    // });
    // this.subscriptions.add(
    //   this.formService.formReset$.subscribe(() => {
    //     this.isGoogleAuthEnabled = false;
    //     this.stepForm.get('password')?.enable();
    //     this.stepForm.get('confirmPassword')?.enable();
    //     console.log("Passwords enabled");
    //     this.cdr.detectChanges();
    //   })
    // );

    // this.subscriptions.add(
    //   this.formService.formReset$.subscribe((reset) => {
    //     console.log('StepOnePersonalInfoComponent: Form reset event received');
    //     if(reset){
    //     this.isGoogleAuthEnabled = false;
    //     console.log('isGoogleAuthEnabled set to false after form reset');
    //     this.stepForm.get('password')?.enable();
    //     this.stepForm.get('confirmPassword')?.enable();
    //     console.log("PASSWORDS ENABLED!!!!!");
    //     console.log("StepOnePersonalInfoComponent: Passwords enabled");
    //     console.log('STATE OF GOOGLE AUTH:', this.isGoogleAuthEnabled);
    //     this.cdr.detectChanges();
    //     }
    //   })
    // );

    // this.formService.resetForm();

    this.resetGoogleAuthState();

    // Force reset Google Auth state
  this.userService.setGoogleAuthEnabled(false);
  this.updatePasswordFieldsState(false);

  // Remove any stored user data
  localStorage.removeItem('user');

  // Ensure the fields are enabled after a short delay
  setTimeout(() => {
    this.updatePasswordFieldsState(false);
    this.cdr.detectChanges();
  }, 0);

  // Trigger loading spinner for oauth
  // this.subscriptions.add(
  //   this.isLoadingSignup$.subscribe(isLoading => {
  //     this.zone.run(() => {
  //       this.isLoadingGoogle = isLoading;
  //       console.log('isLoadingGoogle changed:', isLoading);
  //       this.cdr.detectChanges();
  //     });
  //   })
  // );

    console.log('StepOnePersonalInfoComponent: Subscribed to formReset$');
  
    // window.addEventListener('message', this.handleAuthMessage.bind(this), false);

    // this.authSubscription = this.authStateService.isAuthenticated$.subscribe(
    //   isAuthenticated => {
    //     if (isAuthenticated) {
    //       // this.clearLoginTimeout();
    //       this.isLoadingGoogle = false;
    //       this.handleSuccessfulLogin();
    //       console.log('User authenticated successfully');
    //       // Handle successful login (e.g., navigate to a different page)
    //     }
    //   }
    // );
   // Subscribe to changes in the password and confirmPassword fields
    // this.stepForm.get('password')?.valueChanges.subscribe(() => {
    //   this.checkPasswords();
    // });

    // this.stepForm.get('confirmPassword')?.valueChanges.subscribe(() => {
    //   this.checkPasswords();
    // });

    // this.route.queryParams.subscribe(params => {
    //   if (params['code']) {
    //     this.handleOAuthCallback(params['code']);
    //   }
    // });

    this.authStateService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.authSubscription = this.oauthService.authResult$.subscribe(
          user => {
            // console.log('StepOnePersonalInfoComponent: Received auth result:', user);
            if (user) {
              this.populateFormWithUserData(user);
            }
          },
          // error => console.error('StepOnePersonalInfoComponent: Error in auth subscription:', error),
          () => console.log('StepOnePersonalInfoComponent: Auth subscription completed')
        );
      }
      else{
        this.resetGoogleAuthState();
      }
      this.cdr.detectChanges();
    });
    

    // this.authSubscription = this.oauthService.authResult$.subscribe(
    //   user => {
    //     // console.log('StepOnePersonalInfoComponent: Received auth result:', user);
    //     if (user) {
    //       this.populateFormWithUserData(user);
    //     }
    //   },
    //   error => {
    //     // console.error('StepOnePersonalInfoComponent: Error in auth subscription:', error);
    //     // Handle authentication error if necessary
    //     this.isLoadingGoogle = false;
    //   }
    // );

     // Handle loading spinner oauth - error
    this.subscriptions.add(
      this.oauthService.authError$.subscribe(error => {
        this.zone.run(() => {
          this.isLoadingGoogle = false;
          this.cdr.detectChanges();
        });
      })
    );

    // handle closing the popup
    this.subscriptions.add(
      this.oauthService.popupClosed$.subscribe(() => {
        this.zone.run(() => {
          if (this.isLoadingGoogle) {
            this.isLoadingGoogle = false;
            console.log('OAuth popup closed without completing authentication');
            // Optionally, show a message to the user
            this.cdr.detectChanges();
          }
        });
      })
    );

    // this.subscriptions.add(
    //   this.oauthService.popupClosed$.subscribe(() => {
    //     if (this.isLoadingGoogle) {
    //       this.isLoadingGoogle = false;
    //       // Handle popup closed without completing authentication
    //     }
    //   })
    // );
  

    this.authStateService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.handleSuccessfulLogin();
      }
    });

    // Check if user data exists in localStorage
    // this.authSubscription = this.oauthService.authResult$.subscribe(
    //   user => {
    //     if (user) {
    //       // console.log('Received user data:', user);
    //       this.populateFormWithUserData(user);
    //     }
    //   });
  
    
     // Check if user data exists in localStorage
    //  const userData = localStorage.getItem('user');
    // if (userData) {
    //   this.populateFormWithUserData(JSON.parse(userData));
    // } else {
    // }
    // this.authStateService.isAuthenticated$.subscribe(isAuthenticated => {
    //   if (isAuthenticated) {
    //     console.log('Authentication state:', isAuthenticated);
    //     if (!isAuthenticated) {
    //       this.resetGoogleAuthState();
    //     } else{
    //     const userData = localStorage.getItem('user');
    //     if (userData) {
    //       this.populateFormWithUserData(JSON.parse(userData));
    //     }
    //   }
    //   } else {
    //     // Ensure that isGoogleAuthEnabled is false when not authenticated
    //     this.isGoogleAuthEnabled = false;
    //     this.resetGoogleAuthState();
    //     // this.stepForm.get('isGoogleAuth')?.setValue(false, { emitEvent: false });
    //     // this.stepForm.get('password')?.enable();
    //     // this.stepForm.get('confirmPassword')?.enable();
    //   }
    //   this.cdr.detectChanges();
    // });

    this.subscriptions.add(
      this.authStateService.isAuthenticated$.subscribe(isAuthenticated => {
        console.log('Authentication state:', isAuthenticated);
        if (!isAuthenticated) {
          this.resetGoogleAuthState();
        } else {
          // Only populate form if we're not on the signup page
          if (!this.router.url.includes('/signup')) {
            const userData = localStorage.getItem('user');
            if (userData) {
              this.populateFormWithUserData(JSON.parse(userData));
            }
          } else {
            // If we are on the signup page and authenticated, we should log out
            // if (this.stepForm.pristine) {
            //   this.userService.logoutUser();
            //   this.resetGoogleAuthState();
            // }
          }
        }
        this.cdr.detectChanges();
      })
    );

    // this.oauthService.checkForStoredAuthResult();

    // const oauthResult = localStorage.getItem('oauthResult');
    // if (oauthResult) {
    //   const parsedResult = JSON.parse(oauthResult);
    //   if (parsedResult.type === 'GOOGLE_AUTH_SUCCESS') {
    //     this.oauthService.handleSuccessfulAuth(parsedResult.payload);
    //   }
    //   localStorage.removeItem('oauthResult');
    // }

    // this.oauthService.handleRedirectAfterLogin().then(success => {
    //   if (success) {
    //     this.handleSuccessfulLogin();
    //   }
    // });

    this.stepForm.get('confirmPassword')?.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.checkPasswords());

  }

    
  isFieldDisabled(fieldName: string): boolean {
    const control = this.stepForm.get(fieldName);
    return control ? control.disabled : false;
  }

  // private updatePasswordFieldsState(isEnabled: boolean): void {
  //   const passwordControl = this.stepForm.get('password');
  //   const confirmPasswordControl = this.stepForm.get('confirmPassword');

  //   if (isEnabled) {
  //     passwordControl?.disable();
  //     confirmPasswordControl?.disable();
  //   } else {
  //     passwordControl?.enable();
  //     confirmPasswordControl?.enable();
  //   }
  // }

  private updatePasswordFieldsState(isEnabled: boolean): void {
    const passwordControl = this.stepForm.get('password');
    const confirmPasswordControl = this.stepForm.get('confirmPassword');
  
    if (isEnabled) {
      passwordControl?.disable({ emitEvent: false });
      confirmPasswordControl?.disable({ emitEvent: false });
    } else {
      passwordControl?.enable({ emitEvent: false });
      confirmPasswordControl?.enable({ emitEvent: false });
    }
    this.cdr.detectChanges(); // Trigger change detection
  }

  ngOnDestroy(): void {
    // console.log('StepOnePersonalInfoComponent: Destroying');
    this.destroy$.next();
    this.destroy$.complete();

    console.log('StepOnePersonalInfoComponent: Destroying');
    this.subscriptions.unsubscribe();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.formResetSubscription) {
      this.formResetSubscription.unsubscribe();
    }
    // window.removeEventListener('message', this.handleAuthMessage.bind(this), false);
    
    // if (this.popupClosedSubscription) {
    //   this.popupClosedSubscription.unsubscribe();
    // }
  
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
  

  // private resetGoogleAuthState(): void {
  //   console.log('Resetting Google Auth state');
  //   this.isGoogleAuthEnabled = false;
  //   this.userService.setGoogleAuthEnabled(false);
  //   this.stepForm.patchValue({ isGoogleAuth: false });
  //   this.updatePasswordFieldsState(false);
  // }

  private resetGoogleAuthState(): void {
    console.log('Resetting Google Auth state');
    this.userService.setGoogleAuthEnabled(false);
    const currentFormValue = this.stepForm.value;
    this.stepForm.patchValue({
      ...currentFormValue,
      isGoogleAuth: false
    }, { emitEvent: false });
    this.updatePasswordFieldsState(false);
    // localStorage.removeItem('user');
  }

  // private updatePasswordFieldsState(isEnabled: boolean): void {
  //   if (isEnabled) {
  //     this.stepForm.get('password')?.disable();
  //     this.stepForm.get('confirmPassword')?.disable();
  //   } else {
  //     this.stepForm.get('password')?.enable();
  //     this.stepForm.get('confirmPassword')?.enable();
  //   }
  // }
  // checkEmail() {
  //   const email = this.stepForm.get('email')?.value;
  //   if (email) {
  //     this.userService.checkEmail(email).subscribe(
  //       (response: {exists: boolean, message: string}) => {
  //         if (response.exists) {
  //           this.emailExists = true;
  //           this.stepForm.get('email')?.setErrors({'emailExists': true});
  //         } else {
  //           this.emailExists = false;
  //           this.stepForm.get('email')?.setErrors(null);
  //         }
  //       },
  //       (error) => {
  //         console.error('Error checking email:', error);
  //       }
  //     );
  //   }
  // }

  // checkEmail() {
  //   const email = this.stepForm.get('email')?.value;
  //   if (email) {
  //     this.userService.checkEmail(email).subscribe(
  //       (response: {exists: boolean, message: string}) => {
  //         this.emailExists = response.exists;
  //         this.stepForm.get('email')?.setErrors(this.emailExists ? {'emailExists': true} : null);
  //       },
  //       (error) => console.error('Error checking email:', error)
  //     );
  //   }
  // }

  // In your StepOnePersonalInfoComponent

getEmailErrorMessage(): string {
  const emailControl = this.stepForm.get('email');
  
  if (!emailControl || !emailControl.errors) return '';

  if (!emailControl.value || !emailControl.value.trim()) {
    return 'Email is required';
  }
  
  if (emailControl.hasError('required')) {
    return 'Email is required';
  }
  
  if (emailControl.hasError('email') || emailControl.hasError('pattern')) {
    return 'Invalid Email';
  }
  
  if (emailControl.hasError('emailExists')) {
    return 'Email already exists';
  }

  return '';
}

// Update the checkEmail method to properly set form validity
checkEmail() {
  const emailControl = this.stepForm.get('email');
  if (!emailControl || !emailControl.value) return;

  // Trim the email value
  const trimmedEmail = emailControl.value.trim();

  // If the email is empty after trimming, set required error
  if (!trimmedEmail) {
    emailControl.setErrors({ 'required': true });
    return;
  }

  if (emailControl.errors && (emailControl.errors['email'] || emailControl.errors['pattern'])) {
    return; // Don't check server if format is invalid
  }

  this.userService.checkEmail(emailControl.value).subscribe(
    (response: {exists: boolean, message: string}) => {
      if (response.exists) {
        emailControl.setErrors({ emailExists: true });
      } else {
        // Only clear the emailExists error, preserve other validation errors if any
        const currentErrors = emailControl.errors;
        if (currentErrors) {
          delete currentErrors['emailExists'];
          emailControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
        }
      }
      this.cdr.detectChanges();
    },
    (error) => console.error('Error checking email:', error)
  );
}

private normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

onEmailBlur() {
  const emailControl = this.stepForm.get('email');
  if (emailControl && typeof emailControl.value === 'string') {
    const normalized = this.normalizeEmailInput(emailControl.value);
    if (normalized !== emailControl.value) {
      emailControl.setValue(normalized);
    }
    this.checkEmail();
  }
}

// getInputStyle(controlName: string): { [key: string]: string } {
//   const control = this.stepForm.get(controlName);
//   let isInvalid = false;

//   if (control) {
//     if (controlName === 'email') {
//       isInvalid = (control.invalid && control.touched) || control.hasError('emailExists');
//     } else if (controlName === 'password' || controlName === 'confirmPassword') {
//       isInvalid = (control.invalid && control.touched) || 
//                   (controlName === 'confirmPassword' && this.passwordMismatch && control.touched);
//     } else {
//       isInvalid = control.invalid && control.touched;
//     }
//   }

//   return {
//     'border-color': isInvalid ? 'red' : 'black',
//     '--placeholder-color': isInvalid ? 'red' : 'black',
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

// getLabelStyle(controlName: string): { [key: string]: string } {
//   const control = this.stepForm.get(controlName);
//   let isInvalid = false;

//   if (control) {
//     if (controlName === 'email') {
//       isInvalid = (control.invalid && control.touched) || control.hasError('emailExists');
//     } else if (controlName === 'password' || controlName === 'confirmPassword') {
//       isInvalid = (control.invalid && control.touched) || 
//                   (controlName === 'confirmPassword' && this.passwordMismatch && control.touched);
//     } else {
//       isInvalid = control.invalid && control.touched;
//     }
//   }

//   return {
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

// getInputStyle(controlName: string): { [key: string]: string } {
//   const control = this.stepForm.get(controlName);
//   let isInvalid = false;

//   if (control) {
//     switch (controlName) {
//       case 'email':
//         const trimmedValue = control.value?.trim() || '';
//           isInvalid = (control.invalid && control.touched) || 
//                       control.hasError('emailExists') || 
//                       (!trimmedValue && control.touched);
//           break;
//       case 'password':
//       case 'confirmPassword':
//         isInvalid = (control.invalid && control.touched) || 
//                     (controlName === 'confirmPassword' && this.passwordMismatch && control.touched);
//         break;
//       default:
//         isInvalid = control.invalid && control.touched;
//     }
//   }

//   return {
//     'border-color': isInvalid ? 'red' : 'black',
//     '--placeholder-color': isInvalid ? 'red' : 'black',
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

// getInputStyle(controlName: string): { [key: string]: string } {
//   const control = this.stepForm.get(controlName);
//   let isInvalid = false;

//   if (control) {
//     switch (controlName) {
//       case 'email':
//         const trimmedValue = control.value?.trim() || '';
//         isInvalid = (control.invalid && control.touched) || 
//                     control.hasError('emailExists') || 
//                     (!trimmedValue && control.touched);
//         break;
//       case 'password':
//         // Show red border on password when there's a mismatch and confirmPassword is touched
//         const confirmPasswordControl = this.stepForm.get('confirmPassword');
//         isInvalid = (control.invalid && control.touched) || 
//                     (this.passwordMismatch && confirmPasswordControl!.touched);
//         break;
//       case 'confirmPassword':
//         isInvalid = (control.invalid && control.touched) || 
//                     (this.passwordMismatch && control.touched);
//         break;
//       default:
//         isInvalid = control.invalid && control.touched;
//     }
//   }

//   return {
//     'border-color': isInvalid ? 'red' : 'black',
//     '--placeholder-color': isInvalid ? 'red' : 'black',
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

getInputStyle(controlName: string): { [key: string]: string } {
  const control = this.stepForm.get(controlName);
  let isInvalid = false;

  if (control) {
    switch (controlName) {
      case 'email':
        const trimmedValue = control.value?.trim() || '';
        isInvalid = (control.invalid && control.touched) || 
                    control.hasError('emailExists') || 
                    (!trimmedValue && control.touched);
        break;
      case 'password':
        const confirmPasswordControl = this.stepForm.get('confirmPassword');
        isInvalid = (control.invalid && control.touched) || 
                    (this.passwordMismatch && confirmPasswordControl!.touched);
        break;
      case 'confirmPassword':
        isInvalid = (control.invalid && control.touched) || 
                    (this.passwordMismatch && control.touched);
        break;
      default:
        isInvalid = control.invalid && control.touched;
    }
  }

  const styles: { [key: string]: string } = {
    'border-color': isInvalid ? 'red' : 'black',
    '--placeholder-color': isInvalid ? 'red' : 'black',
    'color': isInvalid ? 'red' : 'black',
    '--eye-icon-color': isInvalid ? 'red' : '#646464',
    '--eye-icon-hover-color': isInvalid ? '#d01515' : '#333333' 
  };

  return styles;
}

// getLabelStyle(controlName: string): { [key: string]: string } {
//   const control = this.stepForm.get(controlName);
//   let isInvalid = false;

//   if (control) {
//     switch (controlName) {
//       case 'email':
//         isInvalid = (control.invalid && control.touched) || control.hasError('emailExists');
//         break;
//       case 'password':
//       case 'confirmPassword':
//         isInvalid = (control.invalid && control.touched) || 
//                     (controlName === 'confirmPassword' && this.passwordMismatch && control.touched);
//         break;
//       default:
//         isInvalid = control.invalid && control.touched;
//     }
//   }

//   return {
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

getLabelStyle(controlName: string): { [key: string]: string } {
  const control = this.stepForm.get(controlName);
  let isInvalid = false;

  if (control) {
    switch (controlName) {
      case 'email':
        isInvalid = (control.invalid && control.touched) || 
                    control.hasError('emailExists');
        break;
      case 'password':
        // Show red label on password when there's a mismatch and confirmPassword is touched
        const confirmPasswordControl = this.stepForm.get('confirmPassword');
        isInvalid = (control.invalid && control.touched) || 
                    (this.passwordMismatch && confirmPasswordControl!.touched);
        break;
      case 'confirmPassword':
        isInvalid = (control.invalid && control.touched) || 
                    (this.passwordMismatch && control.touched);
        break;
      default:
        isInvalid = control.invalid && control.touched;
    }
  }

  return {
    'color': isInvalid ? 'red' : 'black'
  };
}

// shouldShowError(controlName: string): boolean {
//   const control = this.stepForm.get(controlName);
//   if (!control) return false;

//   if (controlName === 'email') {
//     return (control.invalid && control.touched) || control.hasError('emailExists');
//   } else if (controlName === 'confirmPassword') {
//     return (control.invalid && control.touched) || 
//            (this.passwordMismatch && control.touched);
//   }
//   return control.invalid && control.touched;
// }

// shouldShowError(controlName: string): boolean {
//   const control = this.stepForm.get(controlName);
//   if (!control) return false;

//   switch (controlName) {
//     case 'email':
//         const trimmedValue = control.value?.trim() || '';
//         return (control.invalid && control.touched) || 
//                control.hasError('emailExists') || 
//                (!trimmedValue && control.touched);
//     case 'password':
//     case 'confirmPassword':
//       return (control.invalid && control.touched) || 
//              (controlName === 'confirmPassword' && this.passwordMismatch && control.touched);
//     default:
//       return control.invalid && control.touched;
//   }
// }

shouldShowError(controlName: string): boolean | undefined {
  const control = this.stepForm.get(controlName);
  if (!control) return false;

  switch (controlName) {
    case 'email':
      const trimmedValue = control.value?.trim() || '';
      return (control.invalid && control.touched) || 
             control.hasError('emailExists') || 
             (!trimmedValue && control.touched);
    case 'password':
      // Show error on password field when there's a mismatch and confirmPassword is touched
      const confirmPasswordControl = this.stepForm.get('confirmPassword');
      return (control.invalid && control.touched) || 
             (this.passwordMismatch && confirmPasswordControl?.touched);
    case 'confirmPassword':
      return (control.invalid && control.touched) || 
             (this.passwordMismatch && control.touched);
    default:
      return control.invalid && control.touched;
  }
}

getErrorMessage(controlName: string): string {
  const control = this.stepForm.get(controlName);
  if (!control) return '';

  if (controlName === 'name') {
    if (control.hasError('required')) {
      return 'Name is required';
    }
    if (control.hasError('minlength')) {
      return 'Must be at least 4 characters';
    }
    if (control.hasError('pattern')) {
      return 'Invalid';
    }
  }

  if (controlName === 'email') {
    if (control.hasError('required')) {
      return 'Email is required';
    }
    if (control.hasError('email') || control.hasError('pattern')) {
      return 'Invalid';
    }
    if (control.hasError('emailExists')) {
      return 'Email already exists';
    }
  }

  if (controlName === 'password') {
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('pattern')) {
      return 'Requirements not met';
    }
  }

  if (controlName === 'confirmPassword') {
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('pattern')) {
      return 'Requirements not met';
    }
    if (this.passwordMismatch) {
      return 'Passwords do not match';
    }
  }

  return '';
}

private normalizeNameInput(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

onNameBlur() {
  const nameControl = this.stepForm.get('name');
  if (nameControl && typeof nameControl.value === 'string') {
    const normalized = this.normalizeNameInput(nameControl.value);
    if (normalized !== nameControl.value) {
      nameControl.setValue(normalized);
    }
  }
}

  // validatePasswords(): void {
  //   const password = this.formService.multiStepForm.get('personalDetails.password')?.value;
  //   const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

  //   this.passwordMissmatch = password !== confirmPassword;
  // }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

   // Check password mismatch
  //  checkPasswords() {
  //   const password = this.stepForm.get('password')?.value;
  //   const confirmPassword = this.stepForm.get('confirmPassword')?.value;


  // this.passwordMismatch = password !== confirmPassword;

  // if (this.passwordMismatch) {
  //   this.stepForm.get('confirmPassword')?.setErrors({ mismatch: true });
  // } else {
  //   this.stepForm.get('confirmPassword')?.setErrors(null);
  // }
  // }
  checkPasswords() {
    
    const password = this.stepForm.get('password')?.value;
    const confirmPassword = this.stepForm.get('confirmPassword')?.value;
  
    if (this.stepForm.get('confirmPassword')?.touched) {
      if (confirmPassword === '') {
        // Don't show mismatch error if confirm password is empty
        this.passwordMismatch = false;
        this.stepForm.get('confirmPassword')?.setErrors(null);
      } else if (password !== confirmPassword) {
        this.passwordMismatch = true;
        this.stepForm.get('confirmPassword')?.setErrors({ mismatch: true });
      } else {
        this.passwordMismatch = false;
        this.stepForm.get('confirmPassword')?.setErrors(null);
      }
    }
  }
  // Show and hide password popup
  showPasswordPopup() {
    this.isPopupVisible = true;
  }

  hidePasswordPopup() {
    this.isPopupVisible = false;
  }

  // Prevent copy and paste in confirm password field
  preventCopyPaste(event: ClipboardEvent): void {
    event.preventDefault();
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.stepForm.controls['password'];
    if (passwordControl.hasError('required')) {
      return 'Password is required';
    }
    // if (passwordControl.hasError('minlength')) {
    //   return 'Password must be at least 8 characters long';
    // }
    if (passwordControl.hasError('pattern')) {
      return 'Requirements not met';
    }
    return 'Invalid password';
  }

  getConfirmPasswordErrorMessage(): string {
    const passwordControl = this.stepForm.controls['confirmPassword'];
    if (passwordControl.hasError('required')) {
      return 'Password is required';
    }
    // if (passwordControl.hasError('minlength')) {
    //   return 'Password must be at least 8 characters long';
    // }
    if (passwordControl.hasError('pattern')) {
      return 'Requirements not met';
    }
    return 'Invalid password';
  }


  // onClickGoogle() {
  //   this.isLoadingGoogle = true;
  //   this.isLoadingApple = false;
  //   this.oauthService.initiateLogin();
  // }


  onClickGoogle(): void {
    
    console.log('onClickGoogle called');
    this.isLoadingGoogle = true;
    this.oauthService.initiateLogin(true);

    
    // this.subscriptions.add(
    //   this.oauthService.authResult$.subscribe(
    //     (user) => {
    //       this.zone.run(() => {
    //         this.isLoadingGoogle = false;
    //         if (user) {
    //           this.populateFormWithUserData(user);
    //         }
    //         this.cdr.detectChanges();
    //       });
    //     },
    //     (error) => {
    //       this.zone.run(() => {
    //         this.isLoadingGoogle = false;
    //         console.error('Google login error:', error);
    //         this.cdr.detectChanges();
    //       });
    //     }
    //   )
    // );
  }



  onClickApple() {
    // this.isLoadingApple = true;
    this.isLoadingGoogle = false;
    // this.authStateService.login();
    // Simulating authentication process
    // setTimeout(() => {
    //   this.isLoading = false;
    // }, 3000); 
    // setTimeout(() => {
    //   this.hideAppleLoadingSpinner();
    // }, 10000);
  }
    
 

    // private populateFormWithUserData(user: any): void {
    //   console.log('Populating form with user data:', user);
    //   this.stepForm.patchValue({
    //     name: user.name,
    //     email: user.email,
    //     isGoogleAuth: true
    //   });
    //   this.stepForm.get('password')?.disable();
    //   this.stepForm.get('confirmPassword')?.disable();
    //   console.log('Form updated:', this.stepForm.value);
    //   this.isLoadingGoogle = false;
    //   this.cdr.detectChanges();
    // }

    // private populateFormWithUserData(user: any): void {

    //   console.log('populateFormWithUserData called with user:', user);
    //   // console.log('StepOnePersonalInfoComponent: Populating form with user data:', user);
    //   if (!this.authStateService.isAuthenticated$) {
    //     return;
    //   }

    //   this.stepForm.patchValue({
    //     name: user.name,
    //     email: user.email,
    //     isGoogleAuth: true
    //   });
    //   this.stepForm.get('password')?.disable();
    //   this.stepForm.get('confirmPassword')?.disable();
    //   this.isGoogleAuthEnabled = true;
    //   // console.log('StepOnePersonalInfoComponent: Form updated:', this.stepForm.value);
    //   this.isLoadingGoogle = false;
    //   this.cdr.detectChanges();
    // }

    // private populateFormWithUserData(user: any): void {
    //   console.log('populateFormWithUserData called with user:', user);
    //   if (!this.authStateService.isAuthenticated$) {
    //     return;
    //   }
  
    //   this.stepForm.patchValue({
    //     name: user.name,
    //     email: user.email,
    //     isGoogleAuth: true
    //   });
    //   // this.isGoogleAuthEnabled = true;
    //   this.userService.setGoogleAuthEnabled(true);
    //   // this.updatePasswordFieldsState();
    //   this.isLoadingGoogle = false;
    //   this.cdr.detectChanges();
    // }

    private populateFormWithUserData(user: any): void {
      console.log('populateFormWithUserData called with user:', user);
      if (!this.authStateService.isAuthenticated$) {
        return;
      }
    
      this.stepForm.patchValue({
        name: user.name,
        email: user.email,
        isGoogleAuth: true
      }, { emitEvent: false });
      this.userService.setGoogleAuthEnabled(true);
      this.updatePasswordFieldsState(true);
      this.isLoadingGoogle = false;
      this.cdr.detectChanges();
    }

    
    // private handleSuccessfulLogin(): void {
    //   this.zone.run(() => {
    //     this.isLoadingGoogle = false;
    //     console.log('User authenticated successfully');
    //     const user = JSON.parse(localStorage.getItem('user') || '{}');
    //     this.formService.updateFormWithGoogleData(user);
    //     this.cdr.detectChanges();
    //   });
    // }

    private handleSuccessfulLogin(): void {
      this.isLoadingGoogle = false;
      // console.log('User authenticated successfully');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.populateFormWithUserData(user);
      this.cdr.detectChanges();
    }
  
    private handleLoginError(error: string) {
      this.isLoadingGoogle = false;
      // console.log('Google login was cancelled or failed');
      // Optionally, show an error message to the user
    }

    private handlePopupClosed(): void {
      this.isLoadingGoogle = false;
      // You can add additional logic here, such as showing a message to the user
      // console.log('Google login popup was closed');
    }
  }






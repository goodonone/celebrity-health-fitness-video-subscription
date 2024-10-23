import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { passwordMatchValidator } from 'src/app/shared/Multi-Step-Form/form/form.service';

enum ResetPageState {
  SendResetEmail,
  ChangingPassword,
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  navbar!: HTMLElement | null;
  menu!: HTMLElement | null;
  emailForm!: FormGroup;
  private destroy$ = new Subject<void>();
  showEmailError = false;
  fullWidth = false;
  resetEmailSent = false;
  passwordForm!: FormGroup;
  ResetPageState = ResetPageState;
  currentState: ResetPageState = ResetPageState.SendResetEmail;
  // currentState: ResetPageState = ResetPageState.ChangingPassword;
  isPopupVisible = false;
  passwordMismatch: boolean = false;
  userId!: string;
  passwordVisible = false;
  resetToken: string | null = null;
  formSubmitted = false;
  emailSendingError = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Reset password initialized');
    // this.form = this.fb.group({
    //     email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]]
    //   });

    // Check for reset token in the URL
    this.route.params.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.resetToken = token;
        this.currentState = ResetPageState.ChangingPassword;
      } else {
        this.currentState = ResetPageState.SendResetEmail;
      }
    });

    this.emailForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        ],
      ],
    });

    this.emailForm.get('email')?.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.formSubmitted || this.emailForm.get('email')!.touched) {
        this.showEmailError = this.emailForm.get('email')!.invalid;
      }
    });


    this.passwordForm = this.fb.group({
      passwordGroup: this.fb.group(
        {
          password: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              Validators.pattern(
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
              ),
            ],
          ],
          confirmPassword: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              Validators.pattern(
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
              ),
            ],
          ],
        },
        { validators: passwordMatchValidator }
      ),
    });

    this.emailForm
      .get('email')
      ?.valueChanges.pipe(debounceTime(1500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEmailError = true;
      });

    this.navbar = document.getElementById('navbar');
    this.menu = document.querySelector('.menu');
    this.navbar?.classList.add('shadow');
    this.menu?.classList.add('shadow');

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.resetNavbarState();
      }
    });

  // Subscribe to confirm password changes
  const confirmPasswordControl = this.passwordForm.get('passwordGroup.confirmPassword');
  
  confirmPasswordControl?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      // Only check for mismatch if the confirm password field has been touched
      if (confirmPasswordControl.touched) {
        this.checkPasswords();
      }
    });

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // sendResetEmail() {
  //   throw new Error('Method not implemented.');
  // }

  resetNavbarState(): void {
    this.navbar?.classList.remove('black');
    this.menu?.classList.remove('black');
    const navBarTextElements = document.querySelectorAll('.navBarText');
    navBarTextElements.forEach((element) => {
      element.classList.remove('black');
    });
  }

  // onEmailBlur() {
  //   // this.showEmailError = true;
  //   this.showEmailError = this.emailForm.get('email')!.invalid;
  // }

  // onEmailBlur() {
  //   if (this.formSubmitted) {
  //     this.showEmailError = this.emailForm.get('email')!.invalid;
  //   }
  // }

  // updateUserPassword() {
  //   console.log('Update button clicked');
  //   console.log('Form valid:', this.isFormValid());
  //   if (this.isFormValid()) {
  //     const newPassword = this.passwordForm.get(
  //       'passwordGroup.password'
  //     )?.value;
  //     console.log('New password:', newPassword);
  //     this.userService.updatePassword(this.userId, newPassword).subscribe(
  //       () => {
  //         console.log('Password updated successfully');
  //         this.currentState = ResetPageState.SendResetEmail;
  //         // Show success message to the user
  //       },
  //       (error) => {
  //         console.error('Error updating password:', error);
  //         // Show error message to the user
  //       }
  //     );
  //   } else {
  //     console.log('Form is invalid');
  //   }
  // }

  // // Show and hide password popup
  // showPasswordPopup() {
  //   this.isPopupVisible = true;
  // }

  // hidePasswordPopup() {
  //   this.isPopupVisible = false;
  // }

  // getErrorMessage(controlName: string): string {
  //   let control;
    
  //   if (controlName === 'email') {
  //     control = this.emailForm.get('email');
  //     if (!control) return '';
      
  //     if (this.emailSendingError) {
  //       return "Error Sending Email";
  //     }
  //     if (control.hasError('required')) {
  //       return 'Email is required';
  //     }
  //     if (control.hasError('email') || control.hasError('pattern')) {
  //       return 'Invalid email format';
  //     }
  //   } else {
  //     control = this.passwordForm.get(`passwordGroup.${controlName}`);
  //     if (!control) return '';
  
  //     if (control.hasError('required')) {
  //       return 'Required';
  //     }
  //     if (control.hasError('minlength')) {
  //       return 'Must be at least 8 characters';
  //     }
  //     if (control.hasError('pattern')) {
  //       return 'Requirements not met';
  //     }
  //     if (controlName === 'confirmPassword' && this.passwordMismatch) {
  //       return 'Passwords do not match';
  //     }
  //   }
  
  //   return 'Invalid';
  // }

  // getErrorMessage(controlName: string): string {
  //   let control;
    
  //   if (controlName === 'email') {
  //     control = this.emailForm.get('email');
  //     if (!control) return '';
      
  //     if (this.emailSendingError) {
  //       return "Error Sending Email";
  //     }
  //     if (control.hasError('required')) {
  //       return 'Email is required';
  //     }
  //     if (control.hasError('email') || control.hasError('pattern')) {
  //       return 'Invalid email format';
  //     }
  //   } else {
  //     const passwordGroup = this.passwordForm.get('passwordGroup');
  //     control = passwordGroup?.get(controlName);
  //     if (!control) return '';
    
  //     // Show password mismatch error on both fields
  //     if (this.passwordMismatch && (controlName === 'password' || controlName === 'confirmPassword')) {
  //       return 'Passwords do not match';
  //     }
  //     if (control.hasError('required')) {
  //       return 'Required';
  //     }
  //     if (control.hasError('minlength')) {
  //       return 'Must be at least 8 characters';
  //     }
  //     if (control.hasError('pattern')) {
  //       return 'Requirements not met';
  //     }
  //   }
    
  //   return 'Invalid';
  // }

  getErrorMessage(controlName: string): string {
    let control;
    
    if (controlName === 'email') {
          control = this.emailForm.get('email');
          if (!control) return '';
          
          if (this.emailSendingError) {
            return "Error Sending Email";
          }
          if (control.hasError('required')) {
            return 'Email is required';
          }
          if (control.hasError('email') || control.hasError('pattern')) {
            return 'Invalid';
          }
    } else {
      const passwordGroup = this.passwordForm.get('passwordGroup');
      control = passwordGroup?.get(controlName);
      if (!control) return '';
    
      // Only show mismatch error if the field is touched
      if (this.passwordMismatch && control.touched) {
        if (controlName === 'confirmPassword' || 
           (controlName === 'password' && passwordGroup?.get('confirmPassword')?.touched)) {
          return 'Passwords do not match';
        }
      }
      
      if (control.hasError('required')) {
        return 'Required';
      }
      // if (control.hasError('minlength')) {
      //   return 'Must be at least 8 characters';
      // }
      if (control.hasError('pattern')) {
        return 'Requirements not met';
      }
    }
    
    return 'Invalid';
  }

  // Prevent copy and paste in confirm password field
  preventCopyPaste(event: ClipboardEvent): void {
    event.preventDefault();
  }

  // isFormValid(): boolean {
  //   if (!this.passwordForm) {
  //     console.log('Password form is not initialized');
  //     return false;
  //   }

  //   const passwordGroup = this.passwordForm.get('passwordGroup') as FormGroup;
  //   const passwordControl = passwordGroup?.get('password');
  //   const confirmPasswordControl = passwordGroup?.get('confirmPassword');

  //   if (!passwordControl || !confirmPasswordControl) {
  //     console.log('Password controls are not initialized');
  //     return false;
  //   }

  //   const passwordValid =
  //     passwordControl.valid && !passwordControl.hasError('required');
  //   const confirmPasswordValid =
  //     confirmPasswordControl.valid &&
  //     !confirmPasswordControl.hasError('required');
  //   const passwordsMatch = !this.passwordMismatch;

  //   console.log('New password valid:', passwordValid);
  //   console.log('Confirm password valid:', confirmPasswordValid);
  //   console.log('Passwords match:', passwordsMatch);

  //   return passwordValid && confirmPasswordValid && passwordsMatch;
  // }

  isFormValid(): boolean {
    if (!this.passwordForm) {
      return false;
    }
  
    const passwordGroup = this.passwordForm.get('passwordGroup');
    const passwordControl = passwordGroup?.get('password');
    const confirmPasswordControl = passwordGroup?.get('confirmPassword');
  
    if (!passwordControl || !confirmPasswordControl) {
      return false;
    }
  
    const passwordValid = passwordControl.valid && 
                         !passwordControl.hasError('required') && 
                         passwordControl.value?.length > 0;
    
    const confirmPasswordValid = confirmPasswordControl.valid && 
                               !confirmPasswordControl.hasError('required') && 
                               confirmPasswordControl.value?.length > 0;
    
    const noMismatch = !this.passwordMismatch;
    const groupValid = !passwordGroup?.errors;
  
    return passwordValid && confirmPasswordValid && noMismatch && groupValid;
  }

  // checkPasswords(): void {
  //   // this.authenticating = false;
  //   const passwordGroup = this.passwordForm.get('passwordGroup');
  //   const password = passwordGroup?.get('password')?.value;
  //   const confirmPassword = passwordGroup?.get('confirmPassword')?.value;

  //   if (password && confirmPassword) {
  //     this.passwordMismatch = password !== confirmPassword;
  //     if (this.passwordMismatch) {
  //       passwordGroup?.setErrors({ passwordMismatch: true });
  //     } else {
  //       passwordGroup?.setErrors(null);
  //     }
  //   }
  //   this.cdr.detectChanges();
  // }

  // checkPasswords(): void {
  //   const passwordGroup = this.passwordForm.get('passwordGroup');
  //   const password = passwordGroup?.get('password')?.value;
  //   const confirmPassword = passwordGroup?.get('confirmPassword')?.value;
  
  //   if (password && confirmPassword) {
  //     this.passwordMismatch = password !== confirmPassword;
  //     if (this.passwordMismatch) {
  //       passwordGroup?.setErrors({ passwordMismatch: true });
  //     } else {
  //       // Only clear passwordMismatch error, preserve other errors if they exist
  //       const currentErrors = passwordGroup?.errors || {};
  //       if (currentErrors['passwordMismatch']) {
  //         delete currentErrors['passwordMismatch'];
  //         passwordGroup?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
  //       }
  //     }
  //   }
  //   this.cdr.detectChanges();
  // }

  checkPasswords(): void {
    const passwordGroup = this.passwordForm.get('passwordGroup');
    const passwordControl = passwordGroup?.get('password');
    const confirmPasswordControl = passwordGroup?.get('confirmPassword');
  
    if (!passwordControl || !confirmPasswordControl) return;
  
    const password = passwordControl.value;
    const confirmPassword = confirmPasswordControl.value;
  
    // Only show mismatch error if confirmPassword has a value and has been touched
    if (confirmPassword && confirmPasswordControl.touched) {
      this.passwordMismatch = password !== confirmPassword;
      if (this.passwordMismatch) {
        passwordGroup?.setErrors({ passwordMismatch: true });
      } else {
        const currentErrors = passwordGroup?.errors || {};
        if (currentErrors['passwordMismatch']) {
          delete currentErrors['passwordMismatch'];
          passwordGroup?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
        }
      }
    } else {
      // Reset mismatch state if confirm password is empty
      this.passwordMismatch = false;
      const currentErrors = passwordGroup?.errors || {};
      if (currentErrors['passwordMismatch']) {
        delete currentErrors['passwordMismatch'];
        passwordGroup?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }
    }
    
    this.cdr.detectChanges();
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.passwordForm.get('passwordGroup.password');
    if (passwordControl?.hasError('required')) {
      return 'Required';
    }
    if (passwordControl?.hasError('pattern')) {
      return 'Invalid';
    }
    return 'Invalid';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.passwordForm.get(
      'passwordGroup.confirmPassword'
    );
    if (confirmPasswordControl?.hasError('required')) {
      return 'Required';
    }
    if (confirmPasswordControl?.hasError('pattern')) {
      return 'Invalid';
    }
    return 'Invalid';
  }

  cancelAction() {
    this.passwordForm.reset();
    this.currentState = ResetPageState.SendResetEmail;
  }

  // getInputStyle(controlName: string): { [key: string]: string } {
  //   const control = this.passwordForm.get(`passwordGroup.${controlName}`);
  //   const isInvalid = control?.invalid && (control?.dirty || control?.touched);
  //   return {
  //     'border-color': isInvalid ? 'red' : 'black',
  //     '--placeholder-color': isInvalid ? 'red' : 'black',
  //     color: isInvalid ? 'red' : 'black',
  //   };
  // }

  // getInputStyle(controlName: string): { [key: string]: string } {
  //   // const control = this.passwordForm.get(`passwordGroup.${controlName}`);
  //   let control;
  //   if (controlName === 'email') {
  //     control = this.emailForm.get('email');
  //   } else {
  //     control = this.passwordForm.get(`passwordGroup.${controlName}`);
  //   }
  //   const isInvalid = control?.invalid && (control?.dirty || control?.touched);
    
  //   return {
  //       'border-color': isInvalid ? 'red' : 'black',
  //       '--placeholder-color': isInvalid ? 'red' : 'black',
  //       'color': isInvalid ? 'red' : 'black',
  //   };
  // }

  // getEmailLabelStyle(): { [key: string]: string } {
  //   const control = this.emailForm.get('email');
  //   const isInvalid = control?.invalid && (control?.dirty || control?.touched);
    
  //   return {
  //     'color': isInvalid ? 'red' : 'black',
  //   };
  // }

  // Update these methods in your ResetPasswordComponent

isEmailFormValid(): boolean {
  const emailControl = this.emailForm.get('email');
  if (!emailControl) return false;
  
  const trimmedValue = emailControl.value?.trim() || '';
  return emailControl.valid && trimmedValue.length > 0 && !this.emailSendingError;
}

// getInputStyle(controlName: string): { [key: string]: string } {
//   let control;
//   let isInvalid = false;

//   if (controlName === 'email') {
//     control = this.emailForm.get('email');
//     if (control) {
//       const trimmedValue = control.value?.trim() || '';
//       isInvalid = (control.invalid && control.touched) || 
//                   this.emailSendingError ||
//                   (!trimmedValue && control.touched);
//     }
//   } else {
//     control = this.passwordForm.get(`passwordGroup.${controlName}`);
//     if (control) {
//       isInvalid = (control.invalid && control.touched) || 
//                   (controlName === 'confirmPassword' && this.passwordMismatch && control.touched);
//     }
//   }
  
//   return {
//     'border-color': isInvalid ? 'red' : 'black',
//     '--placeholder-color': isInvalid ? 'red' : 'black',
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

// getInputStyle(controlName: string): { [key: string]: string } {
//   let control;
//   let isInvalid = false;

//   if (controlName === 'email') {
//     control = this.emailForm.get('email');
//     if (control) {
//       const trimmedValue = control.value?.trim() || '';
//       isInvalid = (control.invalid && control.touched) || 
//                   this.emailSendingError ||
//                   (!trimmedValue && control.touched);
//     }
//   } else {
//     const passwordGroup = this.passwordForm.get('passwordGroup');
//     control = passwordGroup?.get(controlName);
//     if (control) {
//       // Show red styling on both password fields when there's a mismatch
//       if (this.passwordMismatch && (controlName === 'password' || controlName === 'confirmPassword')) {
//         isInvalid = control.touched;
//       } else {
//         isInvalid = control.invalid && control.touched;
//       }
//     }
//   }
  
//   return {
//     'border-color': isInvalid ? 'red' : 'black',
//     '--placeholder-color': isInvalid ? 'red' : 'black',
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

getInputStyle(controlName: string): { [key: string]: string } {
  let control;
  let isInvalid = false;

  if (controlName === 'email') {
    control = this.emailForm.get('email');
    if (control) {
      const trimmedValue = control.value?.trim() || '';
      isInvalid = (control.invalid && control.touched) || 
                  this.emailSendingError ||
                  (!trimmedValue && control.touched);
    }
  } else {
    const passwordGroup = this.passwordForm.get('passwordGroup');
    control = passwordGroup?.get(controlName);
    const confirmPasswordControl = passwordGroup?.get('confirmPassword');

    if (control) {
      if (controlName === 'password') {
        isInvalid = (control.invalid && control.touched) || 
                    (this.passwordMismatch && confirmPasswordControl?.touched && confirmPasswordControl?.value);
      } else if (controlName === 'confirmPassword') {
        isInvalid = (control.invalid && control.touched) || 
                    (this.passwordMismatch && control.touched);
      }
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
//   let control;
//   let isInvalid = false;

//   if (controlName === 'email') {
//     control = this.emailForm.get('email');
//     if (control) {
//       const trimmedValue = control.value?.trim() || '';
//       isInvalid = (control.invalid && control.touched) || 
//                   this.emailSendingError ||
//                   (!trimmedValue && control.touched);
//     }
//   } else {
//     control = this.passwordForm.get(`passwordGroup.${controlName}`);
//     if (control) {
//       isInvalid = (control.invalid && control.touched) || 
//                   (controlName === 'confirmPassword' && this.passwordMismatch && control.touched);
//     }
//   }

//   return {
//     'color': isInvalid ? 'red' : 'black'
//   };
// }

getLabelStyle(controlName: string): { [key: string]: string } {
  let control;
  let isInvalid = false;

  if (controlName === 'email') {
    control = this.emailForm.get('email');
    if (control) {
      const trimmedValue = control.value?.trim() || '';
      isInvalid = (control.invalid && control.touched) || 
                  this.emailSendingError ||
                  (!trimmedValue && control.touched);
    }
  } else {
    const passwordGroup = this.passwordForm.get('passwordGroup');
    control = passwordGroup?.get(controlName);
    if (control) {
      // Show red styling on both password labels when there's a mismatch
      if (this.passwordMismatch && (controlName === 'password' || controlName === 'confirmPassword')) {
        isInvalid = control.touched;
      } else {
        isInvalid = control.invalid && control.touched;
      }
    }
  }

  return {
    'color': isInvalid ? 'red' : 'black'
  };
}

// Update your onEmailBlur method
onEmailBlur() {
  const emailControl = this.emailForm.get('email');
  if (emailControl && typeof emailControl.value === 'string') {
    const trimmedValue = emailControl.value.trim();
    if (trimmedValue !== emailControl.value) {
      emailControl.setValue(trimmedValue);
    }
  }
  emailControl?.markAsTouched();
  this.emailSendingError = false;
  this.cdr.detectChanges();
}

// shouldShowError(controlName: string): boolean {
//   let control;
  
//   if (controlName === 'email') {
//     control = this.emailForm.get('email');
//     if (!control) return false;
    
//     const trimmedValue = control.value?.trim() || '';
//     return (control.invalid && control.touched) || 
//            this.emailSendingError || 
//            (!trimmedValue && control.touched);
//   } else {
//     // Handle password form controls
//     control = this.passwordForm.get(`passwordGroup.${controlName}`);
//     if (!control) return false;

//     switch (controlName) {
//       case 'password':
//         return control.invalid && control.touched;
      
//       case 'confirmPassword':
//         return (control.invalid && control.touched) || 
//                (this.passwordMismatch && control.touched);
      
//       default:
//         return control.invalid && control.touched;
//     }
//   }
// }

// shouldShowError(controlName: string): boolean {
//   let control;
  
//   if (controlName === 'email') {
//     control = this.emailForm.get('email');
//     if (!control) return false;
    
//     const trimmedValue = control.value?.trim() || '';
//     return (control.invalid && control.touched) || 
//            this.emailSendingError || 
//            (!trimmedValue && control.touched);
//   } else {
//     // Handle password form controls
//     const passwordGroup = this.passwordForm.get('passwordGroup');
//     control = passwordGroup?.get(controlName);
//     if (!control) return false;

//     // Show error on both password fields when there's a mismatch
//     if (this.passwordMismatch && (controlName === 'password' || controlName === 'confirmPassword')) {
//       return control.touched;
//     }

//     return control.invalid && control.touched;
//   }
// }

// shouldShowError(controlName: string): boolean {
//   let control;
  
//   if (controlName === 'email') {
//     // ... existing email validation ...
//   } else {
//     const passwordGroup = this.passwordForm.get('passwordGroup');
//     control = passwordGroup?.get(controlName);
//     if (!control) return false;

//     // Only show password mismatch error if confirm password is touched
//     if (this.passwordMismatch && control.touched) {
//       if (controlName === 'confirmPassword') {
//         return true;
//       }
//       // Only show error on password field if confirm password has a value
//       if (controlName === 'password') {
//         const confirmPasswordControl = passwordGroup?.get('confirmPassword');
//         return confirmPasswordControl?.touched && confirmPasswordControl?.value;
//       }
//     }

//     return control.invalid && control.touched;
//   }
// }

shouldShowError(controlName: string): boolean {
  let control;
  
  if (controlName === 'email') {
    control = this.emailForm.get('email');
    if (!control) return false;
    
    const trimmedValue = control.value?.trim() || '';
    return (control.invalid && control.touched) || 
           this.emailSendingError || 
           (!trimmedValue && control.touched);
  } else {
    // Handle password form controls
    const passwordGroup = this.passwordForm.get('passwordGroup');
    control = passwordGroup?.get(controlName);
    const confirmPasswordControl = passwordGroup?.get('confirmPassword');
    if (!control) return false;

    // For password field
    if (controlName === 'password') {
      if (this.passwordMismatch && confirmPasswordControl?.touched && confirmPasswordControl?.value) {
        return true;
      }
      return control.invalid && control.touched;
    }
    
    // For confirm password field
    if (controlName === 'confirmPassword') {
      if (this.passwordMismatch && control.touched) {
        return true;
      }
      return control.invalid && control.touched;
    }

    return control.invalid && control.touched;
  }
}


  // sendResetEmail() {
  //   if (this.emailForm.valid) {
  //     const email = this.emailForm.get('email')?.value;
  //     this.userService.requestPasswordReset(email).subscribe(
  //       (response) => {
  //         console.log('Reset email sent successfully');
  //         this.resetEmailSent = true;
  //         this.emailForm.reset();
  //         this.emailForm.markAsUntouched();
  //         this.emailForm.markAsPristine();
  //         // You can add a success message here
  //       },
  //       (error) => {
  //         console.error('Error sending reset email:', error);
  //         // You can add an error message here
  //       }
  //     );
  //   } else {
  //     this.showEmailError = true;
  //   }
  // }

  // sendResetEmail() {
  //   this.formSubmitted = true;
  //   this.showEmailError = this.emailForm.get('email')!.invalid;

  //   if (this.emailForm.valid) {
  //     const email = this.emailForm.get('email')?.value;
  //     this.userService.requestPasswordReset(email).subscribe(
  //       (response) => {
  //         console.log('Reset email sent successfully');
  //         this.resetEmailSent = true;
  //         this.showEmailError = false;
  //         this.formSubmitted = false;
  //         this.emailForm.reset();
  //         this.emailForm.get('email')?.setErrors(null);
  //         this.emailForm.markAsUntouched();
  //         this.emailForm.markAsPristine();
  //       },
  //       (error) => {
  //         console.error('Error sending reset email:', error);
  //       }
  //     );
  //   }
   
  // }

  sendResetEmail() {
    this.formSubmitted = true;
    this.emailSendingError = false; // Reset the error flag
    this.cdr.detectChanges(); // Force change detection

    if (this.emailForm.valid) {
      const email = this.emailForm.get('email')?.value;
      this.userService.requestPasswordReset(email).subscribe(
        (response) => {
          console.log('Reset email sent successfully');
          this.resetEmailSent = true;
          this.formSubmitted = false;
          this.emailForm.reset();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.resetEmailSent = false;
            this.cdr.detectChanges();
          }, 5000);
        },
        (error) => {
          console.error('Error sending reset email:', error);
          this.emailSendingError = true;
          this.cdr.detectChanges(); // Force change detection
        }
      );
    }
  }

  shouldShowEmailError(): boolean {
    const emailControl = this.emailForm.get('email');
    return (this.formSubmitted || emailControl!.touched) && (emailControl!.invalid || this.emailSendingError);
  }

  getEmailErrorMessage(): string {
    const emailControl = this.emailForm.get('email');
    if (this.emailSendingError) {
      return "Error Sending Email";
    }
    if (emailControl?.hasError('required')) {
      return 'Email is required';
    }
    if (emailControl?.hasError('email') || emailControl?.hasError('pattern')) {
      return 'Invalid email format';
    }
    return '';
  }

  // onEmailBlur() {
  //   const emailControl = this.emailForm.get('email');
  //   emailControl?.markAsTouched();
  //   this.emailSendingError = false; // Reset the error when the user interacts with the field
  //   this.cdr.detectChanges();
  // }

  updateUserPassword() {
    if (this.isFormValid() && this.resetToken) {
      const newPassword = this.passwordForm.get(
        'passwordGroup.password'
      )?.value;
      this.userService.resetPassword(this.resetToken, newPassword).subscribe(
        () => {
          console.log('Password reset successfully');
          // Navigate to login page or show success message
          this.router.navigate(['/login']);
        },
        (error) => {
          console.error('Error resetting password:', error);
          // Show error message to the user
        }
      );
    } else {
      console.log('Form is invalid or reset token is missing');
    }
  }
}

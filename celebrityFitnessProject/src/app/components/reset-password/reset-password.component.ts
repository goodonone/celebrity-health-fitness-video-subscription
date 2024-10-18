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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    console.log("Reset password initialized");
    // this.form = this.fb.group({
    //     email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]]
    //   });

    // Check for reset token in the URL
    this.route.params.subscribe(params => {
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
          Validators.pattern(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          ),
        ],
      ],
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

  onEmailBlur() {
    this.showEmailError = true;
  }

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

  // Prevent copy and paste in confirm password field
  preventCopyPaste(event: ClipboardEvent): void {
    event.preventDefault();
  }

  isFormValid(): boolean {
    if (!this.passwordForm) {
      console.log('Password form is not initialized');
      return false;
    }

    const passwordGroup = this.passwordForm.get('passwordGroup') as FormGroup;
    const passwordControl = passwordGroup?.get('password');
    const confirmPasswordControl = passwordGroup?.get('confirmPassword');

    if (!passwordControl || !confirmPasswordControl) {
      console.log('Password controls are not initialized');
      return false;
    }

    const passwordValid =
      passwordControl.valid && !passwordControl.hasError('required');
    const confirmPasswordValid =
      confirmPasswordControl.valid &&
      !confirmPasswordControl.hasError('required');
    const passwordsMatch = !this.passwordMismatch;

    console.log('New password valid:', passwordValid);
    console.log('Confirm password valid:', confirmPasswordValid);
    console.log('Passwords match:', passwordsMatch);

    return passwordValid && confirmPasswordValid && passwordsMatch;
  }

  checkPasswords(): void {
    // this.authenticating = false;
    const passwordGroup = this.passwordForm.get('passwordGroup');
    const password = passwordGroup?.get('password')?.value;
    const confirmPassword = passwordGroup?.get('confirmPassword')?.value;

    if (password && confirmPassword) {
      this.passwordMismatch = password !== confirmPassword;
      if (this.passwordMismatch) {
        passwordGroup?.setErrors({ passwordMismatch: true });
      } else {
        passwordGroup?.setErrors(null);
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
    const confirmPasswordControl = this.passwordForm.get('passwordGroup.confirmPassword');
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

  getInputStyle(controlName: string): { [key: string]: string } {
    const control = this.passwordForm.get(`passwordGroup.${controlName}`);
    const isInvalid = control?.invalid && (control?.dirty || control?.touched);
    return {
      'border-color': isInvalid ? 'red' : 'black',
      '--placeholder-color': isInvalid ? 'red' : 'black',
      'color': isInvalid ? 'red' : 'black'
    };
  }

  sendResetEmail() {
    if (this.emailForm.valid) {
      const email = this.emailForm.get('email')?.value;
      this.userService.requestPasswordReset(email).subscribe(
        (response) => {
          console.log('Reset email sent successfully');
          this.resetEmailSent = true;
          // You can add a success message here
        },
        (error) => {
          console.error('Error sending reset email:', error);
          // You can add an error message here
        }
      );
    }
    this.emailForm.reset();
    this.emailForm.markAsUntouched();
    this.emailForm.markAsPristine();
  }

  updateUserPassword() {
    if (this.isFormValid() && this.resetToken) {
      const newPassword = this.passwordForm.get('passwordGroup.password')?.value;
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

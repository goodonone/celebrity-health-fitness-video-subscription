import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective } from '@angular/forms';
import { FormService } from '../../form.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { CustomOAuthService } from 'src/app/services/oauth.service';
import { AuthStateService } from 'src/app/services/authstate.service';


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


  private destroy$ = new Subject<void>();


  constructor(private inputFormGroup: FormGroupDirective, 
    private fb: FormBuilder, public formService: FormService, 
    private cdr: ChangeDetectorRef, private userService: UserService,
    private oauthService: CustomOAuthService,
    private authStateService: AuthStateService) {
      this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
        // The user has been logged in successfully after the redirect
        if (this.oauthService.isLoggedIn) {
          console.log('User logged in after redirect');
          // You can redirect the user or update your app state here
        }
      });
    }


  ngOnInit(): void {
    // this.stepForm = this.inputFormGroup.control.get(this.formGroupName) as FormGroup;
    this.stepForm = this.formService.multiStepForm.get('personalDetails') as FormGroup;
    
    this.authSubscription = this.authStateService.isAuthenticated$.subscribe(
      isAuthenticated => {
        if (isAuthenticated) {
          this.isLoadingGoogle = false;
          console.log('User authenticated successfully');
          // Handle successful login (e.g., navigate to a different page)
        }
      }
    );
   // Subscribe to changes in the password and confirmPassword fields
    // this.stepForm.get('password')?.valueChanges.subscribe(() => {
    //   this.checkPasswords();
    // });

    // this.stepForm.get('confirmPassword')?.valueChanges.subscribe(() => {
    //   this.checkPasswords();
    // });
    this.stepForm.get('confirmPassword')?.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.checkPasswords());

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  checkEmail() {
    const email = this.stepForm.get('email')?.value;
    if (email) {
      this.userService.checkEmail(email).subscribe(
        (response: {exists: boolean, message: string}) => {
          if (response.exists) {
            this.emailExists = true;
            this.stepForm.get('email')?.setErrors({'emailExists': true});
          } else {
            this.emailExists = false;
            this.stepForm.get('email')?.setErrors(null);
          }
        },
        (error) => {
          console.error('Error checking email:', error);
        }
      );
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

  onClickGoogle() {
    this.isLoadingGoogle = true;
    this.isLoadingApple = false;
    this.authStateService.login();
    

    // Simulating authentication process
    // setTimeout(() => {
    //   this.isLoading = false;
    // }, 3000); 
    setTimeout(() => {
      this.hideGoogleLoadingSpinner();
    }, 13000);
  }

    // private showGoogleLoadingSpinner() {
    //   this.isLoadingGoogle = true;
    // }
  
    private hideGoogleLoadingSpinner() {
      this.isLoadingGoogle = false;
    }

    // keep spinning until the user is authenticated, if user clicks apple google oauth is cancelled

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
    
    // private hideAppleLoadingSpinner() {
    //   this.isLoadingGoogle = false;
    // }

    // keep spinning until the user is authenticated, if user clicks google apple oauth is cancelled
  }






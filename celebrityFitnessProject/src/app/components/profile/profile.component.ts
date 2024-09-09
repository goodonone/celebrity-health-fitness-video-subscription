import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  currentUser: User = new User();
  UserId: string = '';
  monthOrYear!: string;

  tierOne = false;
  tierTwo = false;
  tierThree = false;
  freeTier = true;
  firstName?: string;
  editProfileToggle = false;
  saveOrChange = false;
  editOrUpdate = false;
  disappear = false;
  classApplied = false;
  classAppliedTwo = false;
  onlyProfilePicture = true;
  userIsLoggedIn: boolean = false;
  cartQuantity = 0;

  userId!: number;
  classAppliedDeleteProfile = false;
  loadingComplete = false;
  imageLoaded = false;
  updatePassword = false;
  passwordMismatch: boolean = false;
  isPopupVisible: boolean = false;
  passwordVisible = false;
  isUpdatingPassword!: boolean;
  oldPasswordVisible = false;
  stepForm!: FormGroup;
  oldPasswordError: string = '';
  isOldPasswordCorrect: boolean = false;
  firstTimeAnimation: boolean = false;

  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  // Handler properties
  keydownHandler: (event: KeyboardEvent) => void;
  mousedownHandler: (event: MouseEvent) => void;

  private oldPasswordSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  renderer: any;
  elementRef: any;

  constructor(
    private userService: UserService,
    private router: Router,
    private actRoute: ActivatedRoute,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.keydownHandler = (event) => {
      const toggleDiv = document.getElementById('deleteProfile');
      if (event.key === 'Escape' && toggleDiv?.classList.contains('active')) {
        toggleDiv.classList.toggle('active');
        this.toggleDelete();
      }
      // else if(this.updatePassword){
      //   this.goBack();
      // }
    };

    this.mousedownHandler = (event) => {
      const toggleDiv = document.getElementById('deleteProfile');
      if (
        toggleDiv &&
        !toggleDiv.contains(event.target as Node) &&
        toggleDiv.classList.contains('active')
      ) {
        toggleDiv.classList.toggle('active');
        this.toggleDelete();
      }
    };
  }

  ngOnInit(): void {

     // Check if the user has visited the page before to serve animations or not
     const hasVisited = localStorage.getItem('hasVisitedProfileBefore');
     if (!hasVisited) {
       // Trigger animations
       this.triggerAnimations();
       // Store the flag in localStorage
       localStorage.setItem('hasVisitedProfileBefore', 'true');
     } else {
       // Skip animations
       this.skipAnimations();
     }
   
 

    this.loadProfile();

    // Subscribe to router events
    // this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //     // Reload the profile data when navigating to the page

    //   }
    // });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.UpdateStatus();
      }
    });
    this.cartService.getCartObservable().subscribe((newCart) => {
      this.cartQuantity = newCart.totalCount;
    });

    this.initializeEventListeners();

    // Escape key triggers the Cancel Subscription
    // const toggleDiv = document.getElementById('deleteProfile');
    // document.addEventListener('keydown', (event) => {
    //   if (event.key === 'Escape' && toggleDiv?.classList.contains('active')) {
    //     toggleDiv?.classList.toggle('active');
    //     this.toggleDelete();
    //   }
    // });

    // // Clicking outside of the div closes it
    // document.addEventListener('mousedown', (event) => {
    //   if (toggleDiv && !toggleDiv.contains(event.target as Node) && toggleDiv.classList.contains('active')) {
    //     toggleDiv.classList.toggle('active');
    //     this.toggleDelete();
    //   }
    // });

    // Password Validation
    // // Password Validation
    this.stepForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      passwordGroup: this.fb.group({
        password: [
          { value: '', disabled: true },
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            ),
          ],
        ],
        confirmPassword: [
          { value: '', disabled: true },
          [Validators.required],
        ],
      }, { validators: this.passwordMatchValidator })
    });

    // this.oldPasswordSubject.pipe(
    //   debounceTime(1500),
    //   takeUntil(this.destroy$)
    // ).subscribe(() => {
    //   this.checkOldPassword();
    // });

    this.stepForm.get('oldPassword')?.valueChanges.pipe(
      debounceTime(1000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkOldPassword();
    });

    // this.stepForm.get('oldPassword')?.valueChanges.pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe(() => {
    //   this.oldPasswordError = ''; // Clear error when typing
    //   this.isOldPasswordCorrect = false; // Reset this flag when old password changes
    //   this.oldPasswordSubject.next('');
    // });

  
    this.passwordGroup.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.passwordGroup.updateValueAndValidity({ emitEvent: false });
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  ngAfterViewInit(): void {
    // this.checkForFirstTimeAnimation();
  }

  skipAnimations() {
    this.firstTimeAnimation = false;
    // const profilePicture = document.getElementById('profilePicture');
    // profilePicture?.classList.remove('animateBoxShadow');
  }
  triggerAnimations() {
    this.firstTimeAnimation = true;
    // const profilePicture = document.getElementById('profilePicture');
    // profilePicture?.classList.add('animateBoxShadow');
  }
  
  // checkForFirstTimeAnimation() {
  //   if (this.tierThree && !localStorage.getItem('animationRun')) {
  //     const profilePicture = this.elementRef.nativeElement.querySelector('#profilePicture');
  //     if (profilePicture) {
  //       this.renderer.addClass(profilePicture, 'animateBoxShadow');
  //       localStorage.setItem('animationRun', 'true');
  //       this.firstTimeAnimation = true;

  //       // Remove the class after animation completes
  //       setTimeout(() => {
  //         this.renderer.removeClass(profilePicture, 'animateBoxShadow');
  //       }, 500); // Match this to your animation duration
  //     }
  //   } else {
  //     this.firstTimeAnimation = false;
  //   }
  // }
 

  ngOnDestroy(): void {
    // Cleanup any remaining event listeners to prevent memory leaks
    // this.removeEventListeners();
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeEventListeners(): void {
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('mousedown', this.mousedownHandler);
  }

  removeEventListeners(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('mousedown', this.mousedownHandler);
  }

  loadProfile() {
    this.loadingComplete = false;
    this.imageLoaded = false;
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';

    this.userId = parseInt(UserId);

    this.userService.getUser(this.userId).subscribe(
      (user) => {
        this.currentUser = user;
        this.tierThree = this.currentUser.tier === 'TierThree';
        if (this.currentUser.tier === 'Just Looking') {
          this.tierOne = true;
        } else if (this.currentUser.tier === 'Motivated') {
          this.tierTwo = true;
        } else {
          this.tierThree = true;
          // this.tierThree = this.currentUser.tier === 'TierThree'; 
        }
        if (this.currentUser.paymentFrequency === 'monthly') {
          this.monthOrYear = 'month';
        } else {
          this.monthOrYear = 'year';
        }

        if (this.currentUser.tier === 'Just Looking') {
          this.freeTier = true;
        } else {
          this.freeTier = false;
        }
        if (user.imgUrl) {
          this.preloadImage(user.imgUrl);
        } else {
          // If there's no image URL, consider the image "loaded"
          this.imageLoaded = true;
          this.checkLoadingComplete();
        }
        // this.loadingComplete = true;
        const displayName = this.currentUser.name;
        this.firstName = displayName?.split(' ').slice(0, 1).join(' ');
      },
      (error) => {
        console.error('Error loading user profile:', error);
        this.loadingComplete = true;
        this.imageLoaded = true; // Consider image loaded in case of error
        this.cdr.detectChanges();
      }
    );
  }

  reloadProfile() {
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';

    this.userId = parseInt(UserId);

    this.userService.getUser(this.userId).subscribe(
      (user) => {
        this.currentUser = user;
        if (this.currentUser.tier === 'Just Looking') {
          this.tierOne = true;
        } else if (this.currentUser.tier === 'Motivated') {
          this.tierTwo = true;
        } else {
          this.tierThree = true;
        }
        if (this.currentUser.paymentFrequency === 'monthly') {
          this.monthOrYear = 'month';
        } else {
          this.monthOrYear = 'year';
        }

        if (this.currentUser.tier === 'Just Looking') {
          this.freeTier = true;
        } else {
          this.freeTier = false;
        }
        if (user.imgUrl) {
          this.preloadImage(user.imgUrl);
        } else {
          // If there's no image URL, consider the image "loaded"
          this.imageLoaded = true;
          this.checkLoadingComplete();
        }
        // this.loadingComplete = true;
        const displayName = this.currentUser.name;
        this.firstName = displayName?.split(' ').slice(0, 1).join(' ');
      },
      (error) => {
        console.error('Error loading user profile:', error);
        this.loadingComplete = true;
        this.imageLoaded = true; // Consider image loaded in case of error
        this.cdr.detectChanges();
      }
    );
  }

  preloadImage(imgUrl: string) {
    const img = new Image();
    img.onload = () => {
      this.imageLoaded = true;
      this.checkLoadingComplete();
    };
    img.onerror = () => {
      console.error('Error loading image');
      this.imageLoaded = true; 
      this.checkLoadingComplete();
    };
    img.src = imgUrl;
  }

  checkLoadingComplete() {
    if (this.imageLoaded) {
      this.loadingComplete = true;
      this.cdr.detectChanges();
    }
  }

  editProfile() {
    this.userService.updateUser2(this.currentUser).subscribe(() => {
      this.reloadProfile();
    });
  }

  get passwordGroup() {
    return this.stepForm.get('passwordGroup') as FormGroup;
  }

   // Custom validator to check password match
   passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      confirmPassword?.setErrors(null);
      return null;
    }
  }

  // Getter for easy access to form controls
  // get passwordGroup() {
  //   return this.stepForm.get('passwordGroup') as FormGroup;
  // }

  // checkOldPassword() {
  //   const oldPassword = this.stepForm.get('oldPassword')?.value;
  //   this.userService.checkPassword(this.userId, oldPassword).subscribe(
  //     (isCorrect) => {
  //       if (isCorrect) {
  //         this.oldPasswordError = '';
  //         this.passwordGroup.get('password')?.enable();
  //         this.passwordGroup.get('confirmPassword')?.enable();
  //       } else {
  //         this.oldPasswordError = 'Incorrect';
  //         this.passwordGroup.get('password')?.disable();
  //         this.passwordGroup.get('confirmPassword')?.disable();
  //       }
  //     },
  //     (error) => {
  //       console.error('Error checking password:', error);
  //       this.oldPasswordError = 'Error checking password';
  //     }
  //   );
  // }

  // checkOldPassword() {
  //   const oldPassword = this.stepForm.get('oldPassword')?.value;
  //   if (oldPassword) {
  //     this.userService.checkPassword(this.userId, oldPassword).subscribe(
  //       (isCorrect) => {
  //         if (isCorrect) {
  //           this.oldPasswordError = '';
  //           this.stepForm.get('passwordGroup.password')?.enable();
  //           this.stepForm.get('passwordGroup.confirmPassword')?.enable();
  //         } else {
  //           this.oldPasswordError = 'Incorrect';
  //           this.stepForm.get('passwordGroup.password')?.disable();
  //           this.stepForm.get('passwordGroup.confirmPassword')?.disable();
  //         }
  //         this.stepForm.updateValueAndValidity();
  //         this.cdr.detectChanges();
  //       },
  //       (error) => {
  //         console.error('Error checking password:', error);
  //         this.oldPasswordError = 'Error checking password';
  //         this.cdr.detectChanges();
  //       }
  //     );
  //   }
  // }

  checkOldPassword() {
    const oldPassword = this.stepForm.get('oldPassword')?.value;
    if (oldPassword) {
      this.userService.checkPassword(this.userId, oldPassword).subscribe(
        (isCorrect) => {
          this.isOldPasswordCorrect = isCorrect;
          if (isCorrect) {
            this.oldPasswordError = '';
            // this.stepForm.get('passwordGroup.password')?.enable();
            // this.stepForm.get('passwordGroup.confirmPassword')?.enable();
            this.passwordGroup.enable();
          } else {
            this.oldPasswordError = 'Incorrect';
            this.passwordGroup.disable();
            // this.stepForm.get('passwordGroup.password')?.disable();
            // this.stepForm.get('passwordGroup.confirmPassword')?.disable();
          }
          // this.stepForm.updateValueAndValidity();
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error checking password:', error);
          this.oldPasswordError = 'Error checking password';
          this.isOldPasswordCorrect = false;
          this.passwordGroup.disable();
          this.cdr.detectChanges();
        }
      );
    }
    else {
      this.isOldPasswordCorrect = false;
      this.passwordGroup.disable();
  }
}

  isFormValid(): boolean {
    return this.stepForm.valid && 
           this.isOldPasswordCorrect && 
           !this.passwordGroup.errors?.['passwordMismatch'] &&
           this.passwordGroup.valid;
  }

  // updateUserPassword() {
  //   if (this.stepForm.valid && !this.passwordGroup.errors) {
  //     const newPassword = this.passwordGroup.get('password')?.value;
  //     this.userService.updatePassword(this.userId, newPassword).subscribe(
  //       () => {
  //         console.log('Password updated successfully');
  //         this.updatePassword = false; // Close the update password form
  //         // You might want to show a success message to the user
  //       },
  //       (error) => {
  //         console.error('Error updating password:', error);
  //         // Handle error (e.g., show error message to user)
  //       }
  //     );
  //   }
  // }

  updateUserPassword() {
    if (this.isFormValid()) {
      const newPassword = this.passwordGroup.get('password')?.value;
      this.userService.updatePassword(this.userId, newPassword).subscribe(
        () => {
          console.log('Password updated successfully');
          this.updatePassword = false; // Close the update password form
          // You might want to show a success message to the user
        },
        (error) => {
          console.error('Error updating password:', error);
          // Handle error (e.g., show error message to user)
        }
      );
    }
  }

  // checkPasswords() {
  //   const password = this.stepForm.get('password')?.value;
  //   const confirmPassword = this.stepForm.get('confirmPassword')?.value;

  //   if (confirmPassword === '') {
  //     // Don't show mismatch error if confirm password is empty
  //     this.passwordMismatch = false;
  //     this.stepForm.get('confirmPassword')?.setErrors(null);
  //   } else if (password !== confirmPassword) {
  //     this.passwordMismatch = true;
  //     this.stepForm.get('confirmPassword')?.setErrors({ mismatch: true });
  //   } else {
  //     this.passwordMismatch = false;
  //     this.stepForm.get('confirmPassword')?.setErrors(null);
  //   }
  // }

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

  toggleOldPasswordVisibility() {
    this.oldPasswordVisible = !this.oldPasswordVisible;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleProfile() {
    this.saveOrChange = !this.saveOrChange;
    this.classAppliedTwo = !this.classAppliedTwo;
    this.editProfileToggle = !this.editProfileToggle;
    this.onlyProfilePicture = !this.onlyProfilePicture;
  }

  toggleEditProfile() {
    this.classApplied = !this.classApplied;
    this.saveOrChange = !this.saveOrChange;
    this.editOrUpdate = !this.editOrUpdate;
    this.editProfileToggle = !this.editProfileToggle;
  }

  toggleDelete() {
    this.classAppliedDeleteProfile = !this.classAppliedDeleteProfile;
    (
      document.getElementById('deleteProfile') as HTMLFieldSetElement
    ).setAttribute('disabled', 'disabled');
  }

  goodbye() {
    (document.getElementById('cancelSub') as HTMLButtonElement).innerText =
      'Deleting Profile...';
    setTimeout(() => {
      (document.getElementById('cancelSub') as HTMLButtonElement).innerText =
        'Goodbye';
    }, 1000);
    setTimeout(() => {
      this.deleteProfileUser();
    }, 2000);
  }

  deleteProfileUser() {
    this.userService.deleteUser(this.userId).subscribe(() => {
      this.router.navigate(['/home']);
      this.userService.logoutUser();
    });
  }

  UpdateStatus() {
    this.userIsLoggedIn = this.userService.isloggedIn();
    if (this.userIsLoggedIn) {
      this.UserId = this.userService.getUserId() ?? '';
    }
  }

  logOut() {
    this.cartService.clearCart();
    this.userService.logoutUser();
    this.UpdateStatus();
    this.router.navigate(['/home']);
  }

  changePassword() {
    this.classAppliedTwo = !this.classAppliedTwo;
    this.editProfileToggle = !this.editProfileToggle;
    this.onlyProfilePicture = !this.onlyProfilePicture;
    this.updatePassword = !this.updatePassword;
  }

  goBack() {
    this.classApplied = !this.classApplied;
    this.classAppliedTwo = !this.classAppliedTwo;
    this.editProfileToggle = !this.editProfileToggle;
    this.updatePassword = !this.updatePassword;
    this.stepForm.reset();
  }
}

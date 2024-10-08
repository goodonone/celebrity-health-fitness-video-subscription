import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { passwordMatchValidator } from 'src/app/shared/Multi-Step-Form/form/form.service';

enum ProfileState {
  Viewing,
  EditingProfile,
  ChangingPicture,
  ChangingPassword,
  DeletingProfile
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})


export class ProfileComponent implements OnInit {

  // @ViewChild('profileForm') profileForm!: NgForm;
  // @ViewChild('profileNameTier') profileNameTierElement!: ElementRef;
  // @ViewChild('profilePicture') profilePictureElement!: ElementRef;
  
  currentUser: User = new User();
  ProfileState = ProfileState; 
  currentState: ProfileState = ProfileState.Viewing;
  pictureForm!: FormGroup;
  UserId: string = '';
  monthOrYear!: string;
  displayHeight: string = '';
 

  tierOne = false;
  tierTwo = false;
  tierThree = false;
  freeTier = true;
  firstName?: string;
  // editProfileToggle = false;
  // saveOrChange = false;
  // editOrUpdate = false;
  // disappear = false;
  // classApplied = false;
  // classAppliedTwo = false;
  // onlyProfilePicture = true;
  userIsLoggedIn: boolean = false;
  cartQuantity = 0;

  userId!: string;
  classAppliedDeleteProfile = false;
  loadingComplete = false;
  imageLoaded = false;
  updatePassword = false;
  passwordMismatch: boolean = false;
  isPopupVisible: boolean = false;
  passwordVisible = false;
  isUpdatingPassword!: boolean;
  oldPasswordVisible = false;
  // stepForm!: FormGroup;
  oldPasswordError: string = '';
  authenticating: boolean = false;
  isOldPasswordCorrect: boolean = false;
  heightPattern = /^(\d+(\.\d+)?|\d+'\d+"?)$/; 
  heightTouched = false;
  heightFeet!: number;
  heightInches!: number;
  isValidAge: boolean = true;  
  twentyOneError: boolean = false;
  firstTimeAnimation: boolean = true;
  buttonText: string = 'Cancel Subscription';
  isProcessingGoodbye: boolean = false;
  emailExists: boolean = false;
  isWaitingToCheck = false;
  // firstTimeAnimationTierOne: boolean = true;
  // firstTimeAnimationTierTwo: boolean = true;
  // firstTimeAnimationTierThree: boolean = true;
  // currentTier: string = '';
  // lastAnimatedTier: string | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup; 


  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faAngleDown = faAngleDown;


  // Handler properties
  keydownHandler: (event: KeyboardEvent) => void;
  // mousedownHandler: (event: MouseEvent) => void;

  private oldPasswordSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private formSubscription: Subscription | null = null;


  constructor(
    private userService: UserService,
    private router: Router,
    private actRoute: ActivatedRoute,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) {
    this.keydownHandler = (event) => {
      const toggleDiv = document.getElementById('deleteProfile');
      if (event.key === 'Escape' && toggleDiv?.classList.contains('active')) {
        toggleDiv.classList.toggle('active');
        this.currentState = ProfileState.Viewing;
      }
    };

  //   this.mousedownHandler = (event) => {
  //     const toggleDiv = document.getElementById('deleteProfile');
  //     if (
  //       toggleDiv &&
  //       !toggleDiv.contains(event.target as Node) &&
  //       toggleDiv.classList.contains('active')
  //     ) {
  //       toggleDiv.classList.toggle('active');
  //       this.currentState = ProfileState.Viewing;
  //     }
  //   };
  // }
  }

  ngOnInit(): void {
    
    //  this.firstTimeAnimationTierOne = localStorage.getItem('hasVisitedProfileBeforeTierOne') !== 'true';
    //  this.firstTimeAnimationTierTwo = localStorage.getItem('hasVisitedProfileBeforeTierTwo') !== 'true';
    //  this.firstTimeAnimationTierThree = localStorage.getItem('hasVisitedProfileBeforeTierThree') !== 'true';
  
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


    this.initializePictureForm();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.UpdateStatus();
      }
    });
    this.cartService.getCartObservable().subscribe((newCart) => {
      this.cartQuantity = newCart.totalCount;
    });

    this.initializeEventListeners();

    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      dateOfBirth: ['',[]],
      gender: ['', []],
      weight: ['', []],
      height: ['', []],
      goals: ['', []],
      imgUrl: ['', []],
      isGoogleAuth: [false]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      passwordGroup: this.fb.group({
        password: [
          { value: '', disabled: true },
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
          ],
        ],
        confirmPassword: [
          { value: '', disabled: true },
          [Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          ],
        ],
      }, { validators: passwordMatchValidator })
    });

    // this.passwordForm.get('oldPassword')?.valueChanges.pipe(
    //   debounceTime(1500),
    //   takeUntil(this.destroy$)
    // ).subscribe(() => {
    //   // this.oldPasswordError = 'Authenticating';
    //   this.checkOldPassword();
    // });

    this.checkOldPassword();

    this.passwordGroup.get('passwordGroup')?.valueChanges.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkPasswords();
    })
  
    this.passwordGroup.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.passwordGroup.updateValueAndValidity({ emitEvent: false });
      this.cdr.detectChanges(); // Trigger change detection
    });

    // this.logFormState();

    // if (this.currentState === ProfileState.EditingProfile) {
    //   this.updateFormWithUserData();
    // }

    // this.profileForm.get('name')?.valueChanges.subscribe(() => {
    //   this.profileForm.get('name')?.updateValueAndValidity({ emitEvent: false });
    // });
  }

  ngAfterViewInit() {
    // const hasVisited = localStorage.getItem('hasVisitedProfileBefore');
    // if(!hasVisited) {
    //   setTimeout(() => this.triggerAnimations(), 100);
    // }
    // const selectElement = document.getElementById('gender');
    // if (selectElement) {
    //   selectElement.addEventListener('click', () => {
    //     selectElement.style.position = 'relative';
    //     selectElement.style.left = '0';
    //   });
    // }
  }

  ngOnDestroy(): void {
    // Cleanup any remaining event listeners to prevent memory leaks
    // this.removeEventListeners();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ngOnDestroy() {
  //   this.destroy$.next();
  //   this.destroy$.complete();
  // }

  // logFormState(): void {
  //   console.log('Form valid:', this.profileForm.valid);
  //   console.log('Form values:', this.profileForm.value);
  //   console.log('Is form valid (profile):', this.isFormValid('profile'));
  // }

  initializeEventListeners(): void {
    document.addEventListener('keydown', this.keydownHandler);
    // document.addEventListener('mousedown', this.mousedownHandler);
  }

  removeEventListeners(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    // document.removeEventListener('mousedown', this.mousedownHandler);
  }

  loadProfile() {
    this.loadingComplete = false;
    this.imageLoaded = false;
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';

    this.userId = UserId;
    // const previousTier = this.currentUser.tier;


    this.userService.getUser(this.userId).subscribe(
      (user: any) => {
        // const previousTier = this.currentUser?.tier;
        this.currentUser = {
          ...user,
          paymentFrequency: user.billing
        };
        // this.stepForm.patchValue({
        //   name: this.currentUser.name,
        //   email: this.currentUser.email,
        //   // ... other fields if necessary
        // });
  
        // Update the validation status of the controls
        this.profileForm.patchValue({
          name: this.currentUser.name,
          email: this.currentUser.email,
          dateOfBirth: this.currentUser.dateOfBirth,
          gender: this.currentUser.gender,
          weight: this.currentUser.weight,
          height: this.currentUser.height,
          goals: this.currentUser.goals,
          imgUrl: this.currentUser.imgUrl,
          isGoogleAuth: this.currentUser.isGoogleAuth
        });

        if (this.currentUser.isGoogleAuth) {
          this.profileForm.get('email')?.disable();
          this.passwordForm.get('oldPassword')?.disable();
          this.passwordForm.get('passwordGroup')?.disable();
        } else {
          this.profileForm.get('email')?.enable();
        }

        console.log(`goals ${this.currentUser.goals}`);

        this.updateFormWithUserData();
        // console.log('User loaded:', user);
        
        // this.updateTierFlags();

        // Check if the tier has changed
        // if (previousTier && previousTier !== this.currentUser.tier) {
        //   this.resetAnimationFlags();
        // }
        // else{
        //   this.initializeAnimationFlags();
        // }

        // this.triggerAnimations();

        // console.log('Full user object:', user);
        if (this.currentUser.height) {
          this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
        }
        
        if(this.currentUser.tier === 'All In') this.tierThree = true;

        // console.log('After profile load - tierThree:', this.tierThree);
        // console.log('After profile load - firstTimeAnimation:', this.firstTimeAnimation);

        if (this.currentUser.tier === 'Just Looking') {
          this.tierOne = true;
          this.tierTwo = false;
          this.tierThree = false;
          // if (this.firstTimeAnimationTierOne) {
          //   localStorage.setItem('hasVisitedProfileBeforeTierOne', 'true');
          // }
        } else if (this.currentUser.tier === 'Motivated') {
          this.tierOne = false;
          this.tierTwo = true;
          this.tierThree = false;
          // if (this.firstTimeAnimationTierTwo) {
          //   localStorage.setItem('hasVisitedProfileBeforeTierTwo', 'true');
          // }
        } else {
          this.tierOne = false;
          this.tierTwo = false;
          this.tierThree = true;
          // if (this.firstTimeAnimationTierThree) {
          //   localStorage.setItem('hasVisitedProfileBeforeTierThree', 'true');
          // }
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
        // If it's tier three and first visit, trigger animation
        // if (this.tierThree && this.firstTimeAnimationTierThree) {
        //   // Small delay to ensure the view is ready
        //   setTimeout(() => this.triggerAnimations(), 100);
        // }

        // this.loadingComplete = true;
        const displayName = this.currentUser.name;
        this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

         //  // Check if the user has visited the page before to serve animations or not
        
         
      },
      (error) => {
        console.error('Error loading user profile:', error);
        this.loadingComplete = true;
        this.imageLoaded = true; // Consider image loaded in case of error
        this.cdr.detectChanges();
      }
    );
  }

  isEmailDisabled(): boolean {
    return this.profileForm.get('isGoogleAuth')?.value === true;
  }

  updateFormWithUserData(): void {
    console.log('Updating form with user data' + this.currentUser.email);
    this.profileForm.patchValue({
      name: this.currentUser.name,
      email: this.currentUser.email,
      dateOfBirth: this.currentUser.dateOfBirth,
      gender: this.currentUser.gender,
      weight: this.currentUser.weight,
      height: this.currentUser.height,
      goals: this.currentUser.goals,
      imgUrl: this.currentUser.imgUrl,
      isGoogleAuth: this.currentUser.isGoogleAuth
    });

      // Update other form controls here

    this.profileForm.get('name')?.updateValueAndValidity();
    this.profileForm.get('email')?.updateValueAndValidity();

    this.cdr.detectChanges();
  }

  triggerAnimations(){
    const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
    profilePicture?.classList.add('firstTimeAnimation');
    
    const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
    profileNameTier?.classList.add('firstTimeAnimation');

    // const arrows = document.querySelector('.arrowContainer') as HTMLElement;
    // arrows?.classList.add('firstTimeAnimation');

    this.firstTimeAnimation = true;
    this.cdr.detectChanges();
  }
  skipAnimations(){
    const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
    profilePicture?.classList.remove('firstTimeAnimation');
    
    const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
    profileNameTier?.classList.remove('firstTimeAnimation');

    // const arrows = document.querySelector('.arrowContainer') as HTMLElement;
    // arrows?.classList.remove('firstTimeAnimation');

    this.firstTimeAnimation = false;
    this.cdr.detectChanges();
  }

  reloadProfile() {
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';

    this.userId = UserId;

    this.userService.getUser(this.userId).subscribe(
      (user: any) => {
        this.currentUser = {
          ...user,
          paymentFrequency: user.billing
        };
        // this.stepForm.patchValue({
        //   name: this.currentUser.name,
        //   email: this.currentUser.email,
        //   // ... other fields if necessary
        // });
  
        // Update the validation status of the controls
        this.profileForm.patchValue({
          name: this.currentUser.name,
          email: this.currentUser.email,
          dateOfBirth: this.currentUser.dateOfBirth,
          gender: this.currentUser.gender,
          weight: this.currentUser.weight,
          height: this.currentUser.height,
          goals: this.currentUser.goals,
          imgUrl: this.currentUser.imgUrl,
        });

        this.updateFormWithUserData();

        if (this.currentUser.height) {
          this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
        }
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

  formatHeightForDisplay(height?: string): string {
    // If it's already in the correct format (e.g., 6'10"), return it
    if (/^\d+'\d+"?$/.test(height!)) {
      return height!.replace('"', '');
    }
  
    // Convert from decimal feet to feet and inches
    const totalInches = parseFloat(height!) * 12;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.floor(totalInches % 12); // Use Math.floor to avoid rounding up
  
    // If inches round to 12, increment feet and reset inches to 0
    if (inches === 12) {
      return `${feet + 1}'0"`;
    }
  
    // Format the result
    return `${feet}'${inches}"`;
  }

  // onHeightInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const value = input.value;
  //   this.heightTouched = true;
  
  //   if (this.heightPattern.test(value)) {
  //     this.currentUser.height = value;
  //     this.displayHeight = this.formatHeightForDisplay(value);
  //   } else {
  //     // If invalid, don't update currentUser.height
  //     this.currentUser.height = value;
  //     this.displayHeight = 'Invalid input';
  //   }
  // }

  onHeightInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.heightTouched = true;
  
    if (this.isHeightValid(value)) {
      this.profileForm.patchValue({ height: value });
      this.displayHeight = this.formatHeightForDisplay(value);
    } else {
      this.profileForm.get('height')?.setErrors({ 'invalidFormat': true });
      this.displayHeight = 'Invalid input';
    }
  }

  isHeightValid(height: string): boolean {
    const heightPattern = /^(\d+(\.\d+)?|\d+'\d+(\.\d+)?"?)$/;
    if (!heightPattern.test(height)) {
      return false;
    }
  
    let heightInInches: number;
    if (height.includes("'")) {
      // Format: X'Y" or X'Y
      const [feet, inches] = height.replace('"', '').split("'");
      heightInInches = parseInt(feet) * 12 + (inches ? parseFloat(inches) : 0);
    } else {
      // Format: X.Y (decimal feet)
      heightInInches = parseFloat(height) * 12;
    }
  
    // Check if height is within a reasonable range (3 feet to 9 feet)
    return heightInInches >= 36 && heightInInches <= 108;
  }

  initializePictureForm() {
    this.pictureForm = this.fb.group({
      imgUrl: [this.currentUser.imgUrl]
    });
  }
  // validateAge(): void {
  //   let dob: Date | undefined;
  
  //   // Convert to Date object if necessary
  //   if (typeof this.currentUser.dateOfBirth === 'string') {
  //     dob = new Date(this.currentUser.dateOfBirth);
  //   } else {
  //     dob = this.currentUser.dateOfBirth;
  //   }
  
  //   if (dob && !isNaN(dob.getTime())) {
  //     const today = new Date();
  //     if (dob > today) {
  //       this.isValidAge = false;
  //       this.twentyOneError = true;  // You can remove or repurpose this
  //       return;
  //     }
  
  //     const maxDate = new Date();
  //     maxDate.setFullYear(maxDate.getFullYear() - 124);
  
  //     this.isValidAge = dob >= maxDate;
  //     if (!this.isValidAge) {
  //       // Handle the case where the person is older than 124 years
  //       this.twentyOneError = true;  // You can rename this variable to something like "maxAgeError"
  //     } else {
  //       this.twentyOneError = false;
  //     }
  //   } else {
  //     this.isValidAge = false;
  //   }
  // }
  
  validateAge(): void {
    const dobControl = this.profileForm.get('dateOfBirth');
    if (!dobControl) return;
  
    const dobString = dobControl.value;
    if (!dobString) {
      this.isValidAge = true; // Consider empty as valid
      return;
    }
  
    // Parse the date string (assuming mm/dd/yyyy format)
    const [month, day, year] = dobString.split('/').map(Number);
    const dob = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  
    if (isNaN(dob.getTime())) {
      this.isValidAge = false;
      dobControl.setErrors({...dobControl.errors, invalidDate: true});
      return;
    }
  
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 124);
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 18); // Assuming minimum age is 18
  
    if (dob > today) {
      this.isValidAge = false;
      dobControl.setErrors({...dobControl.errors, futureDate: true});
    } else if (dob < maxDate) {
      this.isValidAge = false;
      dobControl.setErrors({...dobControl.errors, tooOld: true});
    } else if (dob > minDate) {
      this.isValidAge = false;
      dobControl.setErrors({...dobControl.errors, tooYoung: true});
    } else {
      this.isValidAge = true;
      const currentErrors = {...dobControl.errors};
      if (currentErrors) {
        delete currentErrors['invalidDate'];
        delete currentErrors['futureDate'];
        delete currentErrors['tooOld'];
        delete currentErrors['tooYoung'];
        dobControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }
    }
  
    this.cdr.detectChanges(); // Force change detection
  }
 
  saveProfilePicture() {
    if (this.currentState === ProfileState.ChangingPicture) {
      const newImgUrl = this.pictureForm.get('imgUrl')?.value;
      this.currentUser.imgUrl = newImgUrl;
      this.userService.updateUser(this.currentUser).subscribe(
        () => {
          this.currentState = ProfileState.Viewing;
          // Optionally, reload the user data or update the view
        },
        error => {
          console.error('Error updating profile picture:', error);
          // Handle error (e.g., show error message)
        }
      );
    }
    // ... handle other states if needed
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

// saveProfile() {
//   // this.markFormGroupTouched(this.profileForm.form);
//   if (this.currentState === ProfileState.EditingProfile && this.isFormValid('profile')) {
//     // Convert height to decimal feet before saving if it's in feet and inches format
//     if (this.currentUser.height && this.currentUser.height.includes("'")) {
//       const [feet, inches] = this.currentUser.height.split("'");
//       const cleanedInches = inches.replace('"', '');
//       const totalInches = parseInt(feet) * 12 + parseInt(cleanedInches);
//       this.currentUser.height = (totalInches / 12).toFixed(2);
//     }
//     if (this.stepForm.valid) {
//     const updatedUser = { ...this.currentUser, ...this.stepForm.value };
//     this.userService.updateUser(updatedUser).subscribe(
//       () => {
//         console.log('Profile updated successfully');
//         this.currentState = ProfileState.Viewing;
//         this.loadProfile();
//         // this.loadProfile();
//       },
//       error => {
//         console.error('Error updating profile:', error);
//         // Handle error (e.g., show error message to user)
//       }
//     );
//   } else {
//     console.log('Form is invalid or not in editing state');
//     // Optionally, you can show an error message to the user here
//   }
// }
// }

saveProfile() {
  if (this.isFormValid('profile')) {
    console.log('Saving profile...');
    // Merge the values from both forms

    const formValue = this.profileForm.getRawValue();

    const updatedUser = {
      ...this.currentUser,
      ...formValue,
      // ...this.profileForm.form.value,
      // name: this.stepForm.get('name')?.value,
      // email: this.stepForm.get('email')?.value,
      // dateOfBirth: this.stepForm.get('dateOfBirth')?.value,
      // height: this.stepForm.get('height')?.value,
      // weight: this.stepForm.get('weight')?.value,
      // goals: this.stepForm.get('goals')?.value,
      // imgUrl: this.stepForm.get('imgUrl')?.value,
    };

    // Convert height to decimal feet before saving if it's in feet and inches format
    // if (updatedUser.height && updatedUser.height.includes("'")) {
    //   const [feet, inches] = updatedUser.height.split("'");
    //   const cleanedInches = inches.replace('"', '');
    //   const totalInches = parseInt(feet) * 12 + parseInt(cleanedInches);
    //   updatedUser.height = (totalInches / 12).toFixed(2);
    // }

    // Convert height to decimal feet before saving if it's in feet and inches forma
    if (updatedUser.height) {
      if (updatedUser.height.includes("'")) {
        const [feet, inches] = updatedUser.height.replace('"', '').split("'");
        const totalInches = parseInt(feet) * 12 + (inches ? parseFloat(inches) : 0);
        updatedUser.height = (totalInches / 12).toFixed(2);
      } else {
        // Ensure height is stored as a string with 2 decimal places
        updatedUser.height = parseFloat(updatedUser.height).toFixed(2);
      }
    }


    console.log('Updated user data:', updatedUser);

    // this.userService.updateUser(updatedUser).subscribe(
    //   () => {
    //     console.log('Profile updated successfully');
    //     this.currentState = ProfileState.Viewing;
    //     this.reloadProfile();
    //   },
    this.userService.updateUser(updatedUser).subscribe(
      (response) => {
        console.log('Profile updated successfully', response);
        this.currentUser = { ...this.currentUser, ...updatedUser };
        this.currentState = ProfileState.Viewing;
        this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
        this.cdr.detectChanges(); // Force change detection
        this.reloadProfile();
        // Optionally, you can still call loadProfile to ensure all data is fresh
        // this.loadProfile();
      },
      error => {
        console.error('Error updating profile:', error);
        // Handle error (e.g., show error message to user)
      }
    );
  } else {
    console.log('Form is invalid, cannot save profile');
  }
}


// isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
//   if (formType === 'password') {
//     return this.stepForm.valid && 
//            this.isOldPasswordCorrect && 
//            !this.passwordGroup.errors?.['passwordMismatch'] &&
//            this.passwordGroup.valid;
//   } else { // profile form
//     if (!this.profileForm) return false;
    
//     const nameControl = this.profileForm.form.get('name');
//     const emailControl = this.profileForm.form.get('email');

//     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;

//     const heightValid = this.isHeightValid();
//     const weightValid = this.isWeightValid();

//     const optionalFieldsValid = ['height', 'dateOfBirth', 'weight', 'imgUrl'].every(field => {
//       const control = this.profileForm.form.get(field);
//       return !control?.value || control?.valid;
//     }) ?? true;

//      // Validate age
//     //  this.validateAge();

//     return requiredFieldsValid && optionalFieldsValid && heightValid && weightValid && this.isValidAge;
//   }
// }

// isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
//   if (formType === 'password') {
//     const oldPasswordControl = this.stepForm.get('oldPassword');
//     const passwordGroup = this.stepForm.get('passwordGroup');
//     const passwordControl = passwordGroup?.get('password');
//     const confirmPasswordControl = passwordGroup?.get('confirmPassword');

//     // Check for specific errors
//     const hasOldPasswordError = oldPasswordControl?.hasError('required') || !this.isOldPasswordCorrect;
//     const hasPasswordError = passwordControl?.hasError('required') || passwordControl?.hasError('pattern');
//     const hasConfirmPasswordError = confirmPasswordControl?.hasError('required') || this.passwordMismatch;

//     return !(hasOldPasswordError || hasPasswordError || hasConfirmPasswordError);
//   } else { // profile form
//     if (!this.profileForm) return false;
    
//     const nameControl = this.profileForm.form.get('name');
//     const emailControl = this.profileForm.form.get('email');

//     // Check required fields
//     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;

//     // Check optional fields only if they have a value
//     const optionalFields = ['dateOfBirth', 'gender', 'weight', 'height', 'goals', 'imgUrl'];
//     const optionalFieldsValid = optionalFields.every(field => {
//       const control = this.profileForm.form.get(field);
//       return !control?.value || control?.valid;
//     });

//     return requiredFieldsValid && optionalFieldsValid;
//   }
// }

// isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
//   if (formType === 'password') {
//     // Password logic remains unchanged
//     const oldPasswordControl = this.stepForm.get('oldPassword');
//     const passwordGroup = this.stepForm.get('passwordGroup');
//     const passwordControl = passwordGroup?.get('password');
//     const confirmPasswordControl = passwordGroup?.get('confirmPassword');

//     const hasOldPasswordError = oldPasswordControl?.hasError('required') || !this.isOldPasswordCorrect;
//     const hasPasswordError = passwordControl?.hasError('required') || passwordControl?.hasError('pattern');
//     const hasConfirmPasswordError = confirmPasswordControl?.hasError('required') || this.passwordMismatch;

//     return !(hasOldPasswordError || hasPasswordError || hasConfirmPasswordError);
//   } else { // profile form
//     if (!this.profileForm) {
//       console.log('Profile form is not initialized');
//       return false;
//     }
    
//     const nameControl = this.profileForm.form.get('name');
//     const emailControl = this.profileForm.form.get('email');

//     console.log('Name valid:', nameControl?.valid);
//     console.log('Email valid:', emailControl?.valid);

//     // Check only required fields: name and email
//     const requiredFieldsValid = nameControl?.valid && emailControl?.valid;

//     console.log('Required fields valid:', requiredFieldsValid);

//     return requiredFieldsValid ?? false;
//   }
// }

// isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
//   if (formType === 'profile') {
//     if (!this.profileForm || !this.stepForm) {
//       console.log('Profile form or step form is not initialized');
//       return false;
//     }

//     const nameControl = this.profileForm.form.get('name');
//     const emailControl = this.stepForm.get('email');

//     console.log('Name valid:', nameControl?.valid);
//     console.log('Email valid:', emailControl?.valid);

//     // Check required fields: name and email
//     const requiredFieldsValid = nameControl?.valid && emailControl?.valid;

//     console.log('Required fields valid:', requiredFieldsValid);

//     // Check optional fields only if they have a value
//     const optionalFields = ['dateOfBirth', 'gender', 'weight', 'height', 'goals', 'imgUrl'];
//     const optionalFieldsValid = optionalFields.every(field => {
//       const control = this.profileForm.form.get(field);
//       console.log(`${field} valid:`, !control?.value || control?.valid);
//       return !control?.value || control?.valid;
//     });

//     console.log('Optional fields valid:', optionalFieldsValid);

//     const formValid = (requiredFieldsValid && optionalFieldsValid) ?? false;
//     console.log('Form valid:', formValid);

//     return formValid;
//   } else if (formType === 'password') {
//     const oldPasswordControl = this.stepForm.get('oldPassword');
//     const passwordGroup = this.stepForm.get('passwordGroup');
//     const passwordControl = passwordGroup?.get('password');
//     const confirmPasswordControl = passwordGroup?.get('confirmPassword');

//     console.log('Old password valid:', oldPasswordControl?.valid);
//     console.log('New password valid:', passwordControl?.valid);
//     console.log('Confirm password valid:', confirmPasswordControl?.valid);

//     // Check for specific errors
//     const hasOldPasswordError = oldPasswordControl?.hasError('required') || !this.isOldPasswordCorrect;
//     const hasPasswordError = passwordControl?.hasError('required') || passwordControl?.hasError('pattern');
//     const hasConfirmPasswordError = confirmPasswordControl?.hasError('required') || this.passwordMismatch;

//     console.log('Has old password error:', hasOldPasswordError);
//     console.log('Has new password error:', hasPasswordError);
//     console.log('Has confirm password error:', hasConfirmPasswordError);

//     const passwordFormValid = !(hasOldPasswordError || hasPasswordError || hasConfirmPasswordError);
//     console.log('Password form valid:', passwordFormValid);

//     return passwordFormValid;
//   }

//   console.log('Invalid form type');
//   return false;
// }

// isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
//   if (formType === 'profile') {
//     if (!this.profileForm || !this.stepForm) {
//       console.log('Profile form or step form is not initialized');
//       return false;
//     }

//     const nameControl = this.stepForm.get('name');
//     const emailControl = this.stepForm.get('email');

//     console.log('Name valid:', nameControl?.valid);
//     console.log('Email valid:', emailControl?.valid);

//     // Check required fields: name and email
//     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;

//     console.log('Required fields valid:', requiredFieldsValid);

//     // Check optional fields
//     const optionalFields = ['dateOfBirth', 'gender', 'weight', 'height', 'goals', 'imgUrl'];
//     const optionalFieldsValid = optionalFields.every(field => {
//       const control = this.profileForm.form.get(field);
//       const isValid = !control?.value || control?.valid;
//       console.log(`${field} valid:`, isValid);
//       return isValid;
//     });

//     console.log('Optional fields valid:', optionalFieldsValid);

//     const formValid = requiredFieldsValid && optionalFieldsValid;
//     console.log('Profile form valid:', formValid);

//     return formValid;
//   } else if (formType === 'password') {
//     if (!this.stepForm) {
//       console.log('Password form is not initialized');
//       return false;
//     }

//     const oldPasswordControl = this.stepForm.get('oldPassword');
//     const passwordGroup = this.stepForm.get('passwordGroup');
//     const passwordControl = passwordGroup?.get('password');
//     const confirmPasswordControl = passwordGroup?.get('confirmPassword');

//     console.log('Old password valid:', oldPasswordControl?.valid);
//     console.log('New password valid:', passwordControl?.valid);
//     console.log('Confirm password valid:', confirmPasswordControl?.valid);

//     // Check for specific errors
//     const hasOldPasswordError = (oldPasswordControl?.hasError('required') || !this.isOldPasswordCorrect) ?? true;
//     const hasPasswordError = (passwordControl?.hasError('required') || passwordControl?.hasError('pattern')) ?? true;
//     const hasConfirmPasswordError = (confirmPasswordControl?.hasError('required') || this.passwordMismatch) ?? true;

//     console.log('Has old password error:', hasOldPasswordError);
//     console.log('Has new password error:', hasPasswordError);
//     console.log('Has confirm password error:', hasConfirmPasswordError);

//     const passwordFormValid = !(hasOldPasswordError || hasPasswordError || hasConfirmPasswordError);
//     console.log('Password form valid:', passwordFormValid);

//     return passwordFormValid;
//   }

//   console.log('Invalid form type');
//   return false;
// }

// isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
//   if (formType === 'profile') {
//     if (!this.profileForm || !this.stepForm) {
//       console.log('Profile form or step form is not initialized');
//       return false;
//     }

//     const nameControl = this.stepForm.get('name');
//     const emailControl = this.stepForm.get('email');

//     console.log('Name valid:', nameControl?.valid);
//     console.log('Email valid:', emailControl?.valid);

//     // Check required fields: name and email
//     // Allow the form to be valid if it hasn't been touched yet
//     const requiredFieldsValid = 
//       (nameControl?.valid || !nameControl?.touched) && 
//       (emailControl?.valid || !emailControl?.touched);

//     console.log('Required fields valid:', requiredFieldsValid);

//     // Check optional fields
//     const optionalFields = ['dateOfBirth', 'gender', 'weight', 'height', 'goals', 'imgUrl'];
//     const optionalFieldsValid = optionalFields.every(field => {
//       const control = this.profileForm.form.get(field);
//       const isValid = !control?.value || control?.valid || !control?.touched;
//       console.log(`${field} valid:`, isValid);
//       return isValid;
//     });

//     console.log('Optional fields valid:', optionalFieldsValid);

//     const formValid = requiredFieldsValid && optionalFieldsValid;
//     console.log('Profile form valid:', formValid);

//     return formValid;
//   } else if (formType === 'password') {
//     if (!this.stepForm) {
//       console.log('Password form is not initialized');
//       return false;
//     }

//     const oldPasswordControl = this.stepForm.get('oldPassword');
//     const passwordGroup = this.stepForm.get('passwordGroup');
//     const passwordControl = passwordGroup?.get('password');
//     const confirmPasswordControl = passwordGroup?.get('confirmPassword');

//     console.log('Old password valid:', oldPasswordControl?.valid);
//     console.log('New password valid:', passwordControl?.valid);
//     console.log('Confirm password valid:', confirmPasswordControl?.valid);

//     // Check for specific errors
//     const hasOldPasswordError = (oldPasswordControl?.hasError('required') || !this.isOldPasswordCorrect) ?? true;
//     const hasPasswordError = (passwordControl?.hasError('required') || passwordControl?.hasError('pattern')) ?? true;
//     const hasConfirmPasswordError = (confirmPasswordControl?.hasError('required') || this.passwordMismatch) ?? true;

//     console.log('Has old password error:', hasOldPasswordError);
//     console.log('Has new password error:', hasPasswordError);
//     console.log('Has confirm password error:', hasConfirmPasswordError);

//     const passwordFormValid = !(hasOldPasswordError || hasPasswordError || hasConfirmPasswordError);
//     console.log('Password form valid:', passwordFormValid);

//     return passwordFormValid;
//   }

//   console.log('Invalid form type');
//   return false;
// }

isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
  if (formType === 'profile') {
    if (!this.profileForm) {
      console.log('Profile form is not initialized');
      return false;
    }
    const nameControl = this.profileForm.get('name');
    const emailControl = this.profileForm.get('email');
    const isGoogleAuth = this.profileForm.get('isGoogleAuth')?.value;

    // console.log('Name valid:', nameControl?.valid);
    // console.log('Email valid:', emailControl?.valid);
    // console.log('Email exists:', this.emailExists);

    const requiredFieldsValid = 
      (nameControl?.valid ?? false) && 
      ((emailControl?.disabled || emailControl?.valid) ?? false) && 
      !this.emailExists;

    // console.log('Required fields valid:', requiredFieldsValid);

    const optionalFields = ['dateOfBirth', 'gender', 'weight', 'height', 'goals', 'imgUrl'];
    const optionalFieldsValid = optionalFields.every(field => {
      const control = this.profileForm.get(field);
      const isValid = !control?.value || control.valid;
      // console.log(`${field} valid:`, isValid);
      return isValid;
    });

    // console.log('Optional fields valid:', optionalFieldsValid);

    const formValid = requiredFieldsValid && optionalFieldsValid;
    // console.log('Profile form valid:', formValid);

    return formValid;
  } else if (formType === 'password') {
    if (!this.passwordForm) {
      // console.log('Password form is not initialized');
      return false;
    }

    const oldPasswordControl = this.passwordForm.get('oldPassword');
    const passwordGroup = this.passwordForm.get('passwordGroup') as FormGroup;
    const passwordControl = passwordGroup?.get('password');
    const confirmPasswordControl = passwordGroup?.get('confirmPassword');

    console.log('Old password valid:', oldPasswordControl?.valid);
    console.log('New password valid:', passwordControl?.valid);
    console.log('Confirm password valid:', confirmPasswordControl?.valid);

    const hasOldPasswordError = (oldPasswordControl?.hasError('required') || !this.isOldPasswordCorrect) ?? true;
    const hasPasswordError = (passwordControl?.hasError('required') || passwordControl?.hasError('pattern')) ?? true;
    const hasConfirmPasswordError = (confirmPasswordControl?.hasError('required') || this.passwordMismatch) ?? true;

    console.log('Has old password error:', hasOldPasswordError);
    console.log('Has new password error:', hasPasswordError);
    console.log('Has confirm password error:', hasConfirmPasswordError);

    const passwordFormValid = !(hasOldPasswordError || hasPasswordError || hasConfirmPasswordError);
    console.log('Password form valid:', passwordFormValid);

    return passwordFormValid;
  }

  console.log('Invalid form type');
  return false;
}

// isHeightValid(): boolean {
//   const heightPattern = /^(\d+(\.\d+)?|\d+'\d+(\.\d+)?"?)$/;
//   return heightPattern.test(this.currentUser.height || '');
// }

// isWeightValid(): boolean {
//   console.log("Validating weight");
//   const weightString = this.currentUser.weight || '';
  
//   // Check if weight contains only numbers and at most one decimal
//   const isNumeric = /^\d+(\.\d{1,2})?$/.test(weightString);
//   if (!isNumeric) {
//     return false;
//   }

//   const weightValue = parseFloat(weightString);

//   // Check if weight is within the valid range
//   if (weightValue < 50 || weightValue > 600) {
//     return false;
//   }

//   return true;
// }

isWeightValid(): boolean {
  const weightControl = this.profileForm.get('weight');
  if (!weightControl) return true; // If control doesn't exist, consider it valid

  const weightValue = weightControl.value;
  if (!weightValue) return true; // Empty value is considered valid (assuming weight is optional)

  // Check if weight is a valid number with up to two decimal places
  const isNumeric = /^\d+(\.\d{1,2})?$/.test(weightValue);
  if (!isNumeric) {
    weightControl.setErrors({...weightControl.errors, invalidFormat: true});
    return false;
  }

  const weight = parseFloat(weightValue);
  if (weight < 50 || weight > 600) {
    weightControl.setErrors({...weightControl.errors, outOfRange: true});
    return false;
  }

  // Clear custom errors if weight is valid
  const currentErrors = {...weightControl.errors};
  if (currentErrors) {
    delete currentErrors['invalidFormat'];
    delete currentErrors['outOfRange'];
    weightControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
  }

  return true;
}

  
  checkPasswords(): void {
    this.authenticating = false;
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

//   checkOldPassword() {
//     const oldPassword = this.passwordForm.get('oldPassword')?.value;
//     if(oldPassword === '') {
//       this.authenticating = false;
//       return;
//     }
//     if (oldPassword) {
//       this.authenticating = true;
//       this.userService.checkPassword(this.userId, oldPassword).subscribe(
//         (isCorrect) => {
//           this.isOldPasswordCorrect = isCorrect;
//           this.authenticating = false;
//           if (isCorrect) {
//             this.oldPasswordError = '';
//             // this.stepForm.get('passwordGroup.password')?.enable();
//             // this.stepForm.get('passwordGroup.confirmPassword')?.enable();
//             this.passwordGroup.enable();
//           } else {
//             this.oldPasswordError = 'Incorrect';
//             this.passwordGroup.disable();
//             // this.stepForm.get('passwordGroup.password')?.disable();
//             // this.stepForm.get('passwordGroup.confirmPassword')?.disable();
//           }
//           // this.stepForm.updateValueAndValidity();
//           this.cdr.detectChanges();
//         },
//         (error) => {
//           console.error('Error checking password:', error);
//           this.oldPasswordError = 'Error checking password';
//           this.isOldPasswordCorrect = false;
//           this.passwordGroup.disable();
//           this.cdr.detectChanges();
//         }
//       );
//     }
//     else {
//       this.isOldPasswordCorrect = false;
//       this.passwordGroup.disable();
//   }
// }

// checkOldPassword() {
//   const oldPasswordControl = this.passwordForm.get('oldPassword');
  
//   if (!oldPasswordControl) return;

//   oldPasswordControl.valueChanges.pipe(
//     debounceTime(300),
//     distinctUntilChanged()
//   ).subscribe(oldPassword => {
//     if (oldPassword === '') {
//       this.authenticating = false;
//       this.oldPasswordError = '';
//       this.isOldPasswordCorrect = false;
//       this.passwordGroup.disable();
//       return;
//     }

//     this.authenticating = true;
//     this.oldPasswordError = '';

//     this.userService.checkPassword(this.userId, oldPassword).subscribe(
//       (isCorrect) => {
//         this.isOldPasswordCorrect = isCorrect;
//         this.authenticating = false;
        
//         if (isCorrect) {
//           this.oldPasswordError = '';
//           this.passwordGroup.enable();
//         } else {
//           this.oldPasswordError = 'Incorrect';
//           this.passwordGroup.disable();
//         }
//         this.cdr.detectChanges();
//       },
//       (error) => {
//         console.error('Error checking password:', error);
//         this.authenticating = false;
//         this.oldPasswordError = 'Error checking password';
//         this.isOldPasswordCorrect = false;
//         this.passwordGroup.disable();
//         this.cdr.detectChanges();
//       }
//     );
//   });
// }

// checkOldPassword() {
//   const oldPasswordControl = this.passwordForm.get('oldPassword');
  
//   if (!oldPasswordControl) return;

//   oldPasswordControl.valueChanges.pipe(
//     debounceTime(1500),
//     distinctUntilChanged(),
//     takeUntil(this.destroy$)
//   ).subscribe(oldPassword => {
//     if (oldPassword === '') {
//       this.authenticating = false;
//       this.oldPasswordError = '';
//       this.isOldPasswordCorrect = false;
//       this.passwordGroup.disable();
//       return;
//     }

//     this.authenticating = true;
//     this.oldPasswordError = '';

//     this.userService.checkPassword(this.userId, oldPassword).subscribe(
//       (isCorrect) => {
//         this.isOldPasswordCorrect = isCorrect;
//         this.authenticating = false;
        
//         if (isCorrect) {
//           this.oldPasswordError = '';
//           this.passwordGroup.enable();
//         } else {
//           this.oldPasswordError = 'Incorrect';
//           this.passwordGroup.disable();
//         }
//         this.cdr.detectChanges();
//       },
//       (error) => {
//         console.error('Error checking password:', error);
//         this.authenticating = false;
//         this.oldPasswordError = 'Invalid';
//         this.isOldPasswordCorrect = false;
//         this.passwordGroup.disable();
//         this.cdr.detectChanges();
//       }
//     );
//   });
// }

// checkOldPassword() {
//   const oldPasswordControl = this.passwordForm.get('oldPassword');
  
//   if (!oldPasswordControl) return;

//   // Reset states when the input changes
//   oldPasswordControl.valueChanges.pipe(
//     takeUntil(this.destroy$)
//   ).subscribe(() => {
//     this.isWaitingToCheck = true;
//     this.authenticating = false;
//     this.oldPasswordError = '';
//     this.cdr.detectChanges();
//   });

//   // Main password checking logic with debounce
//   oldPasswordControl.valueChanges.pipe(
//     debounceTime(1200),
//     distinctUntilChanged(),
//     takeUntil(this.destroy$)
//   ).subscribe(oldPassword => {
//     this.isWaitingToCheck = false;

//     if (oldPassword === '') {
//       this.authenticating = false;
//       this.oldPasswordError = '';
//       this.isOldPasswordCorrect = false;
//       this.passwordGroup.disable();
//       this.cdr.detectChanges();
//       return;
//     }

//     this.authenticating = true;
//     this.oldPasswordError = '';
//     this.cdr.detectChanges();

//     this.userService.checkPassword(this.userId, oldPassword).subscribe(
//       (isCorrect) => {
//         this.isOldPasswordCorrect = isCorrect;
//         this.authenticating = false;
        
//         if (isCorrect) {
//           this.oldPasswordError = '';
//           this.passwordGroup.enable();
//         } else {
//           this.oldPasswordError = 'Incorrect';
//           this.passwordGroup.disable();
//         }
//         this.cdr.detectChanges();
//       },
//       (error) => {
//         console.error('Error checking password:', error);
//         this.authenticating = false;
//         this.oldPasswordError = '';
//         this.isOldPasswordCorrect = false;
//         this.passwordGroup.disable();
//         this.cdr.detectChanges();
//       }
//     );
//   });
// }

// checkOldPassword() {
//   const oldPasswordControl = this.passwordForm.get('oldPassword');
  
//   if (!oldPasswordControl) return;

//   // Reset states when the input changes
//   oldPasswordControl.valueChanges.pipe(
//     takeUntil(this.destroy$)
//   ).subscribe(() => {
//     this.isWaitingToCheck = true;
//     this.authenticating = false;
//     this.oldPasswordError = '';
//     oldPasswordControl.setErrors(null);  // Clear any previous errors
//     this.cdr.detectChanges();
//   });

//   // Main password checking logic with debounce
//   oldPasswordControl.valueChanges.pipe(
//     debounceTime(1500),
//     distinctUntilChanged(),
//     takeUntil(this.destroy$)
//   ).subscribe(oldPassword => {
//     this.isWaitingToCheck = false;

//     if (oldPassword === '') {
//       this.authenticating = false;
//       this.oldPasswordError = '';
//       this.isOldPasswordCorrect = false;
//       this.passwordGroup.disable();
//       oldPasswordControl.setErrors(null);  // Clear errors for empty input
//       this.cdr.detectChanges();
//       return;
//     }

//     this.authenticating = true;
//     this.oldPasswordError = '';
//     this.cdr.detectChanges();

//     this.userService.checkPassword(this.userId, oldPassword).subscribe(
//       (isCorrect) => {
//         this.isOldPasswordCorrect = isCorrect;
//         this.authenticating = false;
        
//         if (isCorrect) {
//           this.oldPasswordError = '';
//           oldPasswordControl.setErrors(null);  // Clear errors if password is correct
//           this.passwordGroup.enable();
//         } else {
//           this.oldPasswordError = 'Incorrect';
//           oldPasswordControl.setErrors({ 'incorrect': true });  // Set error if password is incorrect
//           this.passwordGroup.disable();
//         }
//         this.cdr.detectChanges();
//       },
//       (error) => {
//         console.error('Error checking password:', error);
//         this.authenticating = false;
//         if(this.passwordForm.get('oldPassword')?.touched){
//           this.oldPasswordError = 'Invalid';
//         }
//         this.isOldPasswordCorrect = false;
//         oldPasswordControl.setErrors({ 'serverError': true });  // Set error for server errors
//         this.passwordGroup.disable();
//         this.cdr.detectChanges();
//       }
//     );
//   });
// }

checkOldPassword() {
  if (this.currentState !== ProfileState.ChangingPassword) {
    return; // Exit if not in password changing state
  }

  const oldPasswordControl = this.passwordForm.get('oldPassword');
  
  if (!oldPasswordControl) return;

  let authenticatingTimeout: any;

  // Reset states when the input changes
  oldPasswordControl.valueChanges.pipe(
    takeUntil(this.destroy$)
  ).subscribe(() => {
    this.isWaitingToCheck = true;
    this.authenticating = false;
    this.oldPasswordError = '';
    oldPasswordControl.setErrors(null);
    if (authenticatingTimeout) {
      clearTimeout(authenticatingTimeout);
    }
    this.cdr.detectChanges();
  });

  // Main password checking logic with debounce
  oldPasswordControl.valueChanges.pipe(
    debounceTime(1500),
    distinctUntilChanged(),
    takeUntil(this.destroy$)
  ).subscribe(oldPassword => {
    this.isWaitingToCheck = false;

    if (oldPassword === '') {
      this.authenticating = false;
      this.oldPasswordError = '';
      this.isOldPasswordCorrect = false;
      this.passwordGroup.disable();
      oldPasswordControl.setErrors(null);
      this.cdr.detectChanges();
      return;
    }

    authenticatingTimeout = setTimeout(() => {
      this.authenticating = true;
      this.cdr.detectChanges();
    }, 100);

    this.userService.checkPassword(this.userId, oldPassword).subscribe(
      (isCorrect) => {
        clearTimeout(authenticatingTimeout);
        this.isOldPasswordCorrect = isCorrect;
        this.authenticating = false;
        
        if (isCorrect) {
          this.oldPasswordError = '';
          oldPasswordControl.setErrors(null);
          this.passwordGroup.enable();
        } else {
          if (oldPasswordControl.touched) {
            this.oldPasswordError = 'Incorrect';
            oldPasswordControl.setErrors({ 'incorrect': true });
          }
          this.passwordGroup.disable();
        }
        this.cdr.detectChanges();
      },
      (error) => {
        clearTimeout(authenticatingTimeout);
        console.error('Error checking password:', error);
        this.authenticating = false;
        this.isOldPasswordCorrect = false;
        if (oldPasswordControl.touched) {
          this.oldPasswordError = 'Invalid';
          oldPasswordControl.setErrors({ 'serverError': true });
        }
        this.passwordGroup.disable();
        this.cdr.detectChanges();
      }
    );
  });
}

isOldPasswordError(): boolean {
  const control = this.passwordForm.get('oldPassword');
  return !!this.oldPasswordError && !!control?.invalid && !!control?.touched;
}

get passwordGroup() {
  return this.passwordForm.get('passwordGroup') as FormGroup;
}

  updateUserPassword() {
    console.log('Update button clicked');
    console.log('Form valid:', this.isFormValid('password'));
    if (this.isFormValid('password')) {
      const newPassword = this.passwordGroup.get('password')?.value;
      console.log('New password:', newPassword);
      this.userService.updatePassword(this.userId, newPassword).subscribe(
        () => {
          console.log('Password updated successfully');
          this.currentState = ProfileState.Viewing;
          // Show success message to the user
        },
        (error) => {
          console.error('Error updating password:', error);
          // Show error message to the user
        }
      );
    } else {
      console.log('Form is invalid');
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

  toggleOldPasswordVisibility() {
    this.oldPasswordVisible = !this.oldPasswordVisible;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  goodbye() {
    this.buttonText = 'Deleting Profile...';
    setTimeout(() => {
      this.buttonText = 'Goodbye';
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
    // this.resetAnimationFlags();
    // localStorage.removeItem('currentTier');
    // localStorage.removeItem('lastAnimatedTier');
    localStorage.removeItem('hasVisitedProfileBefore');
    this.UpdateStatus();
    this.router.navigate(['/home']);
  }

  editProfile(): void {
    this.currentState = ProfileState.EditingProfile;
    // if (this.currentState === ProfileState.EditingProfile) {
    //   // Save the profile
    //   const updatedUser = { ...this.currentUser, ...this.stepForm.value };
    //   this.userService.updateUser(updatedUser).subscribe(() => {
    //     this.currentState = ProfileState.Viewing;
    //     this.loadProfile();
    //   });
    // } else {
    //   this.currentState = ProfileState.EditingProfile;
    //   // Initialize the stepForm with current user data
    //   this.stepForm = this.fb.group({
    //       name: [this.currentUser.name, [Validators.required, Validators.minLength(4), Validators.pattern((/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/))]],
    //       email: [this.currentUser.email, [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    //       dateOfBirth: [this.currentUser.dateOfBirth, []],
    //       gender: [this.currentUser.gender],
    //       weight: [this.currentUser.weight, []],
    //       height: [this.currentUser.height, []],
    //       goals: [this.currentUser.goals],
    //       imgUrl: [this.currentUser.imgUrl, []],
    //   });
    //   this.stepForm.get('name')?.updateValueAndValidity();
    //   this.stepForm.get('email')?.updateValueAndValidity();

    //   this.syncFormWithCurrentUser();
    // }
  }

  syncFormWithCurrentUser(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    this.formSubscription = this.profileForm.valueChanges.subscribe(formValue => {
      this.currentUser = { ...this.currentUser, ...formValue };
    });
  }

  changePicture() {
    this.currentState = ProfileState.ChangingPicture;
  }

  changePassword() {
    this.currentState = ProfileState.ChangingPassword;
    this.resetPasswordForm();
  }

  deleteProfile() {
    this.currentState = ProfileState.DeletingProfile;
    this.classAppliedDeleteProfile = true;
  }

  // cancelAction() {
  //   this.currentState = ProfileState.Viewing;
  //   this.stepForm.reset();
  //   this.passwordGroup.disable();
  //   this.authenticating = false;
  //   this.oldPasswordError = '';
  //   this.reloadProfile();
  //   // this.loadProfile();
  //   this.stepForm.clearValidators();
  // }

  // cancelAction(event?: Event): void {
  //   if (event) {
  //     event.stopPropagation();  // Prevent the click from propagating to the parent div
  //   }
  //   this.stepForm.reset();
  //   this.passwordGroup.disable();
  //   this.authenticating = false;
  //   this.oldPasswordError = '';
  //   this.reloadProfile();
  //   // this.loadProfile();
  //   this.stepForm.clearValidators();
  //   this.currentState = ProfileState.Viewing;
  // }

  // cancelAction(event?: MouseEvent): void {
  //   if (event) {
  //     event.stopPropagation();  // This prevents the "Keep Subscription" button from triggering the parent div's click
  //   }
    
  //   this.currentState = ProfileState.Viewing;
  //   this.stepForm.reset();
  //   this.passwordGroup.disable();
  //   this.authenticating = false;
  //   this.oldPasswordError = '';
  //   this.reloadProfile();
  //   this.stepForm.clearValidators();
  // }

  // cancelAction(event?: MouseEvent): void {
  //   if (event) {
  //     event.stopPropagation();
  //   }
    
  //   if (this.isProcessingGoodbye) return;
    
  //   this.currentState = ProfileState.Viewing;
  //   this.profileForm.reset();
  //   this.passwordForm.markAsPristine();
  //   this.passwordForm.reset();
  //   this.passwordGroup.disable();
  //   this.authenticating = false;
  //   this.oldPasswordError = '';
  //   this.reloadProfile();
  //   this.passwordForm.clearValidators();
  // }

  cancelAction(): void {
    // if (event) {
    //   event.stopPropagation();
    // }
    
    if (this.isProcessingGoodbye) return;
    
    this.currentState = ProfileState.Viewing;
  
    // Reset profile form
    this.profileForm.reset();
  
    // Reset password form and clear all errors
    this.passwordForm.reset();
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.setErrors(null);
      control?.updateValueAndValidity();
    });
  
    // Specifically reset the old password control
    const oldPasswordControl = this.passwordForm.get('oldPassword');
    if (oldPasswordControl) {
      oldPasswordControl.setErrors(null);
      oldPasswordControl.updateValueAndValidity();
    }

  
    // Reset password group
    this.passwordGroup.reset();
    this.passwordGroup.disable();
  
    // Clear custom error flags
    this.authenticating = false;
    this.oldPasswordError = '';
    this.isOldPasswordCorrect = false;
    this.isWaitingToCheck = false;
  
    // Reset any other custom states
    this.passwordMismatch = false;
    this.isPopupVisible = false;
  
    // Reload profile data
    this.reloadProfile();
  
    // Trigger change detection
    this.cdr.detectChanges();

    this.resetPasswordForm();
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.setErrors(null);
      control?.updateValueAndValidity();
    });
    this.passwordGroup.reset();
    this.passwordGroup.disable();
    this.authenticating = false;
    this.oldPasswordError = '';
    this.isOldPasswordCorrect = false;
    this.isWaitingToCheck = false;
    this.passwordMismatch = false;
    this.isPopupVisible = false;
    this.cdr.detectChanges();
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.passwordGroup.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Required';
    }
    if (passwordControl?.hasError('pattern')) {
      return 'Invalid';
    }
    return 'Invalid confirm password';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.passwordGroup.get('confirmPassword');
    if (confirmPasswordControl?.hasError('required')) {
      return 'Required';
    }
    if (confirmPasswordControl?.hasError('pattern')) {
      return 'Invalid';
    }
    return 'Invalid confirm password';
  }

  // checkEmail() {
  //   console.log('checking email');
  //   const emailControl = this.stepForm.get('email');
  //   const email = emailControl?.value;
  //   if (email && emailControl?.valid) {
  //     console.log('checking email 2');
  //     this.userService.checkEmail(email).subscribe(
  //       (response: {exists: boolean, message: string}) => {
  //         if (response.exists) {
  //           emailControl.setErrors({'emailExists': true});
  //         } else {
  //           // Only clear the 'emailExists' error, preserve other validation errors if any
  //           const currentErrors = emailControl.errors;
  //           if (currentErrors) {
  //             delete currentErrors['emailExists'];
  //             emailControl.setErrors(Object.keys(currentErrors).length === 0 ? null : currentErrors);
  //           }
  //         }
  //       },
  //       (error) => console.error('Error checking email:', error)
  //     );
  //   }
  // }

  // checkEmail(event: Event) {
  //   // console.log('Checking email method called');
  //   const input = event.target as HTMLInputElement;
  //   const email = input.value;
  //   // console.log('Email value:', email);
  
  //   let emailControl: AbstractControl | null;
  //   if (this.currentState === ProfileState.EditingProfile) {
  //     emailControl = this.stepForm.get('email');
  //   } else {
  //     emailControl = this.profileForm?.form.get('email');
  //   }
  //   // console.log('Email control:', emailControl);
  //   // console.log('Email control valid:', emailControl?.valid);
  
  //   if (email && emailControl?.valid) {
  //     // console.log('Email is valid, proceeding with check');
  //     this.userService.checkEmail(email).subscribe(
  //       (response: {exists: boolean, message: string}) => {
  //         // console.log('Email check response:', response);
  //         if (response.exists) {
  //           if (email !== this.currentUser.email) {
  //             // console.log('Email exists and is different from current, setting error');
  //             emailControl?.setErrors({'emailExists': true});
  //           } else {
  //             // console.log('Email exists but is current user email, no error');
  //             emailControl?.setErrors(null);
  //           }
  //         } else {
  //           // console.log('Email does not exist, clearing errors');
  //           emailControl?.setErrors(null);
  //         }
  //         this.cdr.detectChanges(); // Force change detection
  //       },
  //       (error) => {
  //         console.error('Error checking email:', error);
  //       }
  //     );
  //   } else {
  //     console.log('Email is either empty or invalid, skipping check');
  //   }
  // }

  checkEmail(event: Event) {
    const input = event.target as HTMLInputElement;
    const email = input.value;
    console.log('Checking email:', email);
  
    const emailControl = this.profileForm.get('email');
    if(email === this.currentUser.email) {
      console.log('Email is same as current user email, skipping check' + email + "current email"+ this.currentUser.email);
      emailControl?.setErrors(null);
      return;
    }
    if (email && emailControl && emailControl.valid) {
      this.userService.checkEmail(email).subscribe(
        (response: {exists: boolean, message: string}) => {
          console.log('Email check response:', response);
          if (response.exists && email !== this.currentUser.email) {
            emailControl.setErrors({...emailControl.errors, 'emailExists': true});
          } else {
            const currentErrors = {...emailControl.errors};
            if (currentErrors) {
              delete currentErrors['emailExists'];
              emailControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
            }
          }
          this.cdr.detectChanges(); // Force change detection
        },
        (error) => {
          console.error('Error checking email:', error);
        }
      );
    }
  }


}
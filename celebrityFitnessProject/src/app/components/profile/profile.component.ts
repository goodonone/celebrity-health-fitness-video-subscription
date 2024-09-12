import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { passwordMatchValidator } from 'src/app/shared/Multi-Step-Form /form/form.service';

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

  @ViewChild('profileForm') profileForm!: NgForm;
  
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
  authenticating: boolean = false;
  isOldPasswordCorrect: boolean = false;
  firstTimeAnimation: boolean = false;
  heightPattern = /^(\d+(\.\d+)?|\d+'\d+"?)$/; 
  heightTouched = false;
  heightFeet!: number;
  heightInches!: number;
  isValidAge: boolean = true;  
  twentyOneError: boolean = false;

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
        this.currentState = ProfileState.Viewing;
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
        this.currentState = ProfileState.Viewing;
      }
    };
  }

  ngOnInit(): void {

     // Check if the user has visited the page before to serve animations or not
     const hasVisited = localStorage.getItem('hasVisitedProfileBefore');
     this.firstTimeAnimation = hasVisited !== 'true';
    //  if (!hasVisited && this.tierThree) {
    //    // Trigger animations
    //    this.triggerAnimations();
    //    // Store the flag in localStorage
    //    localStorage.setItem('hasVisitedProfileBefore', 'true');
    //  } else {
    //    // Skip animations
    //    this.skipAnimations();
    //  }

    this.loadProfile();

    this.initializePictureForm();

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
      }, { validators: passwordMatchValidator })
    });

    // this.stepForm.get('passwordGroup')?.valueChanges.subscribe(() => {
    //   this.checkPasswords();
    // });

    this.stepForm.get('oldPassword')?.valueChanges.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // this.oldPasswordError = 'Authenticating';
      this.checkOldPassword();
    });

    this.stepForm.get('passwordGroup')?.valueChanges.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkPasswords();
    })

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

   triggerAnimations() {
    this.firstTimeAnimation = true;
    // Set the flag in localStorage
    localStorage.setItem('hasVisitedProfileBefore', 'true');
    
    // Force change detection
    this.cdr.detectChanges();
    }

  // skipAnimations() {
  //   this.firstTimeAnimation = false;
  //   // const profilePicture = document.getElementById('profilePicture');
  //   // profilePicture?.classList.remove('animateBoxShadow');
  // }
 
  
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
        // console.log('Full user object:', user);
        if (this.currentUser.height) {
          this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
        }
        
        if(this.currentUser.tier === 'All In') this.tierThree = true;

        // console.log('After profile load - tierThree:', this.tierThree);
        // console.log('After profile load - firstTimeAnimation:', this.firstTimeAnimation);

        // If it's tier three and first visit, trigger animation
        if (this.tierThree && this.firstTimeAnimation) {
          // Small delay to ensure the view is ready
          setTimeout(() => this.triggerAnimations(), 100);
        }
        if (this.currentUser.tier === 'Just Looking') {
          this.tierOne = true;
          localStorage.removeItem('hasVisitedProfileBefore');
        } else if (this.currentUser.tier === 'Motivated') {
          this.tierTwo = true;
          localStorage.removeItem('hasVisitedProfileBefore');
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

  reloadProfile() {
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';

    this.userId = parseInt(UserId);

    this.userService.getUser(this.userId).subscribe(
      (user) => {
        this.currentUser = user;
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

  // formatHeightForDisplay(height: string): string {
  //   const heightValue = parseFloat(height);
  //   if (isNaN(heightValue)) return '';
    
  //   const feet = Math.floor(heightValue);
  //   const inches = Math.round((heightValue - feet) * 12);
  //   return `${feet}'${inches}"`;
  // }

  // convertHeightToInches(height: string): number {
  //   if (height.includes("'")) {
  //     const [feet, inches] = height.split("'");
  //     return parseInt(feet) * 12 + parseInt(inches);
  //   } else {
  //     return Math.round(parseFloat(height) * 12);
  //   }
  // }

  // formatHeightForDisplay(inches: number): string {
  //   const feet = Math.floor(inches / 12);
  //   const remainingInches = inches % 12;
  //   return `${feet}'${remainingInches}"`;
  // }

  // formatHeightForDisplay(height: string): string {
  //   if (height.includes("'")) {
  //     // Already in feet and inches format, just return it
  //     return height.replace('"', '');
  //   } else {
  //     // Convert from decimal feet to feet and inches
  //     const totalInches = Math.round(parseFloat(height) * 12);
  //     const feet = Math.floor(totalInches / 12);
  //     const inches = totalInches % 12;
  //     return `${feet}'${inches}"`;
  //   }
  // }

  // formatHeightForDisplay(height: string): string {
  //   // If it's already in the correct format, return it
  //   if (/^\d+'\d+"?$/.test(height)) {
  //     return height.replace('"', '');
  //   }
  
  //   // Convert from decimal feet to feet and inches
  //   const totalInches = parseFloat(height) * 12;
  //   const feet = Math.floor(totalInches / 12);
  //   const inches = Math.round(totalInches % 12);
  
  //   // If inches round to 12, increment feet and reset inches to 0
  //   if (inches === 12) {
  //     return `${feet + 1}'0"`;
  //   }
  
  //   // Format the result
  //   return `${feet}'${inches}"`;
  // }

  // formatHeightForDisplay(height: string): string {
  //   // If it's already in the correct format, return it
  //   if (/^\d+'\d+"?$/.test(height)) {
  //     return height.replace('"', '');
  //   }
  
  //   // Split height into feet and inches
  //   const [feetPart, inchesPart] = height.split('.').map(part => parseInt(part, 10));
  
  //   // If there's no inches part, just return the feet part
  //   if (!inchesPart) {
  //     return `${feetPart}'0"`;
  //   }
  
  //   // Ensure inches are capped at 11 (as anything over that would roll over to feet)
  //   const inches = Math.min(inchesPart, 11);
  
  //   // Format the result
  //   return `${feetPart}'${inches}"`;
  // }

  // formatHeightForDisplay(height: string): string {
  //   // If it's already in the correct format, return it
  //   if (/^\d+'\d+"?$/.test(height)) {
  //     return height.replace('"', '');
  //   }
  
  //   // Convert from decimal feet to feet and inches without rounding
  //   const totalInches = parseFloat(height) * 12;
  //   const feet = Math.floor(totalInches / 12);
  //   const inches = Math.floor(totalInches % 12);  // Use Math.floor to avoid rounding up
  
  //   // Format the result
  //   return `${feet}'${inches}"`;
  // }
  
  formatHeightForDisplay(height: string): string {
    // If it's already in the correct format (e.g., 6'10"), return it
    if (/^\d+'\d+"?$/.test(height)) {
      return height.replace('"', '');
    }
  
    // Convert from decimal feet to feet and inches
    const totalInches = parseFloat(height) * 12;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.floor(totalInches % 12); // Use Math.floor to avoid rounding up
  
    // If inches round to 12, increment feet and reset inches to 0
    if (inches === 12) {
      return `${feet + 1}'0"`;
    }
  
    // Format the result
    return `${feet}'${inches}"`;
  }

  // formatHeightForDisplay(height: string): string {
  //   // If it's already in the correct format (e.g., 6'10"), return it
  //   if (/^\d+'\d+"?$/.test(height)) {
  //     return height.replace('"', '');
  //   }
  
  //   // Split the input into feet and inches based on the decimal point
  //   const [feetPart, inchesPart] = height.split('.').map(part => parseInt(part, 10));
  
  //   // If there is no decimal part, inches are 0
  //   const inches = inchesPart || 0;
  
  //   // Ensure inches are capped at 11
  //   const validInches = Math.min(inches, 11);
  
  //   // Format the result
  //   return `${feetPart}'${validInches}"`;
  // }

  // onHeightInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   this.currentUser.height = input.value;
  //   // this.displayHeight = this.formatHeightForDisplay(input.value);
  // }


  // onHeightInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const value = input.value;

  //   if (this.heightPattern.test(value)) {
  //     this.currentUser.height = value;
  //     // this.displayHeight = this.formatHeightForDisplay(value);
  //   } else {
  //     // If invalid, don't update currentUser.height
  //     this.displayHeight = 'Invalid input';
  //   }
  // }

  // onHeightInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const value = input.value;
  //   this.heightTouched = true;
  
  //   if (this.heightPattern.test(value)) {
  //     this.currentUser.height = value;
  //     this.displayHeight = this.formatHeightForDisplay(value);
  //   } else {
  //     // If invalid, don't update currentUser.height
  //     // but keep the invalid input in the field for user feedback
  //     this.currentUser.height = value;
  //     this.displayHeight = 'Invalid input';
  //   }
  // }

  // onHeightInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const value = input.value;
  //   this.heightTouched = true;
  
  //   if (this.heightPattern.test(value)) {
  //     this.currentUser.heightInches = this.convertHeightToInches(value);
  //     this.displayHeight = this.formatHeightForDisplay(this.currentUser.heightInches);
  //   } else {
  //     // If invalid, don't update currentUser.heightInches
  //     this.displayHeight = 'Invalid input';
  //   }
  // }
  
  // onHeightInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const value = input.value;
  //   this.heightTouched = true;
  
  //   if (this.heightPattern.test(value)) {
  //     // Store the original input format
  //     this.currentUser.height = value;
  //     // Display the formatted height
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
  
    if (this.heightPattern.test(value)) {
      this.currentUser.height = value;
      this.displayHeight = this.formatHeightForDisplay(value);
    } else {
      // If invalid, don't update currentUser.height
      this.currentUser.height = value;
      this.displayHeight = 'Invalid input';
    }
  }

  initializePictureForm() {
    this.pictureForm = this.fb.group({
      imgUrl: [this.currentUser.imgUrl]
    });
  }

  // validateAge(): void {
  //   const dob: Date | undefined = this.currentUser.dateOfBirth;

  //   // Ensure that the dateOfBirth is a valid Date object
  //   if (dob && dob instanceof Date && !isNaN(dob.getTime())) {
  //     const today = new Date();
  //     let age = today.getFullYear() - dob.getFullYear();

  //     const ageMonthDiff = today.getMonth() - dob.getMonth();
  //     const ageDayDiff = today.getDate() - dob.getDate();

  //     // Adjust age if birthday hasn't occurred yet this year
  //     if (ageMonthDiff < 0 || (ageMonthDiff === 0 && ageDayDiff < 0)) {
  //       age--;
  //     }

  //     // Set isValidAge to true if the age is 21 or older
  //     this.isValidAge = age >= 21;
  //   } else {
  //     this.isValidAge = false;  // Invalid date or not provided
  //   }
  // }

  // validateAge(): void {
  //   const dob: Date | undefined = this.currentUser.dateOfBirth;
  
  //   // Ensure that the dateOfBirth is a valid Date object
  //   if (dob && !isNaN(dob.getTime())) {
  //     const today = new Date();
  //     let age = today.getFullYear() - dob.getFullYear();
  
  //     const ageMonthDiff = today.getMonth() - dob.getMonth();
  //     const ageDayDiff = today.getDate() - dob.getDate();
  
  //     // Adjust age if birthday hasn't occurred yet this year
  //     if (ageMonthDiff < 0 || (ageMonthDiff === 0 && ageDayDiff < 0)) {
  //       age--;
  //     }
  
  //     // Set isValidAge to true if the age is 21 or older
  //     this.isValidAge = age >= 21;
  //   } else {
  //     this.isValidAge = false;  // Invalid date or not provided
  //   }
  // }

  // validateAge(): void {
  //   const dob: Date | undefined = this.currentUser.dateOfBirth;
  
  //   // Ensure that the dateOfBirth is a valid Date object
  //   if (dob && !isNaN(dob.getTime())) {
  //     const today = new Date();
      
  //     // Ensure that dob is not a future date
  //     if (dob > today) {
  //       this.isValidAge = false;
  //       return;
  //     }
  
  //     let age = today.getFullYear() - dob.getFullYear();
  
  //     const ageMonthDiff = today.getMonth() - dob.getMonth();
  //     const ageDayDiff = today.getDate() - dob.getDate();
  
  //     // Adjust age if birthday hasn't occurred yet this year
  //     if (ageMonthDiff < 0 || (ageMonthDiff === 0 && ageDayDiff < 0)) {
  //       age--;
  //     }
  
  //     // Set isValidAge to true if the age is 21 or older
  //     this.isValidAge = age >= 21;
  //   } else {
  //     this.isValidAge = false;  // Invalid date or not provided
  //   }
  // }
  

  // validateAge(): void {
  //   const dob: Date | undefined = this.currentUser.dateOfBirth;
  
  //   if (dob && !isNaN(dob.getTime())) {
  //     const today = new Date();
      
  //     // Check if the date of birth is in the future
  //     if (dob > today) {
  //       this.isValidAge = false;
  //       return;
  //     }
  
  //     const minAgeYear = today.getFullYear() - 21;
  //     const minAgeDate = new Date(minAgeYear, today.getMonth(), today.getDate());
  
  //     // Check if the user is at least 21 years old
  //     if (dob > minAgeDate) {
  //       this.isValidAge = false;
  //     } else {
  //       this.isValidAge = true;
  //     }
  //   } else {
  //     this.isValidAge = false; // Invalid date or not provided
  //   }
  // }

  // validateAge(): void {
  //   const dob: Date | undefined = this.currentUser.dateOfBirth;
  
  //   if (dob && !isNaN(dob.getTime())) {
  //     const today = new Date();
      
  //     // Check if the date of birth is in the future
  //     if (dob > today) {
  //       this.isValidAge = false;
  //       return;
  //     }
  
  //     // Calculate the latest acceptable date for someone who is 21 years old
  //     const minDate = new Date();
  //     minDate.setFullYear(minDate.getFullYear() - 21);
      
  //     // Check if the user is at least 21 years old
  //     this.isValidAge = dob <= minDate;
  //   } else {
  //     this.isValidAge = false; // Invalid date or not provided
  //   }
  // }

  // validateAge(): void {
  //   // console.log('Date of Birth:', this.currentUser.dateOfBirth);
  //   // console.log('Type:', typeof this.currentUser.dateOfBirth);
    
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
  //       return;
  //     }
  
  //     const minDate = new Date();
  //     minDate.setFullYear(minDate.getFullYear() - 21);
      
  //     this.isValidAge = dob <= minDate;
  //   } else {
  //     this.isValidAge = false;
  //     this.twentyOneError = true;
  //   }
    
  // }

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
  //       this.twentyOneError = true;
  //       return;
  //     }
  
  //     const minDate = new Date();
  //     // minDate.setFullYear(minDate.getFullYear() - 21);
      
  //     this.isValidAge = dob <= minDate;
  //     // this.twentyOneError = !this.isValidAge; // Show error if age is below 21
  //   } else {
  //     this.isValidAge = false;
  //     // this.twentyOneError = true;
  //   }
  // }

  validateAge(): void {
    let dob: Date | undefined;
  
    // Convert to Date object if necessary
    if (typeof this.currentUser.dateOfBirth === 'string') {
      dob = new Date(this.currentUser.dateOfBirth);
    } else {
      dob = this.currentUser.dateOfBirth;
    }
  
    if (dob && !isNaN(dob.getTime())) {
      const today = new Date();
      if (dob > today) {
        this.isValidAge = false;
        this.twentyOneError = true;  // You can remove or repurpose this
        return;
      }
  
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - 124);
  
      this.isValidAge = dob >= maxDate;
      if (!this.isValidAge) {
        // Handle the case where the person is older than 124 years
        this.twentyOneError = true;  // You can rename this variable to something like "maxAgeError"
      } else {
        this.twentyOneError = false;
      }
    } else {
      this.isValidAge = false;
    }
  }

  // validateAge(): void {
  //   const dob = this.currentUser.dateOfBirth;
  
  //   if (dob instanceof Date && !isNaN(dob.getTime())) {
  //     const today = new Date();
  //     const age = today.getFullYear() - dob.getFullYear();
  
  //     const ageMonthDiff = today.getMonth() - dob.getMonth();
  //     const ageDayDiff = today.getDate() - dob.getDate();
  
  //     if (ageMonthDiff < 0 || (ageMonthDiff === 0 && ageDayDiff < 0)) {
  //       this.isValidAge = age - 1 >= 21;
  //     } else {
  //       this.isValidAge = age >= 21;
  //     }
  //   } else {
  //     this.isValidAge = false;
  //   }
  // }

  isOver21(): boolean {
    return this.isValidAge;
  }


  // changePicture() {
  //   this.currentState = ProfileState.ChangingPicture;
  //   this.initializePictureForm(); // Reset form with current URL
  // }

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

  // editProfile() {
  //   this.userService.updateUser2(this.currentUser).subscribe(() => {
  //     this.reloadProfile();
  //   });
  // }

  // editProfile() {
  //   if (this.currentState === ProfileState.EditingProfile) {
  //     this.userService.updateUser2(this.currentUser).subscribe(() => {
  //       this.currentState = ProfileState.Viewing;
  //       this.reloadProfile();
  //     });
  //   } else {
  //     this.currentState = ProfileState.EditingProfile;
  //   }
  // }

  // height {
  //   if (this.currentState === ProfileState.EditingProfile) {
  //     this.userService.updateUser(this.currentUser).subscribe(
  //       () => {
  //         this.currentState = ProfileState.Viewing;
  //         this.reloadProfile(); // Reload the profile to ensure we display the latest data
  //       },
  //       (error) => {
  //         console.error('Error updating profile:', error);
  //         // Handle error (e.g., show error message to user)
  //       }
  //     );
  //   }
  // }

// saveProfile() {
//     if (this.currentState === ProfileState.EditingProfile && this.isFormValid('profile')) {
//       // Convert height to decimal before saving if it's in feet and inches format
//       if (this.currentUser.height && this.currentUser.height.includes("'")) {
//         const [feet, inches] = this.currentUser.height.split("'");
//         const cleanedInches = inches.replace('"', '');
//         const totalInches = parseInt(feet) * 12 + parseInt(cleanedInches);
//         this.currentUser.height = (totalInches / 12).toFixed(2);
//       }

//       this.userService.updateUser(this.currentUser).subscribe(
//         () => {
//           console.log('Profile updated successfully');
//           this.currentState = ProfileState.Viewing;
//           this.reloadProfile();
//         },
//         error => {
//           console.error('Error updating profile:', error);
//           // Handle error (e.g., show error message to user)
//         }
//       );
//     } else {
//       console.log('Form is invalid or not in editing state');
//       // Optionally, you can show an error message to the user here
//     }
//   }

// isHeightValid(): boolean {
//   return this.heightPattern.test(this.currentUser.height || '');
// }

// isFormValid(form: NgForm): boolean {
//   return form.form.valid && this.isHeightValid();
// }

// saveProfile(form: NgForm) {
//   if (this.currentState === ProfileState.EditingProfile && this.isFormValid(form)) {
//     // Convert height to decimal before saving if it's in feet and inches format
//     if (this.currentUser.height && this.currentUser.height.includes("'")) {
//       const [feet, inches] = this.currentUser.height.split("'");
//       const cleanedInches = inches.replace('"', '');
//       const totalInches = parseInt(feet) * 12 + parseInt(cleanedInches);
//       this.currentUser.height = (totalInches / 12).toFixed(2);
//     }

//     this.userService.updateUser(this.currentUser).subscribe(
//       () => {
//         console.log('Profile updated successfully');
//         this.currentState = ProfileState.Viewing;
//         this.reloadProfile();
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

// saveProfile() {
//   if (this.currentState === ProfileState.EditingProfile && this.isFormValid('profile')) {
//     // Convert height to decimal before saving if it's in feet and inches format
//     if (this.currentUser.height && this.currentUser.height.includes("'")) {
//       const [feet, inches] = this.currentUser.height.split("'");
//       const cleanedInches = inches.replace('"', '');
//       const totalInches = parseInt(feet) * 12 + parseInt(cleanedInches);
//       this.currentUser.height = (totalInches / 12).toFixed(2);
//     }

//     this.userService.updateUser(this.currentUser).subscribe(
//       () => {
//         console.log('Profile updated successfully');
//         this.currentState = ProfileState.Viewing;
//         this.reloadProfile();
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

saveProfile() {
  if (this.currentState === ProfileState.EditingProfile && this.isFormValid('profile')) {
    // Convert height to decimal feet before saving if it's in feet and inches format
    if (this.currentUser.height && this.currentUser.height.includes("'")) {
      const [feet, inches] = this.currentUser.height.split("'");
      const cleanedInches = inches.replace('"', '');
      const totalInches = parseInt(feet) * 12 + parseInt(cleanedInches);
      this.currentUser.height = (totalInches / 12).toFixed(2);
    }

    this.userService.updateUser(this.currentUser).subscribe(
      () => {
        console.log('Profile updated successfully');
        this.currentState = ProfileState.Viewing;
        this.reloadProfile();
      },
      error => {
        console.error('Error updating profile:', error);
        // Handle error (e.g., show error message to user)
      }
    );
  } else {
    console.log('Form is invalid or not in editing state');
    // Optionally, you can show an error message to the user here
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

//     // Check if name and email are valid
//     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;

  

//     // Check if height is valid
//     const heightValid = this.isHeightValid();
//     const weightValid = this.isWeightValid();

//     // Check if other fields are either empty or valid
//     const optionalFieldsValid = ['height','dateOfBirth', 'weight', 'imgUrl'].every(field => {
//       const control = this.profileForm.form.get(field);
//       return !control?.value || control?.valid;
//     }) ?? true; // If the array is empty, consider it valid

//     return requiredFieldsValid && optionalFieldsValid && heightValid && weightValid && this.isValidAge; 
//   }
// }

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

//     // Check if name and email are valid
//     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;

//     // Check if height is valid
//     const heightValid = this.isHeightValid();
//     const weightValid = this.isWeightValid();

//     // Check if other fields are either empty or valid
//     const optionalFieldsValid = ['height','dateOfBirth', 'weight', 'imgUrl'].every(field => {
//       const control = this.profileForm.form.get(field);
//       return !control?.value || control?.valid;
//     }) ?? true; // If the array is empty, consider it valid

//     // Include the age validity in the form validation
//     return requiredFieldsValid && optionalFieldsValid && heightValid && weightValid && this.isValidAge;
//   }
// }

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

//     // Check if name and email are valid
//     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;

//     // Check if height is valid
//     const heightValid = this.isHeightValid();
//     const weightValid = this.isWeightValid();

//     // Check if other fields are either empty or valid
//     const optionalFieldsValid = ['height', 'dateOfBirth', 'weight', 'imgUrl'].every(field => {
//       const control = this.profileForm.form.get(field);
//       return !control?.value || control?.valid;
//     }) ?? true; // If the array is empty, consider it valid

//     // Validate age
//     this.validateAge();
    
//     return requiredFieldsValid && optionalFieldsValid && heightValid && weightValid && this.isValidAge; 
//   }
// }

isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
  if (formType === 'password') {
    return this.stepForm.valid && 
           this.isOldPasswordCorrect && 
           !this.passwordGroup.errors?.['passwordMismatch'] &&
           this.passwordGroup.valid;
  } else { // profile form
    if (!this.profileForm) return false;
    
    const nameControl = this.profileForm.form.get('name');
    const emailControl = this.profileForm.form.get('email');

    const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;

    const heightValid = this.isHeightValid();
    const weightValid = this.isWeightValid();

    const optionalFieldsValid = ['height', 'dateOfBirth', 'weight', 'imgUrl'].every(field => {
      const control = this.profileForm.form.get(field);
      return !control?.value || control?.valid;
    }) ?? true;

     // Validate age
    //  this.validateAge();

    return requiredFieldsValid && optionalFieldsValid && heightValid && weightValid && this.isValidAge;
  }
}

// onHeightInput(event: Event) {
//   const input = event.target as HTMLInputElement;
//   this.currentUser.height = input.value;
//   this.displayHeight = this.formatHeightForDisplay(input.value);
// }

// isHeightValid(): boolean {
//   const heightPattern = /^(\d+(\.\d+)?|\d+'\d+"?)$/;
//   return heightPattern.test(this.currentUser.height || '');
// }

isHeightValid(): boolean {
  const heightPattern = /^(\d+(\.\d+)?|\d+'\d+(\.\d+)?"?)$/;
  return heightPattern.test(this.currentUser.height || '');
}

isWeightValid(): boolean {
  const weightString = this.currentUser.weight || '';
  const weightValue = parseFloat(weightString);
  
  if (isNaN(weightValue)) {
    return false;
  }
  else if(weightValue < 50 || weightValue > 600) {
    return false;
  }
  
  return weightValue >= 50 && weightValue <= 600;
}

  get passwordGroup() {
    return this.stepForm.get('passwordGroup') as FormGroup;
  }

  // checkPasswords() {
  //   const password = this.stepForm.get('password')?.value;
  //   const confirmPassword = this.stepForm.get('confirmPassword')?.value;

  //   if (this.stepForm.get('confirmPassword')?.touched) {
  //     if (confirmPassword === '') {
  //       // Don't show mismatch error if confirm password is empty
  //       this.passwordMismatch = false;
  //       this.stepForm.get('confirmPassword')?.setErrors(null);
  //     } else if (password !== confirmPassword) {
  //       this.passwordMismatch = true;
  //       this.stepForm.get('confirmPassword')?.setErrors({ mismatch: true });
  //     } else {
  //       this.passwordMismatch = false;
  //       this.stepForm.get('confirmPassword')?.setErrors(null);
  //     }
  //   }
  // }

  checkPasswords(): void {
    this.authenticating = false;
    const passwordGroup = this.stepForm.get('passwordGroup');
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

   // Custom validator to check password match
  //  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  //   const password = control.get('password');
  //   const confirmPassword = control.get('confirmPassword');

  //   if (password && confirmPassword && password.value !== confirmPassword.value) {
  //     confirmPassword.setErrors({ passwordMismatch: true });
  //     return { passwordMismatch: true };
  //   } else {
  //     confirmPassword?.setErrors(null);
  //     return null;
  //   }
  // }

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
    if(oldPassword === '') {
      this.authenticating = false;
      return;
    }
    if (oldPassword) {
      this.authenticating = true;
      this.userService.checkPassword(this.userId, oldPassword).subscribe(
        (isCorrect) => {
          this.isOldPasswordCorrect = isCorrect;
          this.authenticating = false;
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

  // isFormValid(): boolean {
  //   return this.stepForm.valid && 
  //          this.isOldPasswordCorrect && 
  //          !this.passwordGroup.errors?.['passwordMismatch'] &&
  //          this.passwordGroup.valid;
  // }

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
  
  //     // Check if name and email are valid
  //     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;
  
  //     // Check if other fields are either empty or valid
  //     const optionalFieldsValid = ['dateOfBirth', 'weight', 'height', 'imgUrl'].every(field => {
  //       const control = this.profileForm.form.get(field);
  //       return !control?.value || control?.valid;
  //     }) ?? true; // If the array is empty, consider it valid
  
  //     return requiredFieldsValid && optionalFieldsValid;
  //   }
  // }

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
  
  //     // Check if name and email are valid
  //     const requiredFieldsValid = (nameControl?.valid && emailControl?.valid) ?? false;
  
  //     // Check if height is valid
  //     const heightValid = this.isHeightValid();
  
  //     // Check if other fields are either empty or valid
  //     const optionalFieldsValid = ['dateOfBirth', 'weight', 'imgUrl'].every(field => {
  //       const control = this.profileForm.form.get(field);
  //       return !control?.value || control?.valid;
  //     }) ?? true; // If the array is empty, consider it valid
  
  //     return requiredFieldsValid && optionalFieldsValid && heightValid;
  //   }
  // }
  
  // // Add this method if it's not already in your component
  // isHeightValid(): boolean {
  //   const heightPattern = /^(\d+(\.\d+)?|\d+'\d+"?)$/;
  //   return heightPattern.test(this.currentUser.height || '');
  // }
  

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

  // updateUserPassword() {
  //   if (this.isFormValid()) {
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

  // toggleProfile() {
  //   this.saveOrChange = !this.saveOrChange;
  //   this.classAppliedTwo = !this.classAppliedTwo;
  //   this.editProfileToggle = !this.editProfileToggle;
  //   this.onlyProfilePicture = !this.onlyProfilePicture;
  // }

  // toggleEditProfile() {
  //   this.classApplied = !this.classApplied;
  //   this.saveOrChange = !this.saveOrChange;
  //   this.editOrUpdate = !this.editOrUpdate;
  //   this.editProfileToggle = !this.editProfileToggle;
  // }

  // toggleDelete() {
  //   this.classAppliedDeleteProfile = !this.classAppliedDeleteProfile;
  //   (document.getElementById('deleteProfile') as HTMLFieldSetElement)
  //   .setAttribute('disabled', 'disabled');
  // }

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
    localStorage.removeItem('hasVisitedProfileBefore');
    this.UpdateStatus();
    this.router.navigate(['/home']);
  }

  // changePassword() {
  //   this.classAppliedTwo = !this.classAppliedTwo;
  //   this.editProfileToggle = !this.editProfileToggle;
  //   this.onlyProfilePicture = !this.onlyProfilePicture;
  //   this.updatePassword = !this.updatePassword;
  // }

  // goBack() {
  //   this.classApplied = !this.classApplied;
  //   this.classAppliedTwo = !this.classAppliedTwo;
  //   this.editProfileToggle = !this.editProfileToggle;
  //   this.updatePassword = !this.updatePassword;
  //   this.stepForm.reset();
  // }

  editProfile() {
    if (this.currentState === ProfileState.EditingProfile) {
      // Save the profile
      this.userService.updateUser(this.currentUser).subscribe(() => {
        this.currentState = ProfileState.Viewing;
        this.reloadProfile();
      });
    } else {
      this.currentState = ProfileState.EditingProfile;
    }
  }

  changePicture() {
    this.currentState = ProfileState.ChangingPicture;
  }

  changePassword() {
    this.currentState = ProfileState.ChangingPassword;
  }

  deleteProfile() {
    this.currentState = ProfileState.DeletingProfile;
    this.classAppliedDeleteProfile = true;
  }

  cancelAction() {
    this.currentState = ProfileState.Viewing;
    this.stepForm.reset();
    this.passwordGroup.disable();
    this.authenticating = false;
    this.oldPasswordError = '';
    this.reloadProfile();
    this.stepForm.clearValidators();
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.passwordGroup.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (passwordControl?.hasError('pattern')) {
      return 'Requirements not met';
    }
    return 'Invalid confirm password';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.passwordGroup.get('confirmPassword');
    if (confirmPasswordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (confirmPasswordControl?.hasError('pattern')) {
      return 'Requirements not met';
    }
    return 'Invalid confirm password';
  }
}

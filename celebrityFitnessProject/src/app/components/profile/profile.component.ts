import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
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

  @ViewChild('profileForm') profileForm!: NgForm;
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
  heightPattern = /^(\d+(\.\d+)?|\d+'\d+"?)$/; 
  heightTouched = false;
  heightFeet!: number;
  heightInches!: number;
  isValidAge: boolean = true;  
  twentyOneError: boolean = false;
  // firstTimeAnimation: boolean = true;
  firstTimeAnimationTierOne: boolean = true;
  firstTimeAnimationTierTwo: boolean = true;
  firstTimeAnimationTierThree: boolean = true;
  currentTier: string = '';
  lastAnimatedTier: string | null = null;


  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  // Handler properties
  keydownHandler: (event: KeyboardEvent) => void;
  mousedownHandler: (event: MouseEvent) => void;

  private oldPasswordSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router,
    private actRoute: ActivatedRoute,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {
    this.keydownHandler = (event) => {
      const toggleDiv = document.getElementById('deleteProfile');
      if (event.key === 'Escape' && toggleDiv?.classList.contains('active')) {
        toggleDiv.classList.toggle('active');
        this.currentState = ProfileState.Viewing;
      }
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
    
    //  this.firstTimeAnimationTierOne = localStorage.getItem('hasVisitedProfileBeforeTierOne') !== 'true';
    //  this.firstTimeAnimationTierTwo = localStorage.getItem('hasVisitedProfileBeforeTierTwo') !== 'true';
    //  this.firstTimeAnimationTierThree = localStorage.getItem('hasVisitedProfileBeforeTierThree') !== 'true';
  

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

    this.stepForm = this.fb.group({
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
  
    this.passwordGroup.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.passwordGroup.updateValueAndValidity({ emitEvent: false });
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.triggerAnimations(), 0);
  }

  // triggerAnimations() {
  //   if (this.tierOne && this.firstTimeAnimationTierOne) {
  //     this.firstTimeAnimationTierOne = false;
  //     localStorage.setItem('hasVisitedProfileBeforeTierOne', 'true');
  //   } else if (this.tierTwo && this.firstTimeAnimationTierTwo) {
  //     this.firstTimeAnimationTierTwo = false;
  //     localStorage.setItem('hasVisitedProfileBeforeTierTwo', 'true');
  //   } else if (this.tierThree && this.firstTimeAnimationTierThree) {
  //     this.firstTimeAnimationTierThree = false;
  //     localStorage.setItem('hasVisitedProfileBeforeTierThree', 'true');
      
  //     // Trigger the expand box shadow animation for tierThree
  //     const profilePicture = this.elementRef.nativeElement.querySelector('#profilePicture');
  //     if (profilePicture) {
  //       this.renderer.addClass(profilePicture, 'animateBoxShadow');
  //       setTimeout(() => {
  //         this.renderer.removeClass(profilePicture, 'animateBoxShadow');
  //       }, 500); // Match this to your animation duration
  //     }
  //   }
    
  //   // Force change detection
  //   this.cdr.detectChanges();
  // }

  // triggerAnimations(): void {
  //   if (this.tierOne && this.firstTimeAnimationTierOne) {
  //     this.firstTimeAnimationTierOne = false;
  //     localStorage.setItem('hasVisitedTierOne', 'true');
  //   } else if (this.tierTwo && this.firstTimeAnimationTierTwo) {
  //     this.firstTimeAnimationTierTwo = false;
  //     localStorage.setItem('hasVisitedTierTwo', 'true');
  //   } else if (this.tierThree && this.firstTimeAnimationTierThree) {
  //     this.firstTimeAnimationTierThree = false;
  //     localStorage.setItem('hasVisitedTierThree', 'true');
      
  //     // Trigger the expand box shadow animation for tierThree
  //     setTimeout(() => {
  //       const profilePicture = this.elementRef.nativeElement.querySelector('#profilePicture');
  //       if (profilePicture) {
  //         this.renderer.addClass(profilePicture, 'animateBoxShadow');
  //         setTimeout(() => {
  //           this.renderer.removeClass(profilePicture, 'animateBoxShadow');
  //         }, 500); // Match this to your animation duration
  //       }
  //     }, 100);
  //   }
    
  //   this.cdr.detectChanges();
  // }

  // triggerAnimations(): void {
  //   console.log('Triggering animations');
  //   console.log('Tier One:', this.tierOne, 'First Time:', this.firstTimeAnimationTierOne);
  //   console.log('Tier Two:', this.tierTwo, 'First Time:', this.firstTimeAnimationTierTwo);
  //   console.log('Tier Three:', this.tierThree, 'First Time:', this.firstTimeAnimationTierThree);
  
  //   if (this.tierOne && this.firstTimeAnimationTierOne) {
  //     console.log('Triggering Tier One animation');
  //     this.firstTimeAnimationTierOne = false;
  //     localStorage.setItem('hasVisitedTierOne', 'true');
  //   } else if (this.tierTwo && this.firstTimeAnimationTierTwo) {
  //     console.log('Triggering Tier Two animation');
  //     this.firstTimeAnimationTierTwo = false;
  //     localStorage.setItem('hasVisitedTierTwo', 'true');
  //   } else if (this.tierThree && this.firstTimeAnimationTierThree) {
  //     console.log('Triggering Tier Three animation');
  //     this.firstTimeAnimationTierThree = false;
  //     localStorage.setItem('hasVisitedTierThree', 'true');
      
  //     // Trigger the expand box shadow animation for tierThree
  //     setTimeout(() => {
  //       const profilePicture = this.elementRef.nativeElement.querySelector('#profilePicture');
  //       if (profilePicture) {
  //         console.log('Adding animateBoxShadow class to profile picture');
  //         this.renderer.addClass(profilePicture, 'animateBoxShadow');
  //         setTimeout(() => {
  //           this.renderer.removeClass(profilePicture, 'animateBoxShadow');
  //         }, 500);
  //       } else {
  //         console.log('Profile picture element not found');
  //       }
  //     }, 100);
  //   }
    
  //   // Force a repaint
  //   this.cdr.detectChanges();
  //   requestAnimationFrame(() => {
  //     const element = this.elementRef.nativeElement;
  //     element.style.display = 'none';
  //     element.offsetHeight; // Trigger a reflow
  //     element.style.display = '';
  //   });
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

  // loadProfile() {
  //   this.loadingComplete = false;
  //   this.imageLoaded = false;
  //   const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';

  //   this.userId = parseInt(UserId);
  //   const previousTier = this.currentUser.tier;


  //   this.userService.getUser(this.userId).subscribe(
  //     (user) => {
  //       const previousTier = this.currentUser?.tier;
  //       this.currentUser = user;
        
  //       this.updateTierFlags();

  //       // Check if the tier has changed
  //       if (previousTier && previousTier !== this.currentUser.tier) {
  //         this.resetAnimationFlags();
  //       }
  //       else{
  //         this.initializeAnimationFlags();
  //       }

  //       this.triggerAnimations();

  //       // console.log('Full user object:', user);
  //       if (this.currentUser.height) {
  //         this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
  //       }
        
  //       if(this.currentUser.tier === 'All In') this.tierThree = true;

  //       // console.log('After profile load - tierThree:', this.tierThree);
  //       // console.log('After profile load - firstTimeAnimation:', this.firstTimeAnimation);

  //       if (this.currentUser.tier === 'Just Looking') {
  //         this.tierOne = true;
  //         this.tierTwo = false;
  //         this.tierThree = false;
  //         if (this.firstTimeAnimationTierOne) {
  //           localStorage.setItem('hasVisitedProfileBeforeTierOne', 'true');
  //         }
  //       } else if (this.currentUser.tier === 'Motivated') {
  //         this.tierOne = false;
  //         this.tierTwo = true;
  //         this.tierThree = false;
  //         if (this.firstTimeAnimationTierTwo) {
  //           localStorage.setItem('hasVisitedProfileBeforeTierTwo', 'true');
  //         }
  //       } else {
  //         this.tierOne = false;
  //         this.tierTwo = false;
  //         this.tierThree = true;
  //         if (this.firstTimeAnimationTierThree) {
  //           localStorage.setItem('hasVisitedProfileBeforeTierThree', 'true');
  //         }
  //       }
  //       if (this.currentUser.paymentFrequency === 'monthly') {
  //         this.monthOrYear = 'month';
  //       } else {
  //         this.monthOrYear = 'year';
  //       }

  //       if (this.currentUser.tier === 'Just Looking') {
  //         this.freeTier = true;
  //       } else {
  //         this.freeTier = false;
  //       }
  //       if (user.imgUrl) {
  //         this.preloadImage(user.imgUrl);
  //       } else {
  //         // If there's no image URL, consider the image "loaded"
  //         this.imageLoaded = true;
  //         this.checkLoadingComplete();
  //       }
  //       // If it's tier three and first visit, trigger animation
  //       if (this.tierThree && this.firstTimeAnimationTierThree) {
  //         // Small delay to ensure the view is ready
  //         setTimeout(() => this.triggerAnimations(), 100);
  //       }

  //       // this.loadingComplete = true;
  //       const displayName = this.currentUser.name;
  //       this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

         
  //     },
  //     (error) => {
  //       console.error('Error loading user profile:', error);
  //       this.loadingComplete = true;
  //       this.imageLoaded = true; // Consider image loaded in case of error
  //       this.cdr.detectChanges();
  //     }
  //   );
  // }

  loadProfile() {
    console.log('Loading profile');
    this.loadingComplete = false;
    this.imageLoaded = false;
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
    this.userId = parseInt(UserId);
  
    // const previousTier = this.currentUser?.tier;
    const storedTier = localStorage.getItem('currentTier');
    this.lastAnimatedTier = localStorage.getItem('lastAnimatedTier');
  
    this.userService.getUser(this.userId).subscribe(
      (user) => {
        console.log('User data received:', user);
        this.currentUser = user;
        
        this.updateTierFlags();

        // const storedTier = localStorage.getItem('currentTier');
        const currentTier = this.currentUser.tier || 'Unknown';
        console.log('Stored tier:', storedTier, 'Current tier:', currentTier);


        if (storedTier !== currentTier || this.lastAnimatedTier !== currentTier) {
          console.log('Tier changed or not animated yet. Resetting animations.');
          this.resetAnimationFlags();
          // setTimeout(() => {
          //   this.triggerAnimations();
          //   if (currentTier !== 'Unknown') {
          //     localStorage.setItem('currentTier', currentTier);
          //   }
          // }, 0);
        // } else {
        //   console.log('Same tier. No animation needed.');
        //   this.loadAnimationState();
        }
        localStorage.setItem('currentTier', currentTier);
  
        // if (currentTier !== 'Unknown') {
        //   localStorage.setItem('currentTier', currentTier);
        // }
  
        if (this.currentUser.height) {
          this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
        }
  
        this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
        this.freeTier = this.currentUser.tier === 'Just Looking';
  
        if (user.imgUrl) {
          this.preloadImage(user.imgUrl);
        } else {
          this.imageLoaded = true;
          this.checkLoadingComplete();
        }
  
        const displayName = this.currentUser.name;
        this.firstName = displayName?.split(' ')[0];
  
        // console.log('About to trigger animations');
        // this.triggerAnimations();
  
        this.cdr.detectChanges();
        setTimeout(() => this.triggerAnimations(), 0);
      },
      (error) => {
        console.error('Error loading user profile:', error);
        this.loadingComplete = true;
        this.imageLoaded = true;
        this.cdr.detectChanges();
      }
    );
  }

  // resetAnimationFlags() {
  //   this.firstTimeAnimationTierOne = true;
  //   this.firstTimeAnimationTierTwo = true;
  //   this.firstTimeAnimationTierThree = true;
  //   localStorage.removeItem('animationTierOne');
  //   localStorage.removeItem('animationTierTwo');
  //   localStorage.removeItem('animationTierThree');
  // }

  resetAnimationFlags() {
    this.firstTimeAnimationTierOne = true;
    this.firstTimeAnimationTierTwo = true;
    this.firstTimeAnimationTierThree = true;
    localStorage.removeItem('lastAnimatedTier');
  }

  loadAnimationState() {
    this.firstTimeAnimationTierOne = localStorage.getItem('animationTierOne') !== 'done';
    this.firstTimeAnimationTierTwo = localStorage.getItem('animationTierTwo') !== 'done';
    this.firstTimeAnimationTierThree = localStorage.getItem('animationTierThree') !== 'done';
  }

  // triggerAnimations(): void {
  //   console.log('Triggering animations');
  //   console.log('Current tier:', this.currentUser.tier);
  //   console.log('First time animation flag:', this.firstTimeAnimation);
  
  //   if (this.firstTimeAnimation) {
  //     console.log('Animating for tier:', this.currentUser.tier);
      
  //     const tierElement = this.elementRef.nativeElement.querySelector('.profileNameTier');
  //     if (tierElement) {
  //       console.log('Found tier element, adding fade-in class');
  //       this.renderer.addClass(tierElement, 'fade-in');
  //     } else {
  //       console.log('Tier element not found');
  //     }
  
  //     if (this.currentUser.tier === 'All In') {
  //       console.log('Tier Three: Adding animateBoxShadow class to profile picture');
  //       const profilePicture = this.elementRef.nativeElement.querySelector('#profilePicture');
  //       if (profilePicture) {
  //         this.renderer.addClass(profilePicture, 'animateBoxShadow');
  //         setTimeout(() => {
  //           this.renderer.removeClass(profilePicture, 'animateBoxShadow');
  //         }, 500);
  //       } else {
  //         console.log('Profile picture element not found');
  //       }
  //     }
  
  //     this.firstTimeAnimation = false;
  //   } else {
  //     console.log('No animation triggered');
  //   }
    
  //   this.cdr.detectChanges();
  // }


// triggerAnimations(): void {
//   console.log('Triggering animations');
//   console.log('Current tier:', this.currentUser.tier);
//   console.log('First time animation flag:', this.firstTimeAnimation);

//   if (this.firstTimeAnimation) {
//     console.log('Animating for tier:', this.currentUser.tier);
    
//     if (this.profileNameTierElement) {
//       console.log('Found tier element, adding fade-in class');
//       this.renderer.addClass(this.profileNameTierElement.nativeElement, 'fade-in');
//     } else {
//       console.log('Tier element not found');
//     }

//     if (this.currentUser.tier === 'All In' && this.profilePictureElement) {
//       console.log('Tier Three: Adding animateBoxShadow class to profile picture');
//       this.renderer.addClass(this.profilePictureElement.nativeElement, 'animateBoxShadow');
//       setTimeout(() => {
//         this.renderer.removeClass(this.profilePictureElement.nativeElement, 'animateBoxShadow');
//       }, 500);
//     }

//     this.firstTimeAnimation = false;
//   } else {
//     console.log('No animation triggered');
//   }
  
//   this.cdr.detectChanges();
// }

// triggerAnimations(): void {
//   console.log('Triggering animations');
//   console.log('Current tier:', this.currentUser.tier);
//   console.log('First time animation flag:', this.firstTimeAnimation);

//   if (this.firstTimeAnimation) {
//     console.log('Animating for tier:', this.currentUser.tier);
    
//     let tierElement = this.profileNameTierElement?.nativeElement;
//     if (!tierElement) {
//       console.log('Tier element not found via ViewChild, trying querySelector');
//       tierElement = this.elementRef.nativeElement.querySelector('.profileNameTier');
//     }

//     if (tierElement) {
//       console.log('Found tier element, adding fade-in class');
//       this.renderer.addClass(tierElement, 'fade-in');
//     } else {
//       console.log('Tier element not found');
//     }

//     if (this.currentUser.tier === 'All In') {
//       let profilePicture = this.profilePictureElement?.nativeElement;
//       if (!profilePicture) {
//         console.log('Profile picture not found via ViewChild, trying querySelector');
//         profilePicture = this.elementRef.nativeElement.querySelector('#profilePicture');
//       }

//       if (profilePicture) {
//         console.log('Adding animateBoxShadow class to profile picture');
//         this.renderer.addClass(profilePicture, 'animateBoxShadow');
//         setTimeout(() => {
//           this.renderer.removeClass(profilePicture, 'animateBoxShadow');
//         }, 500);
//       } else {
//         console.log('Profile picture element not found');
//       }
//     }

//     this.firstTimeAnimation = false;
//   } else {
//     console.log('No animation triggered');
//   }
  
//   this.cdr.detectChanges();
// }

// triggerAnimations(): void {
//   console.log('Triggering animations');
//   console.log('Current tier:', this.currentUser.tier);

//   if (this.tierOne && this.firstTimeAnimationTierOne) {
//     this.animateTier('One');
//   } else if (this.tierTwo && this.firstTimeAnimationTierTwo) {
//     this.animateTier('Two');
//   } else if (this.tierThree && this.firstTimeAnimationTierThree) {
//     this.animateTier('Three');
//   } else {
//     console.log('No animation triggered');
//   }
  
//   this.cdr.detectChanges();
// }

// triggerAnimations(): void {
//   console.log('Triggering animations');
//   console.log('Current tier:', this.currentUser.tier);

//   switch(this.currentUser.tier) {
//     case 'Just Looking':
//       if (this.firstTimeAnimationTierOne) {
//         this.animateTier('One');
//       }
//       break;
//     case 'Motivated':
//       if (this.firstTimeAnimationTierTwo) {
//         this.animateTier('Two');
//       }
//       break;
//     case 'All In':
//       if (this.firstTimeAnimationTierThree) {
//         this.animateTier('Three');
//       }
//       break;
//     default:
//       console.log('No animation triggered');
//   }
  
//   this.cdr.detectChanges();
// }

triggerAnimations(): void {
  console.log('Triggering animations');
  console.log('Current tier:', this.currentUser.tier);

  if (this.currentUser.tier !== this.lastAnimatedTier) {
    switch(this.currentUser.tier) {
      case 'Just Looking':
        this.animateTier('One');
        break;
      case 'Motivated':
        this.animateTier('Two');
        break;
      case 'All In':
        this.animateTier('Three');
        break;
      default:
        console.log('No animation triggered');
    }
  } else {
    console.log('Animation already played for this tier');
  }
  
  this.cdr.detectChanges();
}

// animateTier(tier: string) {
//   console.log(`Animating Tier ${tier}`);
//   const element = document.getElementById(`tier${tier}`);
//   if (element) {
//     element.classList.add('fade-in');
//     if (tier === 'Three') {
//       const profilePicture = document.getElementById('profilePicture');
//       if (profilePicture) {
//         profilePicture.classList.add('animateBoxShadow');
//         setTimeout(() => profilePicture.classList.remove('animateBoxShadow'), 500);
//       }
//     }
//     localStorage.setItem(`animationTier${tier}`, 'done');
    
//     // Update the corresponding flag
//     switch(tier) {
//       case 'One':
//         this.firstTimeAnimationTierOne = false;
//         break;
//       case 'Two':
//         this.firstTimeAnimationTierTwo = false;
//         break;
//       case 'Three':
//         this.firstTimeAnimationTierThree = false;
//         break;
//     }
//   }
// }

// animateTier(tier: string) {
//   console.log(`Animating Tier ${tier}`);
//   const element = document.getElementById(`tier${tier}`);
//   if (element) {
//     element.classList.add('fade-in');
//     if (tier === 'Three') {
//       const profilePicture = document.getElementById('profilePicture');
//       if (profilePicture) {
//         profilePicture.classList.add('animateBoxShadow');
//         setTimeout(() => profilePicture.classList.remove('animateBoxShadow'), 500);
//       }
//     }
//     localStorage.setItem(`animationTier${tier}`, 'done');
    
//     // Update the corresponding flag
//     switch(tier) {
//       case 'One':
//         this.firstTimeAnimationTierOne = false;
//         break;
//       case 'Two':
//         this.firstTimeAnimationTierTwo = false;
//         break;
//       case 'Three':
//         this.firstTimeAnimationTierThree = false;
//         break;
//     }
//   }
// }

// animateTier(tier: string) {
//   console.log(`Animating Tier ${tier}`);
//   const element = document.getElementById(`tier${tier}`);
//   if (element) {
//     element.classList.add('fade-in');
//     if (tier === 'Three') {
//       const profilePicture = document.getElementById('profilePicture');
//       if (profilePicture && this.currentUser.tier === 'All In') {
//         profilePicture.classList.add('animateBoxShadow');
//         setTimeout(() => profilePicture.classList.remove('animateBoxShadow'), 500);
//       }
//     }
//     localStorage.setItem(`animationTier${tier}`, 'done');
    
//     switch(tier) {
//       case 'One':
//         this.firstTimeAnimationTierOne = false;
//         break;
//       case 'Two':
//         this.firstTimeAnimationTierTwo = false;
//         break;
//       case 'Three':
//         this.firstTimeAnimationTierThree = false;
//         break;
//     }
//   }
// }

// animateTier(tier: string) {
//   console.log(`Animating Tier ${tier}`);
//   const elementId = `tier${tier}`;
//   const element = document.getElementById(elementId);
//   if (element) {
//     element.classList.remove('fade-in');
//     void element.offsetWidth; // Trigger a reflow
//     element.classList.add('fade-in');
    
//     if (tier === 'Three') {
//       const profilePicture = document.getElementById('profilePicture');
//       if (profilePicture && this.currentUser.tier === 'All In') {
//         profilePicture.classList.remove('animateBoxShadow');
//         void profilePicture.offsetWidth; // Trigger a reflow
//         profilePicture.classList.add('animateBoxShadow');
//         setTimeout(() => profilePicture.classList.remove('animateBoxShadow'), 500);
//       }
//     }
    
//     this.lastAnimatedTier = this.currentUser.tier;
//     localStorage.setItem('lastAnimatedTier', this.currentUser.tier);
    
//     switch(tier) {
//       case 'One':
//         this.firstTimeAnimationTierOne = false;
//         break;
//       case 'Two':
//         this.firstTimeAnimationTierTwo = false;
//         break;
//       case 'Three':
//         this.firstTimeAnimationTierThree = false;
//         break;
//     }
//   } else {
//     console.log(`Element for Tier ${tier} not found`);
//   }
// }

animateTier(tier: string) {
  console.log(`Animating Tier ${tier}`);
  const elementId = `tier${tier}`;
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove('fade-in');
    void element.offsetWidth; // Trigger a reflow
    element.classList.add('fade-in');
    
    if (tier === 'Three') {
      const profilePicture = document.getElementById('profilePicture');
      if (profilePicture && this.currentUser.tier === 'All In') {
        profilePicture.classList.remove('animateBoxShadow');
        void profilePicture.offsetWidth; // Trigger a reflow
        profilePicture.classList.add('animateBoxShadow');
        setTimeout(() => profilePicture.classList.remove('animateBoxShadow'), 500);
      }
    }
    
    if (this.currentUser.tier) {
      this.lastAnimatedTier = this.currentUser.tier;
      localStorage.setItem('lastAnimatedTier', this.currentUser.tier);
    } else {
      this.lastAnimatedTier = null;
      localStorage.removeItem('lastAnimatedTier');
    }
    
    switch(tier) {
      case 'One':
        this.firstTimeAnimationTierOne = false;
        break;
      case 'Two':
        this.firstTimeAnimationTierTwo = false;
        break;
      case 'Three':
        this.firstTimeAnimationTierThree = false;
        break;
    }
  } else {
    console.log(`Element for Tier ${tier} not found`);
  }
}

updateTierFlags(): void {
  this.tierOne = this.currentUser.tier === 'Just Looking';
  this.tierTwo = this.currentUser.tier === 'Motivated';
  this.tierThree = this.currentUser.tier === 'All In';
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
        // this.loadProfile();
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

  // logOut() {
  //   this.cartService.clearCart();
  //   this.userService.logoutUser();
  //   this.UpdateStatus();
  //   this.router.navigate(['/home']);
  //   this.resetAnimationFlags();
  //   localStorage.removeItem('currentTier');
  // }

  logOut() {
    this.cartService.clearCart();
    this.userService.logoutUser();
    this.resetAnimationFlags();
    localStorage.removeItem('currentTier');
    localStorage.removeItem('lastAnimatedTier');
    this.UpdateStatus();
    this.router.navigate(['/home']);
  }

  // resetAnimationFlags() {
  //   localStorage.removeItem('hasVisitedProfileBeforeTierOne');
  //   localStorage.removeItem('hasVisitedProfileBeforeTierTwo');
  //   localStorage.removeItem('hasVisitedProfileBeforeTierThree');
  //   this.firstTimeAnimationTierOne = true;
  //   this.firstTimeAnimationTierTwo = true;
  //   this.firstTimeAnimationTierThree = true;
  // }

  editProfile() {
    if (this.currentState === ProfileState.EditingProfile) {
      // Save the profile
      this.userService.updateUser(this.currentUser).subscribe(() => {
        this.currentState = ProfileState.Viewing;
        this.reloadProfile();
        // this.loadProfile();
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
    // this.loadProfile();
    this.stepForm.clearValidators();
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.passwordGroup.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (passwordControl?.hasError('pattern')) {
      return 'Invalid';
    }
    return 'Invalid confirm password';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.passwordGroup.get('confirmPassword');
    if (confirmPasswordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (confirmPasswordControl?.hasError('pattern')) {
      return 'Invalid';
    }
    return 'Invalid confirm password';
  }

  // updateTierFlags(): void {
  //   this.tierOne = this.currentUser.tier === 'Just Looking';
  //   this.tierTwo = this.currentUser.tier === 'Motivated';
  //   this.tierThree = this.currentUser.tier === 'All In';
  // }

  // updateTierFlags(): void {
  //   const previousTier = this.tierOne ? 'Just Looking' : (this.tierTwo ? 'Motivated' : 'All In');
  //   this.tierOne = this.currentUser.tier === 'Just Looking';
  //   this.tierTwo = this.currentUser.tier === 'Motivated';
  //   this.tierThree = this.currentUser.tier === 'All In';
  //   if (previousTier !== this.currentUser.tier) {
  //     this.firstTimeAnimation = true;
  //   }
  // }
}

  // initializeAnimationFlags(): void {
  //   console.log('Initializing animation flags');
  //   this.firstTimeAnimationTierOne = localStorage.getItem('hasVisitedTierOne') !== 'true';
  //   this.firstTimeAnimationTierTwo = localStorage.getItem('hasVisitedTierTwo') !== 'true';
  //   this.firstTimeAnimationTierThree = localStorage.getItem('hasVisitedTierThree') !== 'true';
  //   console.log('Animation flags:', {
  //     tierOne: this.firstTimeAnimationTierOne,
  //     tierTwo: this.firstTimeAnimationTierTwo,
  //     tierThree: this.firstTimeAnimationTierThree
  //   });
  // }

//   resetAnimationFlags(): void {
//     console.log('Resetting animation flags');
//     localStorage.removeItem('hasVisitedTierOne');
//     localStorage.removeItem('hasVisitedTierTwo');
//     localStorage.removeItem('hasVisitedTierThree');
//     this.firstTimeAnimationTierOne = true;
//     this.firstTimeAnimationTierTwo = true;
//     this.firstTimeAnimationTierThree = true;
//   }
// }

/*lets make a simpler solution instead of adding more methods. Lets do this:when the user for example is in tierThree we set one  
firstTimeAnimation flag not three to true, and localStorage.setItem({currentTier: currentUser.tier{) Then when upgrading or downgrading
we check in the loadProfile method, if (currentUser.tier === localStorage.setItem({currentTier: currentUser.tier{) if not trigger animations once, then set 
firstTimeAnimation to true in the triggerAnimation method. If this is not a safe method make it better and safer. Or complete the solution*/
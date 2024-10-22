import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash, faAngleDown, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, filter, fromEvent, of, Subject, Subscription, switchMap, takeUntil, tap } from 'rxjs';
import { passwordMatchValidator } from 'src/app/shared/Multi-Step-Form/form/form.service';
import { HttpClient } from '@angular/common/http';
import { profile } from 'console';

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


  @ViewChild('container', { static: false }) container!: ElementRef<HTMLElement>;
  
  @ViewChild('profileImg', { static: false, read: ElementRef }) profileImg!: ElementRef<HTMLElement>;

  private subscriptions: Subscription = new Subscription();

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
  isDragged: boolean = false;

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
  isInClicked = false;
  isOutClicked = false;
  isResetClicked = false;
  // isClicked = false;
  // firstTimeAnimationTierOne: boolean = true;
  // firstTimeAnimationTierTwo: boolean = true;
  // firstTimeAnimationTierThree: boolean = true;
  // currentTier: string = '';
  // lastAnimatedTier: string | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup; 

  // private initialPosition = { x: 0, y: 0 };
  position: { x: number, y: number } = { x: 0, y: 0 };
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  zoomLevel: number = 1;
  minZoom: number = 1;
  maxZoom: number = 2;
  zoomStep: number = 0.1;

  private moveListener!: () => void;
  private upListener!: () => void;
  private touchMoveListener!: () => void;
  private touchEndListener!: () => void;


  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faAngleDown = faAngleDown;
  faPlus = faPlus;
  faMinus = faMinus;

  private subscription: Subscription = new Subscription();


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
    private http: HttpClient,
    private ngZone : NgZone
  ) {
    // this.startDrag = this.startDrag.bind(this);
    // this.drag = this.drag.bind(this);
    // this.endDrag = this.endDrag.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.drag = this.drag.bind(this);
    this.endDrag = this.endDrag.bind(this);

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

    // if (!this.currentUser.profilePictureSettings) {
    //   this.currentUser.profilePictureSettings = {
    //     zoom: 1,
    //     x: 0,
    //     y: 0
    //   };
    // }

   


  
    console.log("Profile picture settings" + this.currentUser.profilePictureSettings);
    
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

    console.log('ngOnInit called');
    this.loadProfile();

    // console.log('this.profileImg.nativeElement:', this.profileImg.nativeElement);


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
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/)]],
      dateOfBirth: ['',[]],
      gender: ['', []],
      weight: ['', []],
      height: ['', []],
      goals: ['', []],
      imgUrl: ['', []],
      profilePictureSettings: ['', []],
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

    // setTimeout(() => {
    //   if (this.container && this.profileImg) {
    //     this.setupDragListeners();
    //     this.loadSavedPosition();
    //   } else {
    //     console.error('Container or profile image not found');
    //   }
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

    // Check if the imgUrl field has changed
    this.profileForm.get('imgUrl')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.cdr.detectChanges();
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
    // this.setupDragListeners();
    // this.loadSavedPosition();
    // this.profileForm.get('profilePictureSettings')?.value.subscribe((value: any) => {
    //   console.log('profilePictureSettings:', value);
    // });

    console.log('Profile image element:', this.profileImg);
    setTimeout(() => {
      this.setupDragListeners();
      this.initializeDragging();
      this.updateImageTransform();
      this.cdr.detectChanges();
    }, 0);

    if (this.profileImg && this.profileImg.nativeElement) {
      this.renderer.setStyle(this.profileImg.nativeElement, 'background-size', 'cover');
      this.renderer.setStyle(this.profileImg.nativeElement, 'background-repeat', 'no-repeat');
      // Set an initial size larger than the visible area
      this.renderer.setStyle(this.profileImg.nativeElement, 'width', '400px');
      this.renderer.setStyle(this.profileImg.nativeElement, 'height', '400px');
      console.log('Initial styles set for profile image');
    }
  }

  ngOnDestroy(): void {
    // Cleanup any remaining event listeners to prevent memory leaks
    // this.removeEventListeners();
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
    this.subscriptions.unsubscribe();
    const profileDiv = this.profileImg?.nativeElement;
    if (profileDiv) {
      profileDiv.removeEventListener('mousedown', this.startDrag);
      profileDiv.removeEventListener('touchstart', this.startDrag);
    }
    document.removeEventListener('mousemove', this.drag);
    document.removeEventListener('touchmove', this.drag);
    document.removeEventListener('mouseup', this.endDrag);
    document.removeEventListener('touchend', this.endDrag);
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
  
  // toggleIconColor(button: string) {
  //   if (button === 'minus') {
  //     this.isOutClicked = !this.isOutClicked;
  //     const minusIcon = document.querySelector('.zoomOut');
      
  //     if (this.isOutClicked) {
  //       minusIcon?.classList.add('clicked');
  //     }
  
  //     setTimeout(() => {
  //       minusIcon?.classList.remove('clicked');
  //       this.isOutClicked = false;
  //     }, 50); // Adjust the delay as needed
  //   } else {
  //     this.isInClicked = !this.isInClicked;
  //     const plusIcon = document.querySelector('.zoomIn');
      
  //     if (this.isInClicked) {
  //       plusIcon?.classList.add('clicked');
  //     }
  
  //     setTimeout(() => {
  //       plusIcon?.classList.remove('clicked');
  //       this.isInClicked = false;
  //     }, 50); // Adjust the delay as needed
  //   }
  // }

  // onMouseDown(button: string) {
  
  //   if (button === 'minus') {
  //     this.isOutClicked = true;
  //     const minusIcon = document.querySelector('.zoomOut');
  //     minusIcon?.classList.add('clicked');
  //   } else if (button === 'plus') {
  //     this.isInClicked = true;
  //     const plusIcon = document.querySelector('.zoomIn');
  //     plusIcon?.classList.add('clicked');
  //   }
    
  // }
  

  // onMouseUp(button: string) {
    
  //   if (button === 'minus') {
  //     this.isOutClicked = false;
  //     const minusIcon = document.querySelector('.zoomOut');
  //     minusIcon?.classList.remove('clicked');
  //   } else if (button === 'plus') {
  //     this.isInClicked = false;
  //     const plusIcon = document.querySelector('.zoomIn');
  //     plusIcon?.classList.remove('clicked');
  //   }

  // }

  onMouseDown(button: string) {
    if (button === 'minus') {
      this.isOutClicked = true;
      const minusIcon = document.querySelector('.zoomOut');
      minusIcon?.classList.add('clicked');
    } else if (button === 'plus') {
      this.isInClicked = true;
      const plusIcon = document.querySelector('.zoomIn');
      plusIcon?.classList.add('clicked');
    } else if (button === 'reset') {
      this.isResetClicked = true;
    const reset = document.querySelector('.reset');
    reset?.classList.add('clicked');
    }
  }
  
  onMouseUp(button: string) {
    this.resetButtonState(button);
  }
  
  onMouseLeave(button: string) {
    this.resetButtonState(button);
  }
  
  resetButtonState(button: string) {
    if (button === 'minus') {
      this.isOutClicked = false;
      const minusIcon = document.querySelector('.zoomOut');
      minusIcon?.classList.remove('clicked');
    } else if (button === 'plus') {
      this.isInClicked = false;
      const plusIcon = document.querySelector('.zoomIn');
      plusIcon?.classList.remove('clicked');
    } else if (button === 'reset') {
      this.isResetClicked = false;
      const reset = document.querySelector('.reset');
      reset?.classList.remove('clicked');
    }
  }

  private initializeDragging() {
    if (this.container && this.profileImg) {
      console.log('Container and profile image found, initializing dragging');
      this.setupDragListeners();
      // this.loadSavedPosition();
    }
  }

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
        console.log('User data received:', user);
        this.currentUser = {
          ...user,
          paymentFrequency: user.billing
        };
        // this.stepForm.patchValue({
        //   name: this.currentUser.name,
        //   email: this.currentUser.email,
        //   // ... other fields if necessary
        // });
  
        // if (this.currentUser.profilePictureSettings) {
        //   this.position.x = this.currentUser.profilePictureSettings.x;
        //   this.position.y = this.currentUser.profilePictureSettings.y;
        //   this.zoomLevel = this.currentUser.profilePictureSettings.zoom;
        //   this.updateImageTransform(); // Apply the saved settings
        // }
        if (typeof this.currentUser.profilePictureSettings === 'string') {
          try {
            this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
          } catch (e) {
            console.error('Error parsing profilePictureSettings:', e);
            this.currentUser.profilePictureSettings = null;
          }
        }

        if (this.currentUser.profilePictureSettings) {
          this.position = {
            x: this.currentUser.profilePictureSettings.x || 0,
            y: this.currentUser.profilePictureSettings.y || 0
          };
          this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
          this.isDragged = this.position.x !== 0 || this.position.y !== 0;
          
          // Apply the saved settings immediately
          // this.updateImageTransform();
        } else {
          this.resetImagePositionAndZoom();
        } 

      console.log('Profile loaded:', this.currentUser);
      console.log('Profile picture settings:', this.currentUser.profilePictureSettings);
      
      // Load saved position and zoom level
      // if (!this.currentUser.profilePictureSettings) {
      //   this.currentUser.profilePictureSettings = {
      //     zoom: 1,
      //     x: 0,
      //     y: 0
      //   };
      // }

      // this.position = {
      //   x: this.currentUser.profilePictureSettings.x,
      //   y: this.currentUser.profilePictureSettings.y
      // };
      // this.zoomLevel = this.currentUser.profilePictureSettings.zoom;
      // this.isDragged = this.position.x !== 0 || this.position.y !== 0;


        // Update the validation status of the controls
        this.profileForm.patchValue({
          name: this.currentUser.name,
          email: this.currentUser.email,
          dateOfBirth: this.currentUser.dateOfBirth,
          gender: this.currentUser.gender,
          weight: this.currentUser.weight,
          height: this.currentUser.height,
          goals: this.currentUser.goals,
          imgUrl: this.currentUser.imgUrl || '',
          profilePictureSettings: this.currentUser.profilePictureSettings,
          isGoogleAuth: this.currentUser.isGoogleAuth
        });

        this.pictureForm.patchValue({
          imgUrl: this.currentUser.imgUrl || '',
          profilePictureSettings: this.currentUser.profilePictureSettings
        }, { emitEvent: false });

        if (this.currentUser.isGoogleAuth) {
          this.profileForm.get('email')?.disable();
          this.passwordForm.get('oldPassword')?.disable();
          this.passwordForm.get('passwordGroup')?.disable();
        } else {
          this.profileForm.get('email')?.enable();
        }

        // console.log(`goals ${this.currentUser.goals}`);

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

        this.updateImageTransform();
        this.cdr.detectChanges();
         
      },
      (error) => {
        console.error('Error loading user profile:', error);
        this.loadingComplete = true;
        this.imageLoaded = true; // Consider image loaded in case of error
        this.cdr.detectChanges();
      }
    );
  }

  // loadSavedPositionAndZoom() {
  //   this.userService.getProfilePictureSettings(this.userId).subscribe(
  //     settings => {
  //       if (settings) {
  //         this.position = settings.position || { x: 0, y: 0 };
  //         this.zoomLevel = settings.zoomLevel || 1;
  //         this.isDragged = this.position.x !== 0 || this.position.y !== 0;
  //       }
  //       this.updateImageTransform();
  //       this.cdr.detectChanges();
  //     },
  //     error => {
  //       console.error('Error loading position and zoom settings:', error);
  //       this.resetImagePositionAndZoom();
  //     }
  //   );
  // }

  isEmailDisabled(): boolean {
    return this.profileForm.get('isGoogleAuth')?.value === true;
  }

  updateFormWithUserData(): void {
    // console.log('Updating form with user data' + this.currentUser.email);
    this.profileForm.patchValue({
      name: this.currentUser.name,
      email: this.currentUser.email,
      dateOfBirth: this.currentUser.dateOfBirth,
      gender: this.currentUser.gender,
      weight: this.currentUser.weight,
      height: this.currentUser.height,
      goals: this.currentUser.goals,
      imgUrl: this.currentUser.imgUrl || '',
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
          paymentFrequency: user.billing,
          imgUrl: user.imgUrl || undefined,
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
          profilePictureSettings: this.currentUser.profilePictureSettings,
          imgUrl: this.currentUser.imgUrl || '',
        }, { emitEvent: false });

        this.pictureForm.patchValue({
          imgUrl: this.currentUser.imgUrl || '',
          profilePictureSettings: this.currentUser.profilePictureSettings
        }, { emitEvent: false });

        this.updateFormWithUserData();

        // Reset position and zoom to saved settings
        if (typeof this.currentUser.profilePictureSettings === 'string') {
          try {
            this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
          } catch (e) {
            console.error('Error parsing profilePictureSettings:', e);
            this.currentUser.profilePictureSettings = null;
          }
        }

        if (this.currentUser.profilePictureSettings) {
          this.position = {
            x: this.currentUser.profilePictureSettings.x || 0,
            y: this.currentUser.profilePictureSettings.y || 0
          };
          this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
          this.isDragged = this.position.x !== 0 || this.position.y !== 0;
        } else {
          this.position = { x: 0, y: 0 };
          this.zoomLevel = 1;
          this.isDragged = false;
        }

        // Update the image transform
        this.updateImageTransform();
        this.cdr.detectChanges();

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
    const newImgUrl = this.pictureForm.get('imgUrl')?.value;
    this.currentUser.imgUrl = newImgUrl === '' ? null : newImgUrl;
    // this.currentUser.profilePictureSettings = {
    //   zoom: this.zoomLevel,
    //   x: this.position.x,
    //   y: this.position.y
    // };

    const updatedUser = { 
      ...this.currentUser, 
      imgUrl: this.currentUser.imgUrl, 
      profilePictureSettings: {
        zoom: this.zoomLevel,
        x: this.position.x,
        y: this.position.y
      }
    };
    this.userService.updateUser(this.currentUser).subscribe(
      (response) => {
        // this.currentState = ProfileState.Viewing;
        // this.profileForm.patchValue({ imgUrl: this.currentUser.imgUrl });
        // this.cdr.detectChanges();
        // this.reloadProfile();
        console.log('Profile picture updated successfully', response);
        this.currentUser = { ...this.currentUser, ...response };

        // Ensure profilePictureSettings are not overwritten if they come back as null
        if (this.currentUser.profilePictureSettings === null) {
          this.currentUser.profilePictureSettings = updatedUser.profilePictureSettings;
        }

        this.currentState = ProfileState.Viewing;
        this.profileForm.patchValue({ imgUrl: this.currentUser.imgUrl || '',
          profilePictureSettings: this.currentUser.profilePictureSettings
        });
        this.pictureForm.patchValue({ imgUrl: this.currentUser.imgUrl || '',
          profilePictureSettings: this.currentUser.profilePictureSettings
        });
        
        // Reset position and zoom after saving
        // this.resetImagePositionAndZoom();
        
        this.updateImageTransform();
        this.cdr.detectChanges();
        // this.reloadProfile();

        
      },
      error => {
        console.error('Error updating profile picture:', error);
        // Handle error (e.g., show error message)
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
      setInterval(() => {
        this.loadingComplete = true;
        this.cdr.detectChanges();
      }, 500)
    }
  }


saveProfile() {
  if (this.isFormValid('profile')) {
    console.log('Saving profile...');
    const formValue = this.profileForm.getRawValue();

     // Explicitly handle empty image URL
     if (formValue.imgUrl === '') {
      formValue.imgUrl = null;  // or undefined, depending on your backend expectations
    }

    const updatedUser = {
      ...this.currentUser,
      ...formValue,
      profilePictureSettings: {
        zoom: this.zoomLevel,
        x: this.position.x,
        y: this.position.y
      }
    };

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
        this.currentUser = { ...this.currentUser, ...response };

        // Ensure profilePictureSettings are not overwritten if they come back as null
        if (this.currentUser.profilePictureSettings === null) {
          this.currentUser.profilePictureSettings = updatedUser.profilePictureSettings;
        }

        // Update the form with the latest data from the server
        this.profileForm.patchValue(this.currentUser, { emitEvent: false });

        this.currentState = ProfileState.Viewing;
        this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
        this.updateImageTransform();
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

// resetImage() {
//   this.currentUser.imgUrl = '';
//   this.profileForm.patchValue({
//     imgUrl: ''
//   });
//   this.position = { x: 0, y: 0 };
//   this.isDragged = false;
//   this.cdr.detectChanges();
// }

resetImage() {
  // this.position = { x: 0, y: 0 };
  this.resetImagePositionAndZoom();
  // this.isDragged = false;
  this.profileForm.patchValue({ imgUrl: null }); 
  this.pictureForm.patchValue({ imgUrl: null });
  this.currentUser.imgUrl = null;
  this.cdr.detectChanges();
}

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

  private UpdateStatus(): void {
    this.subscription.add(
      this.userService.isloggedIn().subscribe(isLoggedIn => {
        this.userIsLoggedIn = isLoggedIn;
        if (isLoggedIn) {
          this.UserId = this.userService.getUserId() ?? '';
        } else {
          this.UserId = '';
        }
        // You may want to perform additional actions here based on the login state
      })
    );
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
    console.log('Entered edit mode, currentState:', this.currentState);
  }


  onImageUrlInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.trim();
    this.profileForm.patchValue({ imgUrl: newValue });
    this.pictureForm.patchValue({ imgUrl: newValue });
    this.currentUser.imgUrl = newValue === '' ? null : newValue; // Use null for empty string
    this.cdr.detectChanges();

    this.resetImagePositionAndZoom();

    this.cdr.detectChanges();
  
    // Update the UI to reflect the change immediately
    if (newValue === '') {
      this.resetImage();
    } else {
      this.preloadImage(newValue);
    }
  }

  syncFormWithCurrentUser(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    this.formSubscription = this.profileForm.valueChanges.subscribe(formValue => {
      this.currentUser = { ...this.currentUser, ...formValue };
    });

    this.profileForm.patchValue({
      imgUrl: this.currentUser.imgUrl || ''
    });
    this.cdr.detectChanges();
  }

  // changePicture() {
  //   this.currentState = ProfileState.ChangingPicture;
  //   console.log('Entered change picture mode, currentState:', this.currentState);
  //   // this.syncFormWithCurrentUser();
  // }

  changePicture() {
    this.currentState = ProfileState.ChangingPicture;
    console.log('Entered change picture mode:', {
      currentState: this.currentState,
      stateName: ProfileState[this.currentState],
      canDrag: this.canDrag()
    });
    // this.syncFormWithCurrentUser();
  }

  changePassword() {
    this.currentState = ProfileState.ChangingPassword;
    this.resetPasswordForm();
  }

  deleteProfile() {
    this.currentState = ProfileState.DeletingProfile;
    this.classAppliedDeleteProfile = true;
  }

  cancelAction(): void {
    // if (event) {
    //   event.stopPropagation();
    // }
    
    if (this.isProcessingGoodbye) return;
    
    this.currentState = ProfileState.Viewing;
  
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

    // Reset profile form
    this.profileForm.reset();
  
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

    // Reset image position and zoom to saved settings
    this.resetImagePositionAndZoomToSaved();
  
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

  isImageUrlFilled(): boolean {
    const imgUrlControl = this.profileForm.get('imgUrl');
    const formValue = imgUrlControl?.value?.trim();
    const isFilled = !!formValue;
    // console.log('Image URL filled:', isFilled, 'Form value:', formValue);
    return isFilled;
  }

  setupDragListeners() {
    console.log('setupDragListeners called');
    if (!this.isImageUrlFilled()) {
      console.log('No image URL, not setting up drag listeners');
      return;
    }
  
    const profileDiv = this.profileImg!.nativeElement;
  
    console.log('Set up drag listeners');
  
    profileDiv.addEventListener('mousedown', (event) => this.startDrag(event));
    profileDiv.addEventListener('touchstart', (event) => this.startDrag(event));
  
    console.log('Drag listeners set up');
  }

  canDrag(): boolean {
    const isEditing = this.currentState === ProfileState.EditingProfile ||
    this.currentState === ProfileState.ChangingPicture;
    const isImageFilled = this.isImageUrlFilled();
    const isProfileImgReady = !!this.profileImg?.nativeElement;
    return isEditing && isImageFilled && isProfileImgReady;
  }


  startDrag(event: MouseEvent | TouchEvent) {
    console.log('startDrag called');
    if (!this.canDrag()) {
      console.log('Cannot drag');
      return;
    }
    
    this.isDragging = true;
    this.isDragged = true;
  
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    
    // Adjust here to account for the current position
    this.startX = clientX - this.position.x;
    this.startY = clientY - this.position.y;

    console.log('Start drag', {
      clientX,
      clientY,
      startX: this.startX,
      startY: this.startY,
      isDragging: this.isDragging
    });

    // Store the initial mouse coordinates
    // this.startX = clientX;
    // this.startY = clientY;
    
    // // Store the initial position of the image
    // this.initialPosition = { ...this.position };
  
    console.log('Start drag', { clientX, clientY, startX: this.startX, startY: this.startY, isDragging: this.isDragging });
  
    // Atttach event listeners
    this.moveListener = this.renderer.listen('document', 'mousemove', (e) => this.drag(e));
    this.upListener = this.renderer.listen('document', 'mouseup', (e) => this.endDrag(e));
    this.touchMoveListener = this.renderer.listen('document', 'touchmove', (e) => this.drag(e));
    this.touchEndListener = this.renderer.listen('document', 'touchend', (e) => this.endDrag(e));

  
    event.preventDefault();
    event.stopPropagation();
  }


  drag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.canDrag()) {
      return;
    }
  
    console.log('drag called', { isDragging: this.isDragging, canDrag: this.canDrag() });
    console.log('this.profileImg:', this.profileImg);
  
    this.ngZone.run(() => {
      const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
      // Calculate new position based on the initial offset
      const newX = clientX - this.startX;
      const newY = clientY - this.startY;
  
      // Get dimensions
      const imgRect = this.profileImg.nativeElement.getBoundingClientRect();
      const containerRect = this.profileImg.nativeElement.parentElement!.getBoundingClientRect();
  
      // Calculate maximum allowed movement
      const maxX = imgRect.width - containerRect.width;
      const maxY = imgRect.height - containerRect.height;
  
      // Adjust constraints to allow negative movement
      const constrainedX = Math.min(Math.max(newX, -maxX), 0);
      const constrainedY = Math.min(Math.max(newY, -maxY), 0);
  
      console.log('imgRect:', imgRect);
      console.log('containerRect:', containerRect);
      console.log('maxX:', maxX, 'maxY:', maxY);
      console.log('newX:', newX, 'newY:', newY);
      console.log('constrainedX:', constrainedX, 'constrainedY:', constrainedY);
  
      this.position = { x: newX, y: newY };
      console.log('About to call updateImagePosition', this.position);
  
      // Update image position
      this.updateImageTransform();
  
      event.preventDefault();
      event.stopPropagation();
    });
  }

  // drag(event: MouseEvent | TouchEvent) {
  //   if (!this.isDragging || !this.canDrag()) {
  //     return;
  //   }
  
  //   const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  //   const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
  //   // Calculate new position based on the initial offset
  //   const deltaX = clientX - this.startX;
  //   const deltaY = clientY - this.startY;
  
  //   // Get dimensions
  //   const containerRect = this.container.nativeElement.getBoundingClientRect();
  //   const imgWidth = containerRect.width * this.zoomLevel;
  //   const imgHeight = containerRect.height * this.zoomLevel;
  
  //   // Calculate percentages
  //   const percentX = (deltaX / (imgWidth - containerRect.width)) * 100;
  //   const percentY = (deltaY / (imgHeight - containerRect.height)) * 100;
  
  //   // Clamp the values to prevent overflow
  //   this.position = {
  //     x: Math.max(Math.min(percentX, 0), -100),
  //     y: Math.max(Math.min(percentY, 0), -100)
  //   };
  
  //   // Update image position
  //   this.updateImageTransform();
  
  //   event.preventDefault();
  //   event.stopPropagation();
  // }

  endDrag(event: MouseEvent | TouchEvent) {
    console.log('endDrag called');
    if (this.isDragging && this.canDrag()) {
      this.updateImageTransform();
      // this.savePositionAndZoom();
    }
    
    this.isDragging = false;
  
    // Remove event listeners
    // document.removeEventListener('mousemove', this.drag);
    // document.removeEventListener('mouseup', this.endDrag);
    // document.removeEventListener('touchmove', this.drag);
    // document.removeEventListener('touchend', this.endDrag);
    if (this.moveListener) this.moveListener();
    if (this.upListener) this.upListener();
    if (this.touchMoveListener) this.touchMoveListener();
    if (this.touchEndListener) this.touchEndListener();
  
    event.preventDefault();
    event.stopPropagation();
  }

  resetImagePositionAndZoom() {
    this.position = { x: 0, y: 0 };
    this.zoomLevel = 1;
    this.isDragged = false;
    this.updateImageTransform();
    this.cdr.detectChanges();
  }

  resetImagePositionAndZoomToSaved() {
    if (this.currentUser.profilePictureSettings) {
      this.position = {
        x: this.currentUser.profilePictureSettings.x || 0,
        y: this.currentUser.profilePictureSettings.y || 0
      };
      this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
    } else {
      this.position = { x: 0, y: 0 };
      this.zoomLevel = 1;
    }
    this.isDragged = this.position.x !== 0 || this.position.y !== 0;
    this.updateImageTransform();
    this.cdr.detectChanges();
  }
  

  // savePosition() {
  //   this.userService.saveProfilePicturePosition(this.userId, this.position).subscribe(
  //     response => console.log('Position saved successfully'),
  //     error => console.error('Error saving position', error)
  //   );
  // }

  savePositionAndZoom() {
    const updatedUser = {
      ...this.currentUser,
      profilePictureSettings: {
        zoom: this.zoomLevel,
        x: this.position.x,
        y: this.position.y
      }
    };
  
    this.userService.updateUser(updatedUser).subscribe(
      response => {
        console.log('Position and zoom saved successfully');
        this.currentUser = { ...this.currentUser, ...response };
      },
      error => console.error('Error saving position and zoom', error)
    );
  }

updateImageTransform() {
  // if (this.profileImg && this.profileImg.nativeElement) {
  //   const imgElement = this.profileImg.nativeElement;
  //   const backgroundPosition = `${this.position.x}px ${this.position.y}px`;
  //   const backgroundSize = `${this.zoomLevel * 100}%`;
  //   this.renderer.setStyle(imgElement, 'background-position', backgroundPosition);
  //   this.renderer.setStyle(imgElement, 'background-size', backgroundSize);
  if (this.profileImg && this.profileImg.nativeElement) {
    const imgElement = this.profileImg.nativeElement;
    const styles = this.getProfileImageStyles();
    Object.keys(styles).forEach(key => {
      this.renderer.setStyle(imgElement, key, styles[key]);
    });
  
    // Update the current user's profilePictureSettings
    if (this.currentUser) {
      this.currentUser.profilePictureSettings = {
        zoom: this.zoomLevel,
        x: this.position.x,
        y: this.position.y
      };
    }
    console.log('Image transform updated:', { position: this.position, zoom: this.zoomLevel });
    this.cdr.detectChanges();
  }
}

// getProfileImageStyles(): any{

//   console.log('getProfileImageStyles called' + this.currentUser.profilePictureSettings?.x + this.currentUser.profilePictureSettings?.y + this.currentUser.profilePictureSettings?.zoom);

//   return {
//     'background-image': this.currentUser.imgUrl ? `url(${this.currentUser.imgUrl})` : 'none',
//     'background-position': `${this.position.x || this.currentUser.profilePictureSettings?.x}px ${this.position.y || this.currentUser.profilePictureSettings?.y}px`,
//     'background-repeat': 'no-repeat',
//     'background-size': `${this.zoomLevel * 100}%`
//   }
// }

getProfileImageStyles(): any {
  let settings = this.currentUser.profilePictureSettings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      console.error('Error parsing profilePictureSettings:', e);
      settings = null;
    }
  }

  console.log('getProfileImageStyles called', {
    x: this.position.x,
    y: this.position.y,
    zoom: this.zoomLevel,
    settings: this.currentUser.profilePictureSettings
  });

  const x = this.position.x ?? settings?.x ?? 0;
  const y = this.position.y ?? settings?.y ?? 0;
  const zoom = this.zoomLevel ?? settings?.zoom ?? 1;

  // console.log("X is " + x);

  // return {
  //   'background-image': this.currentUser.imgUrl ? `url(${this.currentUser.imgUrl})` : 'none',
  //   'background-position': `${x}px ${y}px`,
  //   'background-repeat': 'no-repeat',
  //   'background-size': `${zoom * 100}%`
  // }

  return {
    'background-image': this.currentUser.imgUrl ? `url(${this.currentUser.imgUrl})` : 'none',
    'background-position': `${x}% ${y}%`,
    'background-repeat': 'no-repeat',
    'background-size': `${zoom * 100}%`
  };
}

zoomIn() {
  if (this.zoomLevel < this.maxZoom) {
    this.zoomLevel += this.zoomStep;
    this.updateImageTransform();
  }
}

// Method to handle zoom out
zoomOut() {
  if (this.zoomLevel > this.minZoom) {
    this.zoomLevel -= this.zoomStep;
    this.updateImageTransform();
  }
}

  // loadSavedPosition() {
  //   if (this.isImageUrlFilled()) {
  //   this.userService.getProfilePicturePosition(this.userId).subscribe(
  //     position => {
  //       this.position = position;
  //       this.isDragged = position.x !== 0 || position.y !== 0;
  //       // this.updateImagePosition();
  //       if (this.isDragged) {
  //         const img = this.profileImg.nativeElement;
  //         this.renderer.removeClass(img, 'default-position');
  //       }
  //       this.cdr.detectChanges();
  //     },
  //     error => {
  //       console.error('Error loading position', error);
  //       this.centerImage();
  //       }
  //     );
  //   }
  // }

  // centerImage() {
  //   this.position = { x: 0, y: 0 };
  //   this.isDragged = false;
  //   const img = this.profileImg.nativeElement;
  //   this.renderer.addClass(img, 'default-position');
  //   this.renderer.removeStyle(img, 'transform');
  //   this.cdr.detectChanges();
  // }


}
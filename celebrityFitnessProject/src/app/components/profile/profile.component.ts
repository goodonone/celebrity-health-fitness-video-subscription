import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Renderer2, NgZone, Input } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash, faAngleDown, faPlus, faMinus, faChevronLeft, faChevronRight} from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, filter, finalize, from, fromEvent, of, Subject, Subscription, switchMap, takeUntil, tap } from 'rxjs';
import { passwordMatchValidator } from 'src/app/shared/Multi-Step-Form/form/form.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { profile } from 'console';
import { ref, uploadBytesResumable, getDownloadURL, getStorage, deleteObject } from 'firebase/storage';
import { storage, auth } from 'src/app/firebase.config';
import { signInWithCustomToken } from 'firebase/auth';
import { FirebaseService } from 'src/app/services/firebase.service';
import { StorageService } from 'src/app/services/storage.service';
import { ImageManagementService } from 'src/app/services/imagemanagement.service';
import { ImageUrlManagerService } from 'src/app/services/imageurlmanager.service';

enum ProfileState {
  Viewing,
  EditingProfile,
  ChangingPicture,
  ChangingPassword,
  DeletingProfile
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
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

  private avatarLoaded = new BehaviorSubject<boolean>(false);
  private urlImageLoaded = new BehaviorSubject<boolean>(false);

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
  imageNotFound = false;
  isWaitingToCheck = false;
  isInClicked = false;
  isOutClicked = false;
  isResetClicked = false;
  private isInitialLoad = true;
  isDefaultPosition: boolean = true;
  isUploading = false;
  uploadProgress = 0;
  retryCount: number = 0;
  maxRetries: number = 3;
  retryDelay: number = 1000;
  showImageNavigation = false;
  imageCount = 0;
  isSavingPicture = false;
  private isTyping = false;
  private typingTimeout: any;
  private lastTypedValue = '';
  private readonly TYPING_DEBOUNCE = 500;  // Longer debounce for typing
  private isProcessingUrl = false;
  private lastValidUrl: string | null = null;
  private currentInputValue: string = '';
  private imageLoadedSuccessfully = false;
  stagingImageUrl: string | null = null;
  permanentImageUrl: string | null = null;
  isImageStaged: boolean = false;
  isIconHovered = false;
  hoveredButton: string | null = null;
  rightClicked = false;
  leftClicked = false;

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
  isDragging = false;
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
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  private subscription: Subscription = new Subscription();

  // Handler properties
  keydownHandler: (event: KeyboardEvent) => void;

  private oldPasswordSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private formSubscription: Subscription | null = null;
  private progressSubscription?: Subscription;
  private imageUrlDebouncer = new Subject<string>();
  private stateUpdateDebouncer = new Subject<void>();
  private urlCheckInProgress = false;


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
    private ngZone : NgZone,
    private firebaseService: FirebaseService,
    private storageService: StorageService,
    private imageManagementService: ImageManagementService,
    private imageUrlManager: ImageUrlManagerService,
  ) {


    this.startDrag = this.startDrag.bind(this);
    this.drag = this.drag.bind(this);
    this.endDrag = this.endDrag.bind(this);
    this.initializeLoadingState();

    // Escape key to escape Cancel Subscription State
    this.keydownHandler = (event) => {
      const toggleDiv = document.getElementById('deleteProfile');
      if (event.key === 'Escape' && toggleDiv?.classList.contains('active')) {
        toggleDiv.classList.toggle('active');
        this.currentState = ProfileState.Viewing;
      }
    };

    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.cleanupStagedImage();
    });
  }

  async ngOnInit() {

    // if (!this.currentUser.profilePictureSettings) {
    //   this.currentUser.profilePictureSettings = {
    //     zoom: 1,
    //     x: 0,
    //     y: 0
    //   };
    // }
    

    // ////Remove this later
    // console.log('Auth State on Init:', {
    //   currentAuth: auth.currentUser,
    //   userId: this.userId,
    //   isLoggedIn: await this.userService.isloggedIn().toPromise()
    // });
  
    // auth.onAuthStateChanged((user) => {
    //   console.log('Auth state changed:', {
    //     user: user ? {
    //       uid: user.uid,
    //       email: user.email,
    //       provider: user.providerData[0]?.providerId
    //     } : null,
    //     componentUserId: this.userId
    //   });
    // });

    // /////////

    // Subscribe to upload progress
    this.progressSubscription = this.firebaseService.getUploadProgress().subscribe(
      (progress) => {
        this.ngZone.run(() => {
          this.uploadProgress = progress.progress;
          this.cdr.detectChanges();
        });
      }
    );

    auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.uid}` : 'No user');
      if (!user) {
        // Handle unauthenticated state
        console.error('User not authenticated');
      }
    });

  
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
      dateOfBirth: ['',[Validators.pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/([0-9]{4})$/)]],
      gender: ['', []],
      weight: ['', []],
      height: ['', []],
      goals: ['', []],
      imgUrl: ['', []],
      profilePictureSettings: ['', []],
      isGoogleAuth: [false]
    });

    this.pictureForm = this.fb.group({
      imgUrl: ['', [Validators.required]]
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
    // this.profileForm.get('imgUrl')?.valueChanges.pipe(
    //   debounceTime(300),
    //   distinctUntilChanged()
    // ).subscribe(() => {
    //   this.cdr.detectChanges();
    // });

    // Setup debounced image URL processing
    this.imageUrlDebouncer.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(async (newValue) => {
      this.handleDebouncedUrlChange(newValue);
    });

    // Setup debounced state updates
    this.stateUpdateDebouncer.pipe(
      debounceTime(100),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cdr.detectChanges();
    });

  }

  ngAfterViewInit() {
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

    this.avatarLoaded.complete();
    this.urlImageLoaded.complete();

    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }

    this.firebaseService.cleanupStagedFile(this.userId);
  }

  
///// Page Load Functions & Form Related Functions + Other Related Profile Page Functions /////
  loadProfile() {
    this.isInitialLoad = true;
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
          imgUrl: this.currentUser.imgUrl ? this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) : '',
          profilePictureSettings: this.currentUser.profilePictureSettings,
          isGoogleAuth: this.currentUser.isGoogleAuth
        });

        this.pictureForm.patchValue({
          imgUrl: this.currentUser.imgUrl ? this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) : '',
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


        // if (user.imgUrl) {
        //   this.preloadImage(user.imgUrl);
        // } else {
        //   // If there's no image URL, consider the image "loaded"
        //   this.imageLoaded = true;
        //   this.checkLoadingComplete();
        // }

        // Handle image loading with loading state
        if (user.imgUrl) {
          this.preloadImage(user.imgUrl); // Pass true for initial loading
        } else {
          this.preloadImage(null); // Pass true for initial loading
          this.imageLoaded = true;
          this.checkLoadingComplete();
        }

        // if (user.imgUrl) {
        //   const img = new Image();
        //   img.onload = () => {
        //     this.imageLoaded = true;
        //     this.checkLoadingComplete();
        //   };
        //   img.onerror = () => {
        //     console.error('Error loading image');
        //     this.imageLoaded = true;
        //     this.checkLoadingComplete();
        //   };
        //   img.src = user.imgUrl;
        // } else {
        //   this.imageLoaded = true;
        //   this.checkLoadingComplete();
        // }

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

  reloadProfile() {
    this.isInitialLoad = false;

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
          imgUrl: this.currentUser.imgUrl ? this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) : '',
        }, { emitEvent: false });

        this.pictureForm.patchValue({
          imgUrl: this.currentUser.imgUrl ? this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) : '',
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

  updateFormWithUserData(): void {
    const proxiedUrl = this.currentUser.imgUrl ? 
    this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) : '';

    // console.log('Updating form with user data' + this.currentUser.email);
    this.profileForm.patchValue({
      name: this.currentUser.name,
      email: this.currentUser.email,
      dateOfBirth: this.currentUser.dateOfBirth,
      gender: this.currentUser.gender,
      weight: this.currentUser.weight,
      height: this.currentUser.height,
      goals: this.currentUser.goals,
      imgUrl: proxiedUrl,
      isGoogleAuth: this.currentUser.isGoogleAuth
    });

    this.pictureForm.patchValue({
      imgUrl: proxiedUrl
    });  

    // Update other form controls here

    this.profileForm.get('name')?.updateValueAndValidity();
    this.profileForm.get('email')?.updateValueAndValidity();

    this.cdr.detectChanges();
  }

  isEmailDisabled(): boolean {
    return this.profileForm.get('isGoogleAuth')?.value === true;
  }

  initializePictureForm() {
    this.pictureForm = this.fb.group({
      imgUrl: [this.currentUser.imgUrl]
    });
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

// checkLoadingComplete() {
//   if (this.imageLoaded) {
//     setTimeout(() => {
//       this.loadingComplete = true;
//       this.cdr.detectChanges();
//     }, 500);
//   }
// }
checkLoadingComplete() {
  if (this.imageLoaded) {
    console.log('Images loaded, completing loading state');
    // Add a small delay to ensure UI updates are complete
    setTimeout(() => {
      this.loadingComplete = true;
      this.cdr.detectChanges();
    }, 500);
  } else {
    console.log('Images not yet loaded');
  }
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
  const imageUrl = this.currentUser.imgUrl;

  // this.userService.deleteUser(this.userId).subscribe(() => {
  //   this.router.navigate(['/home']);
  //   this.userService.logoutUser();
  // });
  if (imageUrl) {
    this.userService.deleteOldImage(this.userId, imageUrl).subscribe(
      () => {
        // Continue with profile deletion
        this.userService.deleteUser(this.userId).subscribe(() => {
          this.router.navigate(['/home']);
          this.userService.logoutUser();
        });
      },
      error => {
        console.error('Error deleting image:', error);
        // Decide if you want to continue with profile deletion despite image deletion failure
      }
    );
  } else {
    // No image to delete, proceed with profile deletion
    this.userService.deleteUser(this.userId).subscribe(() => {
      this.router.navigate(['/home']);
      this.userService.logoutUser();
    });
  }
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



//   if (newValue === '') {
//     this.resetImage();
//   } else { // Preload image without affecting loading state
//   const img = new Image();
//   img.onload = () => {
//     this.updateImageTransform();
//     this.cdr.detectChanges();
//   };
//   img.onerror = () => {
//     console.error('Error loading preview image');
//     this.cdr.detectChanges();
//   };
//   img.src = newValue;
// }




// changePicture() {
//   this.currentState = ProfileState.ChangingPicture;
//   console.log('Entered change picture mode, currentState:', this.currentState);
//   // this.syncFormWithCurrentUser();
// }

deleteProfile() {
  this.currentState = ProfileState.DeletingProfile;
  this.classAppliedDeleteProfile = true;
}

async cancelAction(): Promise<void> {
  // if (event) {
  //   event.stopPropagation();
  // }
  // await this.firebaseService.cleanupStagedFile(this.userId);
 

  // Reset image position and zoom to saved settings
  // this.resetImagePositionAndZoomToSaved();

  // // Reload profile data
  // this.reloadProfile();

  
  try {
    // Clean up any staged files
    const userId = this.userService.getUserId();
    if (userId) {
      await this.firebaseService.cleanupStagedFile(userId);
      this.imageUrlManager.clearStagedFile();
    }

     
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
    // Reset state
    this.currentState = ProfileState.Viewing;
    this.resetImagePositionAndZoomToSaved();
    this.reloadProfile();
    // Trigger change detection
    this.cdr.detectChanges();

    this.resetPasswordForm();
  } catch (error) {
    console.error('Error in cancelAction:', error);
  }
}
/*-----------------------------------------------------------------------*/


 
// Listeners for keyboard events to escape Cancel Subscription State
initializeEventListeners(): void {
  document.addEventListener('keydown', this.keydownHandler);
  // document.addEventListener('mousedown', this.mousedownHandler);
}

removeEventListeners(): void {
  document.removeEventListener('keydown', this.keydownHandler);
  // document.removeEventListener('mousedown', this.mousedownHandler);
}
/*-----------------------------------------------------------------------*/


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


///// Trigger animations on First Load /////
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
/*-----------------------------------------------------------------------*/


  
///// Helper functions /////
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

  isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
    if (formType === 'profile') {
      if (!this.profileForm) {
        // console.log('Profile form is not initialized');
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
/*-----------------------------------------------------------------------*/
 



  // checkLoadingComplete() {
  //   if (this.imageLoaded) {
  //     setInterval(() => {
  //       this.loadingComplete = true;
  //       this.cdr.detectChanges();
  //     }, 500)
  //   }
  // }






// resetImage() {
//   this.currentUser.imgUrl = '';
//   this.profileForm.patchValue({
//     imgUrl: ''
//   });
//   this.position = { x: 0, y: 0 };
//   this.isDragged = false;
//   this.cdr.detectChanges();
// }







  
///// Password related Functions /////
changePassword() {
  this.currentState = ProfileState.ChangingPassword;
  this.resetPasswordForm();
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
/*-----------------------------------------------------------------------*/


///// Check if email already exists /////
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
/*-----------------------------------------------------------------------*/


  // isImageUrlFilled(): boolean {
  //   const imgUrlControl = this.profileForm.get('imgUrl');
  //   const formValue = imgUrlControl?.value?.trim();
  //   const isFilled = !!formValue;
  //   // console.log('Image URL filled:', isFilled, 'Form value:', formValue);
  //   return isFilled;
  // }
  

  ///// Functions related to Profile Picture /////
  changePicture() {
    this.currentState = ProfileState.ChangingPicture;
    console.log('Entered change picture mode:', {
      currentState: this.currentState,
      stateName: ProfileState[this.currentState],
      canDrag: this.canDrag()
    });
    // this.syncFormWithCurrentUser();
  }

  // onImageUrlInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const newValue = input.value.trim();

  //   // Queue the value for processing
  //   this.imageUrlDebouncer.next(newValue);

  //   this.imageNotFound = false;

  //   // this.profileForm.patchValue({ imgUrl: newValue });
  //   this.pictureForm.patchValue({ imgUrl: newValue });
  //   this.currentUser.imgUrl = newValue === '' ? null : newValue; // Use null for empty string
  //   this.cdr.detectChanges();

  //   this.resetImagePositionAndZoom();
  //   this.cdr.detectChanges();
  
  //   // Update the UI to reflect the change immediately
  //   if (newValue) {
  //     this.isInitialLoad = false;
  //     this.preloadImage(newValue); 
  //   } else {
  //     this.resetImage();
  //   }
  //   this.cdr.detectChanges();
  // }

  onImageUrlInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.trim();
  
    // Early return if already processing to prevent duplicate work
    // if (this.isProcessingUrl) return;
  
    // Batch immediate UI updates inside NgZone
    this.ngZone.run(() => {
      // Update form state without triggering validation
      this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
      
      // Reset flags
      this.imageNotFound = false;
      this.isInitialLoad = false;
      
      // Reset position and zoom for new input
      this.resetImagePositionAndZoom();
  
      // Single change detection call for immediate updates
      this.stateUpdateDebouncer.next();
    });
  
    // Queue the value for debounced processing
    this.imageUrlDebouncer.next(newValue);
  }



  // private async handleDebouncedUrlChange(newValue: string) {
  //   // Set processing flag
  //   this.isProcessingUrl = true;
  
  //   try {
  //     this.ngZone.run(() => {
  //       // Update user model
  //       this.currentUser.imgUrl = newValue || null;
        
  //       // Handle empty value
  //       if (!newValue) {
  //         this.resetImage();
  //         return;
  //       }
  
  //       // Process new value
  //       this.preloadImage(newValue);
  //     });
  //   } finally {
  //     this.isProcessingUrl = false;
  //   }
  // }

  private async handleDebouncedUrlChange(newValue: string) {
    if (this.isProcessingUrl) return;
    this.isProcessingUrl = true;
  
    try {
      // Don't clear the input, just validate and process the URL
      if (!newValue) {
        this.ngZone.run(() => {
          this.imageNotFound = false;
          this.currentUser.imgUrl = null;
          this.lastValidUrl = null;
          this.resetImagePositionAndZoom();
          this.stateUpdateDebouncer.next();
        });
        return;
      }
  
      // Basic URL validation before attempting to load
      let isValidUrl = false;
      try {
        new URL(newValue);
        isValidUrl = true;
      } catch {
        isValidUrl = false;
      }
  
      if (!isValidUrl) {
        // Don't clear input, just mark as not found
        this.ngZone.run(() => {
          this.imageNotFound = true;
          this.currentUser.imgUrl = null;
          this.stateUpdateDebouncer.next();
        });
        return;
      }
  
      // Process valid URL
      this.ngZone.run(() => {
        this.imageNotFound = false;
        this.isInitialLoad = false;
        this.preloadImage(newValue, false, true);
      });
  
    } finally {
      this.isProcessingUrl = false;
    }
  }

  // resetImage() {
  //   // this.position = { x: 0, y: 0 };
  //   this.resetImagePositionAndZoom();
  //   this.imageNotFound = false;
  //   // this.isDragged = false;
  //   // this.profileForm.patchValue({ imgUrl: null }); 
  //   this.pictureForm.patchValue({ imgUrl: null });
  //   this.currentUser.imgUrl = null;
  //   this.cdr.detectChanges();
  // }
  resetImage() {
    this.ngZone.run(() => {
      this.resetImagePositionAndZoom();
      this.imageNotFound = false;
      this.currentUser.imgUrl = null;
      if (!this.isProcessingUrl) {
        this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
      }
      // Queue a single state update
      this.stateUpdateDebouncer.next();
    });
  }

  // Optional: Add helper method for basic URL validation
  private isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

  // Add this new method to handle image URL changes
  private async handleImageUrlChange(newValue: string) {
    // Batch state updates
    this.ngZone.run(() => {
      this.imageNotFound = false;
      this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
      this.currentUser.imgUrl = newValue === '' ? null : newValue;
    });

    if (newValue) {
      this.isInitialLoad = false;
      await this.preloadImage(newValue);
    } else {
      this.resetImage();
    }

    // Queue a single state update
    this.stateUpdateDebouncer.next();
  }

  // saveProfilePicture() {
  //   const newImgUrl = this.pictureForm.get('imgUrl')?.value;
  //   this.currentUser.imgUrl = newImgUrl === '' ? null : newImgUrl;


  //   const updatedUser = { 
  //     ...this.currentUser, 
  //     imgUrl: this.currentUser.imgUrl, 
  //     profilePictureSettings: {
  //       zoom: this.zoomLevel,
  //       x: this.position.x,
  //       y: this.position.y
  //     }
  //   };
  //   this.userService.updateUser(this.currentUser).subscribe(
  //     (response) => {
  //       // this.currentState = ProfileState.Viewing;
  //       // this.profileForm.patchValue({ imgUrl: this.currentUser.imgUrl });
  //       // this.cdr.detectChanges();
  //       // this.reloadProfile();
  //       console.log('Profile picture updated successfully', response);
  //       this.currentUser = { ...this.currentUser, ...response };

  //       // Ensure profilePictureSettings are not overwritten if they come back as null
  //       if (this.currentUser.profilePictureSettings === null) {
  //         this.currentUser.profilePictureSettings = updatedUser.profilePictureSettings;
  //       }

  //       this.currentState = ProfileState.Viewing;
  //       this.profileForm.patchValue({ imgUrl: this.currentUser.imgUrl || '',
  //         profilePictureSettings: this.currentUser.profilePictureSettings
  //       });
  //       this.pictureForm.patchValue({ imgUrl: this.currentUser.imgUrl || '',
  //         profilePictureSettings: this.currentUser.profilePictureSettings
  //       });
        
  //       // Reset position and zoom after saving
  //       // this.resetImagePositionAndZoom();
        
  //       this.updateImageTransform();
  //       this.cdr.detectChanges();
  //       // this.reloadProfile();

        
  //     },
  //     error => {
  //       console.error('Error updating profile picture:', error);
  //       // Handle error (e.g., show error message)
  //     }
  //   );
  // }

  // async saveProfilePicture() {
  //   if (!this.pictureForm.valid) return;
  
  //   // const newImgUrl = this.pictureForm.get('imgUrl')?.value
  
  //   try {

  //       const formValue = this.pictureForm.getRawValue();
  //       const updatedUser = {
  //       ...this.currentUser,
  //       imgUrl: formValue.imgUrl || null,
  //       profilePictureSettings: {
  //         zoom: this.zoomLevel,
  //         x: this.position.x,
  //         y: this.position.y
  //       }
  //     };

  //     const response = await this.userService.updateUser(updatedUser).toPromise();
      
  //     this.ngZone.run(() => {
  //       // Update current user with response
  //       this.currentUser = { ...this.currentUser, ...response };
        
  //       // Ensure settings aren't overwritten if they come back null
  //       if (this.currentUser.profilePictureSettings === null) {
  //         this.currentUser.profilePictureSettings = updatedUser.profilePictureSettings;
  //       }
  
  //       // Update forms
  //       // this.profileForm.patchValue({
  //       //   imgUrl: this.currentUser.imgUrl || '',
  //       //   profilePictureSettings: this.currentUser.profilePictureSettings
  //       // });
        
  //       this.pictureForm.patchValue({
  //         imgUrl: this.currentUser.imgUrl || '',
  //         profilePictureSettings: this.currentUser.profilePictureSettings
  //       });
  
  //       // Update state
  //       this.currentState = ProfileState.Viewing;
  //       this.updateImageTransform();
  //       this.cdr.detectChanges();
  //     });
  
  //   } catch (error) {
  //     console.error('Error updating profile picture:', error);
  //     this.pictureForm.get('imgUrl')?.setErrors({ 'updateFailed': true });
  //     this.cdr.detectChanges();
  //   }
  // }

  // async saveProfilePicture() {
  //   if (!this.pictureForm.valid) return;
  
  //   this.isSavingPicture = true; 

  //   try {
  //     // Get current form values
  //     const formValue = this.pictureForm.getRawValue();
      
  //     // Get the original Firebase URL instead of the proxied one
  //     let originalUrl = formValue.imgUrl;
  //     if (originalUrl && originalUrl.includes('localhost:3000/api/storage')) {
  //       // Convert back to Firebase URL if it's a proxied URL
  //       originalUrl = this.currentUser.imgUrl; // Use the original Firebase URL stored in currentUser
  //     }

  //     // Move staged file to permanent storage
  //     const permanentUrl = await this.firebaseService.moveToPermStorage(this.userId);
  
  //     // Ensure profilePictureSettings is properly structured
  //     // const settings = {
  //     //   zoom: Number(this.zoomLevel) || 1,
  //     //   x: Number(this.position.x) || 0,
  //     //   y: Number(this.position.y) || 0
  //     // };
  //     if (permanentUrl) {
  //       const settings = {
  //         zoom: Number(this.zoomLevel || 1),
  //         x: Number(this.position.x || 0),
  //         y: Number(this.position.y || 0)
  //       };
  
  //     // Create the update object with properly formatted data
  //     const updatedUser = {
  //       ...this.currentUser,
  //       imgUrl: originalUrl || null, // Use the original Firebase URL
  //       profilePictureSettings: settings
  //     };
  
  //     // Remove any circular references or computed properties
  //     delete updatedUser.paymentFrequency;
  
  //     console.log('Sending update to server:', {
  //       imgUrl: updatedUser.imgUrl,
  //       settings: updatedUser.profilePictureSettings
  //     });
  
  //     const response = await this.userService.updateUser(updatedUser).toPromise();

  //     this.currentUser.imgUrl = permanentUrl;
  //     this.currentState = ProfileState.Viewing;
  //     // }
  //     this.ngZone.run(() => {
  //       // Update current user with response
  //       this.currentUser = { ...this.currentUser, ...response };
        
  //       // Always ensure settings are preserved
  //       this.currentUser.profilePictureSettings = settings;
  
  //       // Update form with proxied URL for display
  //       const proxiedUrl = this.currentUser.imgUrl ? 
  //         this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) : '';
  
  //       // this.profileForm.patchValue({
  //       //   imgUrl: proxiedUrl,
  //       //   profilePictureSettings: settings
  //       // }, { emitEvent: false });
        
  //       this.pictureForm.patchValue({
  //         imgUrl: proxiedUrl,
  //         profilePictureSettings: settings
  //       }, { emitEvent: false });
  
  //       // Update position and zoom
  //       this.position = {
  //         x: settings.x,
  //         y: settings.y
  //       };
  //       this.zoomLevel = settings.zoom;
  
  //       // Change state and update UI
  //       this.currentState = ProfileState.Viewing;
  //       this.updateImageTransform();
        
  //       this.cdr.detectChanges();
  //     });
  
  //   } 
  // }catch (error) {
  //     console.error('Error saving profile picture:', error);
  //     if (error instanceof HttpErrorResponse) {
  //       console.error('Server error details:', error.error);
  //     }
      
  //     const imgUrlControl = this.pictureForm.get('imgUrl');
  //     imgUrlControl?.setErrors({ 'updateFailed': true });
  //     this.cdr.detectChanges();
  
  //     // Keep the current state if there's an error
  //     this.currentState = ProfileState.ChangingPicture;
  //   } finally {
  //     this.isSavingPicture = false;
  //   }
  // }
//   async saveProfilePicture() {
//   if (!this.pictureForm.valid) return;
  
//   this.isSavingPicture = true; 

//   try {
//     // Move staged file to permanent storage first
//     const permanentUrl = await this.firebaseService.moveToPermStorage(this.userId);
    
//     if (!permanentUrl) {
//       throw new Error('Failed to move staged image to permanent storage');
//     }

//     // Create settings object
//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     // Create the update object
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: permanentUrl, // Use the new permanent URL
//       profilePictureSettings: settings
//     };

//     // Remove computed properties
//     delete updatedUser.paymentFrequency;

//     console.log('Sending update to server:', {
//       imgUrl: permanentUrl,
//       settings
//     });

//     // Update user in database
//     const response = await this.userService.updateUser(updatedUser).toPromise();

//     // Update local state within NgZone
//     this.ngZone.run(() => {
//       // Update current user
//       this.currentUser = { 
//         ...this.currentUser, 
//         ...response,
//         imgUrl: permanentUrl,
//         profilePictureSettings: settings 
//       };

//       // Convert to proxied URL for display
//       const proxiedUrl = this.storageService.convertFirebaseUrl(permanentUrl);

//       // Update form
//       this.pictureForm.patchValue({
//         imgUrl: proxiedUrl,
//         profilePictureSettings: settings
//       }, { emitEvent: false });

//       // Update position and zoom
//       this.position = {
//         x: settings.x,
//         y: settings.y
//       };
//       this.zoomLevel = settings.zoom;

//       // Update UI state
//       this.currentState = ProfileState.Viewing;
//       this.updateImageTransform();
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error saving profile picture:', error);
    
//     if (error instanceof HttpErrorResponse) {
//       console.error('Server error details:', error.error);
//     }
    
//     // Handle form error
//     const imgUrlControl = this.pictureForm.get('imgUrl');
//     imgUrlControl?.setErrors({ 'updateFailed': true });
    
//     // Stay in changing picture state
//     this.currentState = ProfileState.ChangingPicture;
//     this.cdr.detectChanges();

//   } finally {
//     this.isSavingPicture = false;
//   }
// }

// async saveProfilePicture() {
//   if (!this.pictureForm.valid || !this.stagingImageUrl){
//     console.log('Form invalid or no staged image');
//     return;
//   }
  
//   this.isSavingPicture = true; 
//   console.log('Starting save with staged URL:', this.stagingImageUrl);

//   try {

//     // Get filename from staged URL
//     const fileName = this.firebaseService.getFileName(this.stagingImageUrl);
//     console.log('Extracted filename:', fileName);

//     // Move staged file to permanent storage
//     const permanentUrl = await this.firebaseService.moveToPermStorage(
//       this.userId,
//       fileName
//     );

//     console.log('Moved to permanent storage:', permanentUrl);
    
//     if (!permanentUrl) {
//       throw new Error('Failed to move staged image to permanent storage');
//     }

//     // Create settings object
//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     // Create the update object
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: permanentUrl,
//       profilePictureSettings: settings
//     };

//     // // Remove computed properties
//     delete updatedUser.paymentFrequency;

//     console.log('Updating user with:', updatedUser);

//     // console.log('Sending update to server:', {
//     //   imgUrl: permanentUrl,
//     //   settings
//     // });

//     // Update user in database
//     const response = await this.userService.updateUser(updatedUser).toPromise();

//     // Update local state within NgZone
//     this.ngZone.run(() => {
//       // Update current user
//       this.currentUser = { 
//         ...this.currentUser, 
//         ...response,
//         imgUrl: permanentUrl,
//         profilePictureSettings: settings 
//       };

//       // Convert to proxied URL for display
//       const proxiedUrl = this.storageService.convertFirebaseUrl(permanentUrl);

//       // Update form
//       this.pictureForm.patchValue({
//         imgUrl: proxiedUrl,
//         profilePictureSettings: settings
//       }, { emitEvent: false });

//       // Update position and zoom
//       this.position = {
//         x: settings.x,
//         y: settings.y
//       };
//       this.zoomLevel = settings.zoom;

//       // Update UI state
//       this.currentState = ProfileState.Viewing;
//       this.updateImageTransform();
      
//       // Clear staging
//       this.stagingImageUrl = null;

//       console.log('Save completed, new state:', {
//         currentUser: this.currentUser,
//         proxiedUrl,
//         settings
//       });

//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error saving profile picture:', error);
    
//     // if (error instanceof HttpErrorResponse) {
//     //   console.error('Server error details:', error.error);
//     // }
    
//     // Handle form error
//     const imgUrlControl = this.pictureForm.get('imgUrl');
//     imgUrlControl?.setErrors({ 'updateFailed': true });
    
//     // Stay in changing picture state
//     this.currentState = ProfileState.ChangingPicture;
//     this.cdr.detectChanges();

//   } finally {
//     this.isSavingPicture = false;
//   }
// }

// async saveProfilePicture() {
//   if (!this.pictureForm.valid) return;

//   try {
//     this.isSavingPicture = true;
//     const imageUrl = this.pictureForm.get('imgUrl')?.value;

//     if (!imageUrl) {
//       throw new Error('No image URL provided');
//     }

//     // Get current user ID
//     const userId = this.userService.getUserId();
//     if (!userId) {
//       throw new Error('User ID not found');
//     }

//     console.log('Saving profile picture:', {
//       userId,
//       imageUrl,
//       currentSettings: this.getProfilePictureSettings()
//     });

//     // Update user profile with current user data and new image URL
//     const updatedUser = await this.userService.updateProfile({
//       ...this.currentUser,
//       id: userId,
//       userId: userId,
//       imgUrl: imageUrl,
//       profilePictureSettings: this.getProfilePictureSettings()
//     });

//     // Update current user state
//     this.currentUser = {
//       ...this.currentUser,
//       ...updatedUser
//     };

//     // Update form
//     this.pictureForm.patchValue({
//       imgUrl: this.currentUser.imgUrl
//     }, { emitEvent: false });

//     // Reset state
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   } catch (error) {
//     console.error('Error saving profile picture:', error);
//     // Show error to user
//     this.showError('Failed to save profile picture. Please try again.');
//   } finally {
//     this.isSavingPicture = false;
//   }
// }
// async saveProfilePicture() {
//   if (!this.pictureForm.valid) return;

//   try {
//     this.isSavingPicture = true;
//     const imageUrl = this.pictureForm.get('imgUrl')?.value;

//     if (!imageUrl) {
//       throw new Error('No image URL provided');
//     }

//     // Get current user ID
//     const userId = this.userService.getUserId();
//     if (!userId) {
//       throw new Error('User ID not found');
//     }

//     // Save image and get Firebase URL
//     const finalImageUrl = await this.imageUrlManager.saveProfileImage(userId, imageUrl);

//     // Create position settings
//     const settings = {
//       zoom: Number(this.zoomLevel) || 1,
//       x: Number(this.position.x) || 0,
//       y: Number(this.position.y) || 0
//     };

//     // Update user profile
//     const updatedUser = await this.userService.updateProfile({
//       ...this.currentUser,
//       id: userId,
//       userId: userId,
//       imgUrl: finalImageUrl,
//       profilePictureSettings: settings
//     });

//     // Update current user state
//     this.currentUser = {
//       ...this.currentUser,
//       ...updatedUser,
//       profilePictureSettings: settings // Ensure settings are preserved
//     };

//     // Convert URL for display
//     const displayUrl = await this.imageUrlManager.getDisplayUrl(userId, finalImageUrl);
    
//     // Update form
//     this.pictureForm.patchValue({
//       imgUrl: displayUrl
//     }, { emitEvent: false });

//     // Update position and zoom
//     this.position = {
//       x: settings.x,
//       y: settings.y
//     };
//     this.zoomLevel = settings.zoom;

//     // Reset state and update UI
//     this.currentState = ProfileState.Viewing;
//     this.updateImageTransform();
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error saving profile picture:', error);
//     this.showError('Failed to save profile picture. Please try again.');
//   } finally {
//     this.isSavingPicture = false;
//   }
// }

async saveProfilePicture() {
  if (!this.pictureForm.valid) return;

  try {
    this.isSavingPicture = true;
    const imageUrl = this.pictureForm.get('imgUrl')?.value;

    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    // Get current user ID
    const userId = this.userService.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Create settings object
    const settings = {
      zoom: Number(this.zoomLevel) || 1,
      x: Number(this.position.x) || 0,
      y: Number(this.position.y) || 0
    };

    // Save image and get Firebase URL
    const finalImageUrl = await this.imageUrlManager.saveProfileImage(userId, imageUrl);

    // Update user profile
    const updatedUser = await this.userService.updateProfile({
      ...this.currentUser,
      id: userId,
      userId: userId,
      imgUrl: finalImageUrl,
      profilePictureSettings: settings
    });

    // Update current user state
    this.currentUser = {
      ...this.currentUser,
      ...updatedUser,
      profilePictureSettings: settings
    };

    // Update form with proxied URL
    const displayUrl = await this.imageUrlManager.getDisplayUrl(userId, finalImageUrl);
    this.pictureForm.patchValue({
      imgUrl: displayUrl
    }, { emitEvent: false });

    // Update position and transform
    this.position = {
      x: settings.x,
      y: settings.y
    };
    this.zoomLevel = settings.zoom;

    // Change state and update UI
    this.currentState = ProfileState.Viewing;
    this.updateImageTransform();
    this.cdr.detectChanges();

  } catch (error) {
    console.error('Error saving profile picture:', error);
    // Show error to user
    // Optionally stay in current state
  } finally {
    this.isSavingPicture = false;
    this.cdr.detectChanges();
  }
}

private getProfilePictureSettings() {
  return {
    position: this.position || { x: 0, y: 0 },
    zoom: this.zoomLevel || 1
  };
}

private showError(message: string) {
  console.error(message);
  // You can implement a more user-friendly error display here
  // For example: this.snackBar.open(message, 'Close', { duration: 3000 });
}
// private updateProfileImage(url: string) {
//   if (this.profileImg && this.profileImg.nativeElement) {
//     const imgElement = this.profileImg.nativeElement;
//     const styles = {
//       'background-image': `url(${url})`,
//       'background-position': `${this.position.x}% ${this.position.y}%`,
//       'background-size': `${this.zoomLevel * 100}%`,
//       'background-repeat': 'no-repeat'
//     };
    
//     Object.entries(styles).forEach(([key, value]) => {
//       this.renderer.setStyle(imgElement, key, value);
//     });
//   }
// }


  private async cleanupStagedImage() {
    if (this.stagingImageUrl) {
      try {
        await this.firebaseService.deleteFile(this.userId, this.stagingImageUrl);
        this.stagingImageUrl = null;
        this.isImageStaged = false;
      } catch (error) {
        console.error('Error cleaning up staged image:', error);
      }
    }
  }  
  

  private getImageUrlErrorMessage(control: AbstractControl): string {
    if (this.isUploading) {
      return `Uploading... ${this.uploadProgress}%`;
    }
  
    if (control.hasError('fileSize')) {
      return 'Max file size 5MB';
    }
    if (control.hasError('fileType')) {
      return 'Only .jpg, .jpeg, .png & .gif';
    }
    if (control.hasError('unauthorized')) {
      return 'Please log in to upload files';
    }
    if (control.hasError('uploadFailed')) {
      return 'Upload failed. Please try again.';
    }
    if (control.hasError('updateFailed')) {
      return 'Failed to update profile. Please try again.';
    }
    if (control.hasError('pattern')) {
      return 'Invalid image URL';
    }
  
    return 'Invalid input';
  }
  
  // Update the imgUrl case in your getErrorMessage method:
  

//  preloadImage(imgUrl: string | null, isInitialLoad = false) {

//     // Reset loading states
//     if (this.isInitialLoad) {
//       this.imageLoaded = false;
//       this.loadingComplete = false;
//     }

//     this.imageNotFound = false;
//     // Reset BehaviorSubjects
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
    

//     // Create a promise for the avatar image
//     const loadAvatar = new Promise<void>((resolve, reject) => {
//       const avatarImg = new Image();
//       avatarImg.onload = () => resolve();
//       avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
//       avatarImg.src = 'assets/Images/avatar.png';
//     });

//     // Handle avatar loading
//     from(loadAvatar).pipe(
//       catchError(error => {
//         console.error('Error loading avatar:', error);
//         return of(null);
//       }),
//       finalize(() => {
//         this.avatarLoaded.next(true);
//         this.checkAllImagesLoaded(this.isInitialLoad);
//       })
//     ).subscribe();

//   //   const img = new Image();
//   //   img.onload = () => {
//   //     this.imageLoaded = true;
//   //     this.checkLoadingComplete();
//   //   };
//   //   img.onerror = () => {
//   //     console.error('Error loading image');
//   //     this.imageLoaded = true; 
//   //     this.checkLoadingComplete();
//   //   };
//   //   img.src = imgUrl;
//   // }
//   // If there's a URL image to load, handle it separately
//   if (imgUrl) {
//     const urlImg = new Image();
    
//     urlImg.onload = () => {
//       this.imageNotFound = false;
//       this.urlImageLoaded.next(true);
//       this.checkAllImagesLoaded(this.isInitialLoad);
//     };
    
//     urlImg.onerror = () => {
//       console.error('Error loading URL image');
//       this.imageNotFound = true;
//       this.urlImageLoaded.next(true); // Consider it "loaded" even if it failed
//       this.checkAllImagesLoaded(this.isInitialLoad);
//     };
    
//     urlImg.src = imgUrl;
//   } else {
//     // No URL image to load, mark it as "loaded"
//     this.imageNotFound = false;
//     this.urlImageLoaded.next(true);
//     this.checkAllImagesLoaded(this.isInitialLoad);
//   }
// }

// async preloadImage(imgUrl: string | null, isInitialLoad = false) {
//   if (this.isInitialLoad) {
//     this.imageLoaded = false;
//     this.loadingComplete = false;
//   }

//   this.imageNotFound = false;
//   this.avatarLoaded.next(false);
//   this.urlImageLoaded.next(false);

//   // Handle avatar loading
//   const loadAvatar = new Promise<void>((resolve, reject) => {
//     const avatarImg = new Image();
//     avatarImg.onload = () => resolve();
//     avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
//     avatarImg.src = 'assets/Images/avatar.png';
//   });

//   try {
//     await loadAvatar;
//     this.avatarLoaded.next(true);
//   } catch (error) {
//     console.error('Error loading avatar:', error);
//   } finally {
//     this.checkAllImagesLoaded(isInitialLoad);
//   }

//   if (imgUrl) {
//     try {
//       // Verify image exists in Firebase
//       const validUrl = await this.imageManagementService.checkAndUpdateImageUrl(
//         this.userId, 
//         imgUrl
//       );

//       if (!validUrl) {
//         throw new Error('Image not found');
//       }

//       const urlImg = new Image();
//       await new Promise<void>((resolve, reject) => {
//         urlImg.onload = () => resolve();
//         urlImg.onerror = () => reject(new Error('Failed to load image'));
//         urlImg.src = validUrl;
//       });

//       this.imageNotFound = false;
//       this.currentUser.imgUrl = validUrl;
//     } catch (error) {
//       console.error('Error loading image:', error);
//       this.imageNotFound = true;
//       this.currentUser.imgUrl = null;
      
//       // Clear the form values
//       this.profileForm.patchValue({ imgUrl: null });
//       this.pictureForm.patchValue({ imgUrl: null });
//     } finally {
//       this.urlImageLoaded.next(true);
//       this.checkAllImagesLoaded(isInitialLoad);
//     }
//   } else {
//     this.imageNotFound = false;
//     this.urlImageLoaded.next(true);
//     this.checkAllImagesLoaded(isInitialLoad);
//   }
// }

// async preloadImage(imgUrl: string | null, isInitialLoad = false) {
//   if (this.isInitialLoad) {
//     this.imageLoaded = false;
//     this.loadingComplete = false;
//   }

//   this.imageNotFound = false;
//   this.avatarLoaded.next(false);
//   this.urlImageLoaded.next(false);

//   // Handle avatar loading
//   const loadAvatar = new Promise<void>((resolve, reject) => {
//     const avatarImg = new Image();
//     avatarImg.onload = () => resolve();
//     avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
//     avatarImg.src = 'assets/Images/avatar.png';
//   });

//   try {
//     await loadAvatar;
//     this.avatarLoaded.next(true);
//   } catch (error) {
//     console.error('Error loading avatar:', error);
//   } finally {
//     this.checkAllImagesLoaded(isInitialLoad);
//   }

//   if (imgUrl) {
//     try {
//       // Verify image exists and get valid URL
//       const validUrl = await this.imageManagementService.checkAndUpdateImageUrl(
//         this.userId, 
//         imgUrl
//       );

//       if (!validUrl) {
//         throw new Error('Image not found');
//       }

//       // For display, use proxied URL if it's a Firebase URL
//       const displayUrl = validUrl.includes('firebasestorage.googleapis.com') 
//         ? this.storageService.convertFirebaseUrl(validUrl)
//         : validUrl;

//       // Load the image
//       const urlImg = new Image();
//       await new Promise<void>((resolve, reject) => {
//         urlImg.onload = () => resolve();
//         urlImg.onerror = () => reject(new Error('Failed to load image'));
//         urlImg.src = displayUrl;
//       });

//       this.imageNotFound = false;
//       // Store original URL in currentUser
//       this.currentUser.imgUrl = validUrl;  // Keep original URL in model
      
//       // Update forms with original URL
//       if (this.currentUser.imgUrl.includes('firebasestorage.googleapis.com')) {
//         // For Firebase URLs, store original but display proxied
//         this.profileForm.patchValue({ 
//           imgUrl: this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) 
//         });
//         this.pictureForm.patchValue({ 
//           imgUrl: this.storageService.convertFirebaseUrl(this.currentUser.imgUrl)
//         });
//       } else {
//         // For external URLs, use as-is
//         this.profileForm.patchValue({ imgUrl: this.currentUser.imgUrl });
//         this.pictureForm.patchValue({ imgUrl: this.currentUser.imgUrl });
//       }
      
//     } catch (error) {
//       console.error('Error loading image:', error);
//       this.imageNotFound = true;
//       this.currentUser.imgUrl = null;
      
//       // Clear the form values
//       this.profileForm.patchValue({ imgUrl: null });
//       this.pictureForm.patchValue({ imgUrl: null });
//     } finally {
//       this.urlImageLoaded.next(true);
//       this.checkAllImagesLoaded(isInitialLoad);
//     }
//   } else {
//     this.imageNotFound = false;
//     this.urlImageLoaded.next(true);
//     this.checkAllImagesLoaded(isInitialLoad);
//   }
// }

// async preloadImage(imgUrl: string | null, isInitialLoad = false) {
//   console.log('Starting preloadImage', { isInitialLoad, imgUrl });

//   if (this.isInitialLoad) {
//     this.imageLoaded = false;
//     this.loadingComplete = false;
//   }

//   // this.imageNotFound = false;
//   this.avatarLoaded.next(false);
//   this.urlImageLoaded.next(false);

//   // Handle avatar loading
//   try {
//     const avatarImg = new Image();
//     await new Promise<void>((resolve, reject) => {
//       avatarImg.onload = () => resolve();
//       avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
//       avatarImg.src = 'assets/Images/avatar.png';
//     });
//     this.avatarLoaded.next(true);
//   } catch (error) {
//     console.error('Error loading avatar:', error);
//     // Still mark avatar as loaded even if it fails
//     this.avatarLoaded.next(true);
//   }

//   if (imgUrl) {
//     try {
//       // Verify image exists and get valid URL
//       const validUrl = await this.imageManagementService.checkAndUpdateImageUrl(
//         this.userId, 
//         imgUrl
//       );

  
//       if (!validUrl) {
//         console.log('No valid URL returned, marking image as not found');
//         this.imageNotFound = true;
//         this.currentUser.imgUrl = null;
//         this.pictureForm.patchValue({ imgUrl: null });
//         this.urlImageLoaded.next(true);
//         this.cdr.detectChanges();
//         return;
//       }

//       // For display, use proxied URL if it's a Firebase URL
//       const displayUrl = validUrl.includes('firebasestorage.googleapis.com') 
//         ? this.storageService.convertFirebaseUrl(validUrl)
//         : validUrl;

//       // Load the image
//       const urlImg = new Image();
//       await new Promise<void>((resolve, reject) => {
//         urlImg.onload = () => resolve();
//         urlImg.onerror = () => {
//           this.imageNotFound = true;
//           reject(new Error('Failed to load image'));
//         };
//         urlImg.src = displayUrl;
//       });

//       this.imageNotFound = false;
//       // Store original URL in currentUser
//       this.currentUser.imgUrl = validUrl;  // Keep original URL in model
      
//       // Update forms with original URL
//       if (this.currentUser.imgUrl.includes('firebasestorage.googleapis.com')) {
//         // For Firebase URLs, store original but display proxied
//         // this.profileForm.patchValue({ 
//         //   imgUrl: this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) 
//         // });
//         this.pictureForm.patchValue({ 
//           imgUrl: this.storageService.convertFirebaseUrl(this.currentUser.imgUrl)
//         });
//       } else {
//         // For external URLs, use as-is
//         // this.profileForm.patchValue({ imgUrl: this.currentUser.imgUrl });
//         this.pictureForm.patchValue({ imgUrl: this.currentUser.imgUrl });
//       }
      
//     } catch (error) {
//       console.error('Error loading image:', error);
//       this.imageNotFound = true;
//       console.log('Error loading image:', this.imageNotFound);
//       this.currentUser.imgUrl = null;
      
//       // Clear the form values
//       // this.profileForm.patchValue({ imgUrl: null });
//       this.pictureForm.patchValue({ imgUrl: null });
//     } finally {
//       // Always mark URL image as loaded
//       this.urlImageLoaded.next(true);
//     }
//   } else {
//     // No image URL provided
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.urlImageLoaded.next(true);
//   }

//     // Final checks
//     console.log('Final state:', {
//       imageNotFound: this.imageNotFound,
//       currentUserImgUrl: this.currentUser.imgUrl,
//       isLoaded: this.imageLoaded
//     });

//   // Final check for loading completion
//   this.checkLoadingComplete();
//   this.cdr.detectChanges();
// }

// async preloadImage(imgUrl: string | null, isInitialLoad = false) {
//   console.log('Starting preloadImage', { isInitialLoad, imgUrl });

//   // Use NgZone to batch initial state updates
//   this.ngZone.run(() => {
//     if (this.isInitialLoad) {
//       this.imageLoaded = false;
//       this.loadingComplete = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
//   let avatarLoaded = false;
//   try {
//     const avatarImg = new Image();
//     await new Promise<void>((resolve, reject) => {
//       avatarImg.onload = () => resolve();
//       avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
//       avatarImg.src = 'assets/Images/avatar.png';
//     });
//     avatarLoaded = true;
//   } catch (error) {
//     console.error('Error loading avatar:', error);
//   } finally {
//     this.avatarLoaded.next(true);
//   }

//   // Early return if no image URL provided
//   if (!imgUrl) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.checkLoadingComplete();
//       this.cdr.detectChanges();
//     });
//     return;
//   }

//   // Process image URL and load image
//   try {
//     // Verify image URL
//     const validUrl = await this.imageManagementService.checkAndUpdateImageUrl(
//       this.userId, 
//       imgUrl
//     );

//     if (!validUrl) {
//       this.ngZone.run(() => {
//         console.log('No valid URL returned, marking image as not found');
//         this.imageNotFound = true;
//         this.currentUser.imgUrl = null;
//         this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//         this.urlImageLoaded.next(true);
//         this.checkLoadingComplete();
//         this.cdr.detectChanges();
//       });
//       return;
//     }

//     // Prepare display URL
//     const displayUrl = validUrl.includes('firebasestorage.googleapis.com')
//       ? this.storageService.convertFirebaseUrl(validUrl)
//       : validUrl;

//     // Load and verify the actual image
//     try {
//       await new Promise<void>((resolve, reject) => {
//         const urlImg = new Image();
//         urlImg.onload = () => resolve();
//         urlImg.onerror = () => {
//           reject(new Error('Failed to load image'));
//         };
//         urlImg.src = displayUrl;
//       });

//       // Success path - update all states at once
//       this.ngZone.run(() => {
//         this.imageNotFound = false;
//         this.currentUser.imgUrl = validUrl;
        
//         // Update form with appropriate URL
//         if (validUrl.includes('firebasestorage.googleapis.com')) {
//           this.pictureForm.patchValue({
//             imgUrl: this.storageService.convertFirebaseUrl(validUrl)
//           }, { emitEvent: false });
//         } else {
//           this.pictureForm.patchValue({
//             imgUrl: validUrl
//           }, { emitEvent: false });
//         }
//       });

//     } catch (loadError) {
//       // Image load failure - batch updates
//       this.ngZone.run(() => {
//         console.error('Error loading image:', loadError);
//         this.imageNotFound = true;
//         this.currentUser.imgUrl = null;
//         this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//       });
//     }

//   } catch (error) {
//     // URL verification failure - batch updates
//     this.ngZone.run(() => {
//       console.error('Error processing image URL:', error);
//       this.imageNotFound = true;
//       this.currentUser.imgUrl = null;
//       this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//     });
//   } finally {
//     // Final state updates
//     this.ngZone.run(() => {
//       this.urlImageLoaded.next(true);
      
//       console.log('Final state:', {
//         imageNotFound: this.imageNotFound,
//         currentUserImgUrl: this.currentUser.imgUrl,
//         isLoaded: this.imageLoaded
//       });

//       this.checkLoadingComplete();
//       this.cdr.detectChanges();
//     });
//   }
// }

async preloadImage(imgUrl: string | null, isInitialLoad = false, isFromTyping = false) {
  console.log('Starting preloadImage', { isInitialLoad, imgUrl });

  this.imageLoadedSuccessfully = false;

  // Batch initial state updates
  this.ngZone.run(() => {
    if (this.isInitialLoad) {
      this.imageLoaded = false;
      this.loadingComplete = false;
    }
    this.avatarLoaded.next(false);
    this.urlImageLoaded.next(false);
    // this.stateUpdateDebouncer.next();
  });

  // Load avatar first
  let avatarLoaded = false;
  try {
    const avatarImg = new Image();
    await new Promise<void>((resolve, reject) => {
      avatarImg.onload = () => resolve();
      avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
      avatarImg.src = 'assets/Images/avatar.png';
    });
    avatarLoaded = true;
  } catch (error) {
    console.error('Error loading avatar:', error);
  } finally {
    this.ngZone.run(() => {
      this.avatarLoaded.next(true);
      // this.stateUpdateDebouncer.next();
    });
  }

  // Early return if no image URL provided
  if (!imgUrl) {
    this.ngZone.run(() => {
      this.imageNotFound = false;
      this.imageLoadedSuccessfully = false;
      this.currentUser.imgUrl = null;
      this.urlImageLoaded.next(true);
      this.checkLoadingComplete();
      if (!isFromTyping) {
        this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
      }
      this.stateUpdateDebouncer.next();
    });
    return;
  }

  // Process image URL and load image
  try {
    // Verify image URL
    const validUrl = await this.imageManagementService.checkAndUpdateImageUrl(
      this.userId, 
      imgUrl
    );

    if (!validUrl) {
      this.ngZone.run(() => {
        console.log('No valid URL returned, marking image as not found');
        this.imageNotFound = true;
        this.imageLoadedSuccessfully = false;
        this.currentUser.imgUrl = null;
        if (!isFromTyping) {
          this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
        }
        this.urlImageLoaded.next(true);
        this.checkLoadingComplete();
        this.stateUpdateDebouncer.next();
      });
      return;
    }

    // Prepare display URL
    const displayUrl = validUrl.includes('firebasestorage.googleapis.com')
      ? this.storageService.convertFirebaseUrl(validUrl)
      : validUrl;

    // Load and verify the actual image
    try {
      await new Promise<void>((resolve, reject) => {
        const urlImg = new Image();
        urlImg.onload = () => {
          this.imageLoadedSuccessfully = true;
          resolve();
        }
        urlImg.onerror = () => {
          this.imageNotFound = true;
          this.imageLoadedSuccessfully = false;
          reject(new Error('Failed to load image'));
        };
        urlImg.src = displayUrl;
      });

      // Success path - update all states at once
      this.ngZone.run(() => {
        this.imageNotFound = false;
        this.currentUser.imgUrl = validUrl;
        
        // Update form with appropriate URL
      if (!isFromTyping && this.currentInputValue !== displayUrl) {
        if (validUrl.includes('firebasestorage.googleapis.com')) {
          this.pictureForm.patchValue({
            imgUrl: this.storageService.convertFirebaseUrl(validUrl)
          }, { emitEvent: false });
        } else {
          this.pictureForm.patchValue({
            imgUrl: validUrl
          }, { emitEvent: false });
        }
      }
        this.stateUpdateDebouncer.next();
      });

    } catch (loadError) {
      if (!this.isTyping) {
      // Image load failure - batch updates
      this.ngZone.run(() => {
        console.error('Error loading image:', loadError);
        this.imageNotFound = true;
        this.imageLoadedSuccessfully = false;
        this.currentUser.imgUrl = null;
        if (!isFromTyping) {
          this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
        }
        this.stateUpdateDebouncer.next();
        });
      }
    }

  } catch (error) {
    // URL verification failure - batch updates
    this.ngZone.run(() => {
      console.error('Error processing image URL:', error);
      this.imageNotFound = true;
      this.imageLoadedSuccessfully = false;
      this.currentUser.imgUrl = null;
      if (!isFromTyping) {
        this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
      }
      this.stateUpdateDebouncer.next();
    });
  } finally {
    // Final state updates
    this.ngZone.run(() => {
      this.urlImageLoaded.next(true);
      
      console.log('Final state:', {
        imageNotFound: this.imageNotFound,
        currentUserImgUrl: this.currentUser.imgUrl,
        isLoaded: this.imageLoaded
      });

      this.checkLoadingComplete();
      this.stateUpdateDebouncer.next();
    });
  }
}

// Helper method to check if all images are loaded
private checkAllImagesLoaded(isInitialLoad: boolean) {
  const avatarLoaded = this.avatarLoaded.getValue();
  const urlLoaded = this.urlImageLoaded.getValue();
  
  console.log('Checking image loading status:', { avatarLoaded, urlLoaded });

  if (avatarLoaded && urlLoaded) {
    this.imageLoaded = true;
    this.checkLoadingComplete();
    this.cdr.detectChanges();
  }
}

// async refreshImages() {
//   await this.imageManagementService.loadUserImages(this.userId);
//   if (this.currentUser.imgUrl) {
//     await this.preloadImage(this.currentUser.imgUrl);
//   }
// }
// async refreshImages() {
//   try {
//     await this.imageManagementService.loadUserImages(this.userId);
//     if (this.currentUser.imgUrl) {
//       // Add a small delay before preloading image
//       await new Promise(resolve => setTimeout(resolve, 300));
//       await this.preloadImage(this.currentUser.imgUrl);
//     }
//   } catch (error) {
//     console.error('Error refreshing images:', error);
//   }
// }

async refreshImages(forceRefresh: boolean = false) {
  try {
    await this.imageManagementService.loadUserImages(this.userId);
    
    if (this.currentUser.imgUrl) {
      if (forceRefresh) {
        // Add cache-busting parameter to the URL
        const cacheBuster = `?t=${Date.now()}`;
        const baseUrl = this.currentUser.imgUrl.split('?')[0];
        await this.preloadImage(baseUrl + cacheBuster);
      } else {
        await this.preloadImage(this.currentUser.imgUrl);
      }
    }
  } catch (error) {
    console.error('Error refreshing images:', error);
  }
}

// private checkAllImagesLoaded(isInitialLoad: boolean) {
//   // Combine both loading states
//   if (this.avatarLoaded.getValue() && this.urlImageLoaded.getValue()) {
//     this.imageLoaded = true;
//     if (this.isInitialLoad) {
//       this.checkLoadingComplete();
//     }
//   }
// }

//   isImageUrlFilled(): boolean {
//   const imgUrlControl = this.profileForm.get('imgUrl');
  
//   const formValue = imgUrlControl?.value?.trim();
//   const isFilled = !!formValue;


//   if (isFilled) {
//     // Basic URL validation
//     try {
//       const url = new URL(formValue);
//       return url.protocol === 'http:' || url.protocol === 'https:';
//     } catch {
//       return false;
//     }
//   }
  
//   return false;
// }

isImageUrlFilled(): boolean {
  // this.imageNotFound = false;

  if (this.imageNotFound) return false;

  const imgUrlControl = this.pictureForm.get('imgUrl');
  if (!imgUrlControl) return false;
  
  const formValue = imgUrlControl.value?.trim();
  if (!formValue) return false;

  if (this._isFirebaseUrl(formValue)) {
    return !this.imageNotFound;
  }

  // For uploaded images (Firebase URLs)
  // if (formValue.includes('firebasestorage.googleapis.com')) return true;

  // For external URLs
  try {
    const url = new URL(formValue);
    const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';
    return isValidProtocol && !this.imageNotFound;
  } catch {
    return false;
  }
}

private _isFirebaseUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com');
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
    this.isDefaultPosition = false;
  
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
    
    setTimeout(() => {
      this.isDragging = false;
    }, 50);
  
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
    this.isDefaultPosition = true;
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

// getProfileImageStyles(): any {
//   let settings = this.currentUser.profilePictureSettings;
//   if (typeof settings === 'string') {
//     try {
//       settings = JSON.parse(settings);
//     } catch (e) {
//       console.error('Error parsing profilePictureSettings:', e);
//       settings = null;
//     }
//   }
//   // const imageUrl = this.currentUser.imgUrl;

//   console.log('getProfileImageStyles called', {
//     x: this.position.x,
//     y: this.position.y,
//     zoom: this.zoomLevel,
//     settings: this.currentUser.profilePictureSettings
//   });

//   const imageUrl = this.currentUser.imgUrl;
//   const proxiedUrl = imageUrl ? this.storageService.convertFirebaseUrl(imageUrl) : '';
//   console.log('Proxied URL:', proxiedUrl);
//   const x = this.position.x ?? settings?.x ?? 0;
//   const y = this.position.y ?? settings?.y ?? 0;
//   const zoom = this.zoomLevel ?? settings?.zoom ?? 1;

//   console.log({
//     original: imageUrl,
//     proxied: proxiedUrl,
//     isConverted: imageUrl !== proxiedUrl
//   });


//   // console.log("X is " + x);

//   // return {
//   //   'background-image': this.currentUser.imgUrl ? `url(${this.currentUser.imgUrl})` : 'none',
//   //   'background-position': `${x}px ${y}px`,
//   //   'background-repeat': 'no-repeat',
//   //   'background-size': `${zoom * 100}%`
//   // }

//   return {
//     // 'background-image': this.currentUser.imgUrl ? `url(${this.currentUser.imgUrl})` : 'none',
//     // 'background-position': `${x}% ${y}%`,
//     // 'background-repeat': 'no-repeat',
//     // 'background-size': `${this.zoomLevel * 100}%`
//     // 'background-image': imageUrl ? `url(${imageUrl}?${new Date().getTime()})` : 'none',
//     // 'background-position': `${this.position.x}% ${this.position.y}%`,
//     // 'background-repeat': 'no-repeat',
//     // 'background-size': `${this.zoomLevel * 100}%`
//     'background-image': proxiedUrl ? `url(${proxiedUrl})` : 'none',
//     'background-position': `${this.position.x}% ${this.position.y}%`,
//     'background-repeat': 'no-repeat',
//     'background-size': `${this.zoomLevel * 100}%`
//   };
// }

getProfileImageStyles(): any {
  let settings = this.currentUser.profilePictureSettings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      settings = {
        zoom: this.zoomLevel,
        x: this.position.x,
        y: this.position.y
      };
    }
  }

  // // Always use proxied URL for display
  // const imageUrl = this.currentUser.imgUrl;
  // // const proxiedUrl = imageUrl ? this.storageService.convertFirebaseUrl(imageUrl) : '';
  
  const imgUrl = this.pictureForm.get('imgUrl')?.value || this.currentUser.imgUrl;

  // let proxiedUrl = '';
  // if (imageUrl) {
  //   proxiedUrl = this.storageService.convertFirebaseUrl(imageUrl);
  //   // console.log('Converted to proxied URL:', proxiedUrl);
  // }
  // console.log('Converted to proxied URL:', proxiedUrl);

  const x = Number(this.position.x) || 0;
  const y = Number(this.position.y) || 0;
  const zoom = Number(this.zoomLevel) || 1;

  const styles = {
    // 'background-image': proxiedUrl ? `url(${proxiedUrl})` : 'none',
    'background-image': imgUrl ? `url(${imgUrl})` : 'none',
    'background-position': `${x}% ${y}%`,
    'background-repeat': 'no-repeat',
    'background-size': `${zoom * 100}%`,
    'background-color': '#c7ff20'
  };

  console.log('Computed styles:', styles);
  return styles;
}

// Add a helper method to determine if we're using a Firebase URL
private isFirebaseUrl(url: string): boolean | "" {
  return url && url.includes('firebasestorage.googleapis.com');
}

// // Update getProfileImageStyles
// getProfileImageStyles(): any {
//   const imageUrl = this.currentUser.imgUrl;
//   return {
//     'background-image': imageUrl ? `url(${imageUrl}?${new Date().getTime()})` : 'none',
//     'background-position': `${this.position.x}% ${this.position.y}%`,
//     'background-repeat': 'no-repeat',
//     'background-size': `${this.zoomLevel * 100}%`
//   };
// }


zoomIn() {
  if (this.zoomLevel < this.maxZoom) {
    this.zoomLevel += this.zoomStep;
    this.zoomLevel = Math.min(this.zoomLevel, this.maxZoom);
    this.isDefaultPosition = false;
    this.updateImageTransform();
  }
}

zoomOut() {
  if (this.zoomLevel > this.minZoom) {
    this.zoomLevel -= this.zoomStep;
    this.zoomLevel = Math.max(this.zoomLevel, this.minZoom);
    this.isDefaultPosition = this.zoomLevel === 1 && this.position.x === 0 && this.position.y === 0;
    this.updateImageTransform();
  }
}

onMouseEnter(button: string) {
  this.hoveredButton = button;
  this.isIconHovered = true;
  // Existing functionality for specific button actions
}


onMouseDown(button: string) {
  if (button === 'minus') {
    if (this.zoomLevel <= this.minZoom) return;
    this.isOutClicked = true;
    const minusIcon = document.querySelector('.zoomOut');
    minusIcon?.classList.add('clicked');
  } else if (button === 'plus') {
    if (this.zoomLevel >= this.maxZoom) return;
    this.isInClicked = true;
    const plusIcon = document.querySelector('.zoomIn');
    plusIcon?.classList.add('clicked');
  } else if (button === 'reset') {
    this.isResetClicked = true;
    const reset = document.querySelector('.reset');
    reset?.classList.add('clicked');
  } else if (button === 'left') {
    this.leftClicked = true;
    const reset = document.querySelector('.chevronLeft');
    reset?.classList.add('clicked');
  } else if (button === 'right') {
    this.rightClicked = true;
    const reset = document.querySelector('.chevronRight');
    reset?.classList.add('clicked');
  }
}

onMouseUp(button: string) {
  this.resetButtonState(button);
}

onMouseLeave(button: string) {
  this.hoveredButton = null;
  this.isIconHovered = false;
  this.resetButtonState(button);
}

isButtonHovered(button: string): boolean {
  return this.hoveredButton === button;
}

isDisabled(button: string): boolean {
  if (button === 'minus') return this.zoomLevel <= this.minZoom;
  if (button === 'plus') return this.zoomLevel >= this.maxZoom;
  if (button === 'reset') return this.isInDefaultPosition();
  return false;
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
  } else if (button === 'left') {
    this.leftClicked = false;
    const reset = document.querySelector('.chevronLeft');
    reset?.classList.remove('clicked');
  } else if (button === 'right') {
    this.rightClicked = false;
    const reset = document.querySelector('.chevronRight');
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

isInDefaultPosition(): boolean {
  return this.isDefaultPosition;
}
/*-----------------------------------------------------------------------*/

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

  ///// Error messages and style changes upon errors for all inputs /////
  getErrorMessage(controlName: string): string {
    let control;
    
    // Handle password form controls
    if (controlName === 'oldPassword') {
      control = this.passwordForm.get('oldPassword');
      if (!control) return '';
      
      if (this.authenticating) {
        return 'Authenticating...';
      }
      if (control.hasError('required')) {
        return 'Current password is required';
      }
      if (this.oldPasswordError) {
        return this.oldPasswordError;
      }
    } 
    else if (controlName === 'password' || controlName === 'confirmPassword') {
      const passwordGroup = this.passwordForm.get('passwordGroup');
      control = passwordGroup?.get(controlName);
      if (!control) return '';
  
      if (this.passwordMismatch && control.touched) {
        return 'Passwords do not match';
      }
      if (control.hasError('required')) {
        return 'Password is required';
      }
      if (control.hasError('minlength')) {
        return 'Must be at least 8 characters';
      }
      if (control.hasError('pattern')) {
        return 'Requirements not met';
      }
    }
    // Handle profile form controls
    else {
      control = this.profileForm.get(controlName);
      if (!control) return '';
  
      switch (controlName) {
        case 'name':
          if (control.hasError('required')) {
            return 'Required';
          }
          if (control.hasError('minlength')) {
            return 'Min 4 characters';
          }
          if (control.hasError('pattern')) {
            return 'Invalid';
          }
          break;
  
        case 'email':
          if (control.hasError('required')) {
            return 'Required';
          }
          if (control.hasError('email') || control.hasError('pattern')) {
            return 'Invalid Format';
          }
          if (control.hasError('emailExists')) {
            return 'Email already exists';
          }
          break;
  
        case 'dateOfBirth':
          if (control.hasError('required')) {
            return 'Date of birth is required';
          }
          if (control.hasError('pattern')) {
            return 'Invalid Format';
          }
          if (!this.isValidAge) {
          if (control.hasError('futureDate')) {
            return 'Invalid';
          }
          }
          break;
  
        case 'weight':
          if (control.hasError('pattern')) {
            return 'Invalid';
          }
          if (control.hasError('outOfRange')) {
            return 'Invalid Weight';
          }
          break;
  
        case 'height':
          if (control.hasError('pattern')) {
            return 'Invalid Height';
          }
          break;

          case 'imgUrl':
            control = this.profileForm.get('imgUrl');
            if (!control) return '';
            return this.getImageUrlErrorMessage(control);
  
          // case 'imgUrl':
          //   control = this.profileForm.get('imgUrl');
          //   if (!control) return '';
            
          //   // Show upload progress if uploading
          //   if (this.isUploading) {
          //     return `Uploading... ${this.uploadProgress}%`;
          //   }
        
          //   // Show retry message if retrying
          //   if (this.showRetryProgress) {
          //     return this.retryMessage;
          //   }
        
          //   // Various error states
          //   if (control.hasError('required')) {
          //     return 'Required';
          //   }
          //   if (control.hasError('pattern')) {
          //     return 'Invalid URL';
          //   }
          //   if (control.hasError('fileSize')) {
          //     return 'Max file size 5MB';
          //   }
          //   if (control.hasError('fileType')) {
          //     return 'Only .jpg, .jpeg, .png & .gif';
          //   }
          //   if (control.hasError('dimensions')) {
          //     return 'Min size 200x200 pixels';
          //   }
          //   if (control.hasError('uploadFailed')) {
          //     return 'Upload failed';
          //   }
          //   if (control.hasError('invalidImage')) {
          //     return 'Invalid file or URL';
          //   }
          //   if (control.hasError('networkError')) {
          //     return 'Network error.';
          //   }
          //   if (control.hasError('urlNotAccessible')) {
          //     return 'URL not accessible';
          //   }
          //   break;
      }
    }
  
    return 'Invalid Input';
  }

  shouldShowError(controlName: string): boolean {
    let control;
    
    if (controlName === 'oldPassword') {
      control = this.passwordForm.get('oldPassword');
      if (!control) return false;
      return (control.invalid && control.touched) || !!this.oldPasswordError;
    } 
    else if (controlName === 'password' || controlName === 'confirmPassword') {
      const passwordGroup = this.passwordForm.get('passwordGroup');
      control = passwordGroup?.get(controlName);
      const confirmPasswordControl = passwordGroup?.get('confirmPassword');
      if (!control) return false;
  
      if (controlName === 'password') {
        return (control.invalid && control.touched) || 
               (this.passwordMismatch && confirmPasswordControl!.touched);
      }
      return (control.invalid && control.touched) || 
             (this.passwordMismatch && control.touched);
    }
    else {
      control = this.profileForm.get(controlName);
      if (!control) return false;
  
      switch (controlName) {
        case 'name':
        case 'email':
          return (control.invalid && control.touched) || 
                 (controlName === 'email' && control.hasError('emailExists'));
        case 'dateOfBirth':
          return (!this.isValidAge && control.touched);
        case 'weight':
          return !this.isWeightValid() && control.touched;
        case 'height':
          return control.invalid && control.touched;
        default:
          return control.invalid && control.touched;
      }
    }
  }

  getInputStyle(controlName: string): { [key: string]: string } {
    let control;
    let isInvalid = false;
  
    if (controlName === 'oldPassword') {
      control = this.passwordForm.get('oldPassword');
      isInvalid = (control?.invalid && control?.touched) || 
                  !!this.oldPasswordError;
    } 
    else if (controlName === 'password' || controlName === 'confirmPassword') {
      const passwordGroup = this.passwordForm.get('passwordGroup');
      control = passwordGroup?.get(controlName);
      const confirmPasswordControl = passwordGroup?.get('confirmPassword');
  
      if (control) {
        if (controlName === 'password') {
          isInvalid = (control.invalid && control.touched) || 
                      (this.passwordMismatch && confirmPasswordControl!.touched);
        } else {
          isInvalid = (control.invalid && control.touched) || 
                      (this.passwordMismatch && control.touched);
        }
      }
    }
    else {
      control = this.profileForm.get(controlName);
      if (control) {
        const trimmedValue = control.value?.trim() || '';
        isInvalid = (control.invalid && control.touched) || 
                    (controlName === 'email' && control.hasError('emailExists')) ||
                    (!trimmedValue && control.touched);
      }
    }
  
    const styles: { [key: string]: string } = {
      'border-color': isInvalid ? 'red' : 'white',
      '--placeholder-color': isInvalid ? 'red' : 'white',
      'color': isInvalid ? 'red' : 'white',
      '--eye-icon-color': isInvalid ? 'red' : 'white',
      '--eye-icon-hover-color': isInvalid ? '#d01515' : '#c7ff20'
    };
  
    return styles;
  }

  getLabelStyle(controlName: string): { [key: string]: string } {
    let control;
    let isInvalid = false;
  
    if (controlName === 'oldPassword') {
      control = this.passwordForm.get('oldPassword');
      isInvalid = (control?.invalid && control?.touched) || 
                  !!this.oldPasswordError;
    } 
    else if (controlName === 'password' || controlName === 'confirmPassword') {
      const passwordGroup = this.passwordForm.get('passwordGroup');
      control = passwordGroup?.get(controlName);
      const confirmPasswordControl = passwordGroup?.get('confirmPassword');
  
      if (control) {
        if (controlName === 'password') {
          isInvalid = (control.invalid && control.touched) || 
                      (this.passwordMismatch && confirmPasswordControl!.touched);
        } else {
          isInvalid = (control.invalid && control.touched) || 
                      (this.passwordMismatch && control.touched);
        }
      }
    }
    else {
      control = this.profileForm.get(controlName);
      if (control) {
        switch (controlName) {
          case 'name':
          case 'email':
            const trimmedValue = control.value?.trim() || '';
            isInvalid = (control.invalid && control.touched) || 
                        (controlName === 'email' && control.hasError('emailExists')) ||
                        (!trimmedValue && control.touched);
            break;
          case 'dateOfBirth':
            isInvalid = !this.isValidAge && control.touched;
            break;
          case 'weight':
            isInvalid = !this.isWeightValid() && control.touched;
            break;
          case 'height':
            isInvalid = control.invalid && control.touched;
            break;
          default:
            isInvalid = control.invalid && control.touched;
        }
      }
    }
  
    return {
      'color': isInvalid ? 'red' : 'white',
    };
  }
/*-----------------------------------------------------------------------*/




///// Google Firebase Storage Functions for Profile Pictures /////
async onFileSelected(event: any) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  try {
    this.isUploading = true;
    
    // Upload and get proxied URL
    const displayUrl = await this.imageUrlManager.handleImageUpload(file, this.currentUser.userId!);
    
    // Update form with proxied URL
    this.pictureForm.patchValue({
      imgUrl: displayUrl
    });

    // Trigger change detection
    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error uploading file:', error);
    // Handle error appropriately
  } finally {
    this.isUploading = false;
  }
}

// async onFileSelected(event: Event) {
//   this.imageNotFound = false;

//   const file = (event.target as HTMLInputElement).files?.[0];
//   if (!file) return;

//   try {
//     // Get current Firebase user
//     const currentUser = this.firebaseService.getCurrentUser();
//     if (!currentUser) {
//       throw new Error('No authenticated user found');
//     }

//     this.isUploading = true;
//     this.uploadProgress = 0;

//     const stagedUrl = await this.firebaseService.uploadFile(
//       file,
//       this.userId,
//       'profileImages',
//       true // isStaged = true
//     );

//     // Store the old image URL for cleanup
//     const oldImageUrl = this.currentUser.imgUrl;

//     // Validate file
//     if (file.size > 5 * 1024 * 1024) {
//       throw new Error('File size exceeds 5MB limit');
//     }

//     const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
//     if (!validTypes.includes(file.type)) {
//       throw new Error('Invalid file type. Please use JPG, PNG or GIF');
//     }

//     // Let the Firebase service handle the upload using the backend-generated URL
//     const downloadURL = await this.firebaseService.uploadFile(file, this.userId, 'profileImages');


//     // Convert to proxied URL for display
//     const proxiedUrl = this.storageService.convertFirebaseUrl(downloadURL);
//     console.log('Proxied URL:', proxiedUrl);

//     // Update form with proxied URL
//     // this.pictureForm.patchValue({
//     //   imgUrl: proxiedUrl
//     // }, { emitEvent: false });
//     if (this.currentUser.imgUrl !== proxiedUrl) {
//       this.pictureForm.patchValue({
//         imgUrl: proxiedUrl
//       }, { emitEvent: false });
//     }

//     // Prepare user update with current settings
//     const currentSettings = this.currentUser.profilePictureSettings || {
//       zoom: this.zoomLevel,
//       x: this.position.x,
//       y: this.position.y
//     };

//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: downloadURL,
//       profilePictureSettings: currentSettings
//     };

//     // Update user in database
//     await this.userService.updateUser(updatedUser).toPromise();

//     // Update local state
//     this.ngZone.run(() => {
//       this.currentUser.imgUrl = downloadURL;
//       this.resetImagePositionAndZoom();
//       this.isUploading = false;
//       this.uploadProgress = 0;
      
//       const profileImg = this.profileImg?.nativeElement;
//       if (profileImg) {
//         profileImg.style.backgroundImage = `url(${proxiedUrl}?${new Date().getTime()})`;
//       }
      
//       this.pictureForm.markAsDirty();
//       this.pictureForm.markAsTouched();
//       this.pictureForm.updateValueAndValidity();
      
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Upload failed:', error);
//     this.handleUploadError(error);
//   } finally {
//     // Reset file input
//     const fileInput = event.target as HTMLInputElement;
//     if (fileInput) {
//       fileInput.value = '';
//     }
//   }
// }

private handleUploadError(error: any) {
  this.ngZone.run(() => {
    this.isUploading = false;
    this.uploadProgress = 0;
    
    if (error instanceof Error) {
      const imgUrlControl = this.pictureForm.get('imgUrl');
      if (error.message.includes('size')) {
        imgUrlControl?.setErrors({ 'fileSize': true });
      } else if (error.message.includes('type')) {
        imgUrlControl?.setErrors({ 'fileType': true });
      } else if (error.message.includes('auth')) {
        imgUrlControl?.setErrors({ 'unauthorized': true });
      } else {
        imgUrlControl?.setErrors({ 'uploadFailed': true });
      }
    }
    
    this.cdr.detectChanges();
  });
}

// Helper method for deleting old images
private async deleteOldImage(oldImageUrl: string): Promise<void> {
  try {
    if (!oldImageUrl || !oldImageUrl.includes('firebasestorage.googleapis.com')) {
      return;
    }

    // Extract the path from the Firebase Storage URL
    const urlObj = new URL(oldImageUrl);
    const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    
    // Create reference to old file
    const oldFileRef = ref(storage, path);
    
    try {
      // Delete the file
      await deleteObject(oldFileRef);
      console.log('Old image deleted successfully');
    } catch (error) {
      if ((error as any)?.code === 'storage/object-not-found') {
        console.log('Old image already deleted or not found');
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting old image:', error);
    throw error;
  }
}
  
    // Add these properties to track retry state
    get retryMessage(): string {
      if (this.retryCount === 0) return '';
      return `Retry attempt ${this.retryCount} of ${this.maxRetries}...`;
    }
  
    get showRetryProgress(): boolean {
      return this.isUploading && this.retryCount > 0;
    }
  
    // Image compression method
    private compressImage(file: File, maxWidthOrHeight = 1200, quality = 0.8): Promise<File> {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidthOrHeight) {
              height = Math.round((height * maxWidthOrHeight) / width);
              width = maxWidthOrHeight;
            }
          } else {
            if (height > maxWidthOrHeight) {
              width = Math.round((width * maxWidthOrHeight) / height);
              height = maxWidthOrHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            }
          }, 'image/jpeg', quality);
        };
      });
    }

  async initializeImageNavigation() {
    await this.imageManagementService.loadUserImages(this.userId);
    this.imageManagementService.getImageCount(this.userId).subscribe(count => {
      this.imageCount = count;
      this.showImageNavigation = count > 1;
    });

    this.imageManagementService.getCurrentImage(this.userId).subscribe(url => {
      if (url) {
        this.currentUser.imgUrl = url;
        this.updateImageTransform();
      }
    });
  }

  async deleteCurrentImage() {
    try {
      await this.imageManagementService.deleteCurrentImage(this.userId);
      if (this.imageCount === 0) {
        this.currentUser.imgUrl = null;
        this.resetImage();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  nextImage() {
    this.imageManagementService.nextImage(this.userId);
  }

  previousImage() {
    this.imageManagementService.previousImage(this.userId);
  }

// Update progress tracking
private _uploadProgress = 0;
@Input() set checkUploadProgress(value: number) {
    this._uploadProgress = value;
    this.cdr.detectChanges();
}

get checkUploadProgress(): number {
  return this._uploadProgress;
}

private initializeLoadingState() {
    this.avatarLoaded.subscribe(loaded => {
      console.log('Avatar loaded:', loaded);
      this.checkAllImagesLoaded(this.isInitialLoad);
    });
  
    this.urlImageLoaded.subscribe(loaded => {
      console.log('URL image loaded:', loaded);
      this.checkAllImagesLoaded(this.isInitialLoad);
    });
  }  
}  
/*-----------------------------------------------------------------------*/


  // }

import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Renderer2, NgZone, Input } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash, faAngleDown, faPlus, faMinus, faChevronLeft, faChevronRight} from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, filter, firstValueFrom, Subject, Subscription, switchMap, takeUntil, tap, throwError, timeout } from 'rxjs';
import { passwordMatchValidator } from 'src/app/shared/Multi-Step-Form/form/form.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { auth } from 'src/app/firebase.config';
import { FirebaseService } from 'src/app/services/firebase.service';
import { StorageService } from 'src/app/services/storage.service';
import { ImageManagementService } from 'src/app/services/imagemanagement.service';
import { ImageUrlManagerService } from 'src/app/services/imageurlmanager.service';
import { AuthService } from 'src/app/services/auth.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ImageProxyService } from 'src/app/services/image-proxy.service';

enum ProfileState {
  Viewing,
  EditingProfile,
  ChangingPicture,
  ChangingPassword,
  DeletingProfile
}

interface UploadState {
  isUploading: boolean;
  imageUrl: string | null;
  progress: number;
  error: string | null;
}

interface ImageStyles {
  'background-image': string;
  'background-position': string;
  'background-repeat': string;
  'background-size': string;
  'background-color': string;
  opacity?: number;           
  transition?: string;  
}     

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [
    trigger('fadeInOut', [
            transition(':enter', [
              style({ opacity: 0 }),
              animate('100ms ease-in', style({ opacity: 1 }))
            ])
      ]),
      trigger('fadeInControls', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('300ms ease-in', style({ opacity: 0.8 }))
        ])
      ]),
      trigger('fadeInImage', [
        state('hidden', style({ opacity: 0 })),
        state('visible', style({ opacity: 1 })),
        transition('hidden => visible', [
          animate('300ms ease-in')
        ]),
      transition('visible => hidden', [
        animate('300ms ease-out')
        ])
      ]),
      trigger('fadeInReset', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('300ms ease-in', 
            style({ opacity: '{{finalOpacity}}' })
          )
        ])
      ]),
      trigger('fadeInCircularNav', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('300ms ease-in', style({ opacity: 1 }))
        ])
      ]),
      trigger('slideAnimation', [
        // Base states
        state('current', style({
          transform: 'translateX(0) translateZ(0)',
          zIndex: 1,
          opacity: 1
        })),
        
        // Next image states
        state('next', style({
          transform: 'translateX(100%) translateZ(0)',
          zIndex: 2,
          opacity: 1
        })),
        state('slideOutLeft', style({
          transform: 'translateX(-100%) translateZ(0)',
          zIndex: 1,
          opacity: 1
        })),
        
        // Previous image states
        state('prev', style({
          transform: 'translateX(-100%) translateZ(0)',
          zIndex: 2,
          opacity: 1
        })),
        state('slideOutRight', style({
          transform: 'translateX(100%) translateZ(0)',
          zIndex: 1,
          opacity: 1
        })),
        
        // Common destination state
        state('slideIn', style({
          transform: 'translateX(0) translateZ(0)',
          zIndex: 2,
          opacity: 1
        })),
  
        // Transitions
        transition('current => slideOutLeft', [
          animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
        ]),
        transition('current => slideOutRight', [
          animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
        ]),
        transition('next => slideIn', [
          animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
        ]),
        transition('prev => slideIn', [
          animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
        ]),
          // State resetting
          transition('* => current', [
            animate('0ms')
          ]),
          transition('* => next', [
            animate('0ms')
          ]),
          transition('* => prev', [
            animate('0ms')
          ])
      ])  
  ]
})

export class ProfileComponent implements OnInit {

  // ----------------------
  // ViewChild References
  // ----------------------
  @ViewChild('container', { static: false }) container!: ElementRef<HTMLElement>;
  @ViewChild('profileImg', { static: false, read: ElementRef }) profileImg!: ElementRef<HTMLElement>;
  @ViewChild('urlInput') urlInput!: ElementRef;

  // ----------------------
  // Enum and Constants
  // ----------------------
  ProfileState = ProfileState;
  readonly ANIMATION_DURATION = 400; // in milliseconds
  private readonly MAX_RETRIES = 3;
  maxRetries: number = 3;
  readonly TYPING_DEBOUNCE = 500;
  circleStrokeWidth = 4;
  baseUrl: string = "http://localhost:3000/";

  // ----------------------
  // Component State
  // ----------------------
  currentState: ProfileState = ProfileState.Viewing;
  currentUser: User = new User();
  userId!: string;
  UserId: string = '';
  firstName?: string;
  monthOrYear!: string;
  displayHeight: string = '';
  userIsLoggedIn: boolean = false;
  cartQuantity = 0;
  loadingComplete = false;
  imageLoaded = false;
  
  // ----------------------
  // Subscription Management
  // ----------------------
  private subscriptions: Subscription = new Subscription();
  private subscription: Subscription = new Subscription();
  private formSubscription: Subscription | null = null;
  private progressSubscription?: Subscription;
  private styleSubscription?: Subscription;

  // ---------------------- 
  // Subject Management
  // ----------------------
  private destroy$ = new Subject<void>();
  private imageUrlDebouncer = new Subject<string>();
  private stateUpdateDebouncer = new Subject<void>();
  private avatarLoaded = new BehaviorSubject<boolean>(false);
  private urlImageLoaded = new BehaviorSubject<boolean>(false);

  // ----------------------
  // Forms
  // ----------------------
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  pictureForm!: FormGroup;

  // ----------------------
  // Tier Status
  // ----------------------
  tierOne = false;
  tierTwo = false;
  tierThree = false;
  freeTier = true;

  // ----------------------
  // Password Management
  // ----------------------
  passwordMismatch: boolean = false;
  isPopupVisible: boolean = false;
  passwordVisible = false;
  isUpdatingPassword!: boolean;
  oldPasswordVisible = false;
  oldPasswordError: string = '';
  authenticating: boolean = false;
  isOldPasswordCorrect: boolean = false;
  updatePassword = false;

  // ----------------------
  // Height/Weight/Age Validation
  // ----------------------
  heightPattern = /^(\d+(\.\d+)?|\d+'\d+"?)$/;
  heightTouched = false;
  heightFeet!: number;
  heightInches!: number;
  isValidAge: boolean = true;
  twentyOneError: boolean = false;

  // ----------------------
  // Subscription Management
  // ----------------------
  buttonText: string = 'Cancel Subscription';
  isProcessingGoodbye: boolean = false;
  classAppliedDeleteProfile = false;
  isProcessingCancel: boolean = false;

  // ----------------------
  // Email Validation
  // ----------------------
  emailExists: boolean = false;
  isWaitingToCheck = false;
  isInClicked = false;
  isOutClicked = false;
  isResetClicked = false;

  // ----------------------
  // Image State
  // ----------------------
  imageNotFound = false;
  imageLoadedSuccessfully = false;
  isImageLoaded = false;
  firebaseImageLoaded: boolean = false;
  imageState: 'hidden' | 'visible' = 'hidden';
  hasProfilePictureTransitioned = false;
  initialProfileUrl?: string | null = null;
  selectedProfileUrl?: string | null = null;
  showUploadSuccess: boolean = false;
  externalUrlError: boolean = false;
  currentImageUrl: string | null = null;
  public profileImageUrl: string | null = null;
  
  // ----------------------
  // Icon State
  // ----------------------
  isIconHovered = false;
  hoveredButton: string | null = null;

  // ----------------------
  // Animation State
  // ----------------------
  firstTimeAnimation: boolean = true;
  controlsAnimationComplete: boolean = false;
  imageAnimationComplete: boolean = false;
  controlsAnimated: boolean = false;
  controlsAnimationTimeout: any = null;
  controlsVisible: boolean = false;
  private animationFrame: number | null = null;
  private animationTimeout: any;
  private transitionTimeout: any;
  private isStateTransitioning = false;
  isAnimating: boolean = false;
  private animationLock = false;
  private animationPromise: Promise<void> | null = null;
  private isInitialChangingPictureState: boolean = false;

  // ----------------------
  // Loading State
  // ----------------------
  private isInitialLoad = true;
  tooltipDisabled = false;
  retryCount: number = 0;
  isLoadingImages = false;
  private isInitialLoadComplete = false;
  private _loadingImageCount: number | null = null;
  private isCancelled = false;
  private allImagesLoaded = false;
  private stableImageCount: number = 0;
  private hasInitialChangingPictureState: boolean = false;

  // ----------------------
  // Image Navigation
  // ----------------------
  showImageNavigation = false;
  imageCount = 0;
  currentImageIndex = 0;
  prevIndex: number = 0;
  currentIndex: number = 0;
  direction = 1; // 1 for next, -1 for previous
  rightClicked = false;
  leftClicked = false;
  showSegments = false;
  hasStartedNavigating = false;
  navigationUnavailable: boolean = false;
  private isNavigating = false;
  private lastDirection: 'next' | 'prev' | null = null;
  showButton = true;
  slideDirection: 'left' | 'right' | null = null;
  
  // ----------------------
  // Image Styles and Animation
  // ----------------------
  imageStyles: any = null;
  nextImageStyles: any = null;
  private isImageUrlChanged = false;
  private originalProfileImage: string | null = null;
  private imageTransformCache: { url: string; styles: any } | null = null;
  private cachedStyles: any = null;
  currentImageState = 'current';
  nextImageState = 'next';
  isTransitioning = false;
  private imageQueue: string[] = [];
  isSlidingLeft = false;
  isSlidingRight = false;
  xDirection!: string;
  showCurrent = true;
  showNext = false;
  currentSlideState = 'in';
  nextSlideState = 'outRight';
  
  // ----------------------
  // Image Manipulation
  // ----------------------
  isDragged: boolean = false;
  isDragging = false;
  private startX = 0;
  private startY = 0;
  position: { x: number, y: number } = { x: 0, y: 0 };
  zoomLevel: number = 1;
  minZoom: number = 1;
  maxZoom: number = 2;
  zoomStep: number = 0.1;
  isDefaultPosition: boolean = true;
  isZooming = false;
  private _initialDragPosX: number = 0;
  private _initialDragPosY: number = 0;
  private originalPosition: { x: number; y: number } | null = null;
  private originalZoom: number | null = null;
  transitionProgress = 0;
  
  // ----------------------
  // Device Detection
  // ----------------------
  isMobile = false;
  isTablet = false;

  // ----------------------
  // Upload and File Management
  // ----------------------
  isUploading = false;
  uploadProgress = 0;
  isSavingPicture = false;
  private isUploadingOrPasting = false;
  private isProcessingUrl = false;
  private lastValidUrl: string | null = null;
  private currentInputValue: string = '';
  private isTyping = false;
  private typingTimeout: any;
  private lastTypedValue = '';
  stagingImageUrl: string | null = null;
  permanentImageUrl: string | null = null;
  isImageStaged: boolean = false;
  stagedFileName: string | null = null;
  onlyFirebaseImageCount: number = 0;
  private hasFirebaseImages = false;
  providerUrlPasted = false;
  
  // ----------------------
  // Event Listeners and Handlers
  // ----------------------
  private moveListener!: () => void;
  private upListener!: () => void;
  private touchMoveListener!: () => void;
  private touchEndListener!: () => void;
  keydownHandler: (event: KeyboardEvent) => void;
  
  // ----------------------
  // Cache Management
  // ----------------------
  private convertedUrlCache = new Map<string, string>();
  
  // ----------------------
  // Promise Management
  // ----------------------
  private imagePreloadPromise: Promise<void> | null = null;
  private avatarLoadPromise: Promise<void> | null = null;
  
  // ----------------------
  // FontAwesome Icons
  // ----------------------
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faAngleDown = faAngleDown;
  faPlus = faPlus;
  faMinus = faMinus;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  
  // ----------------------
  // Upload State Management
  // ----------------------
  private uploadState: UploadState = {
    isUploading: false,
    imageUrl: null,
    progress: 0,
    error: null
  };
  
  // ----------------------
  // DOM Observers
  // ----------------------
  private resizeObserver: ResizeObserver | null = null;
  
  // ----------------------
  // Misc State
  // ----------------------
  canHoverDelete: boolean = false;
  hoverCount: number = 0;

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
    public imageManagementService: ImageManagementService,
    private imageUrlManager: ImageUrlManagerService,
    private authService: AuthService,
    private imageProxyService: ImageProxyService
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

    // Clear staged image on page reload or navigation away from page
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.cleanupStagedImage();
    });

    // Check if the device is a mobile phone
    this.isMobile = window.innerWidth <= 937;
    window.addEventListener('touchstart', () => {
    this.isMobile = window.innerWidth <= 937;
    this.cdr.detectChanges();
    });

    // Check if the device is a tablet
    window.addEventListener('touchstart', () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      this.isTablet = isTouchDevice && (window.innerWidth > 937 && window.innerWidth <= 1366);
      this.cdr.detectChanges();
    });
  }

  async ngOnInit() {
  
    this.loadingComplete = false;
    this.imageLoaded = false;
    this.initializePictureForm();
    this.initializeForms();
    this.hoverCount = 0;
    this.showUploadSuccess = false;
    this.initializeLoadingState();
    this.initialProfileUrl = this.currentUser.imgUrl;
    this.storageService.invalidateUrlCache(this.userId);
    this.pictureForm.get('imgUrl')?.valueChanges.subscribe(newUrl => {
      if (newUrl && this.currentState === ProfileState.ChangingPicture) {
        this.selectedProfileUrl = newUrl;
      }
    });
    // this.checkIfMobile();
    
    try {
      // Start preloading images immediately
      // this.imagePreloadPromise = this.preloadAllImages();

      const subject = this.imageManagementService.getUserImagesSubject(this.userId);
      const loadedUrls = subject?.value?.urls || [];

      await this.imageManagementService.initializeImagesCount(this.userId);

      // 3. Start preloading those images
      this.imagePreloadPromise = this.preloadAllImages(loadedUrls);
      
      // Step 1: Check auth token
      const token = await Promise.race([
        this.authService.waitForToken(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token timeout')), 5000)
        )
      ]);
  
      if (!token) {
        this.router.navigate(['/content', this.userId]);
        return;
      }
  
      // Step 2: Verify login status
      const isLoggedIn = await firstValueFrom(
        this.userService.isloggedIn()
      );
  
      if (!isLoggedIn) {
        this.router.navigate(['/content', this.userId]);
        return;
      }
  
      // Step 3: Get and validate userId
      const routeUserId = this.actRoute.snapshot.paramMap.get('id');
      if (!routeUserId) {
        this.router.navigate(['/content', this.userId]);
        return;
      }
  
      this.userId = routeUserId;

      await this.imageManagementService.refreshFirebaseImageCount(this.userId);
      const hasImages = await this.imageManagementService.checkAndUpdateFirebaseImageCount(this.userId);

      // Now debug storage with the correct userId
      await this.imageManagementService.debugStorageContents(this.userId);

      // Set up image management
      this.imageManagementService.getCurrentImage(this.userId)
        .pipe(
          switchMap(async (url) => {
            if (!url) return null;
            return this.getDisplayUrl(url);
          }),
          takeUntil(this.destroy$)
        )
        // .subscribe(url => {
        //   if (url) {
        //     this.currentImageUrl = url;
        //     this.updateImageDisplay(url);
        //   }
        // });
        .subscribe(url => {
          if (url) {
            this.currentImageUrl = url;
            // Update form with current URL
            this.pictureForm.patchValue({
              imgUrl: url
            }, { emitEvent: false });
            this.updateImageDisplay(url);
          }
        });

      this.isInitialLoadComplete = true;
  
      // Set up progress subscription
      this.progressSubscription = this.firebaseService.getUploadProgress()
        .subscribe(progress => {
          this.ngZone.run(() => {
            this.uploadProgress = progress.progress;
            this.cdr.detectChanges();
          });
        });

      // Check the number of images in firebase folder
      this.imageManagementService.hasFirebaseImages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasImages => {
        this.hasFirebaseImages = hasImages;
        this.cdr.detectChanges();
      });
  
      // Handle Firebase auth state
      auth.onAuthStateChanged((user) => {
        if (!user) {
          console.error('User not authenticated');
        }
      });
  
      // Handle animations
      const hasVisited = localStorage.getItem('hasVisitedProfileBefore');
      if (!hasVisited) {
        this.triggerAnimations();
        localStorage.setItem('hasVisitedProfileBefore', 'true');
      } else {
        this.skipAnimations();
      }
  
      // Load profile and initialize forms
      await this.loadProfile();
      this.setupImageUrlSubscription();
  
      // Set up router and cart subscriptions
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.UpdateStatus();
        }
      });
  
      this.cartService.getCartObservable().subscribe((newCart) => {
        this.cartQuantity = newCart.totalCount;
      });
  
      // Initialize event listeners
      this.initializeEventListeners();
      this.checkOldPassword();
  
      // Set up password group subscriptions
      this.passwordGroup.get('passwordGroup')?.valueChanges.pipe(
        debounceTime(1500),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.checkPasswords();
      });
  
      this.passwordGroup.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.passwordGroup.updateValueAndValidity({ emitEvent: false });
        this.cdr.detectChanges();
      });
  
      // Set up URL debouncer
      this.imageUrlDebouncer.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(async (newValue) => {
        this.handleDebouncedUrlChange(newValue);
      });
  
      // Set up state update debouncer
      this.stateUpdateDebouncer.pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.cdr.detectChanges();
      });
  
      // Wait for images to finish loading
      await this.imagePreloadPromise;
      
      // Set loading states
      this.allImagesLoaded = true;
      this.finishLoading();

      this.pictureForm.get('imgUrl')?.valueChanges.subscribe(newUrl => {
        if (newUrl && this.currentState === ProfileState.ChangingPicture) {
          this.selectedProfileUrl = newUrl;
        }
      });
  
    } catch(error: any) {
      console.error('Error initializing profile:', error);
      if (error.name === 'TimeoutError') {
        console.log('Request timed out');
      }
      // Ensure loading completes even on error
      this.loadingComplete = true;
      this.imageLoaded = true;
      this.allImagesLoaded = true;
      this.cdr.detectChanges();
      this.router.navigate(['/content', this.userId]);
    }
  }

  ngAfterViewInit() {
  
    setTimeout(() => {
      this.setupDragListeners();
      this.initializeDragging();
      this.updateImageTransform();
      // this.imageManagementService.hasAnyFirebaseImages();
      // this.imageManagementService.loadUserImages(this.userId);
      // this.initializeImageNavigation();
      this.cdr.detectChanges();
    }, 0);

    if (this.profileImg && this.profileImg.nativeElement) {
      this.renderer.setStyle(this.profileImg.nativeElement, 'background-size', 'cover');
      this.renderer.setStyle(this.profileImg.nativeElement, 'background-repeat', 'no-repeat');
      // Set an initial size larger than the visible area
      this.renderer.setStyle(this.profileImg.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.profileImg.nativeElement, 'height', '100%');
    }

    if (this.profileImg?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.cdr.detectChanges();
      });
      this.resizeObserver.observe(this.profileImg.nativeElement);
    }
  }

  async ngOnDestroy(): Promise<void> {
 
    try {
      if (this.currentState === ProfileState.ChangingPicture && 
        this.userId && 
        this.firebaseService.hasStagedFile(this.userId)) {
      await this.firebaseService.cleanupStagedFile(this.userId);
    }
    } catch (error) {
      console.error('Error in ngOnDestroy cleanup:', error);
    } finally {
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

      // this.firebaseService.cleanupStagedFile(this.userId);

      if (this.styleSubscription) {
        this.styleSubscription.unsubscribe();
      }
      this.subscriptions.unsubscribe();
      this.imageUrlDebouncer.complete();

      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
      }
    }

    this.controlsAnimationComplete = false;
    this.imageAnimationComplete = false;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    window.removeEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 937;
    });

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    if (this.controlsAnimationTimeout) {
      clearTimeout(this.controlsAnimationTimeout);
    }

    this.forceUnlockAnimation();
  }


  ////////////////////// PAGE LOAD & FORM RELATED FUNCTIONS ////////////////////// 

  /**
   * Loads user profile data from the server, sets up component state,
   * initializes profile picture settings, and triggers image loading.
   **/
  async loadProfile(): Promise<void> {
    // Initial state setup - reset loading flags
    this.isInitialLoad = true;
    this.loadingComplete = false;
    this.allImagesLoaded = false;
    this.imageLoaded = false;
    this.imageLoadedSuccessfully = false; 
    this.imageNotFound = false;

    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
    this.userId = UserId;

    try {
      // Clear URL cache on load to ensure fresh URLs
      this.storageService.invalidateUrlCache(this.userId);
      
      // Retrieve the URLs from the subject
      const subject = this.imageManagementService.getUserImagesSubject(this.userId);
      const loadedUrls = subject?.value?.urls || [];
  
      // Start preloading those images in the background
      this.imagePreloadPromise = this.preloadAllImages(loadedUrls);

      // Get user data first from server
      const user: any = await firstValueFrom(this.userService.getUser(this.userId));
      
      // Update component state with user data
      this.currentUser = {
        ...user,
        paymentFrequency: user.billing
      };
      
      const displayName = this.currentUser.name;
      this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

      await this.ngZone.run(async () => {
        try {
          // Handle image URL and settings first
          let displayUrl = '';
          if (this.currentUser.imgUrl) {
            try {
              // Convert URL with proper error handling and token refresh
              displayUrl = await this.convertAndDisplayUrl(this.currentUser.imgUrl);
              
              // Verify URL works by preloading it with auth
              await this.preloadImageWithAuth(displayUrl);
              
              this.imageStyles = this.getUpdatedStyles(displayUrl);

              // Set the current profile image in ImageManagementService
              this.imageManagementService.setCurrentProfileImage(this.currentUser.imgUrl);
            } catch (urlError) {
              console.error('Error converting URL:', urlError);
              // Continue with other settings, but we'll reset image later
            }
            
            // Parse and apply profile picture settings
            if (typeof this.currentUser.profilePictureSettings === 'string') {
              try {
                this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
              } catch (e) {
                console.error('Error parsing profilePictureSettings:', e);
                this.currentUser.profilePictureSettings = null;
              }
            }

            // Apply position and zoom settings if available
            if (this.currentUser.profilePictureSettings) {
              this.position = {
                x: this.currentUser.profilePictureSettings.x || 0,
                y: this.currentUser.profilePictureSettings.y || 0
              };
              this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
              this.isDragged = this.position.x !== 0 || this.position.y !== 0;
              
              // Apply transforms immediately
              await this.updateImageTransform();
            } else {
              this.resetImagePositionAndZoom();
            }

            // If we have a valid display URL, update the image display (with auth handling)
            if (displayUrl) {
              // Start actual image loading process - IMPORTANT: This needs to be awaited
              // to ensure loading spinner stays visible until image is loaded
              await this.updateImageDisplay(displayUrl, true);
            } else {
              // If URL conversion failed, reset to avatar
              this.resetImage();
            }
          } else {
            // No profile image, set default styles
            this.imageStyles = this.getUpdatedStyles();
            this.imageLoaded = true;
          }

          // Update profile form values with user data
          this.profileForm.patchValue({
            ...this.currentUser,
            imgUrl: displayUrl,
            profilePictureSettings: this.currentUser.profilePictureSettings,
            isGoogleAuth: this.currentUser.isGoogleAuth
          });

          // Update picture form value with user data
          this.pictureForm.patchValue({
            imgUrl: displayUrl,
            profilePictureSettings: this.currentUser.profilePictureSettings
          }, { emitEvent: false });

          // Handle Google Auth state - disable email/password fields
          if (this.currentUser.isGoogleAuth) {
            this.profileForm.get('email')?.disable();
            this.passwordForm.get('oldPassword')?.disable();
            this.passwordForm.get('passwordGroup')?.disable();
          } else {
            this.profileForm.get('email')?.enable();
          }

          await this.updateFormWithUserData();

          // Format height display
          if (this.currentUser.height) {
            this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
          }

          // Set tier flags for tier specific UI styling
          if (this.currentUser.tier === 'Just Looking') {
            this.tierOne = true;
            this.tierTwo = false;
            this.tierThree = false;
          } else if (this.currentUser.tier === 'Motivated') {
            this.tierOne = false;
            this.tierTwo = true;
            this.tierThree = false;
          } else {
            this.tierOne = false;
            this.tierTwo = false;
            this.tierThree = true;
          }

          this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
          this.freeTier = this.currentUser.tier === 'Just Looking';

          // Wait for all images to finish loading including the background preloading
          await Promise.all([
            this.imagePreloadPromise,
            new Promise(resolve => requestAnimationFrame(resolve))
          ]);

          // Set final states
          this.allImagesLoaded = true;
          
          // Ensure UI is ready before finishing load
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          // This will check DOM to ensure image is actually visible before hiding spinner
          this.finishLoading();
          
        } catch (error) {
          console.error('Error in loading process:', error);
          this.resetImage(); // Ensure fallback to avatar on any errors
        }
      });

      // Get the count of only permanent storage images
      const { count } = await this.imageManagementService.getInitialImageCount(this.userId);
      
      this.onlyFirebaseImageCount = count; // This counts only permanent storage images
      this.imageCount = count;

    } catch (error) {
      // Handle critical errors by completing loading process anyway
      console.error('Error loading user profile:', error);
      this.loadingComplete = true;
      this.imageLoaded = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * Reloads the user profile data from the server and updates the component state.
   * Used when profile is updated to ensure the UI reflects current data.
   **/
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

  /**
   * Preloads an image with authentication headers if needed.
   * Used to validate image URLs and ensure they can be accessed.
   **/
  private preloadImageWithAuth(url: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (url.includes('/api/storage/')) {
          const headers = await this.storageService.getAuthHeaders();
          const response = await fetch(url, { headers, method: 'HEAD' });
          if (!response.ok) reject(new Error('Image preload failed'));
        } else {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image preload failed'));
          img.src = url;
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Loads an image with authentication token attached as a query parameter.
   * Creates a URL with auth token for images that require authentication.
   **/
  private async loadImageWithAuth(imgElement: HTMLImageElement, url: string): Promise<void> {
    const headers = await this.storageService.getAuthHeaders();
    const token = headers['Authorization'];
    
    // For background-image in CSS, we need a special approach
    // Create URL with auth param for CSS background (not ideal but functional)
    // Better option would be to configure your backend to accept Authorization via cookie
    const urlWithAuth = `${url}?auth=${encodeURIComponent(token.replace('Bearer ', ''))}`;
    
    // Set the source with auth parameter
    imgElement.src = urlWithAuth;
    
    return new Promise<void>((resolve, reject) => {
      imgElement.onload = () => resolve();
      imgElement.onerror = () => reject(new Error('Failed to load authenticated image'));
    });
  }

  /**
   * Updates form values with the current user data.
   * Ensures form reflects the latest user information.
   **/
  updateFormWithUserData(): void {
    const displayUrl = this.currentUser.imgUrl ? 
    this.storageService.convertFirebaseUrl(this.currentUser.imgUrl) : '';

    this.profileForm.patchValue({
      name: this.currentUser.name,
      email: this.currentUser.email,
      dateOfBirth: this.currentUser.dateOfBirth,
      gender: this.currentUser.gender,
      weight: this.currentUser.weight,
      height: this.currentUser.height,
      goals: this.currentUser.goals,
      imgUrl: displayUrl,
      isGoogleAuth: this.currentUser.isGoogleAuth
    });

    this.pictureForm.patchValue({
      imgUrl: displayUrl
    });  

    // Update other form controls here

    this.profileForm.get('name')?.updateValueAndValidity();
    this.profileForm.get('email')?.updateValueAndValidity();

    this.cdr.detectChanges();
  }

  /**
   * Checks if the email field should be disabled.
   * Disables email editing for users authenticated through Google.
   **/
  isEmailDisabled(): boolean {
    return this.profileForm.get('isGoogleAuth')?.value === true;
  }

  /**
   * Initializes the form for changing profile picture.
   * Sets up initial values and validators.
   **/
  initializePictureForm() {
    this.pictureForm = this.fb.group({
      imgUrl: [this.currentUser.imgUrl]
    });
  }

  /**
   * Synchronizes form values with currentUser object.
   * Ensures data consistency between form and model.
   **/
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

  /**
   * Saves the updated profile information to the server.
   * Validates the form before submission and handles response.
   **/
  saveProfile() {
    if (this.isFormValid('profile')) {
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

      this.userService.updateUser(updatedUser).subscribe(
        (response) => {
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

  /**
   * Checks if all required images are loaded and updates loading state.
   * Controls the visibility of loading spinners.
   **/
  private checkLoadingComplete(): void {
    const allLoaded = this.imageLoaded && 
                    this.avatarLoaded.getValue() && 
                    this.urlImageLoaded.getValue() &&
                    this.allImagesLoaded;
                    
    if (allLoaded) {
      this.finishLoading();
    } else {
      throw("Error during loading")
    }
  }

  /**
   * Initiates the profile deletion process with visual feedback.
   * Shows a deletion confirmation with animation before actual deletion.
   **/
  goodbye() {
    this.buttonText = 'Deleting Profile...';
    setTimeout(() => {
      this.buttonText = 'Goodbye';
    }, 1000);
    setTimeout(() => {
      this.deleteProfileUser();
    }, 2000);
  }

  /**
   * Permanently deletes the user's profile and all associated data.
   * Logs the user out and redirects to home page.
   **/
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

  /**
   * Updates the user's login status by checking auth state.
   * Sets up UI elements based on user authentication.
   **/
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

  /**
   * Logs the user out and cleans up session data.
   * Redirects to the home page after logout.
   **/
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

  /**
   * Sets the component state to edit profile mode.
   * Enables form fields for editing user information.
   **/
  editProfile(): void {
    this.currentState = ProfileState.EditingProfile;
  }

  /**
   * Sets the component state to profile deletion mode.
   * Shows confirmation UI for canceling subscription.
   **/
  deleteProfile() {
    this.currentState = ProfileState.DeletingProfile;
    this.classAppliedDeleteProfile = true;
  }

  /**
   * Cancels the current action and reverts to viewing state.
   * Cleans up any staged images or temporary state.
   **/
  async cancelAction(): Promise<void> {
    if (this.isProcessingGoodbye) return;

    // Set cancelling flag immediately to prevent multiple calls
    this.isProcessingCancel = true;
    
    try {
      // Set cancellation flag to abort any in-progress operations
      this.isCancelled = true;

      // Immediately stop the loading spinner and update UI
      this.isLoadingImages = false;
      this.tooltipDisabled = false;

      // Force change detection to immediately update UI
      this.cdr.detectChanges();

      const userId = this.userService.getUserId();
      if (!userId) {
        console.error('No userId available for cleanup');
        return;
      }

      // Before setting current state back to Viewing, set the image state for fade-in
      if (!this.currentUser.imgUrl) {
        this.imageState = 'visible';
      }

      // If we're cancelling the delete profile action specifically
      if (this.currentState === ProfileState.DeletingProfile ||
        this.currentState === ProfileState.EditingProfile) {
        // Simply change the state back to viewing without doing any 
        // of the image cleanup that's needed when canceling picture change
        this.currentState = ProfileState.Viewing;
        this.cdr.detectChanges();
        return; // Exit early - don't do image processing logic
      }

      await this.ngZone.run(async () => {
        try {
          // Show loading state while cleaning up
          if (this.profileImg?.nativeElement) {
            this.renderer.addClass(this.profileImg.nativeElement, 'loading');
          }

          // Check for staged files that need cleanup
          const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
          const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

          if (hasStagedFileUrl || hasStagedFileFirebase) {
            // Clean up any temporary uploads
            await this.firebaseService.cleanupStagedFile(userId);
            this.imageUrlManager.clearStagedFile(userId);
          }

          // Get current database state to ensure we restore to correct image
          const user = await firstValueFrom(this.userService.getUser(userId));
          
          // CASE 1: User has a profile image in the database - restore it
          if (user.imgUrl) {
            // Convert the URL to a displayable form
            const displayUrl = await this.storageService.convertFirebaseUrl(user.imgUrl);
            
            // Restore the original position and zoom if we saved them
            if (this.originalPosition && this.originalZoom !== null) {
              this.position = { ...this.originalPosition };
              this.zoomLevel = this.originalZoom;
              this.isDragged = this.position.x !== 0 || this.position.y !== 0;
              this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
            }

            if (this.profileImg?.nativeElement) {
              this.renderer.removeClass(this.profileImg.nativeElement, 'no-image');
            }

            // Update form with original URL
            this.pictureForm.patchValue({
              imgUrl: displayUrl
            }, { emitEvent: false });
            
            // Restore the current user's image URL
            this.currentUser.imgUrl = user.imgUrl;
            
            // Create and apply image styles
            this.imageStyles = {
              'background-image': `url("${displayUrl}")`,
              'background-position': `${this.position.x}% ${this.position.y}%`,
              'background-repeat': 'no-repeat',
              'background-size': `${this.zoomLevel * 100}%`,
              'background-color': '#c7ff20'
            };
            
            if (this.profileImg?.nativeElement) {
              Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
            }

            this.imageLoadedSuccessfully = true;
            this.imageNotFound = false;
            
            // Force image to load with the updated transform
            await this.updateImageTransform();
          } 
          
          // CASE 2: No image in database, show avatar
          else {
            this.currentUser.imgUrl = null;
            this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
            this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });

            // Reset image styles to default
            this.imageStyles = {
              'background-image': 'none',
              'background-position': '0% 0%',
              'background-repeat': 'no-repeat',
              'background-size': '100%',
              'background-color': '#c7ff20'
            };
            
            if (this.profileImg?.nativeElement) {
              this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
              Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
            }
            
            // Reset all image states
            this.imageNotFound = false;
            this.imageLoadedSuccessfully = false;
            this.resetImagePositionAndZoom();
            this.imageManagementService.clearAllState(userId);
          }

          // Reset all navigation and UI states
          this.isInitialChangingPictureState = false;
          this.currentState = ProfileState.Viewing;
          this.originalPosition = null;
          this.originalZoom = null;
          this.storageService.clearStagedUrlCache(userId);
          this.resetHoverState();
          this.hasStartedNavigating = false;
          this.showUploadSuccess = false;
          this.providerUrlPasted = false;
          this.hasProfilePictureTransitioned = false;
          this.showButton = true;
          this.externalUrlError = false;
          
          // Refresh image count for navigation
          await this.imageManagementService.refreshFirebaseImageCount(userId);

        } finally {
          // Remove loading state when finished
          if (this.profileImg?.nativeElement) {
            this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
          }
          this.isUploadingOrPasting = false;

          // Ensure loading states are reset
          this.isLoadingImages = false;
          this.tooltipDisabled = false;
          this.allImagesLoaded = true;

          this.cdr.detectChanges();
        }
      });

      this.hoverCount = 0;
    } catch (error) {
      // On any error, ensure we return to viewing state
      console.error('Error in cancelAction:', error);
      this.currentState = ProfileState.Viewing;
      this.isLoadingImages = false;
      this.cdr.detectChanges();
    }
    finally {
      // Reset cancellation flags after operation completes
      this.isCancelled = false;
      this.isStateTransitioning = false;
      setTimeout(() => {
        this.isProcessingCancel = false;
        this.cdr.detectChanges();
      }, 300); // Small delay to ensure all state changes have processed
    }
  }

  /**
   * Updates database with null image URL.
   * Clears profile picture reference when all images are deleted.
   **/
   private async updateDatabaseToNull(): Promise<void> {
    const updatedUser = {
      ...this.currentUser,
      imgUrl: null,
      profilePictureSettings: null
    };
    await firstValueFrom(this.userService.updateUser(updatedUser))
      .catch(error => {
        console.error('Error updating database to null:', error);
        throw error;
      });
  }

  /**
   * Processes URL paste events for image input.
   * Handles direct image URL pasting.
   **/
  onUrlPaste(event: ClipboardEvent) {
    event.preventDefault();
    
    const pastedText = event.clipboardData?.getData('text/plain')?.trim();
    if (!pastedText) return;

    this.ngZone.run(() => {
      // Skip data URLs if requested
      if (pastedText.startsWith('data:image/')) {
        return;
      }

      // Set flags
      this.isUploadingOrPasting = true;
      this.providerUrlPasted = true;

      // Reset position and zoom
      this.position = { x: 0, y: 0 };
      this.zoomLevel = 1;
      this.isDragged = false;
      this.isDefaultPosition = true;

      // Update the form value
      this.pictureForm.patchValue({
        imgUrl: pastedText
      });

      // Show loading state
      if (this.profileImg?.nativeElement) {
        this.renderer.addClass(this.profileImg.nativeElement, 'loading');
      }

      // Use our new service to check if URL needs proxy handling
      this.imageProxyService.checkIfUrlNeedsProxy(pastedText).subscribe(needsProxy => {

      // Try to load the image directly first
      const img = new Image();
      
      img.onload = () => {
        this.ngZone.run(() => {
          // Successfully loaded the image, update UI
          this.imageStyles = {
            'background-image': `url("${pastedText}")`,
            'background-position': '0% 0%',
            'background-repeat': 'no-repeat',
            'background-size': '100%',
            'background-color': '#c7ff20'
          };
          
          if (this.profileImg?.nativeElement) {
            Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
            this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
          }

          // Update state
          this.imageLoadedSuccessfully = true;
          this.imageNotFound = false;
          this.providerUrlPasted = true;
          
          this.cdr.detectChanges();
        });
      };

      img.onerror = () => {
        this.ngZone.run(() => {
          this.imageLoadedSuccessfully = false;
          this.imageNotFound = true;
          
          if (this.profileImg?.nativeElement) {
            this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
          }
          
          this.cdr.detectChanges();
        });
      };

      // Don't limit with crossOrigin - some valid sites may not support it
      img.src = pastedText;
    });
      
      // Create synthetic input event
      const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true
      });

      if (this.urlInput?.nativeElement) {
        this.urlInput.nativeElement.value = pastedText;
        this.urlInput.nativeElement.dispatchEvent(inputEvent);
      }
    });
  }

  /**
   * Checks if a URL is external (not Firebase or API URL).
   * Used for special handling of external image sources.
   **/
  private isExternalUrl(url: string): boolean {
    if (!url) return false;
    
    // Not Firebase or API URLs
    if (url.includes('firebasestorage.googleapis.com') || 
        url.includes('/api/storage/') ||
        url.startsWith('data:image/') ||
        url.startsWith('profileImages/')) {
      return false;
    }
    
    try {
      new URL(url); // Validate it's a proper URL
      return true;  // It's an external URL if we got here
    } catch {
      return false;
    }
  }

  /**
   * Validates if a URL is a supported image URL.
   * Checks against known image providers and formats.
   **/
  private isValidImageUrl(url: string): boolean {
    // Check for data URLs first
    if (url.startsWith('data:image/')) {
      return true;
    }

    const supportedDomains = [
      'unsplash.com',
      'images.unsplash.com',
      'pexels.com',
      'images.pexels.com',
      'pixabay.com',
      'i.kinja-img.com', 
      'imgur.com',
      'i.imgur.com'
    ];

    try {
      const urlObj = new URL(url);
      
      // Check for supported domains
      if (supportedDomains.some(domain => urlObj.hostname.includes(domain))) {
        return true;
      }
      
      // Check if the URL ends with an image extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return imageExtensions.some(ext => 
        url.toLowerCase().endsWith(ext) || url.toLowerCase().includes(ext + '?')
      );
    } catch {
      return false;
    }
  }

  /**
   * Initializes all form groups with initial values and validators.
   * Sets up profile, picture, and password forms.
   **/
  private initializeForms() {
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
  }
  /*----------------------------------------------------------------*/
 

  ///////////////////// EVENT LISTENERS & HANDLERS ///////////////////

  /**
   * Initializes event listeners for keyboard events.
   * Used primarily for handling escape key to exit modal states. For toggling Cancel Subscription state on any key press.
   **/
  initializeEventListeners(): void {
    document.addEventListener('keydown', this.keydownHandler);
    // document.addEventListener('mousedown', this.mousedownHandler);
  }

  /**
   * Removes event listeners to prevent memory leaks. For toggling Cancel Subscription state on any key press.
   * Called during component destruction.
   **/
  removeEventListeners(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    // document.removeEventListener('mousedown', this.mousedownHandler);
  }
  /*----------------------------------------------------------------*/


  ////////////////////// ANIMATION FUNCTIONS //////////////////////

  /**
   * Triggers entrance animations for profile elements.
   * Animates profile picture, name, and tier information on first visit.
   **/
  triggerAnimations() {
    // First, set the animation flag
    this.firstTimeAnimation = true;
    
    // Wait for the loadingComplete flag to be set to true elsewhere in your code
    // This creates a listener that will trigger once loadingComplete changes to true
    const checkLoading = () => {
      if (this.loadingComplete) {
        // Loading is complete, now trigger animations after a short delay
        // to ensure the spinner has fully disappeared visually
        setTimeout(() => {
          const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
          if (profilePicture && this.tierThree) {
            // Force a reflow before adding the animation class
            void profilePicture.offsetWidth;
            profilePicture.classList.add('firstTimeAnimation');
          }
          
          const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
          if (profileNameTier) {
            void profileNameTier.offsetWidth;
            profileNameTier.classList.add('firstTimeAnimation');
          }

          const arrowContainer = document.querySelector('.arrowContainer') as HTMLElement;
          if (arrowContainer) {
            void arrowContainer.offsetWidth;
            arrowContainer.classList.add('firstTimeAnimation');
          }
          
          this.cdr.detectChanges();
        }, 0); // Add a delay after loading completes to ensure spinner has disappeared
      } else {
        // Check again in a short interval
        setTimeout(checkLoading, 50);
      }
    };
    
    // Start checking for loading state
    checkLoading();
  }

  /**
   * Skips entrance animations for returning users.
   * Removes animation classes to show content immediately.
   **/
  skipAnimations(){
    const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
    profilePicture?.classList.remove('firstTimeAnimation');
    
    const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
    profileNameTier?.classList.remove('firstTimeAnimation');

    const arrowContainer = document.querySelector('.arrowContainer') as HTMLElement;
    arrowContainer?.classList.remove('firstTimeAnimation');

    this.firstTimeAnimation = false;
    this.cdr.detectChanges();
  }

  /**
   * Handles image animation completion.
   * Updates state flags when animations finish.
   **/
  onImageAnimationDone() {
    this.imageAnimationComplete = true;
    this.cdr.detectChanges();
  }
  
  /**
   * Forces animation state to unlock after interruption.
   * Prevents UI from getting stuck in transition states.
   **/
  private forceUnlockAnimation() {
    // Clear any pending timeouts
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    
    // Reset all animation state
    this.animationLock = false;
    this.isTransitioning = false;
    this.rightClicked = false;
    this.leftClicked = false;
    this.animationPromise = null;
    
    // Reset to stable state
    this.nextImageStyles = null;
    this.currentImageState = 'current';
    this.nextImageState = 'next';
    
    this.cdr.detectChanges();
  }
  /*-----------------------------------------------------------------------*/
  

  //////////////////////////// HELPER FUNCTIONS /////////////////////////////

  /**
   * Formats height value from decimal to feet/inches format for display.
   * Converts between decimal feet (5.75) and formatted (5'9") displays.
   **/
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
  
  /**
   * Handles height input changes and validates the format.
   * Supports both decimal (5.75) and feet/inches (5'9") formats.
   **/
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

  /**
   * Validates height input against acceptable formats and ranges.
   * Ensures height is in a reasonable human range (3-9 feet).
   **/
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
  
  /**
   * Validates the user's age from date of birth.
   * Ensures user is at least 18 years old but not unreasonably old.
   **/
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

  /**
   * Validates weight input to ensure it's within reasonable human range.
   * Checks if weight is between 50-600 lbs with up to 2 decimal places.
   **/
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

  /**
   * Validates form inputs based on form type (profile or password).
   * Performs comprehensive validation of all relevant form fields.
   **/
  isFormValid(formType: 'profile' | 'password' = 'profile'): boolean {
    if (formType === 'profile') {
      if (!this.profileForm) {
        return false;
      }
      const nameControl = this.profileForm.get('name');
      const emailControl = this.profileForm.get('email');
      const isGoogleAuth = this.profileForm.get('isGoogleAuth')?.value;
  
      const requiredFieldsValid = 
        (nameControl?.valid ?? false) && 
        ((emailControl?.disabled || emailControl?.valid) ?? false) && 
        !this.emailExists;
  
      const optionalFields = ['dateOfBirth', 'gender', 'weight', 'height', 'goals', 'imgUrl'];
      const optionalFieldsValid = optionalFields.every(field => {
        const control = this.profileForm.get(field);
        const isValid = !control?.value || control.valid;
        return isValid;
      });
  
      const formValid = requiredFieldsValid && optionalFieldsValid;
  
      return formValid;
    } else if (formType === 'password') {
      if (!this.passwordForm) {
        return false;
      }
  
      const oldPasswordControl = this.passwordForm.get('oldPassword');
      const passwordGroup = this.passwordForm.get('passwordGroup') as FormGroup;
      const passwordControl = passwordGroup?.get('password');
      const confirmPasswordControl = passwordGroup?.get('confirmPassword');
      const hasOldPasswordError = (oldPasswordControl?.hasError('required') || !this.isOldPasswordCorrect) ?? true;
      const hasPasswordError = (passwordControl?.hasError('required') || passwordControl?.hasError('pattern')) ?? true;
      const hasConfirmPasswordError = (confirmPasswordControl?.hasError('required') || this.passwordMismatch) ?? true;
      const passwordFormValid = !(hasOldPasswordError || hasPasswordError || hasConfirmPasswordError);
  
      return passwordFormValid;
    }
  
    console.log('Invalid form type');
    return false;
  }
  /*-----------------------------------------------------------------------*/
 
    
  //////////////////////// PASSWORD RELATED FUNCTIONS ///////////////////////

  /**
   * Changes the component state to password changing mode.
   * Initializes the password change form.
   **/
  changePassword() {
    this.currentState = ProfileState.ChangingPassword;
    this.resetPasswordForm();
  } 

  /**
   * Checks if password and confirm password fields match.
   * Updates form validation state based on matching status.
   **/
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

  /**
   * Validates the old password against server records.
   * Enables new password fields only if old password is correct.
   **/
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

  /**
   * Checks if the old password field has an error.
   * Used for displaying validation feedback.
   **/
  isOldPasswordError(): boolean {
    const control = this.passwordForm.get('oldPassword');
    return !!this.oldPasswordError && !!control?.invalid && !!control?.touched;
  }

  /**
   * Getter for password form group within the form.
   * Provides convenient access to the nested password controls.
   **/
  get passwordGroup() {
    return this.passwordForm.get('passwordGroup') as FormGroup;
  }

  /**
   * Updates the user's password on the server.
   * Validates all password requirements before submission.
   **/
  updateUserPassword() {
    
    if (this.isFormValid('password')) {
      const newPassword = this.passwordGroup.get('password')?.value;
      this.userService.updatePassword(this.userId, newPassword).subscribe(
        () => {
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

  /**
   * Shows the password requirements popup.
   * Displays password complexity rules on field focus.
   **/
  showPasswordPopup() {
    this.isPopupVisible = true;
  }

  /**
   * Hides the password requirements popup.
   * Called when password field loses focus.
   **/
  hidePasswordPopup() {
    this.isPopupVisible = false;
  }

  /**
   * Prevents copy and paste actions in confirm password field.
   * Security measure to ensure user correctly types confirmation.
   **/
  preventCopyPaste(event: ClipboardEvent): void {
    event.preventDefault();
  }

  /**
   * Toggles visibility of the old password field.
   * Switches between password and text input types.
   **/
  toggleOldPasswordVisibility() {
    this.oldPasswordVisible = !this.oldPasswordVisible;
  }

  /**
   * Toggles visibility of new password fields.
   * Switches between password and text input types for both fields.
   **/
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Resets password form to initial state and clears errors.
   * Used when entering or exiting password change mode.
   **/
  private resetPasswordForm(): void {
    // Reset password form and clear errors
    this.passwordForm.reset();
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      if (control) {
        control.setErrors(null);
        control.updateValueAndValidity();
      }
    });

    // Reset old password control
    const oldPasswordControl = this.passwordForm.get('oldPassword');
    if (oldPasswordControl) {
      oldPasswordControl.setErrors(null);
      oldPasswordControl.updateValueAndValidity();
    }

    // Reset password group
    this.passwordGroup.reset();
    this.passwordGroup.disable();

    // Reset password-related flags
    this.authenticating = false;
    this.oldPasswordError = '';
    this.isOldPasswordCorrect = false;
    this.isWaitingToCheck = false;
    this.passwordMismatch = false;
    this.isPopupVisible = false;
    this.cdr.detectChanges();
  }

  /**
   * Gets error message for password field.
   * Returns appropriate validation message based on error type.
   **/
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

  /**
   * Gets error message for confirm password field.
   * Returns appropriate validation message based on error type.
   **/
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
  /*---------------------------------------------------------------------*/


  /////////////////////////// EMAIL VALIDATION ///////////////////////////

  /**
   * Checks if email already exists in the system.
   * Prevents users from using duplicate email addresses.
   **/
  checkEmail(event: Event) {
    const input = event.target as HTMLInputElement;
    const email = input.value;

      const emailControl = this.profileForm.get('email');
      if(email === this.currentUser.email) {
        emailControl?.setErrors(null);
        return;
      }

      if (email && emailControl && emailControl.valid) {
        this.userService.checkEmail(email).subscribe(
          (response: {exists: boolean, message: string}) => {
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


  // PROFILE PICTURE FUNCTIONS

  /**
   * Sets up image URL subscription for handling URL changes.
   * Processes URL changes with debouncing and authentication.
   **/
  private setupImageUrlSubscription() {
    // Handle form value changes for styles
    if (this.pictureForm) {
      this.styleSubscription = this.pictureForm.get('imgUrl')?.valueChanges
        .pipe(
          takeUntil(this.destroy$),
          // Filter out Promise objects to prevent [object Promise] from appearing in the form
          filter(value => !(value instanceof Promise || (value && typeof value === 'object' && '__zone_symbol__value' in value)))
        )
        .subscribe(() => {
          this.updateStyles();
        });
    }

    // Handle URL input processing with debounce
    this.imageUrlDebouncer.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(async (newValue) => {
      if (this.isProcessingUrl) return;
      this.isProcessingUrl = true;

      try {
        // Update styles immediately
        await this.updateStyles();

        if (!newValue) {
          this.resetImage();
          this.isProcessingUrl = false;
          return;
        }

        // Convert and preload image
        try {
          const displayUrl = await this.storageService.convertFirebaseUrl(newValue);
          
          this.ngZone.run(() => {
            // Update form with resolved URL, not the promise
            this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
            this.currentUser.imgUrl = displayUrl;
            this.preloadImage(displayUrl);
            this.updateImageTransform();
          });
        } catch (urlError) {
          console.error('Error converting URL:', urlError);
          this.ngZone.run(() => {
            this.imageNotFound = true;
            this.currentUser.imgUrl = null;
          });
        }

      } catch (error) {
        console.error('Error processing URL:', error);
        this.ngZone.run(() => {
          this.imageNotFound = true;
          this.currentUser.imgUrl = null;
        });
      } finally {
        this.isProcessingUrl = false;
        this.cdr.detectChanges();
      }
    });

    // Clean up subscription in ngOnDestroy
    this.subscriptions.add(this.styleSubscription);
  }

  /**
   * Handles changes to image URLs with proper error handling.
   * Converts Firebase URLs to accessible formats with auth.
   **/
  async handleImageUrlChange(newValue: string) {
    if (this.isProcessingUrl) return;
    this.isProcessingUrl = true;

    try {
      // Reset states
      this.imageNotFound = false;
      
      // Handle empty value
      if (!newValue) {
        this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
        this.currentUser.imgUrl = null;
        this.resetImage();
        return;
      }

      // Handle data URLs directly (no need for conversion)
      if (newValue.startsWith('data:image/')) {
      this.ngZone.run(() => {
        this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
        this.currentUser.imgUrl = newValue;
        this.preloadImage(newValue);
      });
      return;
      }
      
      // Wait for URL conversion before updating form
      let displayUrl = newValue;
      if (newValue.includes('firebasestorage.googleapis.com')) {
        displayUrl = await this.storageService.convertFirebaseUrl(newValue);
      }
      
      this.ngZone.run(() => {
        // Update form with converted URL
        this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
        this.currentUser.imgUrl = displayUrl;
        this.preloadImage(displayUrl);
      });
    } catch (error) {
      console.error('Error handling URL change:', error);
      this.imageNotFound = true;
    } finally {
      this.isProcessingUrl = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Processes debounced URL changes to update image display.
   * Handles different URL formats and authentication requirements.
   **/
  private async handleDebouncedUrlChange(newValue: string) {
    if (this.isProcessingUrl) return;
    this.isProcessingUrl = true;

    try {
      if (!newValue) {
        this.ngZone.run(() => {
          this.resetImageState();
          this.stateUpdateDebouncer.next();
        });
        return;
      }

      const processedUrl = await this.imageUrlManager.handleImageUrl(newValue);

      this.ngZone.run(() => {
        if (processedUrl) {
          this.updateImageSuccess(processedUrl);
        } else {
          this.updateImageFailure();
        }
        this.stateUpdateDebouncer.next();
      });

    } catch (error) {
      console.error('Error processing URL:', error);
      this.ngZone.run(() => {
        this.updateImageFailure();
        this.stateUpdateDebouncer.next();
      });
    } finally {
      this.isProcessingUrl = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Resets image state to default values.
   * Clears image URL and resets position/zoom.
   **/
  private resetImageState() {
    this.imageNotFound = false;
    this.currentUser.imgUrl = null;
    this.lastValidUrl = null;
    this.resetImagePositionAndZoom();
  }

  /**
   * Updates component state after successful image load.
   * Sets appropriate flags and refreshes the UI.
   **/
  private updateImageSuccess(url: string) {
    this.imageNotFound = false;
    this.currentUser.imgUrl = url;
    this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
    this.lastValidUrl = url;
    this.updateImageTransform();
  }

  /**
   * Updates component state after failed image load.
   * Sets error flags and displays appropriate message.
   **/
  private updateImageFailure() {
    this.imageNotFound = true;
    this.currentUser.imgUrl = null;
    this.pictureForm.get('imgUrl')?.setErrors({ 'invalidImage': true });
  }

  /**
   * Resets the profile image to default state.
   * Removes any loaded image and reverts to avatar display.
   **/
  resetImage() {
    this.ngZone.run(() => {
      this.resetImagePositionAndZoom();
      this.imageNotFound = false;
      this.currentUser.imgUrl = null;
      this.imageLoadedSuccessfully = false; // Add this line

      // Set default background color and clear background image
      if (this.profileImg?.nativeElement) {
        this.imageStyles = {
          'background-image': 'none',
          'background-position': '0% 0%',
          'background-repeat': 'no-repeat',
          'background-size': '100%',
          'background-color': '#c7ff20' // Keep the background color visible
        };
      
      Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
      this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
    }

      if (!this.isProcessingUrl) {
        this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
      }

      // Clear any cached styles
      this.imageTransformCache = null;

      // Queue a single state update
      this.stateUpdateDebouncer.next();
    });
  }

  /**
   * Initializes the changing picture state and loads image data.
   * Prepares UI for image selection, upload, or navigation.
   **/
  async changePicture() {
    if (this.isStateTransitioning || this.isCancelled) return;

    try {
      // Set transition flags to prevent multiple calls
      this.isCancelled = false;
      this.isStateTransitioning = true;

      // First, if there's no profile image and we're showing the avatar,
      // trigger the fade-out animation before entering changing picture state
      if (!this.currentUser.imgUrl && this.shouldShowAvatar()) {
        // Set avatar state to trigger fade-out
        this.imageState = 'hidden';
        
        // Wait for animation to complete (300ms)
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const user = await firstValueFrom(this.userService.getUser(this.userId));

      // If database has no image, ensure clean UI state
      if (!user.imgUrl) {
        // Ensure clean state if database has no image
        this.currentUser.imgUrl = null;
        this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
        this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
        this.imageManagementService.resetAll(this.userId);
      }

      // Check for Firebase images
      this.imageManagementService.hasAnyFirebaseImages();

      // Reset states flags before entering change mode
      this.controlsAnimationComplete = false;
      this.imageAnimationComplete = false;
      this.resetHoverState();
      this.isInitialChangingPictureState = true;
      this.hasStartedNavigating = false;
      this.imageNotFound = false;
      this.imageLoadedSuccessfully = false;
      this.isUploadingOrPasting = false;
      this.firebaseImageLoaded = false;
      this.tooltipDisabled = true;
      
      // Store original image position and URL for potential cancel action to revert 
      // to stored settings
      this.originalPosition = { ...this.position };
      this.originalZoom = this.zoomLevel;
      this.originalProfileImage = this.currentUser.imgUrl || null;

      // Process the current URL before changing state to avoid race conditions
      let resolvedUrl:string | null = null;
      if (this.currentUser.imgUrl) {
        try {
          // Pre-resolve the URL before changing state
          resolvedUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
        } catch (error) {
          console.error('Error pre-resolving URL:', error);
        }
      }

      // Enter changing picture state
      this.currentState = ProfileState.ChangingPicture;

      // Re-enable transitions for mobile after state change
      if (this.isMobile && this.profileImg?.nativeElement) {
        // Wait a frame to ensure the state change is applied
        await new Promise(resolve => requestAnimationFrame(resolve));
        // Re-enable transitions
        this.renderer.removeStyle(this.profileImg.nativeElement, 'transition');
      }

      // Early exit if cancelled during async operations
      if (this.isCancelled) {
        this.isStateTransitioning = false;
        return;
      }

      // Immediately update form with resolved URL to prevent [object Promise] flash
      if (resolvedUrl) {
        this.ngZone.run(() => {
          this.pictureForm.patchValue({ imgUrl: resolvedUrl }, { emitEvent: false });
          this.cdr.detectChanges();
        });
      }
      
      // Start loading state for images
      this.isLoadingImages = true;
      this.tooltipDisabled = true;
      this.allImagesLoaded = false;

      try {
        // Important: Check actual database state first
        const user = await firstValueFrom(this.userService.getUser(this.userId));

        // Check for cancellation after each async operation
        if (this.isCancelled) {
          this.isStateTransitioning = false;
          return;
        }
        
        // Handle case when no image is in database
        if (!user.imgUrl) {
          // If no image in database, ensure UI is clean
          this.ngZone.run(() => {
            this.currentUser.imgUrl = null;
            this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
            this.imageStyles = {
              'background-image': 'none',
              'background-position': '0% 0%',
              'background-repeat': 'no-repeat',
              'background-size': '100%',
              'background-color': '#c7ff20'
            };
            if (this.profileImg?.nativeElement) {
              Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
            }
            this.imageLoadedSuccessfully = false;
            this.cdr.detectChanges();
          });
        } else if (this.currentUser.imgUrl) {
          // Only set up initial image if it matches database state
          if (this.currentUser.imgUrl === user.imgUrl) {
            try {
              const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);

              // Check for cancellation
              if (this.isCancelled) {
                this.isStateTransitioning = false;
                return;
              }

              this.ngZone.run(() => {
                this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
                this.imageLoadedSuccessfully = true;
                this.updateImageTransform();
                this.cdr.detectChanges();
              });
            } catch (initialError) {
              console.error('Error setting initial image:', initialError);
            }
          }
        }

        // Load user images from storage
        await this.imageManagementService.loadUserImages(this.userId, true);

        // Check for cancellation
        if (this.isCancelled) {
        this.isStateTransitioning = false;
        return;
        }
        
        // Get all available URLs and preload
        const subject = this.imageManagementService.getUserImagesSubject(this.userId);
        const loadedUrls = subject.value.urls;

        // await this.preloadAllImages(loadedUrls);
        this.preloadAllImages(loadedUrls).catch(err => 
          console.error('Error preloading images:', err)
        );
        // this.allImagesLoaded = true;

        // Check for cancellation
        if (this.isCancelled) {
          this.isStateTransitioning = false;
          return;
        }

        // Only update display if database state still matches
        if (this.currentUser.imgUrl && this.currentUser.imgUrl === user.imgUrl) {
          try {
            const displayUrl = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);

            // Check for cancellation
            if (this.isCancelled) {
              this.isStateTransitioning = false;
              return;
            }

            if (displayUrl) {
              this.ngZone.run(() => {
                this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
                this.imageLoadedSuccessfully = true;
                this.updateImageTransform();
                this.cdr.detectChanges();
              });
            }
          } catch (displayError) {
            console.error('Error displaying current image:', displayError);
          }
        }

        // Initialize navigation
        await this.initializeImageNavigation();

        // Check for cancellation
        if (this.isCancelled) {
          this.isStateTransitioning = false;
          return;
        }

      } finally {
        // Reset loading states regardless of success/failure
        this.isLoadingImages = false;
        this.tooltipDisabled = this.shouldShowLoadingOverlay;
        this.isStateTransitioning = false;

        // Set allImagesLoaded to true regardless of cancellation
        this.allImagesLoaded = true;
      }

      if (!this.isCancelled) {
      // Only trigger fade-in animation if there's no profile image
      setTimeout(() => {
        if (!this.currentUser.imgUrl && 
            !this.imageManagementService.hasAnyFirebaseImages() && 
            !this.isTransitioning &&
            this.profileImg?.nativeElement) {
              
              this.imageState = 'visible';
          
              // Add the animation class
              // this.renderer.addClass(this.profileImg.nativeElement, 'fade-in-background');
              this.cdr.detectChanges();
        }
      }, 100);
    }
      
    } catch (error) {
      console.error('Error in changePicture:', error);
      // Only set error state if we truly have no images
      const hasAnyImages = this.imageManagementService.hasAnyFirebaseImages();
      if (!hasAnyImages) {
        this.ngZone.run(() => {
          this.imageNotFound = true;
          this.isLoadingImages = false;
          this.tooltipDisabled = this.shouldShowLoadingOverlay;
          this.allImagesLoaded = false;
          this.imageLoadedSuccessfully = false;
          this.cdr.detectChanges();
        });
      } else {
        // If we have images but encountered an error, just reset loading states
        this.ngZone.run(() => {
          this.isLoadingImages = false;
          this.tooltipDisabled = this.shouldShowLoadingOverlay;
          this.allImagesLoaded = true;
          this.externalUrlError = false;
          this.cdr.detectChanges();
        });
      }

      this.isStateTransitioning = false;
    }
  }

  /**
   * Preloads all user images to improve navigation experience.
   * Processes images in batches to manage memory usage.
   **/
  private async preloadAllImages(urls: string[]): Promise<void> {
    // Process in batches of 3 to avoid too many concurrent requests
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      // Check for cancellation before each batch
      if (this.isCancelled) {
        throw new Error('Image preloading cancelled');
      }
      
      // Process batch in parallel
      await Promise.all(batch.map(async (originalUrl) => {
        try {
          // Check for cancellation before each image
          if (this.isCancelled) {
            return;
          }
          
          let displayUrl = originalUrl;
          if (displayUrl.includes('firebasestorage.googleapis.com')) {
            displayUrl = await this.storageService.convertFirebaseUrl(displayUrl);
          }

          // Only attempt to load image if not cancelled
          if (!this.isCancelled) {
            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => reject(`Failed to load image: ${displayUrl}`);
              img.src = displayUrl;
            });
          }
        } catch (error) {
          console.warn(`Error preloading image ${originalUrl}:`, error);
          // Continue with other images even if one fails
        }
      }));
    }
  }

  /**
   * Converts URL to displayable format with authentication.
   * Handles Firebase storage URLs and proxy requirements.
   **/
  private async getDisplayableUrlOnce(url: string | Promise<string>): Promise<string | null> {
    if (!url) return null;

    // Handle Promise objects that might be passed in
    if (url instanceof Promise || (url && typeof url === 'object' && '__zone_symbol__value' in url)) {
      try {
        url = await url;
      } catch (error) {
        console.error('Error resolving URL promise:', error);
        return null;
      }
    }

    // Check cache first
    if (this.convertedUrlCache.has(url)) {
      return this.convertedUrlCache.get(url)!;
    }

    try {
      let displayUrl = url;

      // Convert URL based on type
      if (url.includes('firebasestorage.googleapis.com')) {
        displayUrl = await this.storageService.convertFirebaseUrl(url);
      } else if (url.includes('/api/storage/')) {
        displayUrl = url; // Already proxied
      } else {
        // Default case - convert to proxied URL
        displayUrl = await this.storageService.convertFirebaseUrl(url);
      }

      // Preload the image before returning
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(`Failed to load image: ${displayUrl}`);
        img.src = displayUrl;
      });

      // Cache the successful result
      this.convertedUrlCache.set(url, displayUrl);
      return displayUrl;

    } catch (error) {
      console.error('Error getting displayable URL:', error);
      // Don't cache failed attempts
      return null;
    }
  }

  /**
   * Gets proper display URL with authentication if needed.
   * Converts Firebase storage URLs to accessible proxied URLs.
   **/
  private async getDisplayUrl(url: string): Promise<string> {
    if (!url) return '';
    if (url.includes('firebasestorage.googleapis.com')) {
      return await this.storageService.convertFirebaseUrl(url);
    }
    return url;
  }

  /**
   * Determines if loading overlay should be displayed.
   * Shows loader only when actively loading with available images.
   **/
  get shouldShowLoadingOverlay(): boolean {
    // Only show loading overlay if we're loading AND there are Firebase images
    return this.isLoadingImages && 
          this.imageManagementService.hasAnyFirebaseImages();
  }

  /**
   * Determines if avatar should be shown instead of profile image.
   * Shows avatar when no image is set or during transitions.
   **/
  shouldShowAvatar(){
    // Show avatar if:
    // 1. No profile picture set
    // 2. In changing picture state but the remaining image isn't the profile picture
    // 3. No images in storage
    const shouldShow =  !this.currentUser.imgUrl || 
                        (this.currentState === ProfileState.ChangingPicture && 
                        !this.imageManagementService.hasProfileImageInStorage(this.userId)) ||
                        !this.imageManagementService.hasAnyFirebaseImages();

    // If we're transitioning from viewing to changing picture, we might be temporarily 
    // hiding the avatar with animation, but we still need it in the DOM
    if (this.isStateTransitioning && !this.currentUser.imgUrl) {
      return true;
    }
    
    return shouldShow;
  }

  /**
   * Determines if image manipulation controls should be visible.
   * Controls visibility of zoom, reset, and navigation elements.
   **/
  isControlsVisible(): boolean {
    // Don't show controls if we're in the process of canceling
    if (this.isProcessingCancel) {
      return false;
    }
    
    // Basic state check
    const correctState = !this.isLoadingImages && this.currentState === ProfileState.ChangingPicture;
    if (!correctState) return false;
    
    // Now check if we have a valid image to work with
    const hasUserImage = Boolean(this.currentUser.imgUrl);
    const hasFirebaseImage = this.imageManagementService.hasAnyFirebaseImages() && this.firebaseImageLoaded;
    const hasPastedImage = Boolean(this.pictureForm.get('imgUrl')?.value) && this.imageLoadedSuccessfully;
    
    return hasUserImage || hasFirebaseImage || hasPastedImage;
  }

  /**
   * Calculates the opacity for the reset control.
   * Reduces opacity when image is already in default position.
   **/
  getResetControlOpacity(): number {
    // Logic to compute the opacity value
    // For example, return a value between 0 and 1 based on some condition
    return this.isInDefaultPosition() ? 0.4 : 1;
  }
  
  /**
   * Updates the display of a profile image with authentication.
   * Handles loading state, URL conversion, and styling.
   **/
  private async updateImageDisplay(url: string, isInitialLoad: boolean = false): Promise<void> {
    if (!this.profileImg?.nativeElement) return;
    
    // Always add loading class at the beginning
    this.renderer.addClass(this.profileImg.nativeElement, 'loading');
    
    try {
      let displayUrl = url;
      
      // Convert Firebase URL to proxy URL if needed
      if (url.includes('firebasestorage.googleapis.com')) {
        displayUrl = await this.storageService.convertFirebaseUrl(url);
      }
      
      // Ensure proxy URL has proper format
      if (!displayUrl.includes('/api/storage/') && displayUrl.startsWith('profileImages/')) {
        displayUrl = `${this.baseUrl}/api/storage/${displayUrl}`;
      }
      
      // Important: Wait for image to fully load before proceeding
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          resolve();
        };
        
        img.onerror = (e) => {
          reject(new Error('Failed to load image'));
        };
        
        // Set up auth handling for proxy URLs
        if (displayUrl.includes('/api/storage/')) {
          this.loadImageWithAuth(img, displayUrl).then(resolve).catch(reject);
        } else {
          img.src = displayUrl;
        }
      });
      
      // Only update styles after image is fully loaded
      const styles = {
        'background-image': `url("${displayUrl}")`,
        'background-position': `${this.position.x}% ${this.position.y}%`,
        'background-repeat': 'no-repeat',
        'background-size': `${this.zoomLevel * 100}%`,
        'background-color': '#c7ff20'
      };
      
      // Apply styles
      Object.entries(styles).forEach(([prop, value]) => {
        this.renderer.setStyle(this.profileImg.nativeElement, prop, value);
      });
      
      // Update states
      this.imageLoadedSuccessfully = true;
      this.imageNotFound = false;

      // For initial load, ensure we set imageLoaded flag
      if (isInitialLoad) {
        this.imageLoaded = true;
        this.urlImageLoaded.next(true);
      }
      
    } catch (error) {
      console.error('Error displaying image:', error);
      this.imageNotFound = true;
      this.imageLoadedSuccessfully = false;

      // Even on error, mark as loaded so we can proceed
      if (isInitialLoad) {
        this.imageLoaded = true;
        this.urlImageLoaded.next(true);
      }
      
      this.resetImage();
    } finally {
      // Only remove loading class after everything is complete
      this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles URL input changes and loads the image.
   * Validates and processes URLs pasted into the input field.
   **/
  async onImageUrlInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    
    const newValue = input.value.trim();
    const imgUrlControl = this.pictureForm.get('imgUrl');
    if (!imgUrlControl) return;

    this.ngZone.run(async () => {
      // Reset states
      this.imageNotFound = false;
      this.isInitialLoad = false;
      this.loadingComplete = true;

      // Only process if it's a valid image URL
      if (this.isValidImageUrl(newValue)) {
        // Set temporary URL
        this.imageManagementService.setTemporaryUrl(newValue);

        // Update form
        this.pictureForm.patchValue({
          imgUrl: newValue
        }, { emitEvent: false });

        try {
          if (this.profileImg?.nativeElement) {
            this.renderer.addClass(this.profileImg.nativeElement, 'loading');

            const img = new Image();
            img.onload = () => {
              this.ngZone.run(() => {
                this.imageStyles = {
                  'background-image': `url("${newValue}")`,
                  'background-position': `${this.position.x}% ${this.position.y}%`,
                  'background-repeat': 'no-repeat',
                  'background-size': `${this.zoomLevel * 100}%`,
                  'background-color': '#c7ff20'
                };
                
                Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
                this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
                this.imageLoadedSuccessfully = true;
                this.cdr.detectChanges();
              });
            };

            img.onerror = () => {
              this.ngZone.run(() => {
                this.imageNotFound = true;
                this.imageLoadedSuccessfully = false;
                this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
                this.cdr.detectChanges();
              });
            };

            img.src = newValue;
          }
        } catch (error) {
          console.error('Error processing URL:', error);
          this.imageNotFound = true;
        }
      }
    });
  }

  /**
   * Saves the profile picture to the server.
   * Processes staged images, handles URL conversions, and updates the database.
   **/
  async saveProfilePicture(): Promise<void> {
    if (!this.pictureForm.valid) {
      return;
    }

    try {
      // Set saving state flag for UI
      this.isSavingPicture = true;

      // Validate user ID and form image URL
      const userId = this.userService.getUserId();
      if (!userId) throw new Error('User ID not found');

      const formImageUrl = this.pictureForm.get('imgUrl')?.value;
      if (!formImageUrl) throw new Error('No image URL provided');

      // Prepare image position settings
      const settings = {
        zoom: Number(this.zoomLevel || 1),
        x: Number(this.position.x || 0),
        y: Number(this.position.y || 0)
      };

      let storagePath: string;

      // CASE 1: Handle staged files from uploads
      if (this.imageUrlManager.hasStagedFile(userId)) {
        // Get staged file info and create final storage path
        const stagedFile = this.imageUrlManager.getStagedFile(userId);
        if (!stagedFile) throw new Error('Staged file info not found');

        storagePath = `profileImages/${userId}/${stagedFile.fileName}`;

        // Move from staging to permanent storage with token refresh handling
        await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
          .catch(async (error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              await this.authService.refreshToken();
              return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
            }
            throw error;
          });

        this.onlyFirebaseImageCount++;
      }

      // CASE 2: Handle navigated images (user browsed through existing images)
      else if (this.hasStartedNavigating) {
        const subject = this.imageManagementService.getUserImagesSubject(userId);
        const currentState = subject.value;

        // Get path for the currently selected image
        if (currentState.currentIndex >= 0 && currentState.urls.length > 0) {
          const currentUrl = currentState.urls[currentState.currentIndex];
          
          if (currentUrl.startsWith('blob:')) {
            // Get original path for blob URLs
            const originalPath = await this.imageManagementService.getOriginalPath(userId, currentState.currentIndex);
            if (!originalPath) throw new Error('Could not determine storage path');
            storagePath = originalPath;
          } else if (currentUrl.includes('/api/storage/')) {
            // Extract path from proxied URL
            storagePath = currentUrl.split('/api/storage/')[1];
          } else {
            // Use URL directly if it's already a storage path
            storagePath = currentUrl;
          }
        } else {
          throw new Error('No valid image selected during navigation');
        }
      }

      // CASE 3: Handle external URLs pasted by user
      else if (this.isExternalUrl(formImageUrl)) {
        try {
          
          // Use proxy service to download and store the external image
          storagePath = await firstValueFrom(
            this.imageProxyService.handleImageUrl(formImageUrl)
          );
          
          // The path is already in firebase, no need for this.imageUrlManager.saveProfileImage
          this.onlyFirebaseImageCount++;
        } catch (error) {
          console.error('Error processing external URL:', error);
          this.showError('Failed to process image. ' + 
            (error instanceof Error ? error.message : 'Please try uploading directly.'));
          // Set error flag for template to show error message
          this.externalUrlError = true;
          
          // Make sure change detection runs
          this.cdr.detectChanges();
          
          // Stop the function execution
          return;
        }
      }

      // CASE 4: Handle existing URLs and paths
      else {
        // Determine storage path based on URL format
        if (formImageUrl.includes('/api/storage/')) {
          storagePath = formImageUrl.split('/api/storage/')[1];
        } else if (formImageUrl.includes('firebasestorage.googleapis.com')) {
          const urlObj = new URL(formImageUrl);
          storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
        } else if (formImageUrl.startsWith('profileImages/')) {
          storagePath = formImageUrl;
        } else {
          storagePath = this.currentUser.imgUrl!;
        }
      }

      // Validate storage path format and normalize
      if (!storagePath.startsWith('profileImages/') && 
          !storagePath.includes('http')) { // Keep http URLs as is
        console.warn('Potentially invalid storage path, attempting to fix:', storagePath);
          
        // Extract path from Firebase storage URL if needed
        if (storagePath.includes('firebasestorage.googleapis.com')) {
          const urlObj = new URL(storagePath);
          storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
        }
        
        // Fallback to current image if path is still invalid
        if (!storagePath.startsWith('profileImages/') && !storagePath.includes('http')) {
          console.error('Invalid storage path format:', storagePath);
          if (this.currentUser.imgUrl) {
            storagePath = this.currentUser.imgUrl;
          } else {
            throw new Error('Invalid storage path format');
          }
        }
      }

      // Update user profile with new image path and position settings
      const updatedUser = {
        ...this.currentUser,
        imgUrl: storagePath,
        profilePictureSettings: settings
      };

      // Save to database with token refresh handling
      const response = await firstValueFrom(
        this.userService.updateUser(updatedUser).pipe(
          catchError(async (error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              await this.authService.refreshToken();
              return this.userService.updateUser(updatedUser);
            }
            throw error;
          })
        )
      );

      // Once successfully updated the user, update the image management service state
      this.imageManagementService.setCurrentProfileImage(storagePath);

      // Update component state with server response
      await this.ngZone.run(async () => {
        this.currentUser = {
          ...this.currentUser,
          ...response,
          imgUrl: storagePath,
          profilePictureSettings: settings
        };

        // Reset all state flags to viewing mode
        this.isInitialChangingPictureState = false;
        this.currentState = ProfileState.Viewing;
        this.hasStartedNavigating = false;
        this.showUploadSuccess = false;
        this.resetHoverState();
        this.providerUrlPasted = false;
        await this.updateImageTransform();
        this.imageManagementService.clearTemporaryUrl();
        this.isUploadingOrPasting = false;
        this.hasProfilePictureTransitioned = false;
        this.showButton = true;
        this.cdr.detectChanges();
      });

      // Clean up staged files if they exist
      if (this.imageUrlManager.hasStagedFile(userId)) {
        await this.imageUrlManager.clearStagedFile(userId);
      }

    } catch (error) {
      console.error('Save profile picture error:', error);
      this.handleSaveError(error);
    } finally {
      this.isSavingPicture = false;
      this.isUploadingOrPasting = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Creates updated styles object for current image URL.
   * Includes position, zoom, and color settings.
   **/
  private getUpdatedStyles(imgUrl?: string): any {
    return {
      'background-image': imgUrl ? `url(${imgUrl})` : 'none',
      'background-position': `${this.position.x}% ${this.position.y}%`,
      'background-repeat': 'no-repeat',
      'background-size': `${this.zoomLevel * 100}%`,
      'background-color': '#c7ff20',
    };
  }

  /**
   * Cleans up any staged image files to prevent orphaned storage.
   * Called when canceling image changes or component destruction.
   **/
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

  /**
   * Gets appropriate error message for image URL input.
   * Returns context-specific message based on current state.
   **/
  private getImageUrlErrorMessage(control: AbstractControl): string {
    if (this.isUploading) {
      return `Uploading... ${this.uploadProgress}%`;
    }
  
    if (control.hasError('fileSize')) {
      return 'Max file size 5MB';
    }
    if (control.hasError('fileType')) {
      return 'Only .jpg, .jpeg, .png, .gif & .webp';
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

  /**
   * Preloads an image to improve user experience.
   * Handles loading states for both avatar and profile images.
   **/
  async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
    return new Promise<void>((resolve) => {
      // Initial state updates
      this.ngZone.run(() => {
        if (isInitialLoad) {
          this.loadingComplete = false;
          this.imageLoaded = false;
        }
        this.avatarLoaded.next(false);
        this.urlImageLoaded.next(false);
      });

      // Handle avatar loading first (always needed as fallback)
      const loadAvatarAndImage = async () => {
        try {
          if (!this.avatarLoadPromise) {
            this.avatarLoadPromise = new Promise<void>((resolveAvatar, rejectAvatar) => {
              const avatarImg = new Image();
              avatarImg.onload = () => resolveAvatar();
              avatarImg.onerror = () => rejectAvatar(new Error('Failed to load avatar'));
              avatarImg.src = 'assets/Images/avatar.png';
            });
          }
          
          await this.avatarLoadPromise;
          this.ngZone.run(() => {
            this.avatarLoaded.next(true);
          });
          
          // If no URL provided, we're done
          if (!url) {
            this.ngZone.run(() => {
              this.imageLoaded = true;
              this.urlImageLoaded.next(true);
              if (isInitialLoad) {
                // Delay finishing to ensure UI updates
                setTimeout(() => this.finishLoading(), 100);
              }
              resolve();
            });
            return;
          }
          
          // For profile image, add loading state
          if (this.profileImg?.nativeElement) {
            this.renderer.addClass(this.profileImg.nativeElement, 'loading');
          }
          
          // Handle firebase URL conversion if needed
          const displayUrl = url.includes('firebasestorage.googleapis.com') ? 
            await this.storageService.convertFirebaseUrl(url) : url;
          
          // Get auth headers for storage URLs
          const headers = displayUrl.includes('/api/storage/') ? 
            await this.storageService.getAuthHeaders() : undefined;
          
          // Preload the actual profile image
          const img = new Image();
          img.onload = () => {
            this.ngZone.run(() => {
              // Update the image styles
              this.imageStyles = {
                'background-image': `url("${displayUrl}")`,
                'background-position': `${this.position.x}% ${this.position.y}%`,
                'background-repeat': 'no-repeat',
                'background-size': `${this.zoomLevel * 100}%`,
                'background-color': '#c7ff20'
              };
              
              if (this.profileImg?.nativeElement) {
                Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
                this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
              }
              
              this.imageLoaded = true;
              this.imageNotFound = false;
              this.imageLoadedSuccessfully = true;
              this.urlImageLoaded.next(true);
              
              if (isInitialLoad) {
                // Give time for the UI to update before finishing
                setTimeout(() => this.finishLoading(), 100);
              }
              resolve();
            });
          };
          
          img.onerror = () => {
            this.ngZone.run(() => {
              console.error('Error loading image:', displayUrl);
              if (this.profileImg?.nativeElement) {
                this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
              }
              this.imageLoaded = true; // Consider it loaded even if error
              this.imageNotFound = true;
              this.urlImageLoaded.next(true);
              
              if (isInitialLoad) {
                setTimeout(() => this.finishLoading(), 100);
              }
              resolve();
            });
          };
          
          // Fetch with auth headers if needed
          if (headers) {
            fetch(displayUrl, { headers })
              .then(response => response.blob())
              .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                img.src = blobUrl;
                // Clean up blob URL after loading
                setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
              })
              .catch(() => {
                img.src = displayUrl;
              });
          } else {
            img.src = displayUrl;
          }
        } catch (error) {
          console.error('Error loading images:', error);
          this.ngZone.run(() => {
            this.imageLoaded = true;
            this.urlImageLoaded.next(true);
            if (isInitialLoad) {
              setTimeout(() => this.finishLoading(), 100);
            }
            resolve();
          });
        }
      };
      
      // Start loading process
      loadAvatarAndImage();
    });
  }

  /**
   * Completes the loading process and shows profile content.
   * Verifies image loading status before hiding loading indicators.
   **/
  private finishLoading(): void {
    if (this.profileImg?.nativeElement) {
      // Double-check if image is actually loaded in the DOM
      const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
      const backgroundImage = computedStyle.backgroundImage;
      
      const hasValidImage = backgroundImage !== 'none' && 
                            backgroundImage !== '' && 
                            !backgroundImage.includes('avatar.png');
                            
      const allStatesReady = this.imageLoaded && 
                            this.avatarLoaded.getValue() && 
                            this.urlImageLoaded.getValue() && 
                            this.allImagesLoaded;
      
      if ((hasValidImage || !this.currentUser.imgUrl) && allStatesReady) {
        this.loadingComplete = true;
        this.tooltipDisabled = false;

        // If first visit and tier three, queue up the animation with slight delay
        if (this.firstTimeAnimation && this.tierThree) {
          setTimeout(() => {
            const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
            if (profilePicture) {
              void profilePicture.offsetWidth;
              profilePicture.classList.add('firstTimeAnimation');
            }
            
            const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
            if (profileNameTier) {
              void profileNameTier.offsetWidth;
              profileNameTier.classList.add('firstTimeAnimation');
            }

            const arrowContainer = document.querySelector('.arrowContainer') as HTMLElement;
            if (arrowContainer) {
              void arrowContainer.offsetWidth;
              arrowContainer.classList.add('firstTimeAnimation');
            }

        
              this.cdr.detectChanges();
            }, 100);
          }

          this.cdr.detectChanges();
          
      } else {
        // If image isn't properly loaded, retry with a small delay
        if (!this.retryCount) {
          this.retryCount = 0;
        }
        if (this.retryCount < 10) {
          this.retryCount++;
          setTimeout(() => this.finishLoading(), 100);
        } else {
          // After maximum retries, show the UI anyway
          this.loadingComplete = true;
          this.tooltipDisabled = false;
          this.cdr.detectChanges();
        }
      }
    } else {
      // If profile image element doesn't exist, we can proceed
      this.loadingComplete = true;
      this.tooltipDisabled = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Initializes loading state variables and subscriptions.
   * Sets up image loading tracking for multiple sources.
   **/
  private initializeLoadingState() {
    this.avatarLoaded.subscribe(loaded => {
      this.checkAllImagesLoaded();
    });

    this.urlImageLoaded.subscribe(loaded => {
      this.checkAllImagesLoaded();
    });
  }

  /**
   * Verifies that all required images are loaded.
   * Triggers finishLoading when all dependencies are ready.
   **/
  private checkAllImagesLoaded(): void {
    const allLoaded = this.imageLoaded && 
                    this.avatarLoaded.getValue() && 
                    this.urlImageLoaded.getValue() &&
                    this.allImagesLoaded;
                    
    if (allLoaded) {
      this.finishLoading();
    }
  }

  /**
   * Checks if the image URL (for picture form) input field has a valid value.
   * Used to determine if image editing/navigation controls should be enabled.
   **/
  isImageUrlFilled(): boolean {

    // if (this.isNavigating) {
    //   return true; 
    // }

    if (!this.pictureForm || this.imageNotFound) {
      return false;
    }

    if (this.currentUser.imgUrl && this.imageLoadedSuccessfully) {
      return true;
    }

    const imgUrlControl = this.pictureForm.get('imgUrl');
    if (!imgUrlControl) {
      return false;
    }
    
    const value = imgUrlControl.value;
    if (!value) {
      return false;
    }

    if (value instanceof Promise) {
      return this.imageLoadedSuccessfully;
    }

    const stringValue = typeof value === 'string' ? value.trim() : String(value).trim();
    if (!stringValue) {
      return false;
    }

    const finalResult = this.imageLoadedSuccessfully && !this.imageNotFound;

    return finalResult;
  }

  /**
   * Initializes dragging behavior for the profile image.
   * Sets up event handlers and loads saved position.
   **/
  private initializeDragging() {
    if (this.container && this.profileImg) {
      this.setupDragListeners();
      // this.loadSavedPosition();
    }
  }

  /**
   * Gets CSS classes for the profile image container.
   * Applies appropriate classes based on current state.
   **/
  getProfileClasses() {
    return {
      'changing-picture': this.currentState === ProfileState.ChangingPicture,
      'default-position': !this.isDragged,
      'loaded': this.imageLoadedSuccessfully,
      'loading': !this.imageLoadedSuccessfully || this.isLoadingImages,
      'firstTimeAnimation': this.firstTimeAnimation && this.tierThree,
      'tierThreeStyle': this.tierThree,
      'draggable': this.canDrag(),
    };
  }

  /**
   * Saves current position and zoom settings to the server.
   * Updates user preferences for image display.
   **/
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
        this.currentUser = { ...this.currentUser, ...response };
      },
      error => console.error('Error saving position and zoom', error)
    );
  }

  /**
   * Sets image URL in the form with proper state tracking.
   * Maintains change detection for URL updates.
   **/
  setImageUrl(url: string) {
    const currentUrl = this.pictureForm.get('imgUrl')?.value;
    this.isImageUrlChanged = currentUrl !== url;
    this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
  }

  /**
   * Invalidates the style cache to force recalculation.
   * Used when image or settings change.
   **/
  private invalidateStyleCache() {
    this.cachedStyles = null;
  }

  /**
   * Updates image styles based on current URL and settings.
   * Applies changes to the DOM and updates component state.
   **/
  async updateStyles() {
    try {
      this.imageStyles = await this.getProfileImageStyles();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error updating styles:', error);
      this.imageStyles = this.getDefaultStyles();
      this.cdr.detectChanges();
    }
  }

  /**
   * Generates complete style object for the profile image.
   * Handles URL conversion, authentication, and position/zoom.
   **/
  async getProfileImageStyles(): Promise<any> {
    try {
      // Check if form is initialized
      if (!this.pictureForm) {
        return this.getDefaultStyles();
      }

      // Get and validate the current URL
      const formUrl = this.pictureForm.get('imgUrl')?.value;
      const currentUrl = typeof formUrl === 'string' ? formUrl : this.currentUser?.imgUrl || '';

      // Cache check with logging
      if (this.imageTransformCache?.url === currentUrl) {
        return this.imageTransformCache!.styles;
      }

      // Get settings with better error handling
      let settings = this.currentUser.profilePictureSettings;
      if (typeof settings === 'string') {
        try {
          settings = JSON.parse(settings);
        } catch (e) {
          console.warn('Error parsing settings, using defaults:', e);
          settings = {
            zoom: this.zoomLevel || 1,
            x: this.position.x || 0,
            y: this.position.y || 0
          };
        }
      }

      let displayUrl = currentUrl;
      try {
        // Get auth headers
        const headers = await this.storageService.getAuthHeaders();
        
        if (currentUrl.includes('firebasestorage.googleapis.com')) {
          // Handle Firebase URLs
          displayUrl = await this.storageService.getProxiedUrl(currentUrl);
        } else if (currentUrl.includes('/api/storage/')) {
          // Already a proxied URL, use as is
          displayUrl = currentUrl;
        }

        // Verify URL is accessible
        if (displayUrl.includes('/api/storage/')) {
          const response = await fetch(displayUrl, { 
            headers,
            method: 'HEAD'  // Use HEAD request for faster verification
          });
          
          if (!response.ok) {
            throw new Error('Failed to verify image access');
          }
        }

        // Create blob URL for all storage URLs
        if (displayUrl.includes('/api/storage/')) {
          const response = await fetch(displayUrl, { headers });
          if (!response.ok) {
            throw new Error('Failed to load image');
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          // Clean up previous blob URL if it exists
          if (this.imageStyles?.['background-image']) {
            const match = this.imageStyles['background-image'].match(/url\("(blob:[^"]+)"\)/);
            if (match?.[1]) {
              URL.revokeObjectURL(match[1]);
            }
          }

          displayUrl = blobUrl;

          // Clean up new blob URL after a delay
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }

      } catch (error) {
        console.error('Error processing URL:', error);
        // Fall back to original URL if processing fails
        displayUrl = currentUrl;
      }

      // Create styles object with nullish coalescing
      const styles = {
        'background-image': displayUrl ? `url("${displayUrl}")` : 'none',
        'background-position': `${Number(this.position.x ?? 0)}% ${Number(this.position.y ?? 0)}%`,
        'background-repeat': 'no-repeat',
        'background-size': `${(Number(this.zoomLevel ?? 1) * 100)}%`,
        'background-color': '#c7ff20',
      };

      // Cache the result
      this.imageTransformCache = {
        url: currentUrl,  // Cache original URL, not blob URL
        styles
      };

      // Update imageStyles property
      this.imageStyles = styles;

      return styles;

    } catch (error) {
      console.error('Error generating image styles:', error);
      return this.getDefaultStyles();
    }
  }

  /**
   * Creates default style object when no image is available.
   * Sets default background color and positioning.
   **/
  private getDefaultStyles() {
    const defaults = {
      'background-image': 'none',
      'background-position': '0% 0%',
      'background-repeat': 'no-repeat',
      'background-size': '100%',
      'background-color': '#c7ff20'
    };
    
    // Update imageStyles property even for defaults
    this.imageStyles = defaults;
    
    return defaults;
  }

  /**
   * Gets background image styles with optional animation properties.
   * Used for fade-in/out transitions between states.
   **/
  getBackgroundImageStyles(): ImageStyles {
    // Create a new object with the same properties as imageStyles
    const styles: ImageStyles = {
      'background-image': this.imageStyles['background-image'],
      'background-position': this.imageStyles['background-position'],
      'background-repeat': this.imageStyles['background-repeat'],
      'background-size': this.imageStyles['background-size'],
      'background-color': this.imageStyles['background-color']
    };
    
    // Apply opacity based on animation state, but only when conditions are met
    if (!this.currentUser.imgUrl && 
        this.currentState === ProfileState.ChangingPicture && 
        !this.imageManagementService.hasAnyFirebaseImages() &&
        !this.isTransitioning) {
      
      // Add the optional properties
      styles.opacity = this.imageState === 'visible' ? 1 : 0;
      styles.transition = 'opacity 300ms ease-in';
    }
    
    return styles;
  }

  /**
   * Handles pointer enter event for control buttons.
   * Updates hover state for visual feedback.
   **/
  onPointerEnter(button: string) {
    if(this.shouldShowNavigation() && this.isUploadingOrPasting) return;

    this.hoveredButton = button;
    this.isIconHovered = true;
  }

  /**
   * Handles pointer down event for control buttons.
   * Updates pressed state for visual feedback.
   **/
  onPointerDown(button: string) {
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

  /**
   * Handles pointer up event for control buttons.
   * Resets pressed state and triggers associated action.
   **/
  onPointerUp(button: string) {
    this.resetButtonState(button);
    this.cdr.detectChanges();
  }

  /**
   * Handles pointer leave event for control buttons.
   * Resets hover and pressed states.
   **/
  onPointerLeave(button: string) {
    this.hoveredButton = null;
    this.isIconHovered = false;
    this.resetButtonState(button);
  }

  /**
   * Checks if a specific button is currently hovered.
   * Used for conditional styling.
   **/
  isButtonHovered(button: string): boolean {
    return this.hoveredButton === button;
  }

  /**
   * Determines if a button should be disabled.
   * Prevents actions like zooming beyond limits.
   **/
  isDisabled(button: string): boolean {
    if (button === 'minus') return this.zoomLevel <= this.minZoom;
    if (button === 'plus') return this.zoomLevel >= this.maxZoom;
    if (button === 'reset') return this.isInDefaultPosition() && !this.isDragging;
    return false;
  }

  /**
   * Resets button state after interaction.
   * Removes visual feedback classes.
   **/
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

      if (!this.isMobile || !this.isTablet) {
        // Add a temporary class to handle the transition
        const zoomButtons = document.querySelector('.zoomButtons') as HTMLElement;
        if (reset?.matches(':hover') && zoomButtons) {
          zoomButtons.classList.add('temp-hidden');
          
          // Remove the class after the mouse leaves the reset button
          const resetEl = reset;
          const handleMouseLeave = () => {
            zoomButtons.classList.remove('temp-hidden');
            resetEl.removeEventListener('mouseleave', handleMouseLeave);
          };
          
          resetEl.addEventListener('mouseleave', handleMouseLeave);
        }
      }
    } else if (button === 'left') {
      this.leftClicked = false;
      requestAnimationFrame(() => {
        const chevron = document.querySelector('.chevronLeft');
        chevron?.classList.remove('clicked');
        this.cdr.detectChanges();
      });
    } else if (button === 'right') {
      this.rightClicked = false;
      requestAnimationFrame(() => {
        const chevron = document.querySelector('.chevronRight');
        chevron?.classList.remove('clicked');
        this.cdr.detectChanges();
      });
    } 
  }

  /**
   * Handles profile hover state with multi-tap protection.
   * Requires two hovers to enable certain actions.
   **/
  handlePointerEnter() {
    // Only handle hover if we're explicitly in ChangingPicture state
    if (this.currentState !== ProfileState.ChangingPicture) {
      this.resetHoverState();
      return;
    }

    // Increment count and check conditions
    this.hoverCount++;
    
    if (this.hoverCount === 1) {
      // First hover - ensure hover is disabled
      this.canHoverDelete = false;
    } else if (this.hoverCount === 2) {
      // Second hover - enable hover effect
      this.canHoverDelete = true;
    }
    
    this.cdr.detectChanges();
  }

  /**
   * Resets hover state tracking.
   * Called when leaving hover target or changing state.
   */
  private resetHoverState() {
    this.hoverCount = 0;
    this.canHoverDelete = false;
  }

  /**
   * Handles pointer leave event for multi-tap detection.
   * Updates hover count for tap/hover protection.
   **/
  handlePointerLeave() {
    if (this.hoverCount === 1) {
      // If we leave during first hover, make sure hover is disabled
      this.canHoverDelete = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Gets appropriate text for the cancel button.
   * Changes between "Cancel" and "Back" based on context.
   **/
  getCancelButtonText(): string {
    return this.isInitialChangingPictureState ? 'Cancel' : 'Back';
  }

  /**
   * Checks if image is currently in default position.
   * Used to enable/disable reset controls.
   **/
  isInDefaultPosition(): boolean {
    // If we're uploading/pasting and have a successful image load,
    // we should check position regardless of storage state
    if (this.isUploadingOrPasting && this.imageLoadedSuccessfully) {
      const isDefaultZoom = this.zoomLevel === 1;
      const isDefaultPosition = this.position.x === 0 && this.position.y === 0;
      this.isDefaultPosition = isDefaultZoom && isDefaultPosition;
      return this.isDefaultPosition;
    }

    // Otherwise, check if we have any images to work with
    if (!this.currentUser?.imgUrl && !this.imageManagementService.hasAnyFirebaseImages()) {
      return true;
    }
    
    const isDefaultZoom = this.zoomLevel === 1;
    const isDefaultPosition = this.position.x === 0 && this.position.y === 0;
    this.isDefaultPosition = isDefaultZoom && isDefaultPosition;
    
    return this.isDefaultPosition;
  }

  /**
   * Disables tooltips during certain operations.
   * Prevents tooltips from appearing during loading or animation.
   **/
  disableTooltip(): void {
    this.tooltipDisabled = true;
  }

  /**
   * Enables tooltips when interaction is possible.
   * Allows tooltips to appear when not in loading state.
   **/
  enableTooltip(): void {
    if (this.isLoadingImages) {
      this.tooltipDisabled = true;
      return;
    }
    this.tooltipDisabled = false;
  }
  /*-----------------------------------------------------------------------*/


  /////////////////////// IMAGE NAVIGATION FUNCTIONS ////////////////////////

  /**
   * Navigates to the next image in the carousel.
   * Handles animation and state transition.
   **/
  async nextImage() {
    // Prevent multiple calls during animation or if already clicked
    if (this.rightClicked || this.isTransitioning) return;
    
    try { 
      // Set navigation state flags
      this.rightClicked = true;
      this.isTransitioning = true;
      this.showUploadSuccess = false;
      
      // Clear any existing transition timeouts
      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
      }

      // Reset states if coming from opposite direction
      if (this.lastDirection === 'prev') {
        this.nextImageState = 'next';
        await this.cdr.detectChanges();
      }
      this.lastDirection = 'next';

      // Reset position and zoom before transition
      this.resetImagePositionAndZoomDuringNavigation();

      // if(this.isCurrentImageProfilePicture()){
      //   this.imageStyles = this.imageStyles;
      // }

      // Prepare previous image
      this.imageManagementService.nextImage(this.userId);
      const subject = this.imageManagementService.getUserImagesSubject(this.userId);
      const nextUrl = subject.value.urls[subject.value.currentIndex];

      // Set both current and next image styles simultaneously
      this.nextImageStyles = {
        'background-image': `url("${nextUrl}")`,
        'background-position': '0% 0%',
        'background-size': '100%',
        'background-repeat': 'no-repeat',
        'background-color': '#c7ff20'
      };

      // Force change detection before animation
      await this.cdr.detectChanges();
      
      // Start slide animation for both current and next images
      requestAnimationFrame(() => {
        this.currentImageState = 'slideOutLeft';
        this.nextImageState = 'slideIn';
        this.cdr.detectChanges();
      });

      // Wait for animation completion
      await new Promise<void>(resolve => {
        this.transitionTimeout = setTimeout(() => {
          // Replace current image with next image
          this.imageStyles = { ...this.nextImageStyles };
          this.nextImageStyles = null;

          // Reset animation states
          this.currentImageState = 'current';
          this.nextImageState = 'next';

          // Update form with new URL
          this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
        
          this.cdr.markForCheck();
          resolve();
        }, 450); // Match animation duration
      });
      
    } catch (error) {
      console.error('Error in nextImage:', error);
    } finally {
      // Reset transition states with slight delay to ensure animation completes
      setTimeout(() => {
        this.isTransitioning = false;
        this.rightClicked = false;
        }, 50); // Small delay to ensure animation completes

      // Clear any lingering timeouts
      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
      }
    }
  }

  /**
   * Navigates to the previous image in the carousel.
   * Handles animation and state transition.
   **/
  async previousImage() {
    // Prevent multiple calls during animation or if already clicked
    if (this.leftClicked || this.isTransitioning) return;
    
    try {
      // Set navigation state flags
      this.leftClicked = true;
      this.isTransitioning = true;
      this.showUploadSuccess = false;
      
      // Clear any existing transition timeouts
      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
      }

      // Reset states if coming from opposite direction
      if (this.lastDirection === 'next') {
        this.nextImageState = 'prev';
        await this.cdr.detectChanges();
      }
      this.lastDirection = 'prev';

      // Reset position and zoom before transition
      this.resetImagePositionAndZoomDuringNavigation();

      // Prepare previous image
      this.imageManagementService.previousImage(this.userId);
      const subject = this.imageManagementService.getUserImagesSubject(this.userId);
      const prevUrl = subject.value.urls[subject.value.currentIndex];


      // Set both current and next image styles simultaneously
      this.nextImageStyles = {
        'background-image': `url("${prevUrl}")`,
        'background-position': '0% 0%',
        'background-size': '100%',
        'background-repeat': 'no-repeat',
        'background-color': '#c7ff20'
      };

      // Force change detection before animation
      await this.cdr.detectChanges();
      
      // Start both animations in the same frame
      requestAnimationFrame(() => {
        this.currentImageState = 'slideOutRight';
        this.nextImageState = 'slideIn';
        this.cdr.detectChanges();
      });

      // Wait for animation completion
      await new Promise<void>(resolve => {
        this.transitionTimeout = setTimeout(() => {
          // Replace current image with previous image
          this.imageStyles = { ...this.nextImageStyles };
          this.nextImageStyles = null;

          // Reset animation states
          this.currentImageState = 'current';
          this.nextImageState = 'prev';

          // Update form with new URL
          this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });

          this.cdr.markForCheck();

          resolve();
        }, 450); // Match animation duration
      });

    } catch (error) {
      console.error('Error navigating to previous image:', error);
    } finally {
      // Reset transition states with slight delay to ensure animation completes
      setTimeout(() => {
        this.isTransitioning = false;
        this.leftClicked = false;
      }, 50); // Small delay to ensure animation completes

      // Clear any lingering timeouts
      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
      }
    }
  }

  /**
   * Handles slide animation end event.
   * Updates state after transition completes.
   **/
  onSlideAnimationEnd(event: TransitionEvent) {
    if (event.propertyName !== 'transform') return;
  }

  /**
   * Checks if a URL is the currently selected profile image.
   * Used for highlighting current selection in navigation.
   **/
  isCurrentImage(url: string): boolean {
    if (!this.currentUser.imgUrl || !url) return false;
    return this.imageManagementService.normalizeUrl(url) === 
          this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
  }

  /**
   * Gets the size of the circular progress indicator.
   * Calculates based on container dimensions.
   **/
  get circleSize(): number {
    if (!this.profileImg?.nativeElement) return 200; // Default fallback
    const element = this.profileImg.nativeElement;
    // Get the actual rendered width of the profile picture
    return element.offsetWidth;
  }

  /**
   * Gets the radius for the circular progress indicator.
   * Accounts for stroke width in calculation.
   **/
  get circleRadius(): number {
    return this.circleSize / 2 - this.circleStrokeWidth - 4;
  }

  /**
   * Gets the center point for the circular progress indicator.
   * Used for SVG coordinate calculations.
   **/
  get circleCenter(): number {
    return this.circleSize / 2;
  }

  /**
   * Generates SVG path for a segment in the circular navigation.
   * Creates arc path based on segment index and count.
   **/
  getSegmentPath(index: number): string {
    const totalImages = this.imageManagementService.getUserImagesSubject(this.userId).value.urls.length;
    const segmentAngle = 360 / totalImages;
    const padding = totalImages > 20 ? segmentAngle * 0.1 : segmentAngle * 0.05;
    
    // Offset by -90 degrees (270 degrees) to start at 9 o'clock
    const startAngle = (index * segmentAngle) + padding + 270;
    const endAngle = ((index + 1) * segmentAngle) - padding + 270;
    
    const startX = this.circleCenter + this.circleRadius * Math.cos(this.toRadians(startAngle));
    const startY = this.circleCenter + this.circleRadius * Math.sin(this.toRadians(startAngle));
    const endX = this.circleCenter + this.circleRadius * Math.cos(this.toRadians(endAngle));
    const endY = this.circleCenter + this.circleRadius * Math.sin(this.toRadians(endAngle));

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${startX} ${startY} A ${this.circleRadius} ${this.circleRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  }

  /**
   * Converts degrees to radians for SVG calculations.
   * Helper for circular navigation rendering.
   **/
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Gets CSS class for a segment based on current index.
   * Highlights active segment in navigation.
   **/
  getSegmentClass(index: number): string {
    const currentIndex = this.imageManagementService.getUserImagesSubject(this.userId).value.currentIndex;
    return index === currentIndex ? 'active' : 'inactive';
  }

  /**
   * Handles mouse enter event for navigation chevrons.
   * Shows segment indicators on desktop.
   **/
  onChevronEnter() {
    if(this.shouldShowNavigation() && this.isUploadingOrPasting) return;

    if (!this.isMobile) {
      this.showSegments = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles mouse leave event for navigation chevrons.
   * Hides segment indicators on desktop.
   **/
  onChevronLeave() {
    if(this.shouldShowNavigation() && this.isUploadingOrPasting) return;

    if (!this.isMobile) {
      this.showSegments = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Determines if navigation arrows should be shown.
   * Only shows navigation when multiple images are available.
   **/
  shouldShowNavigation(): boolean {
    
    if (this.isUploadingOrPasting) {
      return false;
    }
    return this.imageCount > 1;
  }

  /**
   * Initializes image navigation controls and state.
   * Sets up image count and carousel functionality.
   **/
  async initializeImageNavigation() {

    try {
      // Get initial count before setting loading state
      const initialCount = await firstValueFrom(
        this.imageManagementService.getImageCount(this.userId)
      );
      
      // Set image count directly
      this.stableImageCount = initialCount;
      
      // Now set loading states
      this.isLoadingImages = true;
      this.tooltipDisabled = true;
      this.firebaseImageLoaded = true;

      const subject = this.imageManagementService.getUserImagesSubject(this.userId);

      // If there's a current user image and we haven't navigated yet, align the index
      if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
        const currentState = subject.value;
        const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
        const currentIndex = currentState.urls.findIndex(
          url => this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
        );
        if (currentIndex !== -1) {
          subject.next({ ...currentState, currentIndex });
        } else if (currentState.urls.length === 0) {
          // If no images exist, fallback to avatar
          this.currentUser.imgUrl = null;
          this.resetImage();
        }
      }

      // Subscribe to image count for navigation
      this.imageManagementService.getImageCount(this.userId).subscribe(count => {
        this.imageCount = count;
        this.showImageNavigation = count > 1;
        this.cdr.detectChanges();
      });

      // If we need to patch the form with the final display URL, do it once:
      if (this.currentUser.imgUrl) {
        const url = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
        this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
      }

    } catch (error) {
      console.error('Error initializing image navigation:', error);
      // If we can't navigate or we fail to load user images, revert to an avatar
      this.resetImage();
    }
  }
  /*-----------------------------------------------------------------------*/


  ////////////////////// IMAGE MANIPULATION FUNCTIONS ///////////////////////

  /**
   * Initializes drag operation when user starts moving the image.
   * Records initial position and sets up move/end event handlers.
   **/
  startDrag(event: MouseEvent | TouchEvent) {
    if(this.currentState === ProfileState.Viewing) return;

    if (!this.canDrag()) {
      return;
    }
    
    this.isDragging = true;
    this.isDragged = true;
    this.isDefaultPosition = false;

    // Get current cursor position
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    
    // Store the initial mouse/touch position
    this.startX = clientX;
    this.startY = clientY;
    
    // Store initial background position for this drag session
    const containerElement = this.profileImg.nativeElement;
    const computedStyle = window.getComputedStyle(containerElement);
    
    // Get initial position in pixels to use as our baseline
    const initialBgPosX = parseFloat(computedStyle.backgroundPositionX);
    const initialBgPosY = parseFloat(computedStyle.backgroundPositionY);
    
    // Store these values in temporary properties
    this._initialDragPosX = initialBgPosX;
    this._initialDragPosY = initialBgPosY;
    
    // For debugging drag
    // console.log('Start drag', { 
    //   clientX, 
    //   clientY, 
    //   startX: this.startX, 
    //   startY: this.startY, 
    //   isDragging: this.isDragging,
    //   initialBackgroundPos: { x: initialBgPosX, y: initialBgPosY }
    // });

    // Attach event listeners
    this.moveListener = this.renderer.listen('document', 'mousemove', (e) => this.drag(e));
    this.upListener = this.renderer.listen('document', 'mouseup', (e) => this.endDrag(e));
    this.touchMoveListener = this.renderer.listen('document', 'touchmove', (e) => this.drag(e));
    this.touchEndListener = this.renderer.listen('document', 'touchend', (e) => this.endDrag(e));

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Processes drag movement to reposition the image.
   * Updates background position based on drag distance.
   **/
  drag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.canDrag() || !this.profileImg?.nativeElement) {
      return;
    }

    requestAnimationFrame(() => {

      // Ensure dragging state is properly reflected for CSS
      this.isDragging = true;

      // Get current cursor position
      const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

      // Calculate the change in position from the start point
      const deltaX = clientX - this.startX;
      const deltaY = clientY - this.startY;

      // Get container dimensions
      const containerElement = this.profileImg.nativeElement;
      const containerRect = containerElement.getBoundingClientRect();
      
      // Get the current background image
      const computedStyle = window.getComputedStyle(containerElement);
      
      // Load image dimensions for precise calculations
      const loadImageDimensions = () => {
        return new Promise<{width: number, height: number}>((resolve) => {
          // Extract image URL from background-image
          const bgImage = computedStyle.backgroundImage;
          const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
          
          if (!urlMatch) {
            // Default to container dimensions if no background image
            resolve({ 
              width: containerRect.width * this.zoomLevel, 
              height: containerRect.height * this.zoomLevel 
            });
            return;
          }
          
          const url = urlMatch[1];
          const img = new Image();
          
          img.onload = () => {
            // Calculate actual dimensions after applying zoom
            const actualWidth = img.width * this.zoomLevel;
            const actualHeight = img.height * this.zoomLevel;
            
            resolve({ width: actualWidth, height: actualHeight });
          };
          
          img.onerror = () => {
            // Fallback to estimated dimensions
            resolve({ 
              width: containerRect.width * this.zoomLevel, 
              height: containerRect.height * this.zoomLevel 
            });
          };
          
          img.src = url;
        });
      };
      
      // We'll use a simpler approach first without loading image dimensions
      // Calculate background image size based on zoom (proportional estimate)
      const backgroundWidth = containerRect.width * this.zoomLevel;
      const backgroundHeight = containerRect.height * this.zoomLevel;
      
      // Skip if no zoom (nothing to drag)
      if (this.zoomLevel <= 1) {
        return;
      }
      
      // Calculate the range that should be available for dragging
      const dragRangeX = backgroundWidth - containerRect.width;
      const dragRangeY = backgroundHeight - containerRect.height;
      
      // Calculate the move amounts for background-position
      const movePercentX = (deltaX / dragRangeX) * -100;
      const movePercentY = (deltaY / dragRangeY) * -100;
      
      // Calculate new position percentages starting from initial position
      let newPercentX = this._initialDragPosX + movePercentX;
      let newPercentY = this._initialDragPosY + movePercentY;
      
      // Force greater range for vertical dragging to ensure bottom is visible
      // For background-position percentages with contain/cover:
      // We need to ensure we can reach 100% for bottom visibility
      const minX = 0;
      const maxX = 100;  // Allow full horizontal range
      const minY = 0;
      const maxY = 100;  // Allow full vertical range
      
      // Apply constraints
      newPercentX = Math.max(minX, Math.min(newPercentX, maxX));
      newPercentY = Math.max(minY, Math.min(newPercentY, maxY));
      
      // Store the new position (for use in updateImageTransform)
      this.position = { x: newPercentX, y: newPercentY };
      
      // For debugging drag
      // console.log('Dragging:', {
      //   deltaMovement: { x: deltaX, y: deltaY },
      //   newPosition: { x: newPercentX, y: newPercentY },
      //   dragRanges: { x: dragRangeX, y: dragRangeY }
      // });
      
      // Apply the change directly to the element for immediate feedback
      this.renderer.setStyle(
        containerElement,
        'background-position',
        `${newPercentX}% ${newPercentY}%`
      );
      
      // Update stored styles
      if (this.imageStyles) {
        this.imageStyles['background-position'] = `${newPercentX}% ${newPercentY}%`;
      }
      
      // Mark as dragged
      this.isDragged = true;
      this.isDefaultPosition = false;
      
      // Force change detection
      this.cdr.detectChanges();
    });
    
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Completes drag operation when user releases the pointer.
   * Finalizes image position and removes event listeners.
   **/
  endDrag(event: MouseEvent | TouchEvent) {
    if(this.currentState === ProfileState.Viewing) return;

    if (this.isDragging && this.canDrag()) {
      // Ensure final position is stored
      if (this.profileImg?.nativeElement) {
        const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
        const finalX = parseFloat(computedStyle.backgroundPositionX);
        const finalY = parseFloat(computedStyle.backgroundPositionY);
        
        // Update stored position
        this.position = { x: finalX, y: finalY };
        this.updateImagePositionAndZoom();
      }
    }

    // Reset dragging state
    setTimeout(() => {
      this.isDragging = false;
      this.cdr.detectChanges(); 
    }, 50);

    // Remove event listeners
    if (this.moveListener) this.moveListener();
    if (this.upListener) this.upListener();
    if (this.touchMoveListener) this.touchMoveListener();
    if (this.touchEndListener) this.touchEndListener();

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Increases zoom level by one step.
   * Updates image transform to show zoomed view.
   **/
  zoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.isZooming = true;
      requestAnimationFrame(() => {
        this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
        this.isDefaultPosition = false;
        this.updateImageTransform();
        setTimeout(() => {
          this.isZooming = false;
        }, 100);
      });
    }
  }

  /**
   * Decreases zoom level by one step.
   * Updates image transform to show zoomed out view.
   **/
  zoomOut() {
    if (this.zoomLevel > this.minZoom) {
      this.isZooming = true;
      requestAnimationFrame(() => {
        this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
        this.isDefaultPosition = this.zoomLevel === 1 && 
                              this.position.x === 0 && 
                              this.position.y === 0;
        this.updateImageTransform();
        setTimeout(() => {
          this.isZooming = false;
        }, 100);
      });
    }
  }

  /**
   * Resets image position and zoom to default values.
   * Centers image and sets zoom to 100%.
   **/
  resetImagePositionAndZoom() {
    const newUrl = this.currentUser.imgUrl; // Store the URL before resetting
    
    this.position = { x: 0, y: 0 };
    this.zoomLevel = 1;
    this.isDragged = false;
    this.isDefaultPosition = true;
    this.currentUser.imgUrl = null; // Clear current image before setting new one
    
    setTimeout(() => {
      this.currentUser.imgUrl = newUrl; // Set new image after reset
      this.updateImageTransform();
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Resets image position during navigation between images.
   * Special version optimized for smooth transitions.
   **/
  resetImagePositionAndZoomDuringNavigation(){

    // const imgElement = this.profileImg.nativeElement;
    // this.renderer.setStyle(imgElement, 'background-size', 'cover'); 

    this.position = { x: 0, y: 0 };
    this.zoomLevel = 1;
    this.isDragged = false;
    this.isDefaultPosition = true;

    // setTimeout(() => {
    //   if (this.profileImg?.nativeElement) {
    //     this.renderer.setStyle(this.profileImg.nativeElement, 'background-position', '0%');
    //   }

      
    //   if (this.profileImg?.nativeElement) {
    //     this.renderer.setStyle(
    //       this.profileImg.nativeElement,
    //       'background-position',
    //       '0% 0%'
    //     );
        
    //     this.renderer.setStyle(
    //       this.profileImg.nativeElement,
    //       'background-size',
    //       '100%'
    //     );
    //   }
    //   this.cdr.detectChanges();
    // }, 0);
    setTimeout(() => {
      this.updateImageTransform();
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Restores image position and zoom to previously saved settings.
   * Used when canceling changes to revert to original state.
   **/
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

  /**
   * Updates the visual transform of the image.
   * Applies position, zoom, and styling to the DOM element.
   **/
  async updateImageTransform() {
    if (!this.profileImg?.nativeElement) return;

    const imgElement = this.profileImg.nativeElement;
    
    try {
      // Add smooth transform class for animated transitions
      this.renderer.addClass(imgElement, 'smooth-transform');

      // Get current URL from form or user
      let currentUrl = this.pictureForm.get('imgUrl')?.value || this.currentUser?.imgUrl;
      if (!currentUrl) return;

      // Handle Promise/ZoneAwarePromise objects (common with async operations)
      if (currentUrl instanceof Promise || (currentUrl && typeof currentUrl === 'object' && '__zone_symbol__value' in currentUrl)) {
        currentUrl = await currentUrl;
      }

      if (!currentUrl) return;

      // Convert Firebase URLs to accessible proxy URLs if needed
      if (currentUrl.includes('firebasestorage.googleapis.com')) {
        currentUrl = await this.storageService.convertFirebaseUrl(currentUrl);
      }

      // Get current background image
      const currentBgImage = window.getComputedStyle(imgElement).backgroundImage;

      // If we have a valid current background image and it's not changing, keep it
      let backgroundImage = currentBgImage;
      
      if (currentBgImage === 'none' || this.isImageUrlChanged) {
        // Only fetch new image with auth if URL is changing
        if (currentUrl.includes('/api/storage/')) {
          // Create a new image element for preloading
          const img = new Image();
          await new Promise<void>(async (resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            // Use fetch with auth headers to get image
            fetch(currentUrl, { 
              headers: await this.storageService.getAuthHeaders() 
            })
            .then(response => response.blob())
            .then(blob => {
              img.src = URL.createObjectURL(blob);
            });
          });
        }
        backgroundImage = `url("${currentUrl}")`;
      }

      // Create complete styles object with position and zoom
      const styles = {
        'background-image': backgroundImage,
        'background-position': `${this.position.x}% ${this.position.y}%`,
        'background-repeat': 'no-repeat',
        'background-size': `${this.zoomLevel * 100}%`,
        'background-color': '#c7ff20'
      };

      // Apply styles - directly apply position and size for immediate update
      this.renderer.setStyle(imgElement, 'background-position', `${this.position.x}% ${this.position.y}%`);
      this.renderer.setStyle(imgElement, 'background-size', `${this.zoomLevel * 100}%`);
      
      // Then apply other styles that don't need immediate update
      Object.entries(styles).forEach(([key, value]) => {
        if (key !== 'background-position' && key !== 'background-size' && 
            (key !== 'background-image' || this.isImageUrlChanged)) {
          this.renderer.setStyle(imgElement, key, value);
        }
      });
      
      // Store styles for reference by other methods
      this.imageStyles = styles;

      // Update user settings if they exist
      if (this.currentUser) {
        this.currentUser.profilePictureSettings = {
          zoom: this.zoomLevel,
          x: this.position.x,
          y: this.position.y
        };
      }

      // Reset the image URL changed flag
      this.isImageUrlChanged = false;

    } catch (error) {
      console.error('Error updating image transform:', error);
    }
  }

  /**
   * Updates image position and zoom without full recalculation.
   * Optimized version for frequent updates during drag.
   **/
  updateImagePositionAndZoom() {
    if (!this.profileImg?.nativeElement) return;

    const imgElement = this.profileImg.nativeElement;
    
    // Apply position and zoom directly
    this.renderer.setStyle(
      imgElement, 
      'background-position', 
      `${this.position.x}% ${this.position.y}%`
    );
    
    this.renderer.setStyle(
      imgElement, 
      'background-size', 
      `${this.zoomLevel * 100}%`
    );
    
    // Update stored styles
    if (this.imageStyles) {
      this.imageStyles['background-position'] = `${this.position.x}% ${this.position.y}%`;
      this.imageStyles['background-size'] = `${this.zoomLevel * 100}%`;
    }
  }

  /**
   * Determines if image dragging should be enabled.
   * Checks multiple conditions to enable/disable dragging.
   **/
  canDrag(): boolean {
    const isEditing = this.currentState === ProfileState.ChangingPicture;
    const hasImage = Boolean(this.currentUser?.imgUrl) && this.imageLoadedSuccessfully === true;
    const hasFirebaseImages = this.imageManagementService.hasAnyFirebaseImages() && this.firebaseImageLoaded;
    const hasPastedUrl = Boolean(this.pictureForm.get('imgUrl')?.value) && this.imageLoadedSuccessfully === true;
    const hasProfileImg = this.profileImg?.nativeElement != null;

    return isEditing === true && 
          (hasImage === true || hasFirebaseImages === true || hasPastedUrl === true) && 
          hasProfileImg === true;
  }

  /**
   * Sets up drag event listeners for the profile image.
   * Enables image repositioning in the frame.
   **/
  setupDragListeners() {
   
    if (!this.isImageUrlFilled()) {
      return;
    }

    const profileDiv = this.profileImg!.nativeElement;

    profileDiv.addEventListener('mousedown', (event) => this.startDrag(event));
    profileDiv.addEventListener('touchstart', (event) => this.startDrag(event));

  }
  /*---------------------------------------------------------------------*/


  ////////////////////// ERROR MESSAGES & VALIDATION //////////////////////

  /**
   * Gets appropriate error message for a form control.
   * Returns context-specific validation message.
   **/
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

  /**
   * Determines if error should be shown for a specific control.
   * Controls visibility of error messages based on validation state.
   **/
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

  /**
   * Gets input styling based on validation state.
   * Applies error styling to invalid inputs.
   **/
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
      // control = this.profileForm.get(controlName);
      // if (control) {
      //   const trimmedValue = control.value?.trim() || '';
      //   isInvalid = (control.invalid && control.touched) || 
      //               (controlName === 'email' && control.hasError('emailExists')) ||
      //               (!trimmedValue && control.touched);
      // }
      control = this.profileForm.get(controlName);
      if (control) {
        // Safely handle different value types
        const value = control.value;
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        const isEmpty = trimmedValue === '' || trimmedValue === null || trimmedValue === undefined;
        
        isInvalid = (control.invalid && control.touched) || 
                    (controlName === 'email' && control.hasError('emailExists')) ||
                    (isEmpty && control.touched);
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

  /**
   * Gets label styling based on validation state.
   * Applies error styling to labels of invalid inputs.
   **/
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

  /**
   * Toggles visibility of URL input field.
   * Switches between URL input and button display.
   **/
  pasteUrl(){
    this.showButton = !this.showButton;
    this.tooltipDisabled = false;
  }
  /*---------------------------------------------------------------------*/


  ///////////////////// GOOGLE FIREBASE IMAGE UPLOAD //////////////////////

  /**
   * Handles file selection for image upload.
   * Processes selected file and uploads to Firebase.
   **/
  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    try {
      this.isUploading = true;
      this.showUploadSuccess = false;
      this.providerUrlPasted = false;
      this.uploadProgress = 0;

      const userId = this.userService.getUserId();
      if (!userId) throw new Error('User ID not found');

      // Subscribe to progress before starting upload
      const progressSub = this.firebaseService.getUploadProgress().subscribe(
        progress => {
          this.ngZone.run(() => {
            this.uploadProgress = Math.min(progress.progress, 99);
            this.cdr.detectChanges();
          });
        }
      );

      // Get proxied URL from upload
      const displayUrl = await this.imageUrlManager.handleImageUpload(file, userId);

      // Set progress to 100% and wait briefly
      this.ngZone.run(() => {
        this.uploadProgress = 100;
        this.cdr.detectChanges();
      });

      // Wait for progress animation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get auth headers before entering NgZone
      const headers = await this.storageService.getAuthHeaders();

      this.ngZone.run(async () => {
        try {
          const response = await fetch(displayUrl, { headers });
          if (!response.ok) throw new Error('Failed to load image');

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          if (this.profileImg?.nativeElement) {
            this.renderer.addClass(this.profileImg.nativeElement, 'loading');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Update styles and form
            this.imageStyles = {
              'background-image': `url("${blobUrl}")`,
              'background-position': '0% 0%',
              'background-repeat': 'no-repeat',
              'background-size': '100%',
              'background-color': '#c7ff20'
            };

            Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
            this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
            this.currentUser.imgUrl = displayUrl;

            // Reset position and states
            this.isUploadingOrPasting = true;
            this.position = { x: 0, y: 0 };
            this.zoomLevel = 1;
            this.isDragged = false;
            this.imageLoadedSuccessfully = true;
            this.imageNotFound = false;

            // Show upload success message
            this.showUploadSuccess = true;
            // this.onlyFirebaseImageCount++;

            // Clean up blob URL after a delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
          }
        } catch (error) {
          console.error('Error in ngZone:', error);
          this.imageNotFound = true;
          this.imageLoadedSuccessfully = false;
          this.showUploadSuccess = false;
        }
      });

      progressSub.unsubscribe();

    } catch (error) {
      console.error('Error in onFileSelected:', error);
      this.showError(error instanceof Error ? error.message : 'Upload failed');
      this.showUploadSuccess = false;
    } finally {
      setTimeout(() => {
        this.isUploading = false;
        this.cdr.detectChanges();
      }, 500);
    }
  }

  /**
   * Displays error message to the user.
   * Shows contextual feedback for image operations.
   **/
  private showError(message: string) {
    // Implement your error display logic here
    console.error(message);
    // Example: this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  /**
   * Handles upload errors with appropriate UI feedback.
   * Sets form errors based on error type.
   **/
  private handleUploadError(error: any): void {
    this.ngZone.run(() => {
      const imgUrlControl = this.pictureForm.get('imgUrl');
      if (!imgUrlControl) return;

      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 413:
            imgUrlControl.setErrors({ 'fileSize': true });
            this.showError('File size exceeds limit');
            break;
          case 415:
            imgUrlControl.setErrors({ 'fileType': true });
            this.showError('File type not supported');
            break;
          case 401:
            imgUrlControl.setErrors({ 'unauthorized': true });
            this.showError('Authentication failed');
            break;
          default:
            imgUrlControl.setErrors({ 'uploadFailed': true });
            this.showError('Upload failed');
        }
      } else {
        imgUrlControl.setErrors({ 'uploadFailed': true });
        this.showError('Upload failed');
      }
    });
  }
  
  /**
   * Gets retry message based on current retry count.
   * Provides feedback during automatic retry attempts.
   **/
  get retryMessage(): string {
    if (this.retryCount === 0) return '';
    return `Retry attempt ${this.retryCount} of ${this.maxRetries}...`;
  }

  /**
   * Determines if retry progress should be shown.
   * Controls visibility of retry feedback.
   **/
  get showRetryProgress(): boolean {
    return this.isUploading && this.retryCount > 0;
  }   

  /**
   * Deletes the currently selected image.
   * Removes from storage and updates navigation.
   **/
  async deleteCurrentImage() {
    try {
      const previousState = this.imageManagementService.getCurrentState(this.userId);
      const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
      
      // Store the next state before deletion for smooth transition
      const nextState = await this.imageManagementService.getNextState(this.userId);
      
      await this.imageManagementService.deleteCurrentImage(this.userId);
      const currentState = this.imageManagementService.getCurrentState(this.userId);

      // Update form and UI based on new state
      this.ngZone.run(async () => {
        if (!currentState.hasImages) {
          // If no images left, do a complete reset
          this.currentUser.imgUrl = null;
          this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
          this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
          
          // Reset all service state
          this.imageManagementService.resetAll(this.userId);
          
          // Reset UI
          this.resetImage();
          await this.updateDatabaseToNull();

          // Reset image styles
          if (this.profileImg?.nativeElement) {
            this.imageStyles = {
              'background-image': 'none',
              'background-position': '0% 0%',
              'background-repeat': 'no-repeat',
              'background-size': '100%',
              'background-color': '#c7ff20'
            };
            Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
            this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
          }

          // Ensure cache is cleared
          this.imageTransformCache = null;
          this.invalidateStyleCache();
        } else {
          // Reset position and zoom before transitioning to next image
          this.position = { x: 0, y: 0 };
          this.zoomLevel = 1;
          this.isDragged = false;
          this.isDefaultPosition = true;

          const currentUrl = await firstValueFrom(
            this.imageManagementService.getCurrentImage(this.userId)
          );
          
          if (currentUrl) {
            // Update form with new URL and default position/zoom
            this.pictureForm.patchValue({
              imgUrl: currentUrl,
              profilePictureSettings: {
                zoom: 1,
                x: 0,
                y: 0
              }
            }, { emitEvent: false });

            // Update styles with default position/zoom
            this.imageStyles = {
              'background-image': `url("${currentUrl}")`,
              'background-position': '0% 0%',
              'background-repeat': 'no-repeat',
              'background-size': '100%',
              'background-color': '#c7ff20'
            };

            if (this.profileImg?.nativeElement) {
              Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
            }

            await this.updateImageTransform();
          }
        }

        this.showUploadSuccess = false;
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error deleting image:', error);
      this.imageNotFound = false;
      this.currentUser.imgUrl = null;
      this.resetImage();
    }
  }

  /**
   * Setter for upload progress tracking.
   * Updates progress indicator with change detection.
   **/
  private _uploadProgress = 0;
  @Input() set checkUploadProgress(value: number) {
      this._uploadProgress = value;
      this.cdr.detectChanges();
  }

  /**
   * Getter for upload progress value.
   * Returns current upload progress percentage.
   **/
  get checkUploadProgress(): number {
  return this._uploadProgress;
  }

  /**
   * Handles save operation errors with appropriate UI feedback.
   * Maps HTTP error codes to user-friendly messages and form validation errors.
   **/
  private handleSaveError(error: any): void {
    this.ngZone.run(() => {
      const imgUrlControl = this.pictureForm.get('imgUrl');
      if (!imgUrlControl) return;

      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 401:
            imgUrlControl.setErrors({ 'unauthorized': true });
            this.showError('Session expired. Please log in again');
            break;
          case 403:
            imgUrlControl.setErrors({ 'forbidden': true });
            this.showError('You do not have permission to perform this action');
            break;
          case 404:
            imgUrlControl.setErrors({ 'notFound': true });
            this.showError('Image not found');
            break;
          case 413:
            imgUrlControl.setErrors({ 'fileSize': true });
            this.showError('File size exceeds the maximum limit');
            break;
          case 415:
            imgUrlControl.setErrors({ 'fileType': true });
            this.showError('Unsupported file type');
            break;
          default:
            imgUrlControl.setErrors({ 'saveFailed': true });
            this.showError('Failed to save profile picture. Please try again');
        }
      } else {
        imgUrlControl.setErrors({ 'saveFailed': true });
        this.showError('An unexpected error occurred. Please try again');
      }

      // Reset to viewing state on error
      this.currentState = ProfileState.Viewing;
      this.cdr.detectChanges();
    });
  }

  /**
   * Converts Firebase URLs to displayable URLs with token refresh handling.
   * Attempts URL conversion and refreshes auth token on 401 errors.
   **/
  private async convertAndDisplayUrl(url: string): Promise<string> {
    try {
      // First attempt
      const displayUrl = await this.storageService.convertFirebaseUrl(url);
      return displayUrl;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Try refreshing token
        await this.authService.refreshToken();
        // Retry after token refresh
        return this.storageService.convertFirebaseUrl(url);
      }
      throw error;
    }
  }
}
/*-----------------------------------------------------------------------*/









































// onProfilePictureSelected() {
//   this.selectedProfileUrl = newProfileUrl;  // Store the newly selected profile URL
// }


// savePosition() {
//   this.userService.saveProfilePicturePosition(this.userId, this.position).subscribe(
//     response => console.log('Position saved successfully'),
//     error => console.error('Error saving position', error)
//   );
// }


// // LATEST WORKING
// async updateImageTransform() {
//   if (!this.profileImg?.nativeElement) return;

//   const imgElement = this.profileImg.nativeElement;
  
//   try {
//     this.renderer.addClass(imgElement, 'smooth-transform');

//     // Get current URL from form or user
//     let currentUrl = this.pictureForm.get('imgUrl')?.value || this.currentUser?.imgUrl;
//     if (!currentUrl) return;

//     // // Convert promise to string if needed
//     // if (currentUrl instanceof Promise) {
//     //   currentUrl = await currentUrl;
//     // }

//     // Handle Promise/ZoneAwarePromise
//     if (currentUrl instanceof Promise || (currentUrl && typeof currentUrl === 'object' && '__zone_symbol__value' in currentUrl)) {
//       currentUrl = await currentUrl;
//     }

//     if (!currentUrl) return;

//     // // Ensure we have a full API URL
//     // if (!currentUrl.startsWith('http')) {
//     //   currentUrl = await this.storageService.convertFirebaseUrl(currentUrl);
//     // }

//     // Convert Firebase URLs if needed
//     if (currentUrl.includes('firebasestorage.googleapis.com')) {
//       currentUrl = await this.storageService.convertFirebaseUrl(currentUrl);
//     }

//     // Get auth headers for API storage URLs
//     const headers = currentUrl.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       null;

//     // console.log('Transform - Current URL:', currentUrl);

//     // Get current background image
//     const currentBgImage = window.getComputedStyle(imgElement).backgroundImage;
//     // console.log('Transform - Current background-image:', currentBgImage);

//     // If we have a valid current background image and it's not changing, keep it
//     const backgroundImage = currentBgImage !== 'none' && !this.isImageUrlChanged ? 
//       currentBgImage : 
//       `url("${currentUrl}")`;

//     // Create the styles object
//     const styles = {
//       'background-image': backgroundImage,
//       'background-position': `${this.position.x}% ${this.position.y}%`,
//       'background-repeat': 'no-repeat',
//       'background-size': `${this.zoomLevel * 100}%`,
//       'background-color': '#c7ff20'
//     };

//     // Apply styles
//     Object.entries(styles).forEach(([key, value]) => {
//       // Only update background-image if it's changing
//       if (key !== 'background-image' || this.isImageUrlChanged) {
//         this.renderer.setStyle(imgElement, key, value);
//       }
//     });
    
//     // Store styles for reference
//     this.imageStyles = styles;

//     // Update user settings if they exist
//     if (this.currentUser) {
//       this.currentUser.profilePictureSettings = {
//         zoom: this.zoomLevel,
//         x: this.position.x,
//         y: this.position.y
//       };
//     }

//     // Reset the image URL changed flag
//     this.isImageUrlChanged = false;

//     // console.log('Transform - Applied styles:', styles);

//   } catch (error) {
//     console.error('Error updating image transform:', error);
//   }
// }

// Last working
// async updateImageTransform() {
//   if (!this.profileImg?.nativeElement) return;

//   const imgElement = this.profileImg.nativeElement;
  
//   try {
//     this.renderer.addClass(imgElement, 'smooth-transform');

//     // Get current URL from form or user
//     let currentUrl = this.pictureForm.get('imgUrl')?.value || this.currentUser?.imgUrl;
//     if (!currentUrl) return;

//     // Handle Promise/ZoneAwarePromise
//     if (currentUrl instanceof Promise || (currentUrl && typeof currentUrl === 'object' && '__zone_symbol__value' in currentUrl)) {
//       currentUrl = await currentUrl;
//     }

//     if (!currentUrl) return;

//     // Convert Firebase URLs if needed
//     if (currentUrl.includes('firebasestorage.googleapis.com')) {
//       currentUrl = await this.storageService.convertFirebaseUrl(currentUrl);
//     }

//     // Get current background image
//     const currentBgImage = window.getComputedStyle(imgElement).backgroundImage;

//     // If we have a valid current background image and it's not changing, keep it
//     let backgroundImage = currentBgImage;
    
//     if (currentBgImage === 'none' || this.isImageUrlChanged) {
//       // Only fetch new image with auth if URL is changing
//       if (currentUrl.includes('/api/storage/')) {
//         // Create a new image element
//         const img = new Image();
//         await new Promise<void>(async (resolve, reject) => {
//           img.onload = () => resolve();
//           img.onerror = () => reject();
//           // Use fetch with auth headers to get image
//           fetch(currentUrl, { 
//             headers: await this.storageService.getAuthHeaders() 
//           })
//           .then(response => response.blob())
//           .then(blob => {
//             img.src = URL.createObjectURL(blob);
//           });
//         });
//       }
//       backgroundImage = `url("${currentUrl}")`;
//     }

//     // Create the styles object
//     const styles = {
//       'background-image': backgroundImage,
//       'background-position': `${this.position.x}% ${this.position.y}%`,
//       'background-repeat': 'no-repeat',
//       'background-size': `${this.zoomLevel * 100}%`,
//       'background-color': '#c7ff20'
//     };

//       // Apply opacity if needed for animation
//     //   if (!this.currentUser.imgUrl && 
//     //     this.currentState === ProfileState.ChangingPicture && 
//     //     !this.imageManagementService.hasAnyFirebaseImages() &&
//     //     !this.isTransitioning) {
      
//     //   styles.opacity = this.imageState === 'visible' ? 1 : 0;
//     //   styles.transition = 'opacity 300ms ease-in';
//     // }

//     // Apply styles
//     Object.entries(styles).forEach(([key, value]) => {
//       if (key !== 'background-image' || this.isImageUrlChanged) {
//         this.renderer.setStyle(imgElement, key, value);
//       }
//     });
    
//     // Store styles for reference
//     this.imageStyles = styles;

//     // Update user settings if they exist
//     if (this.currentUser) {
//       this.currentUser.profilePictureSettings = {
//         zoom: this.zoomLevel,
//         x: this.position.x,
//         y: this.position.y
//       };
//     }

//     // Reset the image URL changed flag
//     this.isImageUrlChanged = false;

//   } catch (error) {
//     console.error('Error updating image transform:', error);
//   }
// }

// getBackgroundImageStyles() {
//   const styles = {...this.imageStyles};
  
//   // Apply opacity based on animation state, but only when conditions are met
//   if (!this.currentUser.imgUrl && 
//       this.currentState === ProfileState.ChangingPicture && 
//       !this.imageManagementService.hasAnyFirebaseImages() &&
//       !this.isTransitioning) {
    
//     // Apply opacity based on animation state
//     styles['opacity'] = this.imageState === 'visible' ? 1 : 0;
//     styles['transition'] = 'opacity 300ms ease-in';
//   }
  
//   return styles;
  // }

// private normalizeUrl(url: string): string {
//   if (!url) return '';
  
//   try {
//     // Remove any protocol, domain, and storage prefix to compare just the paths
//     return url
//       .replace(/^https?:\/\//, '')  // Remove protocol
//       .replace(/[^/]+\//, '')       // Remove domain
//       .replace(/^.*?(profileImages\/)/, 'profileImages/') // Normalize storage path
//       .replace(/\?.*$/, '');        // Remove query parameters
//   } catch (error) {
//     console.error('Error normalizing URL:', error);
//     return url;
//   }
// }

// private async getDisplayableUrl(url: string): Promise<string> {
//   console.log('Converting URL for display:', { originalUrl: url });

//   // If it's a Firebase URL, convert it
//   if (url.includes('firebasestorage.googleapis.com')) {
//     return await this.storageService.convertFirebaseUrl(url);
//   }

//   // If it's already a proxied URL, use it as is
//   if (url.includes('/api/storage/')) {
//     console.log('Using proxied URL as is');
//     return url;
//   }

//   // For provider URLs, return as is
//   if (this.imageManagementService.isProviderUrl(url)) {
//     console.log('Using provider URL as is');
//     return url;
//   }

//   // Default case - convert to proxied URL
//   return await this.storageService.convertFirebaseUrl(url);
// }

// last working
// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);
//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     // Update form and UI based on new state
//     this.ngZone.run(async () => {
//       if (!newState.hasImages) {
//         // If no images left, do a complete reset
//         this.currentUser.imgUrl = null;
//         this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//         this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
        
//         // Reset all service state
//         this.imageManagementService.resetAll(this.userId);
        
//         // Reset UI
//         this.resetImage();
//         await this.updateDatabaseToNull();

//         // Reset image styles
//         if (this.profileImg?.nativeElement) {
//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': '0% 0%',
//             'background-repeat': 'no-repeat',
//             'background-size': '100%',
//             'background-color': '#c7ff20'
//           };
//           Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//         }

//         // Ensure cache is cleared
//         this.imageTransformCache = null;
//         this.invalidateStyleCache();
//       } else {
//         const currentUrl = await firstValueFrom(
//           this.imageManagementService.getCurrentImage(this.userId)
//         );
        
//         if (currentUrl) {
//           this.pictureForm.patchValue({
//             imgUrl: currentUrl
//           }, { emitEvent: false });
//         }
//       }

//       this.showUploadSuccess = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

// async nextImage() {
//   // Single exit point if animation in progress or button clicked
//   if (this.animationLock || this.rightClicked) {
//     return;
//   }

//   try {
//     // Set flags immediately to prevent multiple calls
//     this.animationLock = true;
//     this.rightClicked = true;
//     this.showUploadSuccess = false;

//     // Cancel any existing animation promise/timeout
//     if (this.transitionTimeout) {
//       clearTimeout(this.transitionTimeout);
//       this.transitionTimeout = null;
//     }

//     // Get the subject directly
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    
//     // Move to next image
//     this.imageManagementService.nextImage(this.userId);
    
//     // Get next image URL after navigation
//     const nextUrl = subject.value.urls[subject.value.currentIndex];
    
//     // Reset position and zoom immediately (before animation)
//     this.position = { x: 0, y: 0 };
//     this.zoomLevel = 1;
//     this.isDragged = false;
//     this.isDefaultPosition = true;

//     // Create an atomic animation promise that will complete
//     this.animationPromise = (async () => {
//       try {
//         // Setup animation states
//         this.nextImageStyles = {
//           'background-image': `url("${nextUrl}")`,
//           'background-position': '0% 0%',
//           'background-size': '100%',
//           'background-repeat': 'no-repeat',
//           'background-color': '#c7ff20'
//         };

//         // Force layout recalculation
//         await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
//         this.cdr.detectChanges();
        
//         // Update animation states to trigger transition
//         this.currentImageState = 'slideOutLeft';
//         this.nextImageState = 'slideIn';
//         this.isTransitioning = true;
//         this.lastDirection = 'next';
        
//         // Force another layout calculation to apply the animation
//         await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
//         this.cdr.detectChanges();

//         // Wait for animation to complete - use Promise instead of timeout
//         await new Promise<void>(resolve => {
//           this.transitionTimeout = setTimeout(() => {
//             // Animation completed, update state
//             this.imageStyles = { ...this.nextImageStyles };
//             this.nextImageStyles = null;
//             this.currentImageState = 'current';
//             this.nextImageState = 'next';
            
//             // Update form with new URL
//             this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
            
//             // Force final layout update
//             requestAnimationFrame(() => {
//               this.cdr.detectChanges();
//               resolve();
//             });
//           }, this.ANIMATION_DURATION + 50); // Add buffer to ensure animation completes
//         });
//       } finally {
//         // Always clean up promise reference when done
//         this.animationPromise = null;
//       }
//     })();

//     // Wait for animation to complete before exiting method
//     await this.animationPromise;

//   } catch (error) {
//     console.error('Error in nextImage:', error);
//   } finally {
//     // Reset all flags
//     this.rightClicked = false;
//     this.isTransitioning = false;
//     this.animationLock = false;
//   }
// }

// async previousImage() {
//   if (this.animationLock || this.leftClicked) {
//     return;
//   }

//   try {
//     this.animationLock = true;
//     this.leftClicked = true;
//     this.showUploadSuccess = false;

//     if (this.transitionTimeout) {
//       clearTimeout(this.transitionTimeout);
//       this.transitionTimeout = null;
//     }

//     // Get the subject directly
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);

//     // Move to previous image
//     this.imageManagementService.previousImage(this.userId);
    
//     // Get previous image URL after navigation
//     const prevUrl = subject.value.urls[subject.value.currentIndex];
    
//     this.position = { x: 0, y: 0 };
//     this.zoomLevel = 1;
//     this.isDragged = false;
//     this.isDefaultPosition = true;

//     this.animationPromise = (async () => {
//       try {
//         this.nextImageStyles = {
//           'background-image': `url("${prevUrl}")`,
//           'background-position': '0% 0%',
//           'background-size': '100%',
//           'background-repeat': 'no-repeat',
//           'background-color': '#c7ff20'
//         };

//         await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
//         this.cdr.detectChanges();
        
//         this.currentImageState = 'slideOutRight';
//         this.nextImageState = 'slideIn';
//         this.isTransitioning = true;
//         this.lastDirection = 'prev';
        
//         await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
//         this.cdr.detectChanges();

//         await new Promise<void>(resolve => {
//           this.transitionTimeout = setTimeout(() => {
//             this.imageStyles = { ...this.nextImageStyles };
//             this.nextImageStyles = null;
//             this.currentImageState = 'current';
//             this.nextImageState = 'prev';
            
//             this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
            
//             requestAnimationFrame(() => {
//               this.cdr.detectChanges();
//               resolve();
//             });
//           }, this.ANIMATION_DURATION + 50);
//         });
//       } finally {
//         this.animationPromise = null;
//       }
//     })();

//     await this.animationPromise;

//   } catch (error) {
//     console.error('Error in previousImage:', error);
//   } finally {
//     this.leftClicked = false;
//     this.isTransitioning = false;
//     this.animationLock = false;
//   }
// }

// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//       if (this.transitionTimeout) {
//           clearTimeout(this.transitionTimeout);
//           this.transitionTimeout = null;
//       }

//       this.rightClicked = true;
//       this.isTransitioning = true;
      
//       // Get next image URL
//       this.imageManagementService.nextImage(this.userId);
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const nextUrl = subject.value.urls[subject.value.currentIndex];
      
//       // Preload next image
//       await this.preloadImage(nextUrl, false);
      
//       // IMPORTANT: Keep current image styles as they are
//       // Don't update the current image yet!
      
//       // Set up next image for sliding in
//       this.nextImageStyles = {
//           'background-image': `url("${nextUrl}")`,
//           'background-position': this.imageStyles['background-position'] || '0% 0%',
//           'background-size': this.imageStyles['background-size'] || '100%',
//           'background-repeat': 'no-repeat',
//           'background-color': '#c7ff20'
//       };
      
//       // Force reflow
//       void this.profileImg?.nativeElement.offsetHeight;
      
//       // Start the slide transition
//       this.isSliding = true;
//       this.cdr.detectChanges();
      
//       // Wait for the slide animation to complete
//       await new Promise<void>(resolve => {
//           this.transitionTimeout = setTimeout(() => {
//               // Now we can update the current image
//               this.imageStyles = { ...this.nextImageStyles };
//               this.nextImageStyles = null;
//               this.isSliding = false;
              
//               this.cdr.detectChanges();
//               resolve();
//           }, 400);
//       });
      
//       // Update form only after transition is complete
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
      
//   } catch (error) {
//       console.error('Error in nextImage:', error);
//   } finally {
//       this.rightClicked = false;
//       this.isTransitioning = false;
//       if (this.transitionTimeout) {
//           clearTimeout(this.transitionTimeout);
//           this.transitionTimeout = null;
//       }
//   }
// }

// Update the slide animation end handler
// onSlideAnimationEnd(event: TransitionEvent) {
//   if (event.propertyName === 'transform') {
//       // Clear any lingering transition states
//       this.isSliding = false;
//       this.nextImageStyles = null;
//       this.cdr.detectChanges();
//   }
// }

// getProfileClasses() {
//   return {
//     'changing-picture': this.currentState === ProfileState.ChangingPicture,
//     'default-position': !this.isDragged,
//     'loaded': this.imageLoadedSuccessfully,
//     'loading': !this.imageLoadedSuccessfully || this.isLoadingImages,
//     'firstTimeAnimation': this.firstTimeAnimation && this.tierThree,
//     'tierThreeStyle': this.tierThree,
//     'draggable': this.canDrag()
//   };
// }



// async previousImage() {
//   if (this.leftClicked || this.isTransitioning) return;
  
//   try {
//     this.leftClicked = true;
//     this.isTransitioning = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Update image management service first
//     this.imageManagementService.previousImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const prevUrl = subject.value.urls[subject.value.currentIndex];

//     // Set up the previous image styles
//     this.nextImageStyles = {
//       'background-image': `url("${prevUrl}")`,
//       'background-position': '0% 0%',
//       'background-size': '100%'
//     };

//     // Force a reflow
//     void this.profileImg?.nativeElement.offsetHeight;
    
//     // Start the slide animation
//     this.isSlidingLeft = true;
    
//     // Wait for the animation to complete via onSlideAnimationEnd
//     await new Promise<void>(resolve => {
//       const onAnimationComplete = (event: TransitionEvent) => {
//         if (event.propertyName === 'transform') {
//           this.profileImg?.nativeElement.removeEventListener('transitionend', onAnimationComplete);
//           resolve();
//         }
//       };
//       this.profileImg?.nativeElement.addEventListener('transitionend', onAnimationComplete);
//     });

//     // Update the form after animation completes
//     this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
//     this.imageStyles = { ...this.nextImageStyles };
//     this.nextImageStyles = null;

//     this.imageManagementService.logNavigationState(this.userId);
//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     this.leftClicked = false;
//     this.isTransitioning = false;
//     this.isSlidingLeft = false;
//     this.cdr.detectChanges();
//   }
// }

// async nextImage() {
//   if (this.rightClicked || this.isAnimating) return;
  
//   try {
//     this.rightClicked = true;
//     this.isAnimating = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // 1) Current image
//     const oldUrl = this.pictureForm.get('imgUrl')?.value || '';

//     // 2) Move index forward
//     this.imageManagementService.nextImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
//     const newIndex = currentState.currentIndex;
//     const nextUrl = currentState.urls[newIndex] || '';

//     // 3) Reset any previous animation states
//     this.isSlidingLeft = false;
//     this.isSlidingRight = false;
//     this.cdr.detectChanges();

//     // 4) Set up new animation
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = nextUrl;
//     this.newImageStartingClass = 'start-slide-right';
//     this.xDirection = '100%';
    
//     // Force a repaint to ensure the starting position is set
//     await new Promise(resolve => requestAnimationFrame(resolve));
//     this.cdr.detectChanges();
    
//     // Wait a frame to ensure starting position is applied
//     await new Promise(resolve => requestAnimationFrame(resolve));

//     // 5) Trigger the animation
//     this.isSlidingRight = true;
//     this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//     this.cdr.detectChanges();

//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     setTimeout(() => {
//       this.rightClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 300);
//   }
// }

// async previousImage() {
//   if (this.leftClicked || this.isAnimating) return;
  
//   try {
//     this.leftClicked = true;
//     this.isAnimating = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // 1) Current image
//     const oldUrl = this.pictureForm.get('imgUrl')?.value || '';

//     // 2) Move index backward
//     this.imageManagementService.previousImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
//     const newIndex = currentState.currentIndex;
//     const prevUrl = currentState.urls[newIndex] || '';

//     // 3) Reset any previous animation states
//     this.isSlidingLeft = false;
//     this.isSlidingRight = false;
//     this.cdr.detectChanges();

//     // 4) Set up new animation
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = prevUrl;
//     this.newImageStartingClass = 'start-slide-left';
//     this.xDirection = '-100%';
    
//     // Force a repaint to ensure the starting position is set
//     await new Promise(resolve => requestAnimationFrame(resolve));
//     this.cdr.detectChanges();
    
//     // Wait a frame to ensure starting position is applied
//     await new Promise(resolve => requestAnimationFrame(resolve));

//     // 5) Trigger the animation
//     this.isSlidingLeft = true;
//     this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
//     this.cdr.detectChanges();

//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 300);
//   }
// }

// onSlideAnimationEnd(event: TransitionEvent) {
//   if (
//     event.propertyName === 'transform' &&
//     event.target === event.currentTarget &&
//     !this.isAnimating // Only finalize if we're actually animating
//   ) {
//     this.finalizeSlideAnimation();
//   }
// }

// finalizeSlideAnimation() {
//   // Reset all animation states
//   this.isSlidingRight = false;
//   this.isSlidingLeft = false;
//   this.newImageStartingClass = '';
//   this.xDirection = '';
//   this.isAnimating = false;

//   if (this.newBackgroundUrl) {
//     this.imageStyles['background-image'] = `url('${this.newBackgroundUrl}')`;
//   }

//   this.oldBackgroundUrl = null;
//   this.newBackgroundUrl = null;
  
//   this.cdr.detectChanges();
// }

// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // 1) Store current image URL and get next image
//     const oldUrl = this.pictureForm.get('imgUrl')?.value || '';
    
//     // 2) Navigate and get new URL
//     this.imageManagementService.previousImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
//     const prevUrl = currentState.urls[currentState.currentIndex] || '';

//     // 3) Set up initial state
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = prevUrl;
//     this.newImageStartingClass = 'start-slide-left';
    
//     // 4) Force initial rendering of the new image on the left
//     this.cdr.detectChanges();
//     await new Promise(resolve => requestAnimationFrame(resolve));

//     // 5) Start the sliding animation
//     await new Promise<void>(resolve => {
//       requestAnimationFrame(() => {
//         this.isSlidingLeft = true;
//         this.isSlidingRight = false;
        
//         // Update form with new URL
//         this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
        
//         this.cdr.detectChanges();
//         resolve();
//       });
//     });

//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 300);  // Increased timeout to ensure animation completes
//   }
// }


// Last working
// onUrlPaste(event: ClipboardEvent) {
//   event.preventDefault();
  
//   const pastedText = event.clipboardData?.getData('text/plain')?.trim();
//   if (!pastedText || !this.isValidImageUrl(pastedText)) return;

//   this.ngZone.run(() => {
//     // Always replace the entire URL instead of inserting at cursor position
//     this.pictureForm.patchValue({
//       imgUrl: pastedText
//     }, { emitEvent: false });

//     // Set cursor to end of input
//     if (this.urlInput?.nativeElement) {
//       this.urlInput.nativeElement.value = pastedText;
//       this.urlInput.nativeElement.setSelectionRange(
//         pastedText.length,
//         pastedText.length
//       );
//     }

//     // Process the new URL
//     this.imageUrlDebouncer.next(pastedText);

//     // Update the background immediately
//     if (this.profileImg?.nativeElement) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');

//       const img = new Image();
//       img.onload = () => {
//         this.ngZone.run(() => {
//           this.imageStyles = {
//             'background-image': `url("${pastedText}")`,
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
          
//           Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//           this.imageLoadedSuccessfully = true;
//           this.cdr.detectChanges();
//         });
//       };

//       img.onerror = () => {
//         this.ngZone.run(() => {
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//           this.cdr.detectChanges();
//         });
//       };

//       img.src = pastedText;
//     }
//   });
// }

// Working
// onUrlPaste(event: ClipboardEvent) {
//   event.preventDefault();
  
//   const pastedText = event.clipboardData?.getData('text/plain')?.trim();
//   if (!pastedText) return;

//   this.ngZone.run(() => {
//     this.isUploadingOrPasting = true;

//     // Update the form value with the pasted URL
//     this.pictureForm.patchValue({
//       imgUrl: pastedText
//     });

//     this.providerUrlPasted = true;

//     // Create a synthetic input event to trigger the normal input handler
//     const inputEvent = new Event('input', {
//       bubbles: true,
//       cancelable: true
//     });

//     // Dispatch the event to trigger onImageUrlInput
//     if (this.urlInput?.nativeElement) {
//       this.urlInput.nativeElement.value = pastedText;
//       this.urlInput.nativeElement.dispatchEvent(inputEvent);
//     }
//   });
// }

// working
// onUrlPaste(event: ClipboardEvent) {
//   event.preventDefault();
  
//   const pastedText = event.clipboardData?.getData('text/plain')?.trim();
//   if (!pastedText) return;

//   this.ngZone.run(() => {
//     this.isUploadingOrPasting = true;
//     this.providerUrlPasted = true;

//     // Update the form value with the pasted URL
//     this.pictureForm.patchValue({
//       imgUrl: pastedText
//     });

//     // Show loading state
//     if (this.profileImg?.nativeElement) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     }

//     // Preload the image and set success state
//     const img = new Image();
//     img.onload = () => {
//       this.ngZone.run(() => {
//         this.imageStyles = {
//           'background-image': `url("${pastedText}")`,
//           'background-position': `${this.position.x}% ${this.position.y}%`,
//           'background-repeat': 'no-repeat',
//           'background-size': `${this.zoomLevel * 100}%`,
//           'background-color': '#c7ff20'
//         };
        
//         if (this.profileImg?.nativeElement) {
//           Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }

//         // Important: Set these flags for drag controls to appear
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.providerUrlPasted = true;
        
//         this.cdr.detectChanges();
//       });
//     };

//     img.onerror = () => {
//       this.ngZone.run(() => {
//         this.imageLoadedSuccessfully = false;
//         this.imageNotFound = true;
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       });
//     };

//     img.src = pastedText;

//     // Create a synthetic input event
//     const inputEvent = new Event('input', {
//       bubbles: true,
//       cancelable: true
//     });

//     // Dispatch the event to trigger onImageUrlInput
//     if (this.urlInput?.nativeElement) {
//       this.urlInput.nativeElement.value = pastedText;
//       this.urlInput.nativeElement.dispatchEvent(inputEvent);
//     }
//   });
// }

// Last working
// onUrlPaste(event: ClipboardEvent) {
//   event.preventDefault();
  
//   const pastedText = event.clipboardData?.getData('text/plain')?.trim();
//   if (!pastedText) return;

//   this.ngZone.run(() => {
//     this.isUploadingOrPasting = true;
//     this.providerUrlPasted = true;

//     // Reset position and zoom to default state
//     this.position = { x: 0, y: 0 };
//     this.zoomLevel = 1;
//     this.isDragged = false;
//     this.isDefaultPosition = true;

//     // Update the form value with the pasted URL
//     this.pictureForm.patchValue({
//       imgUrl: pastedText
//     });

//     // Show loading state
//     if (this.profileImg?.nativeElement) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     }

//     // Preload the image and set success state
//     const img = new Image();
//     img.onload = () => {
//       this.ngZone.run(() => {
//         this.imageStyles = {
//           'background-image': `url("${pastedText}")`,
//           'background-position': '0% 0%',
//           'background-repeat': 'no-repeat',
//           'background-size': '100%',
//           'background-color': '#c7ff20'
//         };
        
//         if (this.profileImg?.nativeElement) {
//           Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }

//         // Important: Set these flags for drag controls to appear
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.providerUrlPasted = true;
        
//         this.cdr.detectChanges();
//       });
//     };

//     img.onerror = () => {
//       this.ngZone.run(() => {
//         this.imageLoadedSuccessfully = false;
//         this.imageNotFound = true;
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       });
//     };

//     img.src = pastedText;

//     // Create and dispatch synthetic input event
//     const inputEvent = new Event('input', {
//       bubbles: true,
//       cancelable: true
//     });

//     if (this.urlInput?.nativeElement) {
//       this.urlInput.nativeElement.value = pastedText;
//       this.urlInput.nativeElement.dispatchEvent(inputEvent);
//     }
//   });
// }

// private isExternalImageUrl(url: string): boolean {
//   if (!url) return false;
  
//   // Not Firebase or API URLs
//   if (url.includes('firebasestorage.googleapis.com') || 
//       url.includes('/api/storage/') ||
//       url.startsWith('data:image/')) {
//     return false;
//   }
  
//   try {
//     new URL(url); // Valid URL
//     return true;  // It's an external URL
//   } catch {
//     return false;
//   }
// }

// private async handleExternalUrl(url: string): Promise<void> {
//   try {
//     // First try to load the image directly to display it
//     const img = new Image();
    
//     // Set up promise for image loading
//     const imageLoadPromise = new Promise<void>((resolve, reject) => {
//       img.onload = () => resolve();
//       img.onerror = () => reject(new Error('Failed to load image'));
      
//       // Add crossOrigin attribute to handle CORS issues
//       img.crossOrigin = 'anonymous';
//       img.src = url;
//     });
    
//     // Try to load the image with timeout
//     await Promise.race([
//       imageLoadPromise,
//       new Promise<void>((_, reject) => 
//         setTimeout(() => reject(new Error('Image load timeout')), 5000)
//       )
//     ]);
    
//     // Image loaded successfully, update the display
//     this.ngZone.run(() => {
//       this.imageStyles = {
//         'background-image': `url("${url}")`,
//         'background-position': '0% 0%',
//         'background-repeat': 'no-repeat',
//         'background-size': '100%',
//         'background-color': '#c7ff20'
//       };
      
//       if (this.profileImg?.nativeElement) {
//         Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }

//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;
//       this.providerUrlPasted = true;
      
//       // Additionally, we'll download and upload the image in the background to ensure persistence
//       this.downloadAndUploadInBackground(url);
      
//       this.cdr.detectChanges();
//     });
//   } catch (error) {
//     console.error('Error handling external URL:', error);
    
//     // Try an alternative approach if direct loading fails
//     this.downloadAndUploadInBackground(url, true);
//   }
// }

// private async downloadAndUploadInBackground(url: string, showImmediately: boolean = false): Promise<void> {
//   try {
//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');
    
//     // Fetch the image with proper headers to handle CORS
//     const response = await fetch(url, {
//       headers: {
//         'Accept': 'image/*'
//       },
//       mode: 'cors'
//     });
    
//     if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    
//     const blob = await response.blob();
//     if (!blob.type.startsWith('image/')) {
//       throw new Error('URL did not return an image');
//     }
    
//     // Create a File object from the blob
//     const fileExt = this.getFileExtensionFromMimeType(blob.type);
//     const fileName = `external_${Date.now()}.${fileExt}`;
//     const file = new File([blob], fileName, { type: blob.type });
    
//     // Upload the file to Firebase
//     const uploadedUrl = await this.imageUrlManager.handleImageUpload(file, userId);
    
//     // Set as temporary URL in image management service
//     this.imageManagementService.setTemporaryUrl(uploadedUrl);
    
//     // If showImmediately is true, update the UI immediately
//     if (showImmediately) {
//       this.ngZone.run(() => {
//         this.imageStyles = {
//           'background-image': `url("${uploadedUrl}")`,
//           'background-position': '0% 0%',
//           'background-repeat': 'no-repeat',
//           'background-size': '100%',
//           'background-color': '#c7ff20'
//         };
        
//         if (this.profileImg?.nativeElement) {
//           Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }

//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
        
//         this.cdr.detectChanges();
//       });
//     }
    
//     // Reload images with the new temporary URL
//     await this.imageManagementService.loadUserImages(userId, true);
    
//   } catch (error) {
//     console.error('Error downloading and uploading external image:', error);
    
//     // If showing immediately and the download/upload failed, show error UI
//     if (showImmediately) {
//       this.ngZone.run(() => {
//         this.imageLoadedSuccessfully = false;
//         this.imageNotFound = true;
        
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
        
//         this.cdr.detectChanges();
//       });
//     }
//   }
// }

// private getFileExtensionFromMimeType(mimeType: string): string {
//   const mimeMap: {[key: string]: string} = {
//     'image/jpeg': 'jpg',
//     'image/jpg': 'jpg',
//     'image/gif': 'gif',
//     'image/png': 'png',
//     'image/webp': 'webp',
//   };
  
//   return mimeMap[mimeType] || 'jpg'; // Default to jpg if unknown
// }

// private handleDataUrl(dataUrl: string): void {
//   const img = new Image();
//   img.onload = () => {
//     this.ngZone.run(async () => {
//       this.imageStyles = {
//         'background-image': `url("${dataUrl}")`,
//         'background-position': '0% 0%',
//         'background-repeat': 'no-repeat',
//         'background-size': '100%',
//         'background-color': '#c7ff20'
//       };
      
//       if (this.profileImg?.nativeElement) {
//         Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }

//       // Set success states
//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;
//       this.providerUrlPasted = true;
      
//       // Convert data URL to file and upload in background
//       try {
//         const userId = this.userService.getUserId();
//         if (userId) {
//           const imageUrl = await this.imageUrlManager.handleDataUrl(dataUrl, userId);
//           this.imageManagementService.setTemporaryUrl(imageUrl);
//           await this.imageManagementService.loadUserImages(userId, true);
//         }
//       } catch (error) {
//         console.error('Error handling data URL in background:', error);
//       }
      
//       this.cdr.detectChanges();
//     });
//   };

//   img.onerror = () => {
//     this.ngZone.run(() => {
//       this.imageLoadedSuccessfully = false;
//       this.imageNotFound = true;
//       if (this.profileImg?.nativeElement) {
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }
//       this.cdr.detectChanges();
//     });
//   };

//   img.src = dataUrl;
// }

// private handleRegularUrl(url: string): void {999
//   const img = new Image();
//   img.onload = () => {
//     this.ngZone.run(() => {
//       this.imageStyles = {
//         'background-image': `url("${url}")`,
//         'background-position': '0% 0%',
//         'background-repeat': 'no-repeat',
//         'background-size': '100%',
//         'background-color': '#c7ff20'
//       };
      
//       if (this.profileImg?.nativeElement) {
//         Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }

//       // Set success states
//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;
//       this.providerUrlPasted = true;
      
//       this.cdr.detectChanges();
//     });
//   };

//   img.onerror = () => {
//     this.ngZone.run(() => {
//       this.imageLoadedSuccessfully = false;
//       this.imageNotFound = true;
//       if (this.profileImg?.nativeElement) {
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }
//       this.cdr.detectChanges();
//     });
//   };

//   img.src = url;
// }

// async handleImageInput(input: string): Promise<void> {
//   try {
//     if (!input) return;
    
//     this.isUploadingOrPasting = true;
//     this.showUploadSuccess = false;
    
//     // Show loading state
//     if (this.profileImg?.nativeElement) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     }
    
//     // Determine if this is a data URL or a regular URL
//     if (input.startsWith('data:image/')) {
//       // Handle data URL - convert to file and upload
//       const imageUrl = await this.imageUrlManager.handleDataUrl(input, this.userId);
//       this.imageManagementService.setTemporaryUrl(imageUrl);
//     } else {
//       // Handle regular URL
//       const imageUrl = await this.imageUrlManager.handleImageUrl(input);
//       this.imageManagementService.setTemporaryUrl(imageUrl);
//     }
    
//     // Reload images with the new temporary URL
//     await this.imageManagementService.loadUserImages(this.userId, true);
    
//     // Reset position and zoom
//     this.position = { x: 0, y: 0 };
//     this.zoomLevel = 1;
//     this.isDragged = false;
//     this.isDefaultPosition = true;
    
//     // Set success states
//     this.imageLoadedSuccessfully = true;
//     this.imageNotFound = false;
//     this.providerUrlPasted = true;
    
//     // Remove loading state
//     if (this.profileImg?.nativeElement) {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     }
    
//     this.cdr.detectChanges();
//   } catch (error) {
//     console.error('Error processing image input:', error);
//     this.imageNotFound = true;
//     this.imageLoadedSuccessfully = false;
    
//     if (this.profileImg?.nativeElement) {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     }
    
//     this.cdr.detectChanges();
//   } finally {
//     this.isUploadingOrPasting = false;
//   }
// }

// private handleDataUrl(dataUrl: string): void {
//   const img = new Image();
//   img.onload = () => {
//     this.ngZone.run(() => {
//       this.imageStyles = {
//         'background-image': `url("${dataUrl}")`,
//         'background-position': '0% 0%',
//         'background-repeat': 'no-repeat',
//         'background-size': '100%',
//         'background-color': '#c7ff20'
//       };
      
//       if (this.profileImg?.nativeElement) {
//         Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }

//       // Set success states
//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;
//       this.providerUrlPasted = true;
      
//       this.cdr.detectChanges();
//     });
//   };

//   img.onerror = () => {
//     this.ngZone.run(() => {
//       this.imageLoadedSuccessfully = false;
//       this.imageNotFound = true;
//       if (this.profileImg?.nativeElement) {
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }
//       this.cdr.detectChanges();
//     });
//   };

//   img.src = dataUrl;
// }

// private handleRegularUrl(url: string): void {
//   const img = new Image();
//   img.onload = () => {
//     this.ngZone.run(() => {
//       this.imageStyles = {
//         'background-image': `url("${url}")`,
//         'background-position': '0% 0%',
//         'background-repeat': 'no-repeat',
//         'background-size': '100%',
//         'background-color': '#c7ff20'
//       };
      
//       if (this.profileImg?.nativeElement) {
//         Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }

//       // Set success states
//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;
//       this.providerUrlPasted = true;
      
//       this.cdr.detectChanges();
//     });
//   };

//   img.onerror = () => {
//     this.ngZone.run(() => {
//       this.imageLoadedSuccessfully = false;
//       this.imageNotFound = true;
//       if (this.profileImg?.nativeElement) {
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }
//       this.cdr.detectChanges();
//     });
//   };

//   img.src = url;
// }

// onUrlPaste(event: ClipboardEvent) {
//   event.preventDefault();
  
//   const pastedText = event.clipboardData?.getData('text/plain')?.trim();
//   if (!pastedText) return;

//   this.ngZone.run(() => {
//     // Set the upload/paste mode flag
//     this.isUploadingOrPasting = true;
//     this.providerUrlPasted = true;

//     // Update the form value with the pasted URL
//     this.pictureForm.patchValue({
//       imgUrl: pastedText
//     });

//     // Show loading state
//     if (this.profileImg?.nativeElement) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     }

//     // Preload the image and set success state
//     const img = new Image();
//     img.onload = () => {
//       this.ngZone.run(() => {
//         // Update the image styles
//         this.imageStyles = {
//           'background-image': `url("${pastedText}")`,
//           'background-position': `${this.position.x}% ${this.position.y}%`,
//           'background-repeat': 'no-repeat',
//           'background-size': `${this.zoomLevel * 100}%`,
//           'background-color': '#c7ff20'
//         };
        
//         if (this.profileImg?.nativeElement) {
//           Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }

//         // Set success states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.providerUrlPasted = true;
        
//         this.cdr.detectChanges();
//       });
//     };

//     img.onerror = () => {
//       this.ngZone.run(() => {
//         this.imageLoadedSuccessfully = false;
//         this.imageNotFound = true;
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       });
//     };

//     img.src = pastedText;

//     // Create a synthetic input event
//     const inputEvent = new Event('input', {
//       bubbles: true,
//       cancelable: true
//     });

//     // Dispatch the event to trigger onImageUrlInput
//     if (this.urlInput?.nativeElement) {
//       this.urlInput.nativeElement.value = pastedText;
//       this.urlInput.nativeElement.dispatchEvent(inputEvent);
//     }
//   });
// }

// Last working
// private isValidImageUrl(url: string): boolean {
//   const supportedDomains = [
//     'unsplash.com',
//     'images.unsplash.com',
//     'pexels.com',
//     'images.pexels.com',
//     'pixabay.com',
//     'imgur.com',
//     'i.imgur.com'
//   ];

//   try {
//     const urlObj = new URL(url);
//     return supportedDomains.some(domain => urlObj.hostname.includes(domain));
//   } catch {
//     return false;
//   }
// }

// private initializeLoadingState() {
//     this.avatarLoaded.subscribe(loaded => {
//       console.log('Avatar loaded:', loaded);
//       this.checkAllImagesLoaded(this.isInitialLoad);
//     });
  
//     this.urlImageLoaded.subscribe(loaded => {
//       console.log('URL image loaded:', loaded);
//       this.checkAllImagesLoaded(this.isInitialLoad);
//     });
//   }  
// }  


// Latest working
// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   // Only affect loadingComplete state during initial load
//   if (!isInitialLoad) {
//     this.loadingComplete = true; // Keep page loaded during URL changes
//   }

//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   // Remove this line since we're handling it with the check above
//   // this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Rest of your original method remains exactly the same
//   try {
//     if (!this.avatarLoadPromise) {
//       this.avatarLoadPromise = new Promise<void>((resolve, reject) => {
//         const avatarImg = new Image();
//         avatarImg.onload = () => resolve();
//         avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
//         avatarImg.src = 'assets/Images/avatar.png';
//       });
//     }
    
//     await this.avatarLoadPromise;
//     this.ngZone.run(() => {
//       this.avatarLoaded.next(true);
//     });
//   } catch (error) {
//     console.error('Error loading avatar:', error);
//   }

//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.imageLoaded = true;
//       this.allImagesLoaded = true;
//       if (isInitialLoad) {
//         this.finishLoading();
//       }
//     });
//     return;
//   }

//   try {
//     const displayUrl = await this.storageService.convertFirebaseUrl(url);
//     const headers = displayUrl.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           if (this.profileImg?.nativeElement) {
//             // Keep loading state true until transforms are applied
//             if (isInitialLoad) {
//               this.loadingComplete = false;
//             }

//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           this.imageLoaded = true;
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = true;
//           this.currentUser.imgUrl = url;
//           this.urlImageLoaded.next(true);
//           this.allImagesLoaded = true;

//           requestAnimationFrame(() => {
//             resolve();
//           });
//         });
//       };

//       img.onerror = () => {
//         this.ngZone.run(() => {
//           console.error('Error loading image:', displayUrl);
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           this.currentUser.imgUrl = null;
//           this.imageLoaded = false;
//           this.urlImageLoaded.next(true);
//           reject(new Error('Failed to load image'));
//         });
//       };

//       if (headers) {
//         fetch(displayUrl, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             img.src = displayUrl;
//           })
//           .catch(() => {
//             img.src = displayUrl;
//           });
//       } else {
//         img.src = displayUrl;
//       }
//     });

//     if (isInitialLoad) {
//       requestAnimationFrame(() => {
//         console.log('Image loaded successfully, finishing loading state');
//         this.finishLoading();
//       });
//     }

//   } catch (error) {
//     console.error('Error in preloadImage:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.imageLoaded = false;
//       this.urlImageLoaded.next(true);
//       this.allImagesLoaded = true;
//       if (isInitialLoad) {
//         this.finishLoading();
//       }
//     });
//   }
// }

// currently working on
// preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   // Only affect loadingComplete state during initial load
//   if (!isInitialLoad) {
//     this.loadingComplete = true; // Keep page loaded during URL changes
//   }

//   console.log('Starting preloadImage:', { isInitialLoad, url });
//   this.imageLoadedSuccessfully = false;

//   return new Promise<void>((resolve) => {
//     // Initial state updates
//     this.ngZone.run(() => {
//       if (isInitialLoad) {
//         this.imageLoaded = false;
//       }
//       this.avatarLoaded.next(false);
//       this.urlImageLoaded.next(false);
//     });

//     // Handle avatar loading and other async operations
//     const loadImages = async () => {
//       try {
//         // Load avatar first
//         if (!this.avatarLoadPromise) {
//           this.avatarLoadPromise = new Promise<void>((resolveAvatar, rejectAvatar) => {
//             const avatarImg = new Image();
//             avatarImg.onload = () => resolveAvatar();
//             avatarImg.onerror = () => rejectAvatar(new Error('Failed to load avatar'));
//             avatarImg.src = 'assets/Images/avatar.png';
//           });
//         }
        
//         await this.avatarLoadPromise;
//         this.ngZone.run(() => {
//           this.avatarLoaded.next(true);
//         });

//         // Handle case when no URL is provided
//         if (!url) {
//           this.ngZone.run(() => {
//             this.resetImage();
//             this.imageNotFound = false;
//             this.imageLoadedSuccessfully = false;
//             this.currentUser.imgUrl = null;
//             this.urlImageLoaded.next(true);
//             this.imageLoaded = true;
//             this.allImagesLoaded = true;
            
//             if (isInitialLoad) {
//               this.finishLoading();
//             }
//             resolve();
//           });
//           return;
//         }

//         // Keep showing loading state
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//         }

//         // Convert Firebase URL if needed
//         const displayUrl = await this.storageService.convertFirebaseUrl(url);
//         const headers = displayUrl.includes('/api/storage/') ? 
//           await this.storageService.getAuthHeaders() : 
//           undefined;

//         // Continue with image loading...
//         // (rest of the function remains the same)
//         const img = new Image();
        
//         img.onload = () => {
//           this.ngZone.run(() => {
//             // All state changes in one batch
//             if (isInitialLoad) {
//               this.loadingComplete = false;
//             }

//             // Create styles object once
//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             if (this.profileImg?.nativeElement) {
//               Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//               this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//               this.renderer.addClass(this.profileImg.nativeElement, 'loaded');
//             }

//             this.imageLoaded = true;
//             this.imageNotFound = false;
//             this.imageLoadedSuccessfully = true;
//             this.currentUser.imgUrl = url;
//             this.urlImageLoaded.next(true);
//             this.allImagesLoaded = true;

//             requestAnimationFrame(() => {
//               if (isInitialLoad) {
//                 console.log('Image loaded successfully, finishing loading state');
//                 this.finishLoading();
//               }
//               resolve();
//             });
//           });
//         };

//         img.onerror = () => {
//           this.ngZone.run(() => {
//             console.error('Error loading image:', displayUrl);
//             this.imageNotFound = true;
//             this.imageLoadedSuccessfully = false;
//             this.currentUser.imgUrl = null;
//             this.imageLoaded = false;
//             this.urlImageLoaded.next(true);
//             this.allImagesLoaded = true;
            
//             if (this.profileImg?.nativeElement) {
//               this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//             }
            
//             if (isInitialLoad) {
//               this.finishLoading();
//             }
//             resolve();
//           });
//         };

//         // Handle authenticated images
//         if (headers) {
//           fetch(displayUrl, { headers })
//             .then(response => response.blob())
//             .then(blob => {
//               img.src = displayUrl;
//             })
//             .catch(() => {
//               img.src = displayUrl;
//             });
//         } else {
//           img.src = displayUrl;
//         }

//       } catch (error) {
//         console.error('Error in preloadImage:', error);
//         this.ngZone.run(() => {
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           this.currentUser.imgUrl = null;
//           this.imageLoaded = false;
//           this.urlImageLoaded.next(true);
//           this.allImagesLoaded = true;
          
//           if (isInitialLoad) {
//             this.finishLoading();
//           }
//           resolve();
//         });
//       }
//     };

//     // Start the async loading process
//     loadImages();
//   });
  // }


// private preloadSingleImage(src: string): Promise<void> {
//   return new Promise((resolve) => {
//     const img = new Image();
//     img.onload = () => resolve();
//     img.onerror = () => {
//       console.error(`Failed to preload image: ${src}`);
//       resolve(); // Resolve anyway to not block loading
//     };
//     img.src = src;
//   });
// }


// Last working
// private finishLoading(): void {
//   if (this.profileImg?.nativeElement) {
//     const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
//     const backgroundImage = computedStyle.backgroundImage;

//     const hasValidImage = backgroundImage !== 'none' && 
//                        backgroundImage !== '' && 
//                        !backgroundImage.includes('avatar.png');

//     if (hasValidImage) {
//       this.ngZone.run(() => {
//         console.log('Image verified, completing load');
//         this.loadingComplete = true;
//         this.tooltipDisabled = false;
//         this.cdr.detectChanges();
//       });
//     } else {
//       if (!this.retryCount) {
//         this.retryCount = 0;
//       }
//       if (this.retryCount < 10) {
//         this.retryCount++;
//         console.log(`Waiting for image to apply (${this.retryCount})`);
//         setTimeout(() => this.finishLoading(), 100);
//       } else {
//         console.log('Max retries reached, completing anyway');
//         this.loadingComplete = true;
//         this.tooltipDisabled = false;
//         this.cdr.detectChanges();
//       }
//     }
//   }
// }


// private finishLoading(): void {
//   if (this.profileImg?.nativeElement) {
//     // Check background image style to verify the image has been applied to the DOM
//     const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
//     const backgroundImage = computedStyle.backgroundImage;

//     const hasValidImage = backgroundImage !== 'none' && 
//                        backgroundImage !== '' && 
//                        !backgroundImage.includes('avatar.png');

//     // Verify both DOM has image AND the loading flag is set
//     const imageFullyLoaded = hasValidImage && this.imageLoadedSuccessfully;

//     if (imageFullyLoaded) {
//       this.ngZone.run(() => {
//         console.log('Image verified and loaded, completing load');
//         this.loadingComplete = true;
//         this.tooltipDisabled = false;
//         this.cdr.detectChanges();
//       });
//     } else {
//       // Initialize retry counter if needed
//       if (!this.retryCount) {
//         this.retryCount = 0;
//       }
      
//       // Check which condition failed for better debugging
//       if (!hasValidImage) {
//         console.log(`Waiting for image to apply to DOM (${this.retryCount + 1})`);
//       } else if (!this.imageLoadedSuccessfully) {
//         console.log(`Waiting for image loading to complete (${this.retryCount + 1})`);
//       }
      
//       // Retry with limit
//       if (this.retryCount < 20) { // Increased max retries for slower connections
//         this.retryCount++;
//         setTimeout(() => this.finishLoading(), 100);
//       } else {
//         console.log('Max retries reached, completing anyway');
//         this.loadingComplete = true;
//         this.tooltipDisabled = false;
//         this.cdr.detectChanges();
//       }
//     }
//   } else {
//     // No profile image element, complete loading
//     console.log('No profile image element found, completing load');
//     this.loadingComplete = true;
//     this.tooltipDisabled = false;
//     this.cdr.detectChanges();
//   }
// }


// private checkAllImagesLoaded() {
//   const allLoaded = this.imageLoaded && 
//                    this.avatarLoaded.getValue() && 
//                    this.urlImageLoaded.getValue();
                   
//   if (allLoaded) {
//     console.log('All images loaded, completing loading state');
//     this.finishLoading();
//   }
// }


// isImageUrlFilled(): boolean {
//   if (!this.pictureForm || this.imageNotFound) {
//     return false;
//   }

//   const imgUrlControl = this.pictureForm.get('imgUrl');
//   if (!imgUrlControl) {
//     return false;
//   }

//   // For pasted URLs or existing images
//   if (this.imageLoadedSuccessfully) {
//     return Boolean(imgUrlControl.value || this.currentUser.imgUrl);
//   }

//   const value = imgUrlControl.value;
//   if (!value) {
//     return false;
//   }

//   if (value instanceof Promise) {
//     return this.imageLoadedSuccessfully;
//   }

//   const stringValue = typeof value === 'string' ? value.trim() : String(value).trim();
//   if (!stringValue) {
//     return false;
//   }

//   return this.imageLoadedSuccessfully && !this.imageNotFound;
  // }

  // private _isFirebaseUrl(url: string): boolean {
  //   return url.includes('firebasestorage.googleapis.com');
  // }


  // canDrag(): boolean {
  //   const isEditing = this.currentState === ProfileState.EditingProfile ||
  //   this.currentState === ProfileState.ChangingPicture;
  //   const isImageFilled = this.isImageUrlFilled();
  //   const isProfileImgReady = !!this.profileImg?.nativeElement;
  //   return isEditing && isImageFilled && isProfileImgReady;
  // }

  // canDrag(): boolean {
  //   return (
  //     (this.currentState === ProfileState.EditingProfile || 
  //      this.currentState === ProfileState.ChangingPicture) &&
  //     this.isImageLoaded &&
  //     !this.imageNotFound &&
  //     !!this.profileImg?.nativeElement
  //   );
  // }

  // canDrag(): boolean {
  //   const isEditing = this.currentState === ProfileState.ChangingPicture;
  //   const hasImage = this.isImageUrlFilled();
  //   const isImageLoaded = this.imageLoadedSuccessfully && !this.imageNotFound;
  //   const hasProfileImg = !!this.profileImg?.nativeElement;
  
  //   console.log('canDrag check:', {
  //     isEditing,
  //     hasImage,
  //     isImageLoaded,
  //     hasProfileImg
  //   });
  
  //   return isEditing && hasImage && isImageLoaded && hasProfileImg;
  // }

// canDrag(): boolean {
//   const isEditing = this.currentState === ProfileState.ChangingPicture;
//   const hasImage = Boolean(this.currentUser?.imgUrl) && this.imageLoadedSuccessfully === true;
//   const hasFirebaseImages = this.imageManagementService.hasAnyFirebaseImages() && this.firebaseImageLoaded;
//   const hasProfileImg = this.profileImg?.nativeElement != null;

//   // console.log('canDrag check:', {
//   //   isEditing,
//   //   hasImage,
//   //   hasProfileImg,
//   //   currentState: this.currentState,
//   //   imgUrl: this.currentUser?.imgUrl,
//   //   imageLoadedSuccessfully: this.imageLoadedSuccessfully
//   // });

//   return isEditing === true && (hasImage === true || hasFirebaseImages === true) && hasProfileImg === true;
// }


// canDrag(): boolean {
//   const isEditing = this.currentState === ProfileState.ChangingPicture;
//   const hasImage = Boolean(this.currentUser?.imgUrl) && this.imageLoadedSuccessfully === true;
//   const hasFirebaseImages = this.imageManagementService.hasAnyFirebaseImages() && this.firebaseImageLoaded;
//   const hasPastedUrl = Boolean(this.pictureForm.get('imgUrl')?.value) && this.imageLoadedSuccessfully === true;
//   const hasProfileImg = this.profileImg?.nativeElement != null;

//   return isEditing === true && 
//          (hasImage === true || hasFirebaseImages === true || hasPastedUrl === true) && 
//          hasProfileImg === true;
// }

// Last working
// startDrag(event: MouseEvent | TouchEvent) {
//   console.log('startDrag called');
//   if (!this.canDrag()) {
//     console.log('Cannot drag');
//     return;
//   }
  
//   this.isDragging = true;
//   this.isDragged = true;
//   this.isDefaultPosition = false;

//   const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
//   const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
//   // Adjust here to account for the current position
//   this.startX = clientX - this.position.x;
//   this.startY = clientY - this.position.y;

//   console.log('Start drag', {
//     clientX,
//     clientY,
//     startX: this.startX,
//     startY: this.startY,
//     isDragging: this.isDragging
//   });

//   // Store the initial mouse coordinates
//   // this.startX = clientX;
//   // this.startY = clientY;
  
//   // // Store the initial position of the image
//   // this.initialPosition = { ...this.position };

//   console.log('Start drag', { clientX, clientY, startX: this.startX, startY: this.startY, isDragging: this.isDragging });

//   // this.isDefaultPosition = false;

//   // Attach event listeners
//   this.moveListener = this.renderer.listen('document', 'mousemove', (e) => this.drag(e));
//   this.upListener = this.renderer.listen('document', 'mouseup', (e) => this.endDrag(e));
//   this.touchMoveListener = this.renderer.listen('document', 'touchmove', (e) => this.drag(e));
//   this.touchEndListener = this.renderer.listen('document', 'touchend', (e) => this.endDrag(e));

//   event.preventDefault();
//   event.stopPropagation();
  // }


// Last working
// drag(event: MouseEvent | TouchEvent) {
//   if (!this.isDragging || !this.canDrag()) {
//     return;
//   }

//   console.log('drag called', { isDragging: this.isDragging, canDrag: this.canDrag() });
//   console.log('this.profileImg:', this.profileImg);

//   // this.ngZone.run(() => {
//     requestAnimationFrame(() => {
//     const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
//     const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

//     // Calculate new position based on the initial offset
//     const newX = clientX - this.startX;
//     const newY = clientY - this.startY;

//     // Get dimensions
//     const imgRect = this.profileImg.nativeElement.getBoundingClientRect();
//     const containerRect = this.profileImg.nativeElement.parentElement!.getBoundingClientRect();

//     // Calculate maximum allowed movement - implement later for better UX (so image edges never show in div)
//     const maxX = imgRect.width - containerRect.width;
//     const maxY = imgRect.height - containerRect.height;

//     // Adjust constraints to allow negative movement
//     const constrainedX = Math.min(Math.max(newX, -maxX), 0);
//     const constrainedY = Math.min(Math.max(newY, -maxY), 0);

//     console.log('imgRect:', imgRect);
//     console.log('containerRect:', containerRect);
//     console.log('maxX:', maxX, 'maxY:', maxY);
//     console.log('newX:', newX, 'newY:', newY);
//     console.log('constrainedX:', constrainedX, 'constrainedY:', constrainedY);

//     this.position = { x: newX, y: newY };
//     console.log('About to call updateImagePosition', this.position);

//     // Update image position
//     this.updateImageTransform();

//     // this.renderer.setStyle(
//     //   this.profileImg.nativeElement,
//     //   'background-position',
//     //   `${this.position.x}% ${this.position.y}%`
//     // );

//     // this.imageStyles = {
//     //   ...this.imageStyles,
//     //   'background-position': `${this.position.x}% ${this.position.y}%`
//     // };

//     event.preventDefault();
//     event.stopPropagation();
//   });
// }

// Almost working with constraints
// drag(event: MouseEvent | TouchEvent) {
//   if (!this.isDragging || !this.canDrag() || !this.profileImg?.nativeElement) {
//     return;
//   }

//   // Get current cursor position
//   const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
//   const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

//   // Calculate the change in position from the start point
//   const deltaX = clientX - this.startX;
//   const deltaY = clientY - this.startY;

//   // Get container dimensions
//   const containerElement = this.profileImg.nativeElement;
//   const containerRect = containerElement.getBoundingClientRect();
  
//   // Calculate actual displayed background image dimensions
//   const backgroundWidth = containerRect.width * this.zoomLevel;
//   const backgroundHeight = containerRect.height * this.zoomLevel;
  
//   // Skip if nothing to drag (when zoom is 1.0 exactly)
//   if (this.zoomLevel <= 1) {
//     return;
//   }
  
//   // Calculate the range that should be available for dragging
//   // These are the actual pixel dimensions of the draggable area
//   const dragRangeX = backgroundWidth - containerRect.width;
//   const dragRangeY = backgroundHeight - containerRect.height;
  
//   // Calculate the move amounts for background-position
//   // We need to convert deltaX/Y to background-position percentages
//   // For background-position, moving the mouse right should decrease the percentage
//   // and moving the mouse left should increase the percentage
//   const movePercentX = (deltaX / dragRangeX) * -100;
//   const movePercentY = (deltaY / dragRangeY) * -100;
  
//   // Calculate new position percentages starting from initial position
//   let newPercentX = this._initialDragPosX + movePercentX;
//   let newPercentY = this._initialDragPosY + movePercentY;
  
//   // Constrain boundaries to prevent showing background
//   // For background-position percentages:
//   // - 0% means left/top edge of image aligns with left/top of container
//   // - 100% means right/bottom edge of image aligns with right/bottom of container
//   // But since our image is larger than container, we need to limit the range
//   const minX = 0;
//   const maxX = (backgroundWidth - containerRect.width) / backgroundWidth * 100;
//   const minY = 0;
//   const maxY = (backgroundHeight - containerRect.height) / backgroundHeight * 100;
  
//   // Apply constraints
//   newPercentX = Math.max(minX, Math.min(newPercentX, maxX));
//   newPercentY = Math.max(minY, Math.min(newPercentY, maxY));
  
//   // Store the new position (for use in updateImageTransform)
//   this.position = { x: newPercentX, y: newPercentY };
  
//   console.log('Dragging:', {
//     deltaMovement: { x: deltaX, y: deltaY },
//     maxConstraints: { x: maxX, y: maxY },
//     newPosition: { x: newPercentX, y: newPercentY }
//   });
  
//   // Apply the change directly to the element for immediate feedback
//   this.renderer.setStyle(
//     containerElement,
//     'background-position',
//     `${newPercentX}% ${newPercentY}%`
//   );
  
//   // Update stored styles
//   if (this.imageStyles) {
//     this.imageStyles['background-position'] = `${newPercentX}% ${newPercentY}%`;
//   }
  
//   // Mark as dragged
//   this.isDragged = true;
//   this.isDefaultPosition = false;
  
//   // Force change detection
//   this.cdr.detectChanges();
  
//   event.preventDefault();
//   event.stopPropagation();
// }


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

// // Last working
// endDrag(event: MouseEvent | TouchEvent) {
//   console.log('endDrag called');
//   if (this.isDragging && this.canDrag()) {
//     this.updateImageTransform();
//     // this.savePositionAndZoom();
//   }

//   // if(this.isMobile || this.isTablet){
//   //   const container = document.querySelector('.profilePictureContainerForDragging');
//   //   if (container) {
//   //     container.classList.remove('is-dragging');
//   //   }
//   // }
  
//   setTimeout(() => {
//     this.isDragging = false;
//     this.cdr.detectChanges(); 
//   }, 50);

//   // Remove event listeners
//   // document.removeEventListener('mousemove', this.drag);
//   // document.removeEventListener('mouseup', this.endDrag);
//   // document.removeEventListener('touchmove', this.drag);
//   // document.removeEventListener('touchend', this.endDrag);
//   if (this.moveListener) this.moveListener();
//   if (this.upListener) this.upListener();
//   if (this.touchMoveListener) this.touchMoveListener();
//   if (this.touchEndListener) this.touchEndListener();

//   // if(this.isMobile || this.isTablet){
//   //   this.showAllControls();
//   // }

//   event.preventDefault();
//   event.stopPropagation();
// }


// shouldShowPluralText(): boolean {
//   return this.imageCount > 1 || 
//          (this.hasFirebaseImages && this.imageManagementService.temporaryUrl !== null);
// }

// shouldShowPluralText(): boolean {
//   const hasProviderProfileImage = this.currentUser?.imgUrl && 
//                                 this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
//   return this.imageCount > 1 || 
//          (hasProviderProfileImage && this.imageCount > 0) || 
//          (this.hasFirebaseImages && this.imageManagementService.temporaryUrl !== null);
// }

// Last working
// private async updateImageDisplay(url: string, isInitialLoad: boolean = false): Promise<void> {
//     if (!this.profileImg?.nativeElement) return;
  
//     try {
//       // Add loading class if it's initial load
//       if (isInitialLoad) {
//         this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//       }
  
//       // Convert URL if needed
//       const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//         await this.storageService.convertFirebaseUrl(url) : url;
  
//       // Preload image before updating display
//       await new Promise<void>((resolve, reject) => {
//         const img = new Image();
//         img.onload = () => {
//           this.ngZone.run(() => {
//             // Update styles
//             const styles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
  
//             // Apply styles
//             Object.entries(styles).forEach(([prop, value]) => {
//               this.renderer.setStyle(this.profileImg.nativeElement, prop, value);
//             });
  
//             // Update states
//             this.imageLoadedSuccessfully = true;
//             this.imageNotFound = false;
            
//             resolve();
//           });
//         };
  
//         img.onerror = () => {
//           this.ngZone.run(() => {
//             this.imageNotFound = true;
//             this.imageLoadedSuccessfully = false;
//             reject(new Error('Failed to load image'));
//           });
//         };
  
//         img.src = displayUrl;
//       });
  
//     } catch (error) {
//       console.error('Error displaying image:', error);
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//     } finally {
//       // Remove loading class if it was initial load
//       if (isInitialLoad) {
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       }
//       this.cdr.detectChanges();
//     }
// }

// // Blob urls on first load
// private async updateImageDisplay(url: string, isInitialLoad: boolean = false): Promise<void> {
//   if (!this.profileImg?.nativeElement) return;
  
//   try {
//     // Add loading class if it's initial load
//     if (isInitialLoad) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     }
    
//     let displayUrl = url;
    
//     // Convert URL if needed
//     if (url.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(url);
//     }
    
//     // Handle authenticated image URLs differently
//     if (displayUrl.includes('/api/storage/')) {
//       try {
//         // Get auth headers
//         const headers = await this.storageService.getAuthHeaders();
        
//         // Fetch the image with proper auth
//         const response = await fetch(displayUrl, { headers });
//         if (!response.ok) throw new Error('Failed to load image');
        
//         // Create a blob URL which doesn't need auth
//         const blob = await response.blob();
//         displayUrl = URL.createObjectURL(blob);
        
//         // Schedule cleanup of blob URL after a short delay
//         setTimeout(() => URL.revokeObjectURL(displayUrl), 3000);
//       } catch (fetchError) {
//         console.error('Error fetching authenticated image:', fetchError);
//         throw fetchError; // Re-throw to handle in the main catch block
//       }
//     }
    
//     // Preload image before updating display (keeping your approach)
//     await new Promise<void>((resolve, reject) => {
//       this.ngZone.run(() => {
//         const img = new Image();
//         img.onload = () => {
//           // Update styles
//           const styles = {
//             'background-image': `url("${displayUrl}")`,
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
    
//           // Apply styles
//           Object.entries(styles).forEach(([prop, value]) => {
//             this.renderer.setStyle(this.profileImg.nativeElement, prop, value);
//           });
    
//           // Update states and store styles
//           this.imageLoadedSuccessfully = true;
//           this.imageNotFound = false;
//           this.imageStyles = styles;
          
//           resolve();
//         };
    
//         img.onerror = () => {
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           reject(new Error('Failed to load image'));
//         };
    
//         img.src = displayUrl;
//       });
//     });
  
//   } catch (error) {
//     console.error('Error displaying image:', error);
//     this.imageNotFound = true;
//     this.imageLoadedSuccessfully = false;
//   } finally {
//     // Remove loading class if it was initial load
//     if (isInitialLoad) {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     }
//     this.cdr.detectChanges();
//   }
// }

// private async updateImageDisplay(url: string, isInitialLoad: boolean = false): Promise<void> {
//   if (!this.profileImg?.nativeElement) return;
  
//   try {
//     // Add loading class if it's initial load
//     if (isInitialLoad) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     }
    
//     let displayUrl = url;
//     let originalProxiedUrl = ""; // Store original proxied URL
    
//     // Convert URL if needed
//     if (url.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(url);
//     }
    
//     // Handle authenticated image URLs differently
//     if (displayUrl.includes('/api/storage/')) {
//       try {
//         // Save the original proxied URL before creating a blob
//         originalProxiedUrl = displayUrl;
        
//         // Get auth headers
//         const headers = await this.storageService.getAuthHeaders();
        
//         // Fetch the image with proper auth
//         const response = await fetch(displayUrl, { headers });
//         if (!response.ok) throw new Error('Failed to load image');
        
//         // Create a blob URL which doesn't need auth
//         const blob = await response.blob();
//         displayUrl = URL.createObjectURL(blob);
        
//         // Schedule cleanup of blob URL after a delay
//         setTimeout(() => URL.revokeObjectURL(displayUrl), 10000);
//       } catch (fetchError) {
//         console.error('Error fetching authenticated image:', fetchError);
//         throw fetchError;
//       }
//     }
    
//     // Preload image before updating display
//     await new Promise<void>((resolve, reject) => {
//       this.ngZone.run(() => {
//         const img = new Image();
//         img.onload = () => {
//           // Update styles with blob URL for performance
//           const styles = {
//             'background-image': `url("${displayUrl}")`,
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
    
//           // Apply styles
//           Object.entries(styles).forEach(([prop, value]) => {
//             this.renderer.setStyle(this.profileImg.nativeElement, prop, value);
//           });
    
//           // Store styles with original proxied URL for DOM inspection
//           if (originalProxiedUrl) {
//             // Only replace in the stored styles, not the actual applied styles
//             this.imageStyles = {
//               ...styles,
//               'background-image': `url("${originalProxiedUrl}")`
//             };
//           } else {
//             this.imageStyles = styles;
//           }
          
//           this.imageLoadedSuccessfully = true;
//           this.imageNotFound = false;
          
//           resolve();
//         };
    
//         img.onerror = () => {
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           reject(new Error('Failed to load image'));
//         };
    
//         img.src = displayUrl;
//       });
//     });
  
//   } catch (error) {
//     console.error('Error displaying image:', error);
//     this.imageNotFound = true;
//     this.imageLoadedSuccessfully = false;
//   } finally {
//     // Remove loading class if it was initial load
//     if (isInitialLoad) {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     }
//     this.cdr.detectChanges();
//   }
// }

// trying something 
// private async updateImageDisplay(url: string, isInitialLoad: boolean = false): Promise<void> {
//   if (!this.profileImg?.nativeElement) return;
  
//   try {
//     // Add loading class if it's initial load
//     if (isInitialLoad) {
//       this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     }
    
//     let displayUrl = url;
    
//     // Convert Firebase URL to proxy URL if needed
//     if (url.includes('firebasestorage.googleapis.com')) {
//       console.log('Converting Firebase URL to proxy URL');
//       displayUrl = await this.storageService.convertFirebaseUrl(url);
//     }
    
//     // Ensure proxy URL has proper format
//     if (!displayUrl.includes('/api/storage/') && displayUrl.startsWith('profileImages/')) {
//       displayUrl = `${this.baseUrl}/api/storage/${displayUrl}`;
//     }
    
//     // No blob URL creation needed - we'll use the proxy URL directly
    
//     // Preload image before updating display to ensure it loads properly
//     await new Promise<void>((resolve, reject) => {
//       console.log('Preloading image:', displayUrl);
//       const img = new Image();
      
//       // Add auth header for authenticated requests
//       if (displayUrl.includes('/api/storage/')) {
//         img.crossOrigin = 'use-credentials'; // Enable sending credentials with request
//       }
      
//       img.onload = () => {
//         console.log('Image loaded successfully');
//         resolve();
//       };
      
//       img.onerror = (e) => {
//         console.error('Image load error:', e);
//         reject(new Error('Failed to load image'));
//       };
      
//       // Set up auth handling for proxy URLs
//       if (displayUrl.includes('/api/storage/')) {
//         // Use the imageWithAuth helper to load image with credentials
//         this.loadImageWithAuth(img, displayUrl).then(resolve).catch(reject);
//       } else {
//         img.src = displayUrl;
//       }
//     });
    
//     // Now update the styles
//     console.log('Updating image styles');
//     const styles = {
//       'background-image': `url("${displayUrl}")`,
//       'background-position': `${this.position.x}% ${this.position.y}%`,
//       'background-repeat': 'no-repeat',
//       'background-size': `${this.zoomLevel * 100}%`,
//       'background-color': '#c7ff20'
//     };
    
//     // Apply styles
//     Object.entries(styles).forEach(([prop, value]) => {
//       this.renderer.setStyle(this.profileImg.nativeElement, prop, value);
//     });
    
//     // Update states
//     this.imageLoadedSuccessfully = true;
//     this.imageNotFound = false;
    
//   } catch (error) {
//     console.error('Error displaying image:', error);
//     this.imageNotFound = true;
//     this.imageLoadedSuccessfully = false;
    
//     // Implement fallback image display logic here
//     this.resetImage();
//   } finally {
//     // Remove loading class if it was initial load
//     if (isInitialLoad && this.profileImg?.nativeElement) {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     }
//     this.cdr.detectChanges();
//   }
// }


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


// private async handleImageUrlChange(newValue: string) {
//   // Batch state updates
//   this.ngZone.run(() => {
//     this.imageNotFound = false;
//     this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
//     this.currentUser.imgUrl = newValue === '' ? null : newValue;
//   });

//   if (newValue) {
//     this.isInitialLoad = false;
//     await this.preloadImage(newValue);
//   } else {
//     this.resetImage();
//   }

//   // Queue a single state update
//   this.stateUpdateDebouncer.next();
// }

// Last working
// async handleImageUrlChange(newValue: string) {
//   if (this.isProcessingUrl) return;
//   this.isProcessingUrl = true;

//   try {
//     // Reset states
//     this.imageNotFound = false;
//     this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
//     this.currentUser.imgUrl = newValue === '' ? null : newValue;

//     if (newValue) {
//       this.isInitialLoad = false;
//       // Wait for URL conversion before updating display
//       const displayUrl = await this.storageService.convertFirebaseUrl(newValue);
      
//       this.ngZone.run(() => {
//         // Update form with converted URL
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//         this.preloadImage(displayUrl);
//       });
//     } else {
//       this.resetImage();
//     }
//   } catch (error) {
//     console.error('Error handling URL change:', error);
//     this.imageNotFound = true;
//   } finally {
//     this.isProcessingUrl = false;
//     this.cdr.detectChanges();
//   }
// }



// Last working
// async saveProfilePicture(): Promise<void> {
//   if (!this.pictureForm.valid) {
//     console.log('Form validation failed');
//     return;
//   }

//   try {
//     this.isSavingPicture = true;
//     console.log('Starting save process...');

//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');

//     const formImageUrl = this.pictureForm.get('imgUrl')?.value;
//     if (!formImageUrl) throw new Error('No image URL provided');

//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     let storagePath: string;

//     // Handle staged files
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//       console.log('Moving staged file:', { fileName: stagedFile.fileName, storagePath });

//       await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//         .catch(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//           }
//           throw error;
//         });

//       this.onlyFirebaseImageCount++;
//     }
//     // Handle navigated images
//     else if (this.hasStartedNavigating) {
//       const subject = this.imageManagementService.getUserImagesSubject(userId);
//       const currentState = subject.value;

//       if (currentState.currentIndex >= 0 && currentState.urls.length > 0) {
//         const currentUrl = currentState.urls[currentState.currentIndex];
        
//         if (currentUrl.startsWith('blob:')) {
//           const originalPath = await this.imageManagementService.getOriginalPath(userId, currentState.currentIndex);
//           if (!originalPath) throw new Error('Could not determine storage path');
//           storagePath = originalPath;
//         } else if (currentUrl.includes('/api/storage/')) {
//           storagePath = currentUrl.split('/api/storage/')[1];
//         } else {
//           storagePath = currentUrl;
//         }
//       } else {
//         throw new Error('No valid image selected during navigation');
//       }
//     }
//     // Handle provider URLs (Unsplash, etc.)
//     else if (this.imageManagementService.isProviderUrl(formImageUrl)) {
//       storagePath = formImageUrl;
//       console.log('Using provider URL:', { storagePath });
//     }
//     // Handle existing URLs and paths
//     else {
//       if (formImageUrl.includes('/api/storage/')) {
//         storagePath = formImageUrl.split('/api/storage/')[1];
//       } else if (formImageUrl.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(formImageUrl);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       } else if (formImageUrl.startsWith('profileImages/')) {
//         storagePath = formImageUrl;
//       } else {
//         storagePath = this.currentUser.imgUrl!;
//       }
//       console.log('Using existing image path:', { storagePath });
//     }

//     // Validate storage path format
//     if (!this.imageManagementService.isProviderUrl(storagePath) && 
//         !storagePath.startsWith('profileImages/')) {
//       console.error('Invalid storage path:', storagePath);
//       throw new Error('Invalid storage path format');
//     }

//     // Update user with new path and settings
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: storagePath,
//       profilePictureSettings: settings
//     };

//     const response = await firstValueFrom(
//       this.userService.updateUser(updatedUser).pipe(
//         catchError(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.userService.updateUser(updatedUser);
//           }
//           throw error;
//         })
//       )
//     );

//     // Once successfully updated the user, update the image management service state
//     this.imageManagementService.setCurrentProfileImage(storagePath);

//     // Update UI state in NgZone
//     await this.ngZone.run(async () => {
//       this.currentUser = {
//         ...this.currentUser,
//         ...response,
//         imgUrl: storagePath,
//         profilePictureSettings: settings
//       };

//       this.isInitialChangingPictureState = false;
//       this.currentState = ProfileState.Viewing;
//       this.hasStartedNavigating = false;
//       this.showUploadSuccess = false;
//       this.resetHoverState();
//       this.providerUrlPasted = false;
//       await this.updateImageTransform();
//       this.imageManagementService.clearTemporaryUrl();
//       this.isUploadingOrPasting = false;
//       this.hasProfilePictureTransitioned = false;
//       this.showButton = true;
//       // this.leftClicked = false;
//       // this.rightClicked = false;
//       // this.isTransitioning = false;
//       // const container = document.querySelector('.profilePictureContainerForDragging');
//       // if (container && (this.isMobile || this.isTablet)) {
//       //   container.classList.remove('post-animation');
//       // }
//       this.cdr.detectChanges();
//     });

//     // Clean up staged files if they exist
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       await this.imageUrlManager.clearStagedFile(userId);
//       console.log('Staged file cleanup completed');
//     }

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.isUploadingOrPasting = false;
//     this.cdr.detectChanges();
//   }
// }

// async saveProfilePicture(): Promise<void> {
//   if (!this.pictureForm.valid) {
//     console.log('Form validation failed');
//     return;
//   }

//   try {
//     this.isSavingPicture = true;
//     console.log('Starting save process...');

//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');

//     const formImageUrl = this.pictureForm.get('imgUrl')?.value;
//     if (!formImageUrl) throw new Error('No image URL provided');

//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     let storagePath: string;

//     // Handle staged files
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//       console.log('Moving staged file:', { fileName: stagedFile.fileName, storagePath });

//       await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//         .catch(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//           }
//           throw error;
//         });

//       this.onlyFirebaseImageCount++;
//     }
//     // Handle navigated images
//     else if (this.hasStartedNavigating) {
//       const subject = this.imageManagementService.getUserImagesSubject(userId);
//       const currentState = subject.value;

//       if (currentState.currentIndex >= 0 && currentState.urls.length > 0) {
//         const currentUrl = currentState.urls[currentState.currentIndex];
        
//         if (currentUrl.startsWith('blob:')) {
//           const originalPath = await this.imageManagementService.getOriginalPath(userId, currentState.currentIndex);
//           if (!originalPath) throw new Error('Could not determine storage path');
//           storagePath = originalPath;
//         } else if (currentUrl.includes('/api/storage/')) {
//           storagePath = currentUrl.split('/api/storage/')[1];
//         } else {
//           storagePath = currentUrl;
//         }
//       } else {
//         throw new Error('No valid image selected during navigation');
//       }
//     }
//     // Handle provider URLs (Unsplash, etc.)
//     else if (this.imageManagementService.isProviderUrl(formImageUrl)) {
//       storagePath = formImageUrl;
//       console.log('Using provider URL:', { storagePath });
//     }
//     // Handle external URLs (new code to handle any image URL)
//     else if (this.isExternalImageUrl(formImageUrl)) {
//       try {
//         console.log('Processing external URL:', formImageUrl);
        
//         // Fetch the image with proper headers for CORS
//         const response = await fetch(formImageUrl, {
//           headers: {
//             'Accept': 'image/*'
//           }
//           // No mode: 'cors' to handle more URLs
//         });
        
//         if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        
//         const blob = await response.blob();
        
//         // Verify it's an image type
//         if (!blob.type.startsWith('image/')) {
//           throw new Error(`Not an image: ${blob.type}`);
//         }
        
//         // Generate filename from URL
//         const urlObj = new URL(formImageUrl);
//         const pathParts = urlObj.pathname.split('/');
//         let fileName = pathParts[pathParts.length - 1];
        
//         // If filename doesn't have extension or has query params, clean it up
//         if (!fileName.includes('.') || fileName.includes('?')) {
//           const ext = blob.type.split('/')[1] || 'jpg';
//           fileName = `image_${Date.now()}.${ext}`;
//         } else {
//           // Add timestamp to avoid name collisions
//           const nameParts = fileName.split('.');
//           const ext = nameParts.pop() || 'jpg';
//           fileName = `${nameParts.join('.')}_${Date.now()}.${ext}`;
//         }
        
//         // Create file object and upload
//         const file = new File([blob], fileName, { type: blob.type });
//         await this.imageUrlManager.handleImageUpload(file, userId);
        
//         const stagedFile = this.imageUrlManager.getStagedFile(userId);
//         if (!stagedFile) throw new Error('Failed to stage external image');
        
//         storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//         console.log('External URL processed and staged:', storagePath);
        
//         // Move to permanent storage
//         await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//           .catch(async (error) => {
//             if (error instanceof HttpErrorResponse && error.status === 401) {
//               await this.authService.refreshToken();
//               return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//             }
//             throw error;
//           });
          
//         this.onlyFirebaseImageCount++;
//       } catch (error) {
//         console.error('Error processing external URL:', error);
//         this.showError('Failed to process external image. Please try uploading directly.');
//         throw error;
//       }
//     }
//     // Handle existing URLs and paths
//     else {
//       if (formImageUrl.includes('/api/storage/')) {
//         storagePath = formImageUrl.split('/api/storage/')[1];
//       } else if (formImageUrl.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(formImageUrl);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       } else if (formImageUrl.startsWith('profileImages/')) {
//         storagePath = formImageUrl;
//       } else {
//         storagePath = this.currentUser.imgUrl!;
//       }
//       console.log('Using existing image path:', { storagePath });
//     }

//     // Validate storage path format
//     if (!this.imageManagementService.isProviderUrl(storagePath) && 
//         !storagePath.startsWith('profileImages/')) {
//       console.warn('Potentially invalid storage path, attempting to fix:', storagePath);
        
//       // Attempt to normalize the path
//       if (storagePath.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(storagePath);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       }
      
//       // If we still don't have a valid path, use the current one or throw
//       if (!storagePath.startsWith('profileImages/')) {
//         console.error('Invalid storage path format:', storagePath);
//         if (this.currentUser.imgUrl) {
//           storagePath = this.currentUser.imgUrl;
//         } else {
//           throw new Error('Invalid storage path format');
//         }
//       }
//     }

//     // Update user with new path and settings
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: storagePath,
//       profilePictureSettings: settings
//     };

//     const response = await firstValueFrom(
//       this.userService.updateUser(updatedUser).pipe(
//         catchError(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.userService.updateUser(updatedUser);
//           }
//           throw error;
//         })
//       )
//     );

//     // Once successfully updated the user, update the image management service state
//     this.imageManagementService.setCurrentProfileImage(storagePath);

//     // Update UI state in NgZone
//     await this.ngZone.run(async () => {
//       this.currentUser = {
//         ...this.currentUser,
//         ...response,
//         imgUrl: storagePath,
//         profilePictureSettings: settings
//       };

//       this.isInitialChangingPictureState = false;
//       this.currentState = ProfileState.Viewing;
//       this.hasStartedNavigating = false;
//       this.showUploadSuccess = false;
//       this.resetHoverState();
//       this.providerUrlPasted = false;
//       await this.updateImageTransform();
//       this.imageManagementService.clearTemporaryUrl();
//       this.isUploadingOrPasting = false;
//       this.hasProfilePictureTransitioned = false;
//       this.showButton = true;
//       this.cdr.detectChanges();
//     });

//     // Clean up staged files if they exist
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       await this.imageUrlManager.clearStagedFile(userId);
//       console.log('Staged file cleanup completed');
//     }

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.isUploadingOrPasting = false;
//     this.cdr.detectChanges();
//   }
// }

// async saveProfilePicture(): Promise<void> {
//   if (!this.pictureForm.valid) {
//     console.log('Form validation failed');
//     return;
//   }

//   try {
//     this.isSavingPicture = true;
//     console.log('Starting save process...');

//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');

//     const formImageUrl = this.pictureForm.get('imgUrl')?.value;
//     if (!formImageUrl) throw new Error('No image URL provided');

//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     let storagePath: string;

//     // Handle staged files
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//       console.log('Moving staged file:', { fileName: stagedFile.fileName, storagePath });

//       await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//         .catch(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//           }
//           throw error;
//         });

//       this.onlyFirebaseImageCount++;
//     }
//     // Handle navigated images
//     else if (this.hasStartedNavigating) {
//       const subject = this.imageManagementService.getUserImagesSubject(userId);
//       const currentState = subject.value;

//       if (currentState.currentIndex >= 0 && currentState.urls.length > 0) {
//         const currentUrl = currentState.urls[currentState.currentIndex];
        
//         if (currentUrl.startsWith('blob:')) {
//           const originalPath = await this.imageManagementService.getOriginalPath(userId, currentState.currentIndex);
//           if (!originalPath) throw new Error('Could not determine storage path');
//           storagePath = originalPath;
//         } else if (currentUrl.includes('/api/storage/')) {
//           storagePath = currentUrl.split('/api/storage/')[1];
//         } else {
//           storagePath = currentUrl;
//         }
//       } else {
//         throw new Error('No valid image selected during navigation');
//       }
//     }
//     // Handle provider URLs (Unsplash, etc.) - Now we'll download them too
//     else if (this.imageManagementService.isProviderUrl(formImageUrl)) {
//       try {
//         console.log('Processing provider URL:', formImageUrl);
        
//         // Fetch the image with proper headers for CORS
//         const response = await fetch(formImageUrl, {
//           headers: {
//             'Accept': 'image/*'
//           }
//         });
        
//         if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        
//         const blob = await response.blob();
        
//         // Verify it's an image type
//         if (!blob.type.startsWith('image/')) {
//           throw new Error(`Not an image: ${blob.type}`);
//         }
        
//         // Generate filename that includes provider name
//         let providerName = 'provider';
//         if (formImageUrl.includes('unsplash.com')) {
//           providerName = 'unsplash';
//         } else if (formImageUrl.includes('pexels.com')) {
//           providerName = 'pexels';
//         } else if (formImageUrl.includes('pixabay.com')) {
//           providerName = 'pixabay';
//         }
        
//         const ext = blob.type.split('/')[1] || 'jpg';
//         const fileName = `${providerName}_${Date.now()}.${ext}`;
        
//         // Create file object and upload
//         const file = new File([blob], fileName, { type: blob.type });
//         await this.imageUrlManager.handleImageUpload(file, userId);
        
//         const stagedFile = this.imageUrlManager.getStagedFile(userId);
//         if (!stagedFile) throw new Error('Failed to stage provider image');
        
//         storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//         console.log('Provider URL processed and staged:', storagePath);
        
//         // Move to permanent storage
//         await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//           .catch(async (error) => {
//             if (error instanceof HttpErrorResponse && error.status === 401) {
//               await this.authService.refreshToken();
//               return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//             }
//             throw error;
//           });
          
//         this.onlyFirebaseImageCount++;
//       } catch (error) {
//         // If downloading fails, fall back to using the direct URL
//         console.warn('Error processing provider URL, falling back to direct URL:', error);
//         storagePath = formImageUrl;
//         console.log('Using provider URL directly:', { storagePath });
//       }
//     }
//     // Handle external URLs (new code to handle any image URL)
//     else if (this.isExternalImageUrl(formImageUrl)) {
//       try {
//         console.log('Processing external URL:', formImageUrl);
        
//         // Fetch the image with proper headers for CORS
//         const response = await fetch(formImageUrl, {
//           headers: {
//             'Accept': 'image/*'
//           }
//           // No mode: 'cors' to handle more URLs
//         });
        
//         if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        
//         const blob = await response.blob();
        
//         // Verify it's an image type
//         if (!blob.type.startsWith('image/')) {
//           throw new Error(`Not an image: ${blob.type}`);
//         }
        
//         // Generate filename from URL
//         const urlObj = new URL(formImageUrl);
//         const pathParts = urlObj.pathname.split('/');
//         let fileName = pathParts[pathParts.length - 1];
        
//         // If filename doesn't have extension or has query params, clean it up
//         if (!fileName.includes('.') || fileName.includes('?')) {
//           const ext = blob.type.split('/')[1] || 'jpg';
//           fileName = `image_${Date.now()}.${ext}`;
//         } else {
//           // Add timestamp to avoid name collisions
//           const nameParts = fileName.split('.');
//           const ext = nameParts.pop() || 'jpg';
//           fileName = `${nameParts.join('.')}_${Date.now()}.${ext}`;
//         }
        
//         // Create file object and upload
//         const file = new File([blob], fileName, { type: blob.type });
//         await this.imageUrlManager.handleImageUpload(file, userId);
        
//         const stagedFile = this.imageUrlManager.getStagedFile(userId);
//         if (!stagedFile) throw new Error('Failed to stage external image');
        
//         storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//         console.log('External URL processed and staged:', storagePath);
        
//         // Move to permanent storage
//         await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//           .catch(async (error) => {
//             if (error instanceof HttpErrorResponse && error.status === 401) {
//               await this.authService.refreshToken();
//               return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//             }
//             throw error;
//           });
          
//         this.onlyFirebaseImageCount++;
//       } catch (error) {
//         console.error('Error processing external URL:', error);
//         this.showError('Failed to process external image. Please try uploading directly.');
//         throw error;
//       }
//     }
//     // Handle existing URLs and paths
//     else {
//       if (formImageUrl.includes('/api/storage/')) {
//         storagePath = formImageUrl.split('/api/storage/')[1];
//       } else if (formImageUrl.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(formImageUrl);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       } else if (formImageUrl.startsWith('profileImages/')) {
//         storagePath = formImageUrl;
//       } else {
//         storagePath = this.currentUser.imgUrl!;
//       }
//       console.log('Using existing image path:', { storagePath });
//     }

//     // Validate storage path format
//     if (!this.imageManagementService.isProviderUrl(storagePath) && 
//         !storagePath.startsWith('profileImages/')) {
//       console.warn('Potentially invalid storage path, attempting to fix:', storagePath);
        
//       // Attempt to normalize the path
//       if (storagePath.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(storagePath);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       }
      
//       // If we still don't have a valid path, use the current one or throw
//       if (!storagePath.startsWith('profileImages/')) {
//         console.error('Invalid storage path format:', storagePath);
//         if (this.currentUser.imgUrl) {
//           storagePath = this.currentUser.imgUrl;
//         } else {
//           throw new Error('Invalid storage path format');
//         }
//       }
//     }

//     // Update user with new path and settings
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: storagePath,
//       profilePictureSettings: settings
//     };

//     const response = await firstValueFrom(
//       this.userService.updateUser(updatedUser).pipe(
//         catchError(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.userService.updateUser(updatedUser);
//           }
//           throw error;
//         })
//       )
//     );

//     // Once successfully updated the user, update the image management service state
//     this.imageManagementService.setCurrentProfileImage(storagePath);

//     // Update UI state in NgZone
//     await this.ngZone.run(async () => {
//       this.currentUser = {
//         ...this.currentUser,
//         ...response,
//         imgUrl: storagePath,
//         profilePictureSettings: settings
//       };

//       this.isInitialChangingPictureState = false;
//       this.currentState = ProfileState.Viewing;
//       this.hasStartedNavigating = false;
//       this.showUploadSuccess = false;
//       this.resetHoverState();
//       this.providerUrlPasted = false;
//       await this.updateImageTransform();
//       this.imageManagementService.clearTemporaryUrl();
//       this.isUploadingOrPasting = false;
//       this.hasProfilePictureTransitioned = false;
//       this.showButton = true;
//       this.cdr.detectChanges();
//     });

//     // Clean up staged files if they exist
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       await this.imageUrlManager.clearStagedFile(userId);
//       console.log('Staged file cleanup completed');
//     }

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.isUploadingOrPasting = false;
//     this.cdr.detectChanges();
//   }
// }

// working with new profile picture pasting functionality but no cors
// async saveProfilePicture(): Promise<void> {
//   if (!this.pictureForm.valid) {
//     console.log('Form validation failed');
//     return;
//   }

//   try {
//     this.isSavingPicture = true;
//     console.log('Starting save process...');

//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');

//     const formImageUrl = this.pictureForm.get('imgUrl')?.value;
//     if (!formImageUrl) throw new Error('No image URL provided');

//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     let storagePath: string;

//     // Handle staged files
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//       console.log('Moving staged file:', { fileName: stagedFile.fileName, storagePath });

//       await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//         .catch(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//           }
//           throw error;
//         });

//       this.onlyFirebaseImageCount++;
//     }
//     // Handle navigated images
//     else if (this.hasStartedNavigating) {
//       const subject = this.imageManagementService.getUserImagesSubject(userId);
//       const currentState = subject.value;

//       if (currentState.currentIndex >= 0 && currentState.urls.length > 0) {
//         const currentUrl = currentState.urls[currentState.currentIndex];
        
//         if (currentUrl.startsWith('blob:')) {
//           const originalPath = await this.imageManagementService.getOriginalPath(userId, currentState.currentIndex);
//           if (!originalPath) throw new Error('Could not determine storage path');
//           storagePath = originalPath;
//         } else if (currentUrl.includes('/api/storage/')) {
//           storagePath = currentUrl.split('/api/storage/')[1];
//         } else {
//           storagePath = currentUrl;
//         }
//       } else {
//         throw new Error('No valid image selected during navigation');
//       }
//     }
//     // Handle external URLs and web images
//     else if (this.isExternalUrl(formImageUrl)) {
//       try {
//         console.log('Processing URL:', formImageUrl);
        
//         // Fetch the image with proper headers
//         const response = await fetch(formImageUrl, {
//           headers: {
//             'Accept': 'image/*'
//           }
//         });
        
//         if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        
//         const blob = await response.blob();
        
//         // Verify it's an image type
//         if (!blob.type.startsWith('image/')) {
//           throw new Error(`Not an image: ${blob.type}`);
//         }
        
//         // Generate a meaningful filename
//         const urlObj = new URL(formImageUrl);
//         const hostname = urlObj.hostname.replace('www.', '').split('.')[0];
//         const pathParts = urlObj.pathname.split('/');
//         let fileName = pathParts[pathParts.length - 1];
        
//         // Clean up the filename
//         if (!fileName || fileName === '' || !fileName.includes('.') || fileName.includes('?')) {
//           const ext = blob.type.split('/')[1] || 'jpg';
//           fileName = `${hostname}_${Date.now()}.${ext}`;
//         } else {
//           // Add timestamp to avoid name collisions
//           const nameParts = fileName.split('.');
//           const ext = nameParts.pop() || 'jpg';
//           fileName = `${hostname}_${nameParts.join('.')}_${Date.now()}.${ext}`;
//         }
        
//         // Create file object and upload
//         const file = new File([blob], fileName, { type: blob.type });
//         await this.imageUrlManager.handleImageUpload(file, userId);
        
//         const stagedFile = this.imageUrlManager.getStagedFile(userId);
//         if (!stagedFile) throw new Error('Failed to stage image');
        
//         storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//         console.log('URL processed and staged:', storagePath);
        
//         // Move to permanent storage
//         await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//           .catch(async (error) => {
//             if (error instanceof HttpErrorResponse && error.status === 401) {
//               await this.authService.refreshToken();
//               return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//             }
//             throw error;
//           });
          
//         this.onlyFirebaseImageCount++;
//       } catch (error) {
//         console.error('Error processing URL:', error);
//         this.showError('Failed to process image URL. Please try uploading directly.');
//         throw error;
//       }
//     }
//     // Handle existing Firebase URLs and paths
//     else {
//       if (formImageUrl.includes('/api/storage/')) {
//         storagePath = formImageUrl.split('/api/storage/')[1];
//       } else if (formImageUrl.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(formImageUrl);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       } else if (formImageUrl.startsWith('profileImages/')) {
//         storagePath = formImageUrl;
//       } else {
//         storagePath = this.currentUser.imgUrl!;
//       }
//       console.log('Using existing image path:', { storagePath });
//     }

//     // Validate storage path format
//     if (!storagePath.startsWith('profileImages/') && 
//         !storagePath.includes('http')) { // Keep http URLs as is
//       console.warn('Potentially invalid storage path, attempting to fix:', storagePath);
        
//       // Attempt to normalize the path
//       if (storagePath.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(storagePath);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       }
      
//       // If we still don't have a valid path, use the current one or throw
//       if (!storagePath.startsWith('profileImages/') && !storagePath.includes('http')) {
//         console.error('Invalid storage path format:', storagePath);
//         if (this.currentUser.imgUrl) {
//           storagePath = this.currentUser.imgUrl;
//         } else {
//           throw new Error('Invalid storage path format');
//         }
//       }
//     }

//     // Update user with new path and settings
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: storagePath,
//       profilePictureSettings: settings
//     };

//     const response = await firstValueFrom(
//       this.userService.updateUser(updatedUser).pipe(
//         catchError(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.userService.updateUser(updatedUser);
//           }
//           throw error;
//         })
//       )
//     );

//     // Once successfully updated the user, update the image management service state
//     this.imageManagementService.setCurrentProfileImage(storagePath);

//     // Update UI state in NgZone
//     await this.ngZone.run(async () => {
//       this.currentUser = {
//         ...this.currentUser,
//         ...response,
//         imgUrl: storagePath,
//         profilePictureSettings: settings
//       };

//       this.isInitialChangingPictureState = false;
//       this.currentState = ProfileState.Viewing;
//       this.hasStartedNavigating = false;
//       this.showUploadSuccess = false;
//       this.resetHoverState();
//       this.providerUrlPasted = false;
//       await this.updateImageTransform();
//       this.imageManagementService.clearTemporaryUrl();
//       this.isUploadingOrPasting = false;
//       this.hasProfilePictureTransitioned = false;
//       this.showButton = true;
//       this.cdr.detectChanges();
//     });

//     // Clean up staged files if they exist
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       await this.imageUrlManager.clearStagedFile(userId);
//       console.log('Staged file cleanup completed');
//     }

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.isUploadingOrPasting = false;
//     this.cdr.detectChanges();
//   }
// }

// private updateImageStyles(displayUrl: string) {
  //   this.imageStyles = {
  //     'background-image': `url("${displayUrl}")`,
  //     'background-position': `${this.position.x}% ${this.position.y}%`,
  //     'background-repeat': 'no-repeat',
  //     'background-size': `${this.zoomLevel * 100}%`,
  //     'background-color': '#c7ff20'
  //   };

  //   if (this.profileImg?.nativeElement) {
  //     Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
  //   }
  // }


// // Last working
// private async getDisplayableUrlOnce(url: string): Promise<string | null> {
//   if (!url) return null;

//   // Check cache first
//   if (this.convertedUrlCache.has(url)) {
//     return this.convertedUrlCache.get(url)!;
//   }

//   try {
//     let displayUrl = url;

//     // Convert URL based on type
//     if (url.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(url);
//     } else if (url.includes('/api/storage/')) {
//       displayUrl = url; // Already proxied
//     } else if (this.imageManagementService.isProviderUrl(url)) {
//       displayUrl = url; // Provider URL, use as is
//     } else {
//       // Default case - convert to proxied URL
//       displayUrl = await this.storageService.convertFirebaseUrl(url);
//     }

//     // Preload the image before returning
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
//       img.onload = () => resolve();
//       img.onerror = () => reject(`Failed to load image: ${displayUrl}`);
//       img.src = displayUrl;
//     });

//     // Cache the successful result
//     this.convertedUrlCache.set(url, displayUrl);
//     return displayUrl;

//   } catch (error) {
//     console.error('Error getting displayable URL:', error);
//     // Don't cache failed attempts
//     return null;
//   }
// }


// get loadingText(): string {
//   const count = this.imageCount;
//   return `Loading image${count > 1 ? 's' : ''}...`;
// }

// Latest working
// get loadingText(): string {
//   const count = this.imageCount;
//   const hasProviderProfileImage = this.currentUser?.imgUrl && 
//                                 this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
//   const totalCount = hasProviderProfileImage ? count + 1 : count;
//   return `Loading image${totalCount > 1 ? 's' : ''}...`;
// }

// get loadingText(): string {
//   // Only update stable count when loading is complete
//   if (!this.isLoadingImages) {
//     const count = this.imageCount;
//     const hasProviderProfileImage = this.currentUser?.imgUrl && 
//                                   this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
//     this.stableImageCount = hasProviderProfileImage ? count + 1 : count;
//   }

//   // Use stable count for display
//   return `Loading image${this.stableImageCount > 1 ? 's' : ''}...`;
// }

// onControlsAnimationDone() {
//   this.controlsAnimationComplete = true;
//   this.cdr.detectChanges();
// }


// onControlsAnimationDone() {
//   this.ngZone.run(() => {
//     if (!this.controlsAnimationComplete) {
//       this.controlsAnimationComplete = true;
//       this.cdr.detectChanges();
//     }
//   });
// }

// onImageAnimationDone() {
//   this.ngZone.run(() => {
//     if (!this.imageAnimationComplete) {
//       this.imageAnimationComplete = true;
//       this.cdr.detectChanges();
//     }
//   });
// }

// removeAnimations(event: any) {
//   // Remove animation classes and bindings after completion
//   const element = event.element as HTMLElement;
//   element.style.animation = 'none';
  
//   // Set animation flags
//   this.ngZone.run(() => {
//     this.controlsAnimationComplete = true;
//     // Remove the animation binding
//     element.removeAttribute('@fadeInControls');
//     this.cdr.detectChanges();
//   });
  // }



// async changePicture() {
//   try {
//     // Before loading images, verify they exist
//     this.isLoadingImages = true;
    
//     // Refresh image list from storage directly
//     await this.imageManagementService.refreshFirebaseImageCount(this.userId);

//     const user = await firstValueFrom(this.userService.getUser(this.userId));

//     if (!user.imgUrl) {
//       // Ensure clean state if database has no image
//       this.currentUser.imgUrl = null;
//       this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//       this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
//       this.imageManagementService.resetAll(this.userId);
//     }
    
//     console.log('Entering changePicture()...');
//     this.imageManagementService.logNavigationState(this.userId);

//     // Reset states first
//     this.controlsAnimationComplete = false;
//     this.imageAnimationComplete = false;
//     this.resetHoverState();
//     this.isInitialChangingPictureState = true;
//     this.hasStartedNavigating = false;
//     this.imageNotFound = false;
//     this.imageLoadedSuccessfully = false;
//     this.isUploadingOrPasting = false;
//     this.firebaseImageLoaded = false;
    
//     // Store original states
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl || null;

//     // Enter changing picture state
//     this.currentState = ProfileState.ChangingPicture;
    
//     // We're already setting this at the beginning now
//     // this.isLoadingImages = true;
//     this.allImagesLoaded = false;

//     try {
//       // Important: Check actual database state first is already done above
      
//       if (!user.imgUrl) {
//         // If no image in database, ensure UI is clean
//         this.ngZone.run(() => {
//           this.currentUser.imgUrl = null;
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': '0% 0%',
//             'background-repeat': 'no-repeat',
//             'background-size': '100%',
//             'background-color': '#c7ff20'
//           };
//           if (this.profileImg?.nativeElement) {
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }
//           this.imageLoadedSuccessfully = false;
//           this.cdr.detectChanges();
//         });
//       } else if (this.currentUser.imgUrl) {
//         // Only set up initial image if it matches database state
//         if (this.currentUser.imgUrl === user.imgUrl) {
//           try {
//             const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//             this.ngZone.run(() => {
//               this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//               this.imageLoadedSuccessfully = true;
//               this.updateImageTransform();
//               this.cdr.detectChanges();
//             });
//           } catch (initialError) {
//             console.error('Error setting initial image:', initialError);
//           }
//         }
//       }

//       // Load user images
//       await this.imageManagementService.loadUserImages(this.userId, true);
      
//       // Get all available URLs and preload
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const loadedUrls = subject.value.urls;
      
//       // If no images found, reset position and zoom immediately
//       if (loadedUrls.length === 0) {
//         this.resetImagePositionAndZoom();
//       }
      
//       await this.preloadAllImages(loadedUrls);
//       this.allImagesLoaded = true;

//       // Only update display if database state still matches
//       if (this.currentUser.imgUrl && this.currentUser.imgUrl === user.imgUrl) {
//         try {
//           const displayUrl = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
//           if (displayUrl) {
//             this.ngZone.run(() => {
//               this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//               this.imageLoadedSuccessfully = true;
//               this.updateImageTransform();
//               this.cdr.detectChanges();
//             });
//           }
//         } catch (displayError) {
//           console.error('Error displaying current image:', displayError);
//         }
//       }

//       // Initialize navigation
//       await this.initializeImageNavigation();

//       console.log('State after navigation init:', {
//         currentState: this.currentState,
//         showImageNavigation: this.showImageNavigation,
//         imageCount: this.imageCount
//       });

//     } finally {
//       this.isLoadingImages = false;
//     }

//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     // Only set error state if we truly have no images
//     const hasAnyImages = this.imageManagementService.hasAnyFirebaseImages();
//     if (!hasAnyImages) {
//       this.ngZone.run(() => {
//         this.imageNotFound = true;
//         this.isLoadingImages = false;
//         this.allImagesLoaded = false;
//         this.imageLoadedSuccessfully = false;
//         this.cdr.detectChanges();
//       });
//     } else {
//       // If we have images but encountered an error, just reset loading states
//       this.ngZone.run(() => {
//         this.isLoadingImages = false;
//         this.allImagesLoaded = true;
//         this.cdr.detectChanges();
//       });
//     }
//   } finally {
//     this.isLoadingImages = false;
//   }
// }

// Last working
// private async preloadAllImages(urls: string[]): Promise<void> {
//   const promises = urls.map(async (originalUrl) => {
//     let displayUrl = originalUrl;
//     if (displayUrl.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(displayUrl);
//     }

//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
//       img.onload = () => resolve();
//       img.onerror = () => reject(`Failed to load image: ${displayUrl}`);
//       img.src = displayUrl;
//     });
//   });

//   await Promise.all(promises);
// }



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


// last working
// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
//     if (!userId) {
//       console.error('No userId available for cleanup');
//       return;
//     }

//     await this.ngZone.run(async () => {
//       try {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//           if (!this.currentUser.imgUrl) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//           }
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // Get current database state
//         const user = await firstValueFrom(this.userService.getUser(userId));
//         const wasDeleted = this.originalProfileImage !== null && !user.imgUrl;

//         // If original was deleted or never existed, show avatar and ensure database is updated
//         if (wasDeleted || this.originalProfileImage === null) {
//           // Only clear URLs and reset if the image was actually deleted
//           if (wasDeleted) {
//             // Ensure database reflects the null state
//             const updatedUser = {
//               ...this.currentUser,
//               imgUrl: null,
//               profilePictureSettings: null
//             };
//             await firstValueFrom(this.userService.updateUser(updatedUser));

//             // Reset UI to show avatar
//             this.currentUser.imgUrl = null;
//             this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//             this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
            
//             // If it was a provider URL, ensure complete cleanup
//             if (this.originalProfileImage && this.imageManagementService.isProviderUrl(this.originalProfileImage)) {
//               const subject = this.imageManagementService.getUserImagesSubject(userId);
//               const current = subject.value;
//               const updatedUrls = current.urls.filter(url => url !== this.originalProfileImage);
//               subject.next({
//                 urls: updatedUrls,
//                 currentIndex: 0
//               });

//               // Clear all references to this provider URL
//               if (this.imageManagementService.temporaryUrl === this.originalProfileImage) {
//                 this.imageManagementService.clearTemporaryUrl();
//               }
//             }
            
//             this.originalProfileImage = null;
//           }

//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
          
//           if (this.profileImg?.nativeElement) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }
          
//           this.resetImage();
//           this.imageNotFound = false;
//           this.imageManagementService.clearAllState(userId);
//         } else if (user.imgUrl && this.originalProfileImage) {
//           // Restore original image and its settings
//           const displayUrl = await this.storageService.convertFirebaseUrl(user.imgUrl);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           if (this.profileImg?.nativeElement) {
//             this.renderer.removeClass(this.profileImg.nativeElement, 'no-image');
//           }

//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });
          
//           this.currentUser.imgUrl = this.originalProfileImage;
          
//           this.imageStyles = {
//             'background-image': `url("${displayUrl}")`,
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
          
//           if (this.profileImg?.nativeElement) {
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           this.imageLoadedSuccessfully = true;
//           this.imageNotFound = false;

//           await this.updateImageTransform();
//         }

//         // Reset all states
//         this.isInitialChangingPictureState = false;
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.resetHoverState();
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;
//         this.providerUrlPasted = false;
//         this.hasProfilePictureTransitioned = false;
//         this.showButton = true;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.isUploadingOrPasting = false; 
//         this.cdr.detectChanges();
//       }
//     });

//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// Last working
// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
//     if (!userId) {
//       console.error('No userId available for cleanup');
//       return;
//     }

//     await this.ngZone.run(async () => {
//       try {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//           if (!this.currentUser.imgUrl) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//           }
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // Get current database state and check if profile image still exists
//         const user = await firstValueFrom(this.userService.getUser(userId));
//         const wasDeleted = this.originalProfileImage !== null && !user.imgUrl;
//         const profileImageExists = await this.imageManagementService.checkProfileImageExists(user.imgUrl!);

//         // Reset to avatar if:
//         // 1. Image was deleted or never existed
//         // 2. Profile image doesn't exist in storage anymore
//         // 3. We're canceling an upload
//         if (wasDeleted || this.originalProfileImage === null || !profileImageExists || this.isUploadingOrPasting) {
//           // Only update database if the image was actually deleted
//           if (wasDeleted) {
//             const updatedUser = {
//               ...this.currentUser,
//               imgUrl: null,
//               profilePictureSettings: null
//             };
//             await firstValueFrom(this.userService.updateUser(updatedUser));

//             // If it was a provider URL, ensure complete cleanup
//             if (this.originalProfileImage && this.imageManagementService.isProviderUrl(this.originalProfileImage)) {
//               const subject = this.imageManagementService.getUserImagesSubject(userId);
//               const current = subject.value;
//               const updatedUrls = current.urls.filter(url => url !== this.originalProfileImage);
//               subject.next({
//                 urls: updatedUrls,
//                 currentIndex: 0
//               });

//               if (this.imageManagementService.temporaryUrl === this.originalProfileImage) {
//                 this.imageManagementService.clearTemporaryUrl();
//               }
//             }
            
//             this.originalProfileImage = null;
//           }

//           // Reset UI and form states
//           this.currentUser.imgUrl = null;
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });

//           // Reset image styles with fixed positions
//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': '0% 0%',
//             'background-repeat': 'no-repeat',
//             'background-size': '100%',
//             'background-color': '#c7ff20'
//           };
          
//           if (this.profileImg?.nativeElement) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }
          
//           // Reset all states
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = false;
//           this.resetImagePositionAndZoom();
//           this.imageManagementService.clearAllState(userId);

//         } else if (user.imgUrl && this.originalProfileImage) {
//           // Restore original image and its settings
//           const displayUrl = await this.storageService.convertFirebaseUrl(user.imgUrl);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           if (this.profileImg?.nativeElement) {
//             this.renderer.removeClass(this.profileImg.nativeElement, 'no-image');
//           }

//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });
          
//           this.currentUser.imgUrl = this.originalProfileImage;
          
//           this.imageStyles = {
//             'background-image': `url("${displayUrl}")`,
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
          
//           if (this.profileImg?.nativeElement) {
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           this.imageLoadedSuccessfully = true;
//           this.imageNotFound = false;

//           await this.updateImageTransform();
//         }

//         // Reset all states
//         this.isInitialChangingPictureState = false;
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.resetHoverState();
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;
//         this.providerUrlPasted = false;
//         this.hasProfilePictureTransitioned = false;
//         this.showButton = true;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.isUploadingOrPasting = false;
//         this.cdr.detectChanges();
//       }
//     });

//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// Last working
// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
//     if (!userId) {
//       console.error('No userId available for cleanup');
//       return;
//     }

//     // If we're cancelling the delete profile action specifically
//     if (this.currentState === ProfileState.DeletingProfile ||
//        this.currentState === ProfileState.EditingProfile) {
//       // Simply change the state back to viewing without doing any 
//       // of the image cleanup that's needed when canceling picture change
//       this.currentState = ProfileState.Viewing;
//       this.cdr.detectChanges();
//       return; // Exit early - don't do image processing logic
//     }

//     await this.ngZone.run(async () => {
//       try {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//           if (!this.currentUser.imgUrl) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//           }
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // Get current database state and check if profile image still exists
//         const user = await firstValueFrom(this.userService.getUser(userId));
//         const wasDeleted = this.originalProfileImage !== null && !user.imgUrl;
//         const profileImageExists = await this.imageManagementService.checkProfileImageExists(user.imgUrl!);

//         // Reset to avatar if:
//         // 1. Image was deleted or never existed
//         // 2. Profile image doesn't exist in storage anymore
//         // 3. We're canceling an upload
//         if (wasDeleted || this.originalProfileImage === null || !profileImageExists || this.isUploadingOrPasting) {
//           // Only update database if the image was actually deleted
//           if (wasDeleted) {
//             const updatedUser = {
//               ...this.currentUser,
//               imgUrl: null,
//               profilePictureSettings: null
//             };
//             await firstValueFrom(this.userService.updateUser(updatedUser));

//             // If it was a provider URL, ensure complete cleanup
//             if (this.originalProfileImage) {
//               const subject = this.imageManagementService.getUserImagesSubject(userId);
//               const current = subject.value;
//               const updatedUrls = current.urls.filter(url => url !== this.originalProfileImage);
//               subject.next({
//                 urls: updatedUrls,
//                 currentIndex: 0
//               });

//               if (this.imageManagementService.temporaryUrl === this.originalProfileImage) {
//                 this.imageManagementService.clearTemporaryUrl();
//               }
//             }
            
//             this.originalProfileImage = null;
//           }

//           // Reset UI and form states
//           this.currentUser.imgUrl = null;
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });

//           // Reset image styles with fixed positions
//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': '0% 0%',
//             'background-repeat': 'no-repeat',
//             'background-size': '100%',
//             'background-color': '#c7ff20'
//           };
          
//           if (this.profileImg?.nativeElement) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }
          
//           // Reset all states
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = false;
//           this.resetImagePositionAndZoom();
//           this.imageManagementService.clearAllState(userId);

//         } else if (user.imgUrl && this.originalProfileImage) {
//           // Restore original image and its settings
//           const displayUrl = await this.storageService.convertFirebaseUrl(user.imgUrl);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           if (this.profileImg?.nativeElement) {
//             this.renderer.removeClass(this.profileImg.nativeElement, 'no-image');
//           }

//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });
          
//           this.currentUser.imgUrl = this.originalProfileImage;
          
//           this.imageStyles = {
//             'background-image': `url("${displayUrl}")`,
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
          
//           if (this.profileImg?.nativeElement) {
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           this.imageLoadedSuccessfully = true;
//           this.imageNotFound = false;

//           await this.updateImageTransform();
//         }

//         // Reset all states
//         this.isInitialChangingPictureState = false;
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.resetHoverState();
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;
//         this.providerUrlPasted = false;
//         this.hasProfilePictureTransitioned = false;
//         this.showButton = true;
//         // this.leftClicked = false;
//         // this.rightClicked = false;
//         // this.isTransitioning = false;

//         // const container = document.querySelector('.profilePictureContainerForDragging');
//         // if (container && (this.isMobile || this.isTablet)) {
//         //   container.classList.remove('post-animation');
//         // }
        
//         await this.imageManagementService.refreshFirebaseImageCount(userId);

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.isUploadingOrPasting = false;
//         this.cdr.detectChanges();
//       }
//     });

//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }


// paste url and cancel working once improved
// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
//     if (!userId) {
//       console.error('No userId available for cleanup');
//       return;
//     }

//     // If we're cancelling the delete profile action specifically
//     if (this.currentState === ProfileState.DeletingProfile ||
//        this.currentState === ProfileState.EditingProfile) {
//       // Simply change the state back to viewing without doing any 
//       // of the image cleanup that's needed when canceling picture change
//       this.currentState = ProfileState.Viewing;
//       this.cdr.detectChanges();
//       return; // Exit early - don't do image processing logic
//     }

//     await this.ngZone.run(async () => {
//       try {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//           if (!this.currentUser.imgUrl) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//           }
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // Get current database state and check if profile image still exists
//         const user = await firstValueFrom(this.userService.getUser(userId));
//         const wasDeleted = this.originalProfileImage !== null && !user.imgUrl;
//         let profileImageExists = false;
        
//         if (user.imgUrl) {
//           try {
//             profileImageExists = await this.imageManagementService.checkProfileImageExists(user.imgUrl);
//           } catch (error) {
//             console.error('Error checking if profile image exists:', error);
//             profileImageExists = false;
//           }
//         }

//         // Reset to avatar if:
//         // 1. Image was deleted or never existed
//         // 2. Profile image doesn't exist in storage anymore
//         // 3. We're canceling an upload or paste operation
//         if (wasDeleted || this.originalProfileImage === null || !profileImageExists || this.isUploadingOrPasting) {
//           // Only update database if the image was actually deleted
//           if (wasDeleted) {
//             const updatedUser = {
//               ...this.currentUser,
//               imgUrl: null,
//               profilePictureSettings: null
//             };
//             await firstValueFrom(this.userService.updateUser(updatedUser));

//             // If it was a provider URL, ensure complete cleanup
//             if (this.originalProfileImage) {
//               const subject = this.imageManagementService.getUserImagesSubject(userId);
//               const current = subject.value;
//               const updatedUrls = current.urls.filter(url => url !== this.originalProfileImage);
//               subject.next({
//                 urls: updatedUrls,
//                 currentIndex: 0
//               });

//               if (this.imageManagementService.temporaryUrl === this.originalProfileImage) {
//                 this.imageManagementService.clearTemporaryUrl();
//               }
//             }
            
//             this.originalProfileImage = null;
//           }

//           // Reset UI and form states
//           this.currentUser.imgUrl = null;
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });

//           // Reset image styles with fixed positions
//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': '0% 0%',
//             'background-repeat': 'no-repeat',
//             'background-size': '100%',
//             'background-color': '#c7ff20'
//           };
          
//           if (this.profileImg?.nativeElement) {
//             this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }
          
//           // Reset all states
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = false;
//           this.resetImagePositionAndZoom();
//           this.imageManagementService.clearAllState(userId);
//         }

//         // After reset, if the original image still exists, restore it
//         if (user.imgUrl && this.originalProfileImage) {
//           try {
//             // Convert the URL to a displayable form
//             const displayUrl = await this.storageService.convertFirebaseUrl(user.imgUrl);
            
//             // Restore the original position and zoom if we saved them
//             if (this.originalPosition && this.originalZoom !== null) {
//               this.position = { ...this.originalPosition };
//               this.zoomLevel = this.originalZoom;
//               this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//               this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//             }

//             if (this.profileImg?.nativeElement) {
//               this.renderer.removeClass(this.profileImg.nativeElement, 'no-image');
//             }

//             // Update form with original URL
//             this.pictureForm.patchValue({
//               imgUrl: displayUrl
//             }, { emitEvent: false });
            
//             // Restore the current user's image URL
//             this.currentUser.imgUrl = this.originalProfileImage;
            
//             // Create and apply image styles
//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             if (this.profileImg?.nativeElement) {
//               Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//             }

//             this.imageLoadedSuccessfully = true;
//             this.imageNotFound = false;
            
//             // Force image to load with the updated transform
//             await this.updateImageTransform();
//           } catch (error) {
//             console.error('Error restoring original image:', error);
//             // If restoration fails, ensure we stay in avatar state
//             this.resetImage();
//           }
//         }

//         // Reset all states
//         this.isInitialChangingPictureState = false;
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.resetHoverState();
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;
//         this.providerUrlPasted = false;
//         this.hasProfilePictureTransitioned = false;
//         this.showButton = true;
        
//         await this.imageManagementService.refreshFirebaseImageCount(userId);

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.isUploadingOrPasting = false;
//         this.cdr.detectChanges();
//       }
//     });

//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }


///// Trigger animations on First Load /////
// triggerAnimations(){
//   const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
//   profilePicture?.classList.add('firstTimeAnimation');
  
//   const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
//   profileNameTier?.classList.add('firstTimeAnimation');

//   this.firstTimeAnimation = true;
//   this.cdr.detectChanges();
// }

// triggerAnimations() {
//   // Set the flag first
//   this.firstTimeAnimation = true;
  // this.cdr.detectChanges();
  
  // setTimeout(() => {
  //   const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
  //   if (profilePicture) {
  //     // Force a reflow before adding the animation class
  //     void profilePicture.offsetWidth;
  //     profilePicture.classList.add('firstTimeAnimation');
  //   }
    
  //   const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
  //   if (profileNameTier) {
  //     void profileNameTier.offsetWidth;
  //     profileNameTier.classList.add('firstTimeAnimation');
  //   }

  //   // const arrows = document.querySelector('.arrows') as HTMLElement;
  //   // if (arrows) {
  //   //   void arrows.offsetWidth;
  //   //   arrows.classList.add('firstTimeAnimation');
  //   // }

  //   const arrowContainer = document.querySelector('.arrowContainer') as HTMLElement;
  //   if (arrowContainer) {
  //     void arrowContainer.offsetWidth;
  //     arrowContainer.classList.add('firstTimeAnimation');
  //   }
    
  //   this.cdr.detectChanges();
  // }, 300);

    // Wait for loading to complete
    // setTimeout(() => {
    //   this.loadingComplete = true;
    //   this.cdr.detectChanges();
      
    //   // After loading is complete, prepare and trigger animations with a short delay
    //   setTimeout(() => {
    //     const profilePicture = document.querySelector('#profilePicture') as HTMLElement;
    //     if (profilePicture) {
    //       // For first visit, add firstTimeAnimation class to trigger the animation
    //       // but don't add tierThreeStyle yet (it will be added by the animation)
    //       void profilePicture.offsetWidth; // Force reflow
    //       profilePicture.classList.add('firstTimeAnimation');
    //     }
        
    //     const profileNameTier = document.querySelector('.profileNameTier') as HTMLElement;
    //     if (profileNameTier) {
    //       void profileNameTier.offsetWidth;
    //       profileNameTier.classList.add('firstTimeAnimation');
    //     }
  
    //     const arrowContainer = document.querySelector('.arrowContainer') as HTMLElement;
    //     if (arrowContainer) {
    //       void arrowContainer.offsetWidth;
    //       arrowContainer.classList.add('firstTimeAnimation');
    //     }
        
    //     this.cdr.detectChanges();
    //   }, 100);
    // }, 300);
  
// }



// checkEmailOverflow() {
//   // First let's check if the reference exists
//   if (!this.emailScrollContainer) {
//     console.log('Email container reference not found');
//     return;
//   }
  
//   // Now we can safely use the reference
//   const container = this.emailScrollContainer.nativeElement;
//   console.log('Email container:', container);
//   console.log('Email container dimensions:', {
//     scrollWidth: container.scrollWidth,
//     clientWidth: container.clientWidth
//   });
  
//   // Check if content width exceeds container width
//   if (container.scrollWidth > container.clientWidth) {
//     console.log('Email overflows container, adding overflow class');
//     container.classList.add('overflow');
//   } else {
//     console.log('Email fits container, removing overflow class');
//     container.classList.remove('overflow');
//   }
// }

// private resetProfileForm(): void {
  //   this.profileForm.reset();
  //   this.isPopupVisible = false;
  // }


  // Working
// async loadProfile(): Promise<void> {
//   // Initial state setup
//   this.isInitialLoad = true;
//   this.loadingComplete = false;
//   this.allImagesLoaded = false;
//   this.imageLoaded = false;
//   this.imageLoadedSuccessfully = false; 
//   this.imageNotFound = false;

//   const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
//   this.userId = UserId;

//   try {
//     // Start preloading avatar
//     this.imagePreloadPromise = this.preloadAllImages();  
      
//     const user: any = await firstValueFrom(this.userService.getUser(this.userId));
    
//     console.log('User data received:', user);
//     this.currentUser = {
//       ...user,
//       paymentFrequency: user.billing
//     };

//     await this.ngZone.run(async () => {
//       try {
//         // Convert Firebase URL to clean URL without token
//         let displayUrl = '';
//         if (this.currentUser.imgUrl) {
//           // Get clean URL without token
//           displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//           this.imageStyles = this.getUpdatedStyles(displayUrl);
//           await this.preloadImage(displayUrl, true);
//         } else {
//           this.imageStyles = this.getUpdatedStyles();
//           this.imageLoaded = true;
//         }

//         // Parse settings
//         if (typeof this.currentUser.profilePictureSettings === 'string') {
//           try {
//             this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
//           } catch (e) {
//             console.error('Error parsing profilePictureSettings:', e);
//             this.currentUser.profilePictureSettings = null;
//           }
//         }

//         // Apply position and zoom settings
//         if (this.currentUser.profilePictureSettings) {
//           this.position = {
//             x: this.currentUser.profilePictureSettings.x || 0,
//             y: this.currentUser.profilePictureSettings.y || 0
//           };
//           this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
//           this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//         } else {
//           this.resetImagePositionAndZoom();
//         }

//         // Update forms with clean URL
//         this.profileForm.patchValue({
//           ...this.currentUser,
//           imgUrl: displayUrl,
//           profilePictureSettings: this.currentUser.profilePictureSettings,
//           isGoogleAuth: this.currentUser.isGoogleAuth
//         });

//         this.pictureForm.patchValue({
//           imgUrl: displayUrl,
//           profilePictureSettings: this.currentUser.profilePictureSettings
//         }, { emitEvent: false });

//         // Rest of your form setup
//         if (this.currentUser.isGoogleAuth) {
//           this.profileForm.get('email')?.disable();
//           this.passwordForm.get('oldPassword')?.disable();
//           this.passwordForm.get('passwordGroup')?.disable();
//         } else {
//           this.profileForm.get('email')?.enable();
//         }

//         await this.updateFormWithUserData();
        
//         // Set user data
//         if (this.currentUser.height) {
//           this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
//         }

//         // Set tier flags
//         if (this.currentUser.tier === 'Just Looking') {
//           this.tierOne = true;
//           this.tierTwo = false;
//           this.tierThree = false;
//         } else if (this.currentUser.tier === 'Motivated') {
//           this.tierOne = false;
//           this.tierTwo = true;
//           this.tierThree = false;
//         } else {
//           this.tierOne = false;
//           this.tierTwo = false;
//           this.tierThree = true;
//         }

//         this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
//         this.freeTier = this.currentUser.tier === 'Just Looking';

//         // Wait for images and update transform
//         await this.imagePreloadPromise;
//         await this.updateImageTransform();

//         const displayName = this.currentUser.name;
//         this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

//       } catch (error) {
//         console.error('Error in loading process:', error);
//       }
//     });

//     // Wait for all images to finish loading
//     await this.imagePreloadPromise;

//     // Set final states
//     this.allImagesLoaded = true;
//     this.finishLoading();
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error loading user profile:', error);
//     this.loadingComplete = true;
//     this.imageLoaded = true;
//     this.cdr.detectChanges();
//   }
// }

// Latest working
// async loadProfile(): Promise<void> {
//   // Initial state setup
//   this.isInitialLoad = true;
//   this.loadingComplete = false;
//   this.allImagesLoaded = false;
//   this.imageLoaded = false;
//   this.imageLoadedSuccessfully = false; 
//   this.imageNotFound = false;

//   const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
//   this.userId = UserId;

//   try {
//     // Start preloading images early
//     // this.imagePreloadPromise = this.preloadAllImages();

//      // 2. Retrieve the URLs from the subject
//      const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//      const loadedUrls = subject?.value?.urls || [];
 
//      // 3. Pass the URLs to preloadAllImages
//      this.imagePreloadPromise = this.preloadAllImages(loadedUrls);

//     // Get user data first
//     const user: any = await firstValueFrom(this.userService.getUser(this.userId));
//     console.log('User data received:', user);
    
//     // Set user data and name immediately
//     this.currentUser = {
//       ...user,
//       paymentFrequency: user.billing
//     };
    
//     const displayName = this.currentUser.name;
//     this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

//     await this.ngZone.run(async () => {
//       try {
//         // Handle image URL and settings first
//         let displayUrl = '';
//         if (this.currentUser.imgUrl) {
//           displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//           this.imageStyles = this.getUpdatedStyles(displayUrl);

//           // Set the current profile image in ImageManagementService
//           this.imageManagementService.setCurrentProfileImage(this.currentUser.imgUrl);
          
//           // Parse and apply profile picture settings
//           if (typeof this.currentUser.profilePictureSettings === 'string') {
//             try {
//               this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
//             } catch (e) {
//               console.error('Error parsing profilePictureSettings:', e);
//               this.currentUser.profilePictureSettings = null;
//             }
//           }

//           // Apply position and zoom settings
//           if (this.currentUser.profilePictureSettings) {
//             this.position = {
//               x: this.currentUser.profilePictureSettings.x || 0,
//               y: this.currentUser.profilePictureSettings.y || 0
//             };
//             this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
            
//             // Apply transforms immediately
//             await this.updateImageTransform();
//           } else {
//             this.resetImagePositionAndZoom();
//           }

//           // Start image preload after transform settings are applied
//           await this.preloadImage(displayUrl, true);
//         } else {
//           this.imageStyles = this.getUpdatedStyles();
//           this.imageLoaded = true;
//         }

//         // Update forms
//         this.profileForm.patchValue({
//           ...this.currentUser,
//           imgUrl: displayUrl,
//           profilePictureSettings: this.currentUser.profilePictureSettings,
//           isGoogleAuth: this.currentUser.isGoogleAuth
//         });

//         this.pictureForm.patchValue({
//           imgUrl: displayUrl,
//           profilePictureSettings: this.currentUser.profilePictureSettings
//         }, { emitEvent: false });

//         // Handle Google Auth state
//         if (this.currentUser.isGoogleAuth) {
//           this.profileForm.get('email')?.disable();
//           this.passwordForm.get('oldPassword')?.disable();
//           this.passwordForm.get('passwordGroup')?.disable();
//         } else {
//           this.profileForm.get('email')?.enable();
//         }

//         await this.updateFormWithUserData();

//         // Set display height
//         if (this.currentUser.height) {
//           this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
//         }

//         // Set tier flags
//         if (this.currentUser.tier === 'Just Looking') {
//           this.tierOne = true;
//           this.tierTwo = false;
//           this.tierThree = false;
//         } else if (this.currentUser.tier === 'Motivated') {
//           this.tierOne = false;
//           this.tierTwo = true;
//           this.tierThree = false;
//         } else {
//           this.tierOne = false;
//           this.tierTwo = false;
//           this.tierThree = true;
//         }

//         this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
//         this.freeTier = this.currentUser.tier === 'Just Looking';

//         // Wait for all images to finish loading
//         await Promise.all([
//           this.imagePreloadPromise,
//           new Promise(resolve => requestAnimationFrame(resolve))
//         ]);

//         // Set final states
//         this.allImagesLoaded = true;
        
//         // Ensure UI is ready before finishing load
//         await new Promise(resolve => requestAnimationFrame(resolve));
//         this.finishLoading();
        
//       } catch (error) {
//         console.error('Error in loading process:', error);
//       }
//     });

//     // Get the count of only permanent storage images
//     const { count } = await this.imageManagementService.getInitialImageCount(this.userId);
//     // Don't include provider URLs in this count
//     const hasProviderProfileImage = this.currentUser?.imgUrl && 
//                                   this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
//     this.onlyFirebaseImageCount = count; // This counts only permanent storage images
//     this.imageCount = hasProviderProfileImage ? count + 1 : count;

//   } catch (error) {
//     console.error('Error loading user profile:', error);
//     this.loadingComplete = true;
//     this.imageLoaded = true;
//     this.cdr.detectChanges();
//   }
// }

// Last working
// async loadProfile(): Promise<void> {
//   // Initial state setup
//   this.isInitialLoad = true;
//   this.loadingComplete = false;
//   this.allImagesLoaded = false;
//   this.imageLoaded = false;
//   this.imageLoadedSuccessfully = false; 
//   this.imageNotFound = false;

//   const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
//   this.userId = UserId;

//   try {
//     // Clear URL cache on load to ensure fresh URLs
//     this.storageService.invalidateUrlCache(this.userId);
    
//     // Retrieve the URLs from the subject
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const loadedUrls = subject?.value?.urls || [];
 
//     // Pass the URLs to preloadAllImages
//     this.imagePreloadPromise = this.preloadAllImages(loadedUrls);

//     // Get user data first
//     const user: any = await firstValueFrom(this.userService.getUser(this.userId));
//     console.log('User data received:', user);
    
//     // Set user data and name immediately
//     this.currentUser = {
//       ...user,
//       paymentFrequency: user.billing
//     };
    
//     const displayName = this.currentUser.name;
//     this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

//     await this.ngZone.run(async () => {
//       try {
//         // Handle image URL and settings first
//         let displayUrl = '';
//         if (this.currentUser.imgUrl) {
//           try {
//             // Convert URL with proper error handling and token refresh
//             displayUrl = await this.convertAndDisplayUrl(this.currentUser.imgUrl);
            
//             // Verify URL works by preloading it with auth
//             await this.preloadImageWithAuth(displayUrl);
            
//             this.imageStyles = this.getUpdatedStyles(displayUrl);

//             // Set the current profile image in ImageManagementService
//             this.imageManagementService.setCurrentProfileImage(this.currentUser.imgUrl);
//           } catch (urlError) {
//             console.error('Error converting URL:', urlError);
//             // Continue with other settings, but we'll reset image later
//           }
          
//           // Parse and apply profile picture settings
//           if (typeof this.currentUser.profilePictureSettings === 'string') {
//             try {
//               this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
//             } catch (e) {
//               console.error('Error parsing profilePictureSettings:', e);
//               this.currentUser.profilePictureSettings = null;
//             }
//           }

//           // Apply position and zoom settings
//           if (this.currentUser.profilePictureSettings) {
//             this.position = {
//               x: this.currentUser.profilePictureSettings.x || 0,
//               y: this.currentUser.profilePictureSettings.y || 0
//             };
//             this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
            
//             // Apply transforms immediately
//             await this.updateImageTransform();
//           } else {
//             this.resetImagePositionAndZoom();
//           }

//           // If we have a valid display URL, update the image display (with auth handling)
//           if (displayUrl) {
//             // Update background directly to ensure it displays
//             await this.updateImageDisplay(displayUrl, true);
//           } else {
//             // If URL conversion failed, reset to avatar
//             this.resetImage();
//           }
//         } else {
//           this.imageStyles = this.getUpdatedStyles();
//           this.imageLoaded = true;
//         }

//         // Update forms
//         this.profileForm.patchValue({
//           ...this.currentUser,
//           imgUrl: displayUrl,
//           profilePictureSettings: this.currentUser.profilePictureSettings,
//           isGoogleAuth: this.currentUser.isGoogleAuth
//         });

//         this.pictureForm.patchValue({
//           imgUrl: displayUrl,
//           profilePictureSettings: this.currentUser.profilePictureSettings
//         }, { emitEvent: false });

//         // Handle Google Auth state
//         if (this.currentUser.isGoogleAuth) {
//           this.profileForm.get('email')?.disable();
//           this.passwordForm.get('oldPassword')?.disable();
//           this.passwordForm.get('passwordGroup')?.disable();
//         } else {
//           this.profileForm.get('email')?.enable();
//         }

//         await this.updateFormWithUserData();

//         // Set display height
//         if (this.currentUser.height) {
//           this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
//         }

//         // Set tier flags
//         if (this.currentUser.tier === 'Just Looking') {
//           this.tierOne = true;
//           this.tierTwo = false;
//           this.tierThree = false;
//         } else if (this.currentUser.tier === 'Motivated') {
//           this.tierOne = false;
//           this.tierTwo = true;
//           this.tierThree = false;
//         } else {
//           this.tierOne = false;
//           this.tierTwo = false;
//           this.tierThree = true;
//         }

//         this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
//         this.freeTier = this.currentUser.tier === 'Just Looking';

//         // Wait for all images to finish loading
//         await Promise.all([
//           this.imagePreloadPromise,
//           new Promise(resolve => requestAnimationFrame(resolve))
//         ]);

//         // Set final states
//         this.allImagesLoaded = true;
        
//         // Ensure UI is ready before finishing load
//         await new Promise(resolve => requestAnimationFrame(resolve));
//         this.finishLoading();
        
//       } catch (error) {
//         console.error('Error in loading process:', error);
//         this.resetImage(); // Ensure fallback to avatar on any errors
//       }
//     });

//     // Get the count of only permanent storage images
//     const { count } = await this.imageManagementService.getInitialImageCount(this.userId);
    
//     this.onlyFirebaseImageCount = count; // This counts only permanent storage images
//     this.imageCount = count;

//   } catch (error) {
//     console.error('Error loading user profile:', error);
//     this.loadingComplete = true;
//     this.imageLoaded = true;
//     this.cdr.detectChanges();
//   }
// }


  // initializePictureForm() {
  //   this.pictureForm = this.fb.group({
  //     imgUrl: new FormControl(
  //       { value: this.currentUser.imgUrl || '', disabled: this.isUploading || this.shouldShowLoadingOverlay },
  //       [Validators.pattern('https?://.+')]
  //     )
  //   });
  // }
  
  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes['isUploading'] || changes['shouldShowLoadingOverlay']) {
  //     this.toggleImageUrlInput();
  //   }
  // }
  
  // toggleImageUrlInput() {
  //   if (this.isUploading || this.shouldShowLoadingOverlay) {
  //     this.pictureForm.get('imgUrl')?.disable();
  //   } else {
  //     this.pictureForm.get('imgUrl')?.enable();
  //   }
  // }


// checkLoadingComplete() {
//   if (this.imageLoaded) {
//     setTimeout(() => {
//       this.loadingComplete = true;
//       this.cdr.detectChanges();
//     }, 500);
//   }
// }
// checkLoadingComplete() {
//   if (this.imageLoaded) {
//     console.log('Images loaded, completing loading state');
//     // Add a small delay to ensure UI updates are complete
//     setTimeout(() => {
//       this.loadingComplete = true;
//       this.cdr.detectChanges();
//     }, 500);
//   } else {
//     console.log('Images not yet loaded');
//   }
// }

// checkLoadingComplete() {
//   if (this.imageLoaded && this.avatarLoaded.getValue() && this.urlImageLoaded.getValue()) {
//     // Image and other assets are loaded, finish loading
//     this.finishLoading();
//   }
// }

 //   private async handleTokenError() {
  //     try {
  //         // Try to refresh token
  //         await this.authService.refreshToken();
  //         // If successful, reload profile
  //         await this.loadProfile();
  //     } catch (error) {
  //         console.error('Failed to refresh token:', error);
  //         this.router.navigate(['/content', this.userId]);
  //     }
  // }

    // private async updateProfileImageUrl(url: string | null): Promise<void> {
  //   try {
  //     if (!url) {
  //       this.profileImageUrl = null;
  //       return;
  //     }

  //     // Convert to proxied URL if needed
  //     const displayUrl = url.includes('firebasestorage.googleapis.com') ?
  //       await this.storageService.convertFirebaseUrl(url) :
  //       url;
      
  //     // Update the form and component state
  //     this.setImageUrl(displayUrl);
  //     this.profileImageUrl = displayUrl;
      
  //     // Trigger image transform update
  //     await this.updateImageTransform();
  //   } catch (error) {
  //     console.error('Error updating profile image URL:', error);
  //   }
  // }

  // Optional: Add helper method for basic URL validation
  // private isValidUrl(url: string): boolean {
  // try {
  //   new URL(url);
  //   return true;
  // } catch {
  //   return false;
  // }
  // }


  // private initializeProfilePictureSettings() {
  //   if (typeof this.currentUser.profilePictureSettings === 'string') {
  //     try {
  //       this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
  //     } catch (e) {
  //       console.error('Error parsing profilePictureSettings:', e);
  //       this.currentUser.profilePictureSettings = {
  //         zoom: 1,
  //         x: 0,
  //         y: 0
  //       };
  //     }
  //   }

  //   // Apply settings if they exist, otherwise use defaults
  //   if (this.currentUser.profilePictureSettings) {
  //     this.position = {
  //       x: this.currentUser.profilePictureSettings.x || 0,
  //       y: this.currentUser.profilePictureSettings.y || 0
  //     };
  //     this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
  //     this.isDragged = this.position.x !== 0 || this.position.y !== 0;

  //     // Update isDefaultPosition based on initial settings
  //     this.isDefaultPosition = this.zoomLevel === 1 && this.position.x === 0 && this.position.y === 0;
  //   } else {
  //     this.resetImagePositionAndZoom();
  //   }
  // }


  // Helper method to check if URL is from a provider
  // private isProviderUrl(url: string): boolean {
  //   if (!url) return false;

  //   const providerDomains = [
  //     'unsplash.com',
  //     'images.unsplash.com',
  //     'pexels.com',
  //     'images.pexels.com',
  //     'pixabay.com'
  //   ];

  //   try {
  //     const urlObj = new URL(url);
  //     return providerDomains.some(domain => urlObj.hostname.includes(domain));
  //   } catch {
  //     return false;
  //   }
  // }



  // debugAnimationState() {
  //   console.log('Debugging animation state:');
  //   console.log('Current state:', this.currentState);
  //   console.log('Is ProfileState.ChangingPicture:', this.currentState === ProfileState.ChangingPicture);
  //   console.log('Controls animated:', this.controlsAnimated);
    
  //   const controls = [
  //     '.dragToCenter', 
  //     '.zoomButtons', 
  //     '.profile-image-navigation', 
  //     '.reset',
  //     '.circular-nav-container'
  //   ];
    
  //   controls.forEach(selector => {
  //     const elements = document.querySelectorAll(selector);
  //     console.log(`Selector: ${selector}, Elements found: ${elements.length}`);
      
  //     elements.forEach((el, i) => {
  //       const classes = Array.from(el.classList).join(', ');
  //       const styles = window.getComputedStyle(el as Element);
  //       console.log(`  Element ${i}: Classes = [${classes}], opacity = ${styles.opacity}, visibility = ${styles.visibility}`);
  //     });
  //   });
  // }

  // getDeleteButtonText(): string {
  //   return this.isInitialChangingPictureState ? 'Delete Picture' : 'Discard Upload/Url';
  // }

    // private isCurrentImageProfilePicture(): boolean {
  //   // Logic to determine if current image is the profile picture
  //   // This might be comparing the current URL with the profile picture URL
  //   // or checking the index, depending on your implementation
  //   return this.currentUser.imgUrl === this.imageStyles['background-image']?.replace('url("', '').replace('")', '');
  // }


  // // Helper method for deleting old images
  // private async deleteOldImage(oldImageUrl: string): Promise<void> {
  //   try {
  //     if (!oldImageUrl || !oldImageUrl.includes('firebasestorage.googleapis.com')) {
  //       return;
  //     }

  //     // Extract the path from the Firebase Storage URL
  //     const urlObj = new URL(oldImageUrl);
  //     const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      
  //     // Create reference to old file
  //     const oldFileRef = ref(storage, path);
      
  //     try {
  //       // Delete the file
  //       await deleteObject(oldFileRef);
  //       console.log('Old image deleted successfully');
  //     } catch (error) {
  //       if ((error as any)?.code === 'storage/object-not-found') {
  //         console.log('Old image already deleted or not found');
  //         return;
  //       }
  //       throw error;
  //     }
  //   } catch (error) {
  //     console.error('Error deleting old image:', error);
  //     throw error;
  //   }
  // }


  // resetImagePositionAndZoom() {
  //   this.position = { x: 0, y: 0 };
  //   this.zoomLevel = 1;
  //   this.isDragged = false;
  //   this.isDefaultPosition = true;
  //   this.updateImageTransform();
  //   this.cdr.detectChanges();
  // }

import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Renderer2, NgZone, Input, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { CartService } from 'src/app/services/cart.service';
import { UserService } from 'src/app/services/user.service';
import { faEye, faEyeSlash, faAngleDown, faPlus, faMinus, faChevronLeft, faChevronRight, faListNumeric} from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, filter, finalize, firstValueFrom, from, fromEvent, of, Subject, Subscription, switchMap, takeUntil, tap, timeout } from 'rxjs';
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
import { AuthService } from 'src/app/services/auth.service';
import { animate, query, state, style, transition, trigger } from '@angular/animations';
import { environment } from 'src/environments/environment';

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

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

interface ProfilePictureSettings {
  zoom: number;
  x: number;
  y: number;
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
      // trigger('slideAnimation', [
      //   // State for current image
      //   state('current', style({
      //     transform: 'translateX(0)'
      //   })),
      //   // State for next image waiting to slide in
      //   state('next', style({
      //     transform: 'translateX(100%)'
      //   })),
      //   // State for current image sliding out
      //   state('slideOutLeft', style({
      //     transform: 'translateX(-100%)'
      //   })),
      //   // State for next image sliding in
      //   state('slideIn', style({
      //     transform: 'translateX(0)'
      //   })),
      //   // Transitions
      //   transition('current => slideOutLeft', [
      //     animate('400ms ease-in-out')
      //   ]),
      //   transition('next => slideIn', [
      //     animate('400ms ease-in-out')
      //   ])
      // ])
      trigger('slideAnimation', [
        // Existing states
        state('current', style({
          transform: 'translateX(0)'
        })),
        state('next', style({
          transform: 'translateX(100%)'
        })),
        state('slideOutLeft', style({
          transform: 'translateX(-100%)'
        })),
        state('slideIn', style({
          transform: 'translateX(0)'
        })),
        // New states for sliding right
        state('slideOutRight', style({
          transform: 'translateX(100%)'
        })),
        state('prev', style({
          transform: 'translateX(-100%)'
        })),
      
        // Existing transitions
        transition('current => slideOutLeft', [
          animate('400ms ease-in-out')
        ]),
        transition('next => slideIn', [
          animate('400ms ease-in-out')
        ]),
        // New transitions for sliding right
        transition('current => slideOutRight', [
          animate('400ms ease-in-out')
        ]),
        transition('prev => slideIn', [
          animate('400ms ease-in-out')
        ])
      ])
  ]
})
//   animations: [
//     trigger('fadeInOut', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('100ms ease-in', style({ opacity: 1 }))
//       ])
//     ]),
//     trigger('fadeInControls', [
//       state('void', style({ 
//         opacity: 0,
//         // pointerEvents: 'none'
//       })),
//       state('visible', style({ 
//         opacity: 0.8,
//         // pointerEvents: 'auto'
//       })),
//       transition('void => visible', [
//         animate('300ms ease-in')
//       ])
//     ]),
//     trigger('fadeInImage', [
//       state('void', style({ 
//         opacity: 0
//       })),
//       state('visible', style({ 
//         opacity: 1
//       })),
//       transition('void => visible', [
//         animate('300ms ease-in')
//       ])
//     ]),
//     trigger('fadeInReset', [
//         transition(':enter', [
//           style({ opacity: 0 }),
//           animate('300ms ease-in', 
//             style({ opacity: '{{finalOpacity}}' })
//           )
//         ])
//       ])
//   ]
// })
  // animations: [
  //   trigger('fadeInOut', [
  //     transition(':enter', [
  //       style({ opacity: 0 }),
  //       animate('100ms ease-in', 
  //         style({ opacity: 1 }))
  //     ])
  //   ]),
  //   trigger('fadeInControls', [
  //     state('void', style({ 
  //       opacity: 0,
  //     })),
  //     state('visible', style({ 
  //       opacity: 0.8,
  //     })),
  //     transition('void => visible', [
  //       animate('300ms ease-in')
  //     ])
  //   ]),
  //   trigger('fadeInImage', [
  //     state('void', style({ 
  //       opacity: 0,
  //     })),
  //     state('visible', style({ 
  //       opacity: 1,
  //     })),
  //     transition('void => visible', [
  //       animate('300ms ease-in')
  //     ])
  //   ]),
  //   trigger('fadeInReset', [
  //     state('void', style({ opacity: 0 })),
  //     state('visible', style({ opacity: '{{finalOpacity}}' }), { params: { finalOpacity: 0.8 }}),
  //     transition('void => visible', [
  //       animate('300ms ease-in')
  //     ])
  //   ])
  // ]

//     trigger('fadeInControls', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('300ms ease-in', 
//           style({ opacity: 1 })
//         )
//       ])
//     ]),
//     trigger('fadeInImage', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('200ms ease-in', 
//           style({ opacity: 1 })
//         )
//       ])
//     ]),
//     trigger('fadeInReset', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('300ms ease-in', 
//           style({ opacity: '{{finalOpacity}}' })
//         )
//       ])
//     ])
//   ]
// })


export class ProfileComponent implements OnInit {

  @ViewChild('container', { static: false }) container!: ElementRef<HTMLElement>;
  
  @ViewChild('profileImg', { static: false, read: ElementRef }) profileImg!: ElementRef<HTMLElement>;

  @ViewChild('urlInput') urlInput!: ElementRef;

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
  imageLoadedSuccessfully = false;
  stagingImageUrl: string | null = null;
  permanentImageUrl: string | null = null;
  isImageStaged: boolean = false;
  isIconHovered = false;
  hoveredButton: string | null = null;
  rightClicked = false;
  leftClicked = false;
  currentImageIndex = 0;
  stagedFileName: string | null = null;
  currentImageUrl: string | null = null;
  private cachedStyles: any = null;
  private readonly MAX_RETRIES = 3;
  private stableImageCount: number = 0;
  private imageTransformCache: {
    url: string;
    styles: any;
  } | null = null;
  imageStyles: any = null;
  private allImagesLoaded = false;
  isImageLoaded = false;
  isZooming = false;
  private isImageUrlChanged = false;
  private originalProfileImage: string | null = null;
  public profileImageUrl: string | null = null;
  onlyFirebaseImageCount: number = 0;
  firebaseImageLoaded: boolean = false;
  controlsAnimationComplete: boolean = false;
  imageAnimationComplete: boolean = false;
  tooltipDisabled = false;
  private convertedUrlCache = new Map<string, string>();
  private isInitialChangingPictureState: boolean = false;
  providerUrlPasted = false;
  private isUploadingOrPasting = false;
  private originalPosition: { x: number; y: number } | null = null;
  private originalZoom: number | null = null;
  hasStartedNavigating = false;
  canHoverDelete: boolean = false;
  hoverCount: number = 0;
  showUploadSuccess: boolean = false;
  isLoadingImages = false;
  private hasFirebaseImages = false;
  private isInitialLoadComplete = false;
  private imageWasDeleted: boolean = false;
  slideDirection: 'left' | 'right' | null = null;
  lastDirection: 'next' | 'prev' | null = null;
  isSliding = false;
  // private readonly ANIMATION_DURATION = 400; // in milliseconds
  private isFirstAnimation = true;
  private animationTimeout: any;
  private transitionTimeout: any;
  // slideState: 'current' | 'slideOutLeft' | 'slideOutRight' | 'slideInLeft' | 'slideInRight' = 'current';
  // isSliding = false;
  // currentBgImage: string | null = null;
  // nextBgImage: string | null = null;
  // currentAnimation: string | null = null;
  // nextImageUrl: string | null = null;
  // private originalImageStyles: any = null;
  // private isNavigationInProgress = false;
  private isNavigating = false;
  // Temporary holders for the old and new images
  oldBackgroundUrl: string | null = null;
  newBackgroundUrl: string | null = null;
  newImageStartingClass = ''; // or 'start-slide-right'
  isSlidingLeft = false; // triggers .slide-left
  isSlidingRight = false;
  xDirection!: string;
  isAnimating: boolean = false;
  showCurrent = true;
  showNext = false;
  currentImageState = 'current';
  nextImageState = 'next';
  // showOldImage = true;
  // showNewImage = true;
    // oldImageStyles!: { [key: string]: any };
    // newImageStyles!: { [key: string]: any };
  // private hasInitializedAnimation = false;
  // private lastDirection: 'left' | 'right' | null = null;
  // private isFirstSlide = true;
  // private previousSlideDirection: 'left' | 'right' | null = null;
  nextImageStyles: any = null;
  isTransitioning = false;
  private ANIMATION_DURATION = 400;
  currentSlideState = 'in';
  nextSlideState = 'outRight';
  // Flags to indicate which direction we are sliding
  
  // isSlidingLeft = false;

  private uploadState: UploadState = {
    isUploading: false,
    imageUrl: null,
    progress: 0,
    error: null
  };

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
  private styleSubscription?: Subscription;
  private imagePreloadPromise: Promise<void> | null = null;
  private urlCache = new Map<string, string>();
  private avatarLoadPromise: Promise<void> | null = null;
  private imageLoadPromises: Map<string, Promise<void>> = new Map();

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
    private authService: AuthService
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
    console.log('Starting Profile initialization');
    this.loadingComplete = false;
    this.imageLoaded = false;
    this.initializePictureForm();
    this.initializeForms();
    this.hoverCount = 0;
    this.showUploadSuccess = false;
    this.initializeLoadingState();
  
    try {
      // Start preloading images immediately
      // this.imagePreloadPromise = this.preloadAllImages();

      const subject = this.imageManagementService.getUserImagesSubject(this.userId);
      const loadedUrls = subject?.value?.urls || [];

      // 3. Start preloading those images
      this.imagePreloadPromise = this.preloadAllImages(loadedUrls);
      
      // Step 1: Check auth token
      console.log('Checking auth token...');
      const token = await Promise.race([
        this.authService.waitForToken(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token timeout')), 5000)
        )
      ]);
  
      if (!token) {
        console.log('No valid token found');
        this.router.navigate(['/content', this.userId]);
        return;
      }
  
      // Step 2: Verify login status
      console.log('Verifying login status...');
      const isLoggedIn = await firstValueFrom(
        this.userService.isloggedIn().pipe(
          timeout(5000),
          tap(status => console.log('Login status:', status))
        )
      );
  
      if (!isLoggedIn) {
        console.log('User not logged in');
        this.router.navigate(['/content', this.userId]);
        return;
      }
  
      // Step 3: Get and validate userId
      console.log('Getting userId from route...');
      const routeUserId = this.actRoute.snapshot.paramMap.get('id');
      if (!routeUserId) {
        console.error('No user ID in route');
        this.router.navigate(['/content', this.userId]);
        return;
      }
  
      this.userId = routeUserId;
  
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

      // Set up image count for image navigation
      // this.imageManagementService.getImageCount(this.userId).subscribe(count => {
      //   console.log('Setting navigation visibility:', {
      //     count,
      //     previousShowNav: this.showImageNavigation
      //   });
      //   this.imageCount = count;
      //   this.showImageNavigation = count > 1;
      // });

      // const initialCount = await this.imageManagementService.getInitialImageCount(this.userId);
      // this.imageCount = initialCount;
      // this.isInitialLoadComplete = true;

      // Check the number of images in firebase folder
      // const { count } = await this.imageManagementService.getInitialImageCount(this.userId);
      // this.imageCount = count;

      // const { count } = await this.imageManagementService.getInitialImageCount(this.userId);
      // // Set image count considering provider URL
      // const hasProviderProfileImage = this.currentUser?.imgUrl && 
      //                               this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
      // this.imageCount = hasProviderProfileImage ? count + 1 : count;
      // this.onlyFirebaseImageCount = count;
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
        console.log('Auth state changed:', user ? `User logged in: ${user.uid}` : 'No user');
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
      console.log('Loading profile...');
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
  
      console.log('Profile initialization completed successfully');

      // Remove later, just for testing
      this.pictureForm.get('imgUrl')?.valueChanges.subscribe(newUrl => {
        console.log('URL changed to:', newUrl);
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
     console.log('Profile image element:', this.profileImg);
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
      console.log('Initial styles set for profile image');
    }
  }

  async ngOnDestroy(): Promise<void> {
    // Cleanup any remaining event listeners to prevent memory leaks
    // this.removeEventListeners();
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
}


  
///// Page Load Functions & Form Related Functions + Other Related Profile Page Functions /////
  // async loadProfile(): Promise<void> {
  //   this.isInitialLoad = true;
  //   this.loadingComplete = false;
  //   this.allImagesLoaded = false;
  //   this.imageLoaded = false;
  //   this.imageLoadedSuccessfully = false; 
  //   this.imageNotFound = false;

  //   const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';

  //   this.userId = UserId;
  //   // const previousTier = this.currentUser.tier;

  //   try {

  //   // Start preloading images immediately
  //   this.imagePreloadPromise = this.preloadAllImages();  
      
  //   const user: any = await firstValueFrom(this.userService.getUser(this.userId));

  //   // this.userService.getUser(this.userId).subscribe(
  //   //   (user: any) => {
  //       // const previousTier = this.currentUser?.tier;
  //       console.log('User data received:', user);
  //       this.currentUser = {
  //         ...user,
  //         paymentFrequency: user.billing
  //       };

  //       // Initialize settings before updating display
  //       this.initializeProfilePictureSettings();

  //       if (this.currentUser.imgUrl) {
  //         const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
  //         this.imageStyles = this.getUpdatedStyles(displayUrl);
  //       } else {
  //         this.imageStyles = this.getUpdatedStyles();
  //       }
  //       // this.stepForm.patchValue({
  //       //   name: this.currentUser.name,
  //       //   email: this.currentUser.email,
  //       //   // ... other fields if necessary
  //       // });
  
  //       // if (this.currentUser.profilePictureSettings) {
  //       //   this.position.x = this.currentUser.profilePictureSettings.x;
  //       //   this.position.y = this.currentUser.profilePictureSettings.y;
  //       //   this.zoomLevel = this.currentUser.profilePictureSettings.zoom;
  //       //   this.updateImageTransform(); // Apply the saved settings
  //       // }
  //       if (typeof this.currentUser.profilePictureSettings === 'string') {
  //         try {
  //           this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
  //         } catch (e) {
  //           console.error('Error parsing profilePictureSettings:', e);
  //           this.currentUser.profilePictureSettings = null;
  //         }
  //       }

  //       if (this.currentUser.profilePictureSettings) {
  //         this.position = {
  //           x: this.currentUser.profilePictureSettings.x || 0,
  //           y: this.currentUser.profilePictureSettings.y || 0
  //         };
  //         this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
  //         this.isDragged = this.position.x !== 0 || this.position.y !== 0;
          
  //         // Apply the saved settings immediately
  //         // this.updateImageTransform();
  //       } else {
  //         this.resetImagePositionAndZoom();
  //       } 

  //     console.log('Profile loaded:', this.currentUser);
  //     console.log('Profile picture settings:', this.currentUser.profilePictureSettings);
      
  //     // Load saved position and zoom level
  //     // if (!this.currentUser.profilePictureSettings) {
  //     //   this.currentUser.profilePictureSettings = {
  //     //     zoom: 1,
  //     //     x: 0,
  //     //     y: 0
  //     //   };
  //     // }

  //     // this.position = {
  //     //   x: this.currentUser.profilePictureSettings.x,
  //     //   y: this.currentUser.profilePictureSettings.y
  //     // };
  //     // this.zoomLevel = this.currentUser.profilePictureSettings.zoom;
  //     // this.isDragged = this.position.x !== 0 || this.position.y !== 0;


  //       // Update the validation status of the controls
  //       this.profileForm.patchValue({
  //         ...this.currentUser,
  //         imgUrl: displayUrl,
  //         profilePictureSettings: this.currentUser.profilePictureSettings,
  //         isGoogleAuth: this.currentUser.isGoogleAuth
  //       });

  //       this.pictureForm.patchValue({
  //         imgUrl: displayUrl,
  //         profilePictureSettings: this.currentUser.profilePictureSettings
  //       }, { emitEvent: false });

  //       if (this.currentUser.isGoogleAuth) {
  //         this.profileForm.get('email')?.disable();
  //         this.passwordForm.get('oldPassword')?.disable();
  //         this.passwordForm.get('passwordGroup')?.disable();
  //       } else {
  //         this.profileForm.get('email')?.enable();
  //       }

  //       // console.log(`goals ${this.currentUser.goals}`);

  //       this.updateFormWithUserData();
  //       // console.log('User loaded:', user);
        
  //       // this.updateTierFlags();

  //       // Check if the tier has changed
  //       // if (previousTier && previousTier !== this.currentUser.tier) {
  //       //   this.resetAnimationFlags();
  //       // }
  //       // else{
  //       //   this.initializeAnimationFlags();
  //       // }

  //       // this.triggerAnimations();

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
  //         // if (this.firstTimeAnimationTierOne) {
  //         //   localStorage.setItem('hasVisitedProfileBeforeTierOne', 'true');
  //         // }
  //       } else if (this.currentUser.tier === 'Motivated') {
  //         this.tierOne = false;
  //         this.tierTwo = true;
  //         this.tierThree = false;
  //         // if (this.firstTimeAnimationTierTwo) {
  //         //   localStorage.setItem('hasVisitedProfileBeforeTierTwo', 'true');
  //         // }
  //       } else {
  //         this.tierOne = false;
  //         this.tierTwo = false;
  //         this.tierThree = true;
  //         // if (this.firstTimeAnimationTierThree) {
  //         //   localStorage.setItem('hasVisitedProfileBeforeTierThree', 'true');
  //         // }
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


  //       // if (user.imgUrl) {
  //       //   this.preloadImage(user.imgUrl);
  //       // } else {
  //       //   // If there's no image URL, consider the image "loaded"
  //       //   this.imageLoaded = true;
  //       //   this.checkLoadingComplete();
  //       // }

  //       // Handle image loading with loading state
  //       if (user.imgUrl) {
  //         this.preloadImage(user.imgUrl); // Pass true for initial loading
  //       } else {
  //         this.preloadImage(null); // Pass true for initial loading
  //         this.imageLoaded = true;
  //         this.checkLoadingComplete();
  //       }

  //       // if (user.imgUrl) {
  //       //   const img = new Image();
  //       //   img.onload = () => {
  //       //     this.imageLoaded = true;
  //       //     this.checkLoadingComplete();
  //       //   };
  //       //   img.onerror = () => {
  //       //     console.error('Error loading image');
  //       //     this.imageLoaded = true;
  //       //     this.checkLoadingComplete();
  //       //   };
  //       //   img.src = user.imgUrl;
  //       // } else {
  //       //   this.imageLoaded = true;
  //       //   this.checkLoadingComplete();
  //       // }

  //       // If it's tier three and first visit, trigger animation
  //       // if (this.tierThree && this.firstTimeAnimationTierThree) {
  //       //   // Small delay to ensure the view is ready
  //       //   setTimeout(() => this.triggerAnimations(), 100);
  //       // }

  //       // Wait for images to finish loading
  //       await this.imagePreloadPromise;
        
  //       // Set loading states
  //       this.allImagesLoaded = true;
  //       this.finishLoading();

  //       // this.loadingComplete = true;
  //       const displayName = this.currentUser.name;
  //       this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

  //       this.updateImageTransform();
  //       this.cdr.detectChanges();
  //     } catch (error) {
  //       console.error('Error loading user profile:', error);
  //       this.loadingComplete = true;
  //       this.imageLoaded = true;
  //       this.cdr.detectChanges();
  //     }
  // }

// Last Working
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
//     // Start preloading images immediately
//     this.imagePreloadPromise = this.preloadAllImages();  
      
//     const user: any = await firstValueFrom(this.userService.getUser(this.userId));
    
//     console.log('User data received:', user);
//     this.currentUser = {
//       ...user,
//       paymentFrequency: user.billing
//     };

//     // Initialize settings before updating display
//     this.initializeProfilePictureSettings();

//     // Handle image URL conversion and styles
//     let displayUrl = '';
//     if (this.currentUser.imgUrl) {
//       displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//       this.imageStyles = this.getUpdatedStyles(displayUrl);
//     } else {
//       this.imageStyles = this.getUpdatedStyles();
//     }

//     // Parse profile picture settings if needed
//     if (typeof this.currentUser.profilePictureSettings === 'string') {
//       try {
//         this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
//       } catch (e) {
//         console.error('Error parsing profilePictureSettings:', e);
//         this.currentUser.profilePictureSettings = null;
//       }
//     }

//     // Apply position and zoom settings
//     if (this.currentUser.profilePictureSettings) {
//       this.position = {
//         x: this.currentUser.profilePictureSettings.x || 0,
//         y: this.currentUser.profilePictureSettings.y || 0
//       };
//       this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
//       this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//     } else {
//       this.resetImagePositionAndZoom();
//     } 

//     console.log('Profile loaded:', this.currentUser);
//     console.log('Profile picture settings:', this.currentUser.profilePictureSettings);
    
//     // if (this.currentUser.imgUrl) {
//     //   // Use preloadImage with isInitialLoad flag
//     //   await this.preloadImage(this.currentUser.imgUrl, true);
//     // } else {
//     //   this.imageLoaded = true;
//     //   this.checkLoadingComplete();
//     // }

//     // Update form controls
//     this.profileForm.patchValue({
//       ...this.currentUser,
//       imgUrl: displayUrl,
//       profilePictureSettings: this.currentUser.profilePictureSettings,
//       isGoogleAuth: this.currentUser.isGoogleAuth
//     });

//     this.pictureForm.patchValue({
//       imgUrl: displayUrl,
//       profilePictureSettings: this.currentUser.profilePictureSettings
//     }, { emitEvent: false });

//     // Handle Google Auth state
//     if (this.currentUser.isGoogleAuth) {
//       this.profileForm.get('email')?.disable();
//       this.passwordForm.get('oldPassword')?.disable();
//       this.passwordForm.get('passwordGroup')?.disable();
//     } else {
//       this.profileForm.get('email')?.enable();
//     }

//     await this.updateFormWithUserData();

//     // Handle height display
//     if (this.currentUser.height) {
//       this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
//     }

//     // Set tier flags
//     if (this.currentUser.tier === 'Just Looking') {
//       this.tierOne = true;
//       this.tierTwo = false;
//       this.tierThree = false;
//     } else if (this.currentUser.tier === 'Motivated') {
//       this.tierOne = false;
//       this.tierTwo = true;
//       this.tierThree = false;
//     } else {
//       this.tierOne = false;
//       this.tierTwo = false;
//       this.tierThree = true;
//     }

//     // Set payment frequency
//     this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
//     this.freeTier = this.currentUser.tier === 'Just Looking';

//     // Handle image loading
//     if (user.imgUrl) {
//       await this.preloadImage(user.imgUrl, true);
//     } else {
//       await this.preloadImage(null, true);
//       this.imageLoaded = true;
//       this.checkLoadingComplete();
//     }

//     // Wait for images to finish loading
//     await this.imagePreloadPromise;
    
//     // Set final states
//     this.allImagesLoaded = true;
//     this.finishLoading();

//     const displayName = this.currentUser.name;
//     this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

//     await this.updateImageTransform();
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error loading user profile:', error);
//     this.loadingComplete = true;
//     this.imageLoaded = true;
//     this.cdr.detectChanges();
//   }
// }


// async loadProfile(): Promise<void> {
//   // Initial state setup
//   this.isInitialLoad = true;
//   this.loadingComplete = false;  // Keep false until everything is loaded
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

//     // Initialize settings before updating display
//     this.initializeProfilePictureSettings();

//     // Create a loading promise to await all loading operations
//     const loadingPromise = new Promise<void>(async (resolve) => {
//       try {
//         // Handle image URL conversion and styles
//         let displayUrl = '';
//         if (this.currentUser.imgUrl) {
//           displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//           this.imageStyles = this.getUpdatedStyles(displayUrl);

//           // Wait for image to preload
//           await this.preloadImage(displayUrl, true);
//         } else {
//           this.imageStyles = this.getUpdatedStyles();
//           this.imageLoaded = true;
//         }

//         // Parse profile picture settings if needed
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

//         // Update form controls with converted URL
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

//         // Handle height display
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

//         // Set payment frequency
//         this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
//         this.freeTier = this.currentUser.tier === 'Just Looking';

//         // Wait for all images to finish loading
//         await this.imagePreloadPromise;
        
//         // Update image transform before completing
//         await this.updateImageTransform();

//         // Set name
//         const displayName = this.currentUser.name;
//         this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

//         resolve();
//       } catch (error) {
//         console.error('Error in loading process:', error);
//         resolve(); // Resolve anyway to prevent hanging
//       }
//     });

//     // Wait for everything to load before setting final states
//     await loadingPromise;
    
//     // Only set these after everything is loaded
//     this.allImagesLoaded = true;
//     this.finishLoading(); // This will set loadingComplete to true

//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error loading user profile:', error);
//     this.loadingComplete = true;
//     this.imageLoaded = true;
//     this.cdr.detectChanges();
//   }
// }

// Latest Working
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

async loadProfile(): Promise<void> {
  // Initial state setup
  this.isInitialLoad = true;
  this.loadingComplete = false;
  this.allImagesLoaded = false;
  this.imageLoaded = false;
  this.imageLoadedSuccessfully = false; 
  this.imageNotFound = false;

  const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
  this.userId = UserId;

  try {
    // Start preloading images early
    // this.imagePreloadPromise = this.preloadAllImages();

     // 2. Retrieve the URLs from the subject
     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
     const loadedUrls = subject?.value?.urls || [];
 
     // 3. Pass the URLs to preloadAllImages
     this.imagePreloadPromise = this.preloadAllImages(loadedUrls);

    // Get user data first
    const user: any = await firstValueFrom(this.userService.getUser(this.userId));
    console.log('User data received:', user);
    
    // Set user data and name immediately
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
          displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
          this.imageStyles = this.getUpdatedStyles(displayUrl);

          // Set the current profile image in ImageManagementService
          this.imageManagementService.setCurrentProfileImage(this.currentUser.imgUrl);
          
          // Parse and apply profile picture settings
          if (typeof this.currentUser.profilePictureSettings === 'string') {
            try {
              this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
            } catch (e) {
              console.error('Error parsing profilePictureSettings:', e);
              this.currentUser.profilePictureSettings = null;
            }
          }

          // Apply position and zoom settings
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

          // Start image preload after transform settings are applied
          await this.preloadImage(displayUrl, true);
        } else {
          this.imageStyles = this.getUpdatedStyles();
          this.imageLoaded = true;
        }

        // Update forms
        this.profileForm.patchValue({
          ...this.currentUser,
          imgUrl: displayUrl,
          profilePictureSettings: this.currentUser.profilePictureSettings,
          isGoogleAuth: this.currentUser.isGoogleAuth
        });

        this.pictureForm.patchValue({
          imgUrl: displayUrl,
          profilePictureSettings: this.currentUser.profilePictureSettings
        }, { emitEvent: false });

        // Handle Google Auth state
        if (this.currentUser.isGoogleAuth) {
          this.profileForm.get('email')?.disable();
          this.passwordForm.get('oldPassword')?.disable();
          this.passwordForm.get('passwordGroup')?.disable();
        } else {
          this.profileForm.get('email')?.enable();
        }

        await this.updateFormWithUserData();

        // Set display height
        if (this.currentUser.height) {
          this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
        }

        // Set tier flags
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

        // Wait for all images to finish loading
        await Promise.all([
          this.imagePreloadPromise,
          new Promise(resolve => requestAnimationFrame(resolve))
        ]);

        // Set final states
        this.allImagesLoaded = true;
        
        // Ensure UI is ready before finishing load
        await new Promise(resolve => requestAnimationFrame(resolve));
        this.finishLoading();
        
      } catch (error) {
        console.error('Error in loading process:', error);
      }
    });

    // Get the count of only permanent storage images
    const { count } = await this.imageManagementService.getInitialImageCount(this.userId);
    // Don't include provider URLs in this count
    const hasProviderProfileImage = this.currentUser?.imgUrl && 
                                  this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
    this.onlyFirebaseImageCount = count; // This counts only permanent storage images
    this.imageCount = hasProviderProfileImage ? count + 1 : count;

  } catch (error) {
    console.error('Error loading user profile:', error);
    this.loadingComplete = true;
    this.imageLoaded = true;
    this.cdr.detectChanges();
  }
}

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
//     // Start preloading images immediately
//     this.imagePreloadPromise = this.preloadAllImages();  
      
//     const user: any = await firstValueFrom(this.userService.getUser(this.userId));
    
//     console.log('User data received:', user);
//     this.currentUser = {
//       ...user,
//       paymentFrequency: user.billing
//     };

//     // Initialize settings before updating display
//     this.initializeProfilePictureSettings();

//     // Handle image URL conversion and styles
//     let displayUrl = '';
//     if (this.currentUser.imgUrl) {
//       // Convert to API URL first
//       displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//       this.imageStyles = this.getUpdatedStyles(displayUrl);

//       // Preload image with converted URL before updating forms
//       await this.preloadImage(displayUrl, true);
//     } else {
//       this.imageStyles = this.getUpdatedStyles();
//       this.imageLoaded = true;
//       this.checkLoadingComplete();
//     }

//     // Parse profile picture settings if needed
//     if (typeof this.currentUser.profilePictureSettings === 'string') {
//       try {
//         this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
//       } catch (e) {
//         console.error('Error parsing profilePictureSettings:', e);
//         this.currentUser.profilePictureSettings = null;
//       }
//     }

//     // Apply position and zoom settings
//     if (this.currentUser.profilePictureSettings) {
//       this.position = {
//         x: this.currentUser.profilePictureSettings.x || 0,
//         y: this.currentUser.profilePictureSettings.y || 0
//       };
//       this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
//       this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//     } else {
//       this.resetImagePositionAndZoom();
//     } 

//     console.log('Profile loaded:', this.currentUser);
//     console.log('Profile picture settings:', this.currentUser.profilePictureSettings);

//     // Update form controls with converted URL
//     this.profileForm.patchValue({
//       ...this.currentUser,
//       imgUrl: displayUrl,
//       profilePictureSettings: this.currentUser.profilePictureSettings,
//       isGoogleAuth: this.currentUser.isGoogleAuth
//     });

//     this.pictureForm.patchValue({
//       imgUrl: displayUrl,
//       profilePictureSettings: this.currentUser.profilePictureSettings
//     }, { emitEvent: false });

//     // Handle Google Auth state
//     if (this.currentUser.isGoogleAuth) {
//       this.profileForm.get('email')?.disable();
//       this.passwordForm.get('oldPassword')?.disable();
//       this.passwordForm.get('passwordGroup')?.disable();
//     } else {
//       this.profileForm.get('email')?.enable();
//     }

//     await this.updateFormWithUserData();

//     // Handle height display
//     if (this.currentUser.height) {
//       this.displayHeight = this.formatHeightForDisplay(this.currentUser.height);
//     }

//     // Set tier flags
//     if (this.currentUser.tier === 'Just Looking') {
//       this.tierOne = true;
//       this.tierTwo = false;
//       this.tierThree = false;
//     } else if (this.currentUser.tier === 'Motivated') {
//       this.tierOne = false;
//       this.tierTwo = true;
//       this.tierThree = false;
//     } else {
//       this.tierOne = false;
//       this.tierTwo = false;
//       this.tierThree = true;
//     }

//     // Set payment frequency
//     this.monthOrYear = this.currentUser.paymentFrequency === 'monthly' ? 'month' : 'year';
//     this.freeTier = this.currentUser.tier === 'Just Looking';

//     // Wait for images to finish loading
//     await this.imagePreloadPromise;
    
//     // Set final states
//     this.allImagesLoaded = true;
//     this.finishLoading();

//     const displayName = this.currentUser.name;
//     this.firstName = displayName?.split(' ').slice(0, 1).join(' ');

//     await this.updateImageTransform();
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error loading user profile:', error);
//     this.loadingComplete = true;
//     this.imageLoaded = true;
//     this.cdr.detectChanges();
//   }
// }

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

  private async handleTokenError() {
    try {
        // Try to refresh token
        await this.authService.refreshToken();
        // If successful, reload profile
        await this.loadProfile();
    } catch (error) {
        console.error('Failed to refresh token:', error);
        this.router.navigate(['/content', this.userId]);
    }
}

  updateFormWithUserData(): void {
    const displayUrl = this.currentUser.imgUrl ? 
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

// Update checkLoadingComplete to be more strict
private checkLoadingComplete(): void {
  const allLoaded = this.imageLoaded && 
                   this.avatarLoaded.getValue() && 
                   this.urlImageLoaded.getValue() &&
                   this.allImagesLoaded;
                   
  if (allLoaded) {
    console.log('All images loaded, completing loading state');
    this.finishLoading();
  } else {
    console.log('Still waiting for assets:', {
      imageLoaded: this.imageLoaded,
      avatarLoaded: this.avatarLoaded.getValue(),
      urlImageLoaded: this.urlImageLoaded.getValue(),
      allImagesLoaded: this.allImagesLoaded
    });
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

// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     // Clean up any staged files
//     const userId = this.userService.getUserId();
//      // Only attempt cleanup if we have both a userId and a staged file
//      if (userId && this.firebaseService.hasStagedFile(userId)) {
//       await this.firebaseService.cleanupStagedFile(userId);
//       this.imageUrlManager.clearStagedFile(userId);
//     }
   
//   if (this.isProcessingGoodbye) return;
  
//   this.currentState = ProfileState.Viewing;

//   // Reset password form and clear all errors
//   this.passwordForm.reset();
//   Object.keys(this.passwordForm.controls).forEach(key => {
//     const control = this.passwordForm.get(key);
//     control?.setErrors(null);
//     control?.updateValueAndValidity();
//   });

//   // Specifically reset the old password control
//   const oldPasswordControl = this.passwordForm.get('oldPassword');
//   if (oldPasswordControl) {
//     oldPasswordControl.setErrors(null);
//     oldPasswordControl.updateValueAndValidity();
//   }

//   // Reset profile form
//   this.profileForm.reset();

//   // Reset password group
//   this.passwordGroup.reset();
//   this.passwordGroup.disable();

//   // Clear custom error flags
//   this.authenticating = false;
//   this.oldPasswordError = '';
//   this.isOldPasswordCorrect = false;
//   this.isWaitingToCheck = false;

//   // Reset any other custom states
//   this.passwordMismatch = false;
//   this.isPopupVisible = false;
//     // Reset state
//     this.currentState = ProfileState.Viewing;
//     this.resetImagePositionAndZoomToSaved();
//     this.reloadProfile();
//     // Trigger change detection
//     this.cdr.detectChanges();

//     this.resetPasswordForm();
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//   }
// }




// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     // Store current user ID
//     const userId = this.userService.getUserId();
    
//     // Only attempt cleanup if we have both a userId and a staged file
//     if (userId && this.firebaseService.hasStagedFile(userId)) {
//       await this.firebaseService.cleanupStagedFile(userId);
//       this.imageUrlManager.clearStagedFile(userId);
//     }

//     // Reset state before form handling
//     this.currentState = ProfileState.Viewing;

//     // Ensure we restore the previous profile image URL
//     const originalProfileUrl = await this.storageService.generateImageUrl(
//       userId,
//       this.originalProfileImage || ''
//     );

//     // Update image URL in state
//     await this.updateProfileImageUrl(originalProfileUrl);

//     // Handle password form reset
//     this.resetPasswordForm();

//     // Reset profile form and position
//     this.resetProfileForm();
//     this.resetImagePositionAndZoomToSaved();
    
//     // Reload profile after state reset
//     await this.reloadProfile();

//     // Final UI updates
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     // Even if there's an error, ensure we reset the state
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }


// resetPasswordForm(): void {
//   this.passwordForm.reset();
//   Object.keys(this.passwordForm.controls).forEach(key => {
//     const control = this.passwordForm.get(key);
//     control?.setErrors(null);
//     control?.updateValueAndValidity();
//   });
//   this.passwordGroup.reset();
//   this.passwordGroup.disable();
//   this.authenticating = false;
//   this.oldPasswordError = '';
//   this.isOldPasswordCorrect = false;
//   this.isWaitingToCheck = false;
//   this.passwordMismatch = false;
  
// }


// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
    
//     // Cleanup staged file if exists
//     if (userId && this.firebaseService.hasStagedFile(userId)) {
//       await this.firebaseService.cleanupStagedFile(userId);
//       this.imageUrlManager.clearStagedFile(userId);
//     }

//     // Reset to original URL
//     if (this.originalProfileImage) {
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
//       this.setImageUrl(displayUrl);
//     }

//     // Reset state
//     this.currentState = ProfileState.Viewing;

//     // Update transform with original settings
//     await this.updateImageTransform();

//     // Reset forms and position
//     this.resetPasswordForm();
//     this.resetProfileForm();
//     this.resetImagePositionAndZoomToSaved();
    
//     // Reload profile
//     await this.reloadProfile();

//     // Update view
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
    
//     // Cleanup staged file if exists
//     if (userId && this.firebaseService.hasStagedFile(userId)) {
//       await this.firebaseService.cleanupStagedFile(userId);
//       this.imageUrlManager.clearStagedFile(userId);
//     }

//     // Reset to original URL using updateProfileImageUrl if it exists
//     // if (this.originalProfileImage) {
//     //   await this.updateProfileImageUrl(this.originalProfileImage);
//     // } else {
//     //   // Handle case where there was no original image
//     //   await this.updateProfileImageUrl(null);
//     // }

//     // Reset to original URL if it exists
//     if (this.originalProfileImage) {
//       this.ngZone.run(() => {
//         this.pictureForm.patchValue({
//           imgUrl: this.originalProfileImage
//         }, { emitEvent: false });
        
//         this.profileImageUrl = this.originalProfileImage;
        
//         // Update transform
//         this.updateImageTransform();
//       });
//     }

//     // Reset state
//     this.currentState = ProfileState.Viewing;

//     // Reset forms and position
//     this.resetPasswordForm();
//     this.resetProfileForm();
//     this.resetImagePositionAndZoomToSaved();
    
//     // Reload profile
//     // await this.reloadProfile();

//     // Update view
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
    
//     // Cleanup staged file if exists
//     if (userId && this.firebaseService.hasStagedFile(userId)) {
//       await this.firebaseService.cleanupStagedFile(userId);
//       this.imageUrlManager.clearStagedFile(userId);
//     }

//     this.ngZone.run(async () => {
//       // Restore original image if it exists
//       if (this.originalProfileImage) {
//         // Convert original URL if needed
//         let displayUrl = this.originalProfileImage;
//         if (displayUrl.includes('firebasestorage.googleapis.com')) {
//           displayUrl = await this.storageService.convertFirebaseUrl(displayUrl);
//         }

//         // Set flag to ensure image updates
//         this.isImageUrlChanged = true;

//         // Update form with original URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });

//         // Restore original styles if they exist
//         if (this.originalImageStyles) {
//           this.imageStyles = { ...this.originalImageStyles };
//         }

//         // Update the transform to show original image
//         await this.updateImageTransform();
//       }

//       // Reset state and forms
//       this.currentState = ProfileState.Viewing;
//       this.resetPasswordForm();
//       this.resetProfileForm();
      
//       // Reset position and zoom to saved values
//       this.resetImagePositionAndZoomToSaved();
      
//       // Ensure loading states are reset
//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;

//       // Update view
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.ngZone.run(() => {
//       this.currentState = ProfileState.Viewing;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
    
//     // Cleanup staged file if exists
//     if (userId && this.firebaseService.hasStagedFile(userId)) {
//       await this.firebaseService.cleanupStagedFile(userId);
//       this.imageUrlManager.clearStagedFile(userId);
//     }

//     // Get current user image URL
//     let currentUrl = this.currentUser?.imgUrl;
//     if (currentUrl && !currentUrl.startsWith('http')) {
//       currentUrl = await this.storageService.convertFirebaseUrl(currentUrl);
//     }

//     this.ngZone.run(() => {
//       if (currentUrl) {
//         // Set flag to force image update
//         this.isImageUrlChanged = true;
        
//         // Update form with full URL
//         this.pictureForm.patchValue({
//           imgUrl: currentUrl
//         }, { emitEvent: false });
//       }

//       // Reset to viewing state
//       this.currentState = ProfileState.Viewing;
      
//       // Reset forms and position
//       this.resetPasswordForm();
//       this.resetProfileForm();
//       this.resetImagePositionAndZoomToSaved();

//       // Ensure loading states are reset
//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;
      
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.ngZone.run(() => {
//       this.currentState = ProfileState.Viewing;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
    
//     // Cleanup staged file if exists
//     if (userId && this.firebaseService.hasStagedFile(userId)) {
//       await this.firebaseService.cleanupStagedFile(userId);
//       this.imageUrlManager.clearStagedFile(userId);
//     }

//     this.ngZone.run(async () => {
//       // Get current saved image URL from user
//       if (this.currentUser?.imgUrl) {
//         // Force image update by setting flag
//         this.isImageUrlChanged = true;
        
//         let displayUrl = this.currentUser.imgUrl;
//         if (displayUrl.includes('firebasestorage.googleapis.com')) {
//           displayUrl = await this.storageService.convertFirebaseUrl(displayUrl);
//         }

//         // Update form with original URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });
//       }

//       // Reset state
//       this.currentState = ProfileState.Viewing;
      
//       // Reset forms
//       this.resetPasswordForm();
//       this.resetProfileForm();
      
//       // Reset position and force update
//       this.resetImagePositionAndZoomToSaved();
      
//       // Force immediate update
//       this.isImageUrlChanged = true;
//       await this.updateImageTransform();
      
//       // Reset loading states
//       this.imageLoadedSuccessfully = true;
//       this.imageNotFound = false;

//       // Update view
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.ngZone.run(() => {
//       this.currentState = ProfileState.Viewing;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
    

//     this.ngZone.run(async () => {
//       // Restore original image if it exists
//       if (this.originalProfileImage) {
//         // Convert to display URL
//         const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
        
//         // Update form
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });
        
//         // Update image display
//         if (this.profileImg?.nativeElement) {
//           this.imageStyles = {
//             'background-image': `url("${displayUrl}")`,
//             'background-position': '0% 0%',
//             'background-repeat': 'no-repeat',
//             'background-size': '100%',
//             'background-color': '#c7ff20'
//           };
          
//           Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//         }

//         // Update states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.currentUser.imgUrl = this.originalProfileImage;
//       }

//       // Reset state
//       this.currentState = ProfileState.Viewing;
      
//       // Reset position and zoom to original
//       if (this.originalImageStyles) {
//         this.imageStyles = { ...this.originalImageStyles };
//       }
      
//       this.resetImagePositionAndZoomToSaved();
      
//       // Force update
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// working
// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('No user ID available');

//     this.ngZone.run(async () => {
//       try {
//         // Start loading state
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//         }

//         // First cleanup staged file if exists
//         if (this.firebaseService.hasStagedFile(userId)) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // Restore original image if it exists
//         if (this.originalProfileImage) {
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           // Update form
//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });
          
//           // Update image states
//           this.imageLoadedSuccessfully = true;
//           this.imageNotFound = false;
//           this.currentUser.imgUrl = this.originalProfileImage;

//           // Update image display
//           if (this.profileImg?.nativeElement) {
//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': '0% 0%',
//               'background-repeat': 'no-repeat',
//               'background-size': '100%',
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }
//         }

//         // Reset state and settings
//         this.currentState = ProfileState.Viewing;
//         this.resetImagePositionAndZoomToSaved();
        
//         // Clear staged image URL from cache
//         this.storageService.clearStagedUrlCache(userId);

//       } finally {
//         // Remove loading state
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     // Ensure we still reset state on error
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// async cancelAction(): Promise<void> {
//   if (this.isProcessingGoodbye) return;
  
//   try {
//     const userId = this.userService.getUserId();
//     if (!userId) {
//       console.error('No userId available for cleanup');
//       return;
//     }

//     console.log('Starting cancel action, userId:', userId);

//     // Check both services for staged files
//     const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//     const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//     console.log('Staged file status:', {
//       imageUrlManager: hasStagedFileUrl,
//       firebaseService: hasStagedFileFirebase
//     });

//     if (hasStagedFileUrl || hasStagedFileFirebase) {
//       try {
//         // Get staged file info before cleanup
//         const stagedFile = this.imageUrlManager.getStagedFile(userId);
//         console.log('Staged file to cleanup:', stagedFile);

//         // Cleanup Firebase storage
//         await this.firebaseService.cleanupStagedFile(userId);
        
//         // Clear local tracking
//         this.imageUrlManager.clearStagedFile(userId);
        
//         console.log('Staged file cleanup completed');
//       } catch (cleanupError) {
//         console.error('Error during staged file cleanup:', cleanupError);
//       }
//     }

//     // Restore original image
//     if (this.originalProfileImage) {
//       await this.ngZone.run(async () => {
//         try {
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage!);
          
//           console.log('Restoring original image:', {
//             original: this.originalProfileImage,
//             display: displayUrl
//           });

//           // Update form
//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });

//           // Update states
//           this.imageLoadedSuccessfully = true;
//           this.imageNotFound = false;
//           this.currentUser.imgUrl = this.originalProfileImage;

//           // Update display
//           await this.updateImageTransform();
          
//           console.log('Original image restored');
//         } catch (error) {
//           console.error('Error restoring original image:', error);
//         }
//       });
//     }

//     // Reset states
//     this.currentState = ProfileState.Viewing;
//     this.resetImagePositionAndZoomToSaved();
//     this.storageService.clearStagedUrlCache(userId);
    
//     this.cdr.detectChanges();

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }



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
//         // Start loading state
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//         }

//         // Check both services for staged files
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         console.log('Staged file status:', {
//           imageUrlManager: hasStagedFileUrl,
//           firebaseService: hasStagedFileFirebase
//         });

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           try {
//             const stagedFile = this.imageUrlManager.getStagedFile(userId);
//             console.log('Staged file to cleanup:', stagedFile);

//             await this.firebaseService.cleanupStagedFile(userId);
//             this.imageUrlManager.clearStagedFile(userId);
            
//             console.log('Staged file cleanup completed');
//           } catch (cleanupError) {
//             console.error('Error during staged file cleanup:', cleanupError);
//           }
//         }

//         // Restore original image if it exists
//         if (this.originalProfileImage) {
//           try {
//             const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
            
//             console.log('Restoring original image:', {
//               original: this.originalProfileImage,
//               display: displayUrl
//             });

//             // Update form
//             this.pictureForm.patchValue({
//               imgUrl: displayUrl
//             }, { emitEvent: false });
            
//             // Update states
//             this.imageLoadedSuccessfully = true;
//             this.imageNotFound = false;
//             this.currentUser.imgUrl = this.originalProfileImage;

//             // Update image display with immediate style application
//             if (this.profileImg?.nativeElement) {
//               this.imageStyles = {
//                 'background-image': `url("${displayUrl}")`,
//                 'background-position': '0% 0%',
//                 'background-repeat': 'no-repeat',
//                 'background-size': '100%',
//                 'background-color': '#c7ff20'
//               };
              
//               Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//             }
            
//             // Update transform after styles are applied
//             await this.updateImageTransform();
            
//             console.log('Original image restored');
//           } catch (error) {
//             console.error('Error restoring original image:', error);
//           }
//         }

//         // Reset state and settings
//         this.currentState = ProfileState.Viewing;
//         this.resetImagePositionAndZoomToSaved();
//         this.storageService.clearStagedUrlCache(userId);

//       } finally {
//         // Remove loading state
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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
//         // Start loading state
//         if (this.profileImg?.nativeElement) {
//           this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           try {
//             await this.firebaseService.cleanupStagedFile(userId);
//             this.imageUrlManager.clearStagedFile(userId);
//           } catch (cleanupError) {
//             console.error('Error during staged file cleanup:', cleanupError);
//           }
//         }

//         // Restore original image and its transforms
//         if (this.originalProfileImage) {
//           try {
//             const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
            
//             // First restore the original position and zoom
//             if (this.currentUser.profilePictureSettings) {
//               this.position = {
//                 x: this.currentUser.profilePictureSettings.x || 0,
//                 y: this.currentUser.profilePictureSettings.y || 0
//               };
//               this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
//               this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             } else {
//               // Reset to defaults if no settings exist
//               this.position = { x: 0, y: 0 };
//               this.zoomLevel = 1;
//               this.isDragged = false;
//             }

//             // Update form and current user
//             this.pictureForm.patchValue({
//               imgUrl: displayUrl
//             }, { emitEvent: false });
            
//             this.currentUser.imgUrl = this.originalProfileImage;
            
//             // Update image styles with restored position and zoom
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

//             // Update states
//             this.imageLoadedSuccessfully = true;
//             this.imageNotFound = false;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;

//             await this.updateImageTransform();
//             console.log('Original image and transforms restored:', {
//               position: this.position,
//               zoom: this.zoomLevel,
//               isDragged: this.isDragged
//             });
//           } catch (error) {
//             console.error('Error restoring original image:', error);
//           }
//         }

//         // Reset state
//         this.currentState = ProfileState.Viewing;
//         this.storageService.clearStagedUrlCache(userId);

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

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
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // Restore original image and transforms
//         if (this.originalProfileImage) {
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           // Restore original position and zoom
//           if (this.originalPosition && this.originalZoom !== null) {
//             console.log('Restoring original transforms:', {
//               position: this.originalPosition,
//               zoom: this.originalZoom
//             });
            
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           // Update form and current user
//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });
          
//           this.currentUser.imgUrl = this.originalProfileImage;
          
//           // Apply restored transforms
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

//         // Reset state
//         this.currentState = ProfileState.Viewing;
        
//         // Clear stored originals
//         this.originalPosition = null;
//         this.originalZoom = null;
        
//         this.storageService.clearStagedUrlCache(userId);
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URL when canceling
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         let needsDatabaseUpdate = false;

//         // Restore original image and verify it exists
//         if (this.originalProfileImage) {
//           try {
//             const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
            
//             // Verify the image is still accessible
//             const headers = await this.storageService.getAuthHeaders();
//             const response = await fetch(displayUrl, { 
//               method: 'HEAD',
//               headers 
//             });

//             if (!response.ok) {
//               // Original image was deleted, need to update database
//               needsDatabaseUpdate = true;
//               throw new Error('Original image no longer exists');
//             }

//             // Restore original position and zoom
//             if (this.originalPosition && this.originalZoom !== null) {
//               console.log('Restoring original transforms:', {
//                 position: this.originalPosition,
//                 zoom: this.originalZoom
//               });
              
//               this.position = { ...this.originalPosition };
//               this.zoomLevel = this.originalZoom;
//               this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//               this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//             }

//             // Update form and current user
//             this.pictureForm.patchValue({
//               imgUrl: displayUrl
//             }, { emitEvent: false });
            
//             this.currentUser.imgUrl = this.originalProfileImage;
            
//             // Apply restored transforms
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

//             await this.updateImageTransform();
//           } catch (error) {
//             // Original image doesn't exist or isn't accessible, show avatar
//             console.log('Original image not accessible, showing avatar');
//             this.currentUser.imgUrl = null;
//             this.resetImage();
//             this.imageNotFound = false;
//             needsDatabaseUpdate = true;
//           }
//         } else {
//           // No original image, show avatar
//           this.currentUser.imgUrl = null;
//           this.resetImage();
//           this.imageNotFound = false;
//           needsDatabaseUpdate = true;
//         }

//         // Update database if needed
//         if (needsDatabaseUpdate) {
//           const updatedUser = {
//             ...this.currentUser,
//             imgUrl: null,
//             profilePictureSettings: null
//           };
//           await firstValueFrom(this.userService.updateUser(updatedUser));
//         }

//         // Reset state
//         this.currentState = ProfileState.Viewing;
        
//         // Clear stored originals
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URL when canceling
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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
//         }

//         // Cleanup staged files
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // If original profile image is null, it means we're canceling after a deletion
//         if (this.originalProfileImage === null) {
//           // Update database to null and show avatar
//           const updatedUser = {
//             ...this.currentUser,
//             imgUrl: null,
//             profilePictureSettings: null
//           };
//           await firstValueFrom(this.userService.updateUser(updatedUser));

//           this.currentUser.imgUrl = null;
//           this.resetImage();
//           this.imageNotFound = false;
//         } else if (this.originalProfileImage) {
//           try {
//             // Verify original image still exists
//             const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
//             const headers = await this.storageService.getAuthHeaders();
//             const response = await fetch(displayUrl, { headers, method: 'HEAD' });

//             if (!response.ok) {
//               throw new Error('Original image no longer exists');
//             }

//             // Restore original image and settings
//             this.currentUser.imgUrl = this.originalProfileImage;
//             if (this.originalPosition && this.originalZoom !== null) {
//               this.position = { ...this.originalPosition };
//               this.zoomLevel = this.originalZoom;
//               this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//               this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//             }

//             await this.updateImageTransform();
//           } catch (error) {
//             // Original image not accessible, update database and show avatar
//             const updatedUser = {
//               ...this.currentUser,
//               imgUrl: null,
//               profilePictureSettings: null
//             };
//             await firstValueFrom(this.userService.updateUser(updatedUser));

//             this.currentUser.imgUrl = null;
//             this.resetImage();
//             this.imageNotFound = false;
//           }
//         }

//         // Reset states
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URLs
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // If an image was deleted, show avatar and update database
//         if (this.imageWasDeleted || this.originalProfileImage === null) {
//           await this.updateDatabaseToNull();
//           this.currentUser.imgUrl = null;
//           this.resetImage();
//           this.imageNotFound = false;
//         }
//         // Otherwise restore original image if it exists
//         else if (this.originalProfileImage) {
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           // Restore original position and zoom
//           if (this.originalPosition && this.originalZoom !== null) {
//             console.log('Restoring original transforms:', {
//               position: this.originalPosition,
//               zoom: this.originalZoom
//             });
            
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           // Update form and current user
//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });
          
//           this.currentUser.imgUrl = this.originalProfileImage;
          
//           // Apply restored transforms
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
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.imageWasDeleted = false;
//         this.storageService.clearStagedUrlCache(userId);
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URL when canceling
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // If we've deleted the profile image, ensure avatar is shown
//         if (this.originalProfileImage === null || this.currentUser.imgUrl === null) {
//           // Force update database to null if not already
//           const updatedUser = {
//             ...this.currentUser,
//             imgUrl: null,
//             profilePictureSettings: null
//           };
//           await firstValueFrom(this.userService.updateUser(updatedUser));
          
//           this.currentUser.imgUrl = null;
//           this.resetImage();
//           this.imageNotFound = false;
//         } else if (this.originalProfileImage) {
//           try {
//             const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
            
//             // Restore original position and zoom
//             if (this.originalPosition && this.originalZoom !== null) {
//               console.log('Restoring original transforms:', {
//                 position: this.originalPosition,
//                 zoom: this.originalZoom
//               });
              
//               this.position = { ...this.originalPosition };
//               this.zoomLevel = this.originalZoom;
//               this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//               this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//             }

//             // Update form and current user
//             this.pictureForm.patchValue({
//               imgUrl: displayUrl
//             }, { emitEvent: false });
            
//             this.currentUser.imgUrl = this.originalProfileImage;
            
//             // Apply restored transforms
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

//             await this.updateImageTransform();
//           } catch (error) {
//             // If original image can't be loaded, show avatar
//             const updatedUser = {
//               ...this.currentUser,
//               imgUrl: null,
//               profilePictureSettings: null
//             };
//             await firstValueFrom(this.userService.updateUser(updatedUser));

//             this.currentUser.imgUrl = null;
//             this.resetImage();
//             this.imageNotFound = false;
//           }
//         }

//         // Reset state
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URL when canceling
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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
//         }

//         // Handle staged files cleanup
//         const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
//         const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

//         if (hasStagedFileUrl || hasStagedFileFirebase) {
//           await this.firebaseService.cleanupStagedFile(userId);
//           this.imageUrlManager.clearStagedFile(userId);
//         }

//         // If original was deleted, show avatar and update database
//         if (this.originalProfileImage === null) {
//           // Update database to null
//           const updatedUser = {
//             ...this.currentUser,
//             imgUrl: null,
//             profilePictureSettings: null
//           };
//           await firstValueFrom(this.userService.updateUser(updatedUser));

//           // Reset UI to show avatar
//           this.currentUser.imgUrl = null;
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
//           this.resetImage();
//           this.imageNotFound = false;
//         } else if (this.originalProfileImage) {
//           // Rest of your existing restoration logic...
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
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

//         // Reset state
//         this.currentState = ProfileState.Viewing;
//         this.originalPosition = null;
//         this.originalZoom = null;
//         this.storageService.clearStagedUrlCache(userId);
//         this.hasStartedNavigating = false;
//         this.showUploadSuccess = false;

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URL when canceling
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// Main method
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
//           // Add no-image class if there's no image
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

//         // If original was deleted, show avatar and update database
//         if (this.originalProfileImage === null) {
//           // Update database to null
//           const updatedUser = {
//             ...this.currentUser,
//             imgUrl: null,
//             profilePictureSettings: null
//           };
//           await firstValueFrom(this.userService.updateUser(updatedUser));

//           // Reset UI to show avatar
//           this.currentUser.imgUrl = null;
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
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
//         } else if (this.originalProfileImage) {
//           // Restore original image and its settings
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           // Remove no-image class if restoring image
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

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URL when canceling
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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
//           // Add no-image class if there's no image
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

//         // Check if the original image was deleted
//         const wasDeleted = this.originalProfileImage !== null && !this.currentUser.imgUrl;

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
            
//             // Only clear temporary URL if it was the deleted image
//             if (this.imageManagementService.temporaryUrl === this.originalProfileImage) {
//               this.imageManagementService.clearTemporaryUrl();
//             }
            
//             // Only reset original profile image if it was deleted
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

//         } else if (this.originalProfileImage) {
//           // Restore original image and its settings
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           // Remove no-image class if restoring image
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

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Only clear temporary URL and hover count at the end
//     // if we're not dealing with a provider URL that wasn't deleted
//     if (!this.imageManagementService.temporaryUrl || 
//         (this.originalProfileImage === null || this.currentUser.imgUrl === null)) {
//       this.imageManagementService.clearTemporaryUrl();
//     }
//     this.hoverCount = 0;

//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

// Testing
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
//           // Add no-image class if there's no image
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

//         // Check if the original image was deleted
//         const wasDeleted = this.originalProfileImage !== null && !this.currentUser.imgUrl;

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
            
//             // Only reset original profile image if it was deleted
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
//         } else if (this.originalProfileImage) {
//           // Restore original image and its settings
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           // Remove no-image class if restoring image
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

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Do not clear temporary URL here to avoid affecting non-deleted provider URLs
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

async cancelAction(): Promise<void> {
  if (this.isProcessingGoodbye) return;
  
  try {
    const userId = this.userService.getUserId();
    if (!userId) {
      console.error('No userId available for cleanup');
      return;
    }

    await this.ngZone.run(async () => {
      try {
        if (this.profileImg?.nativeElement) {
          this.renderer.addClass(this.profileImg.nativeElement, 'loading');
          if (!this.currentUser.imgUrl) {
            this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
          }
        }

        // Handle staged files cleanup
        const hasStagedFileUrl = this.imageUrlManager.hasStagedFile(userId);
        const hasStagedFileFirebase = this.firebaseService.hasStagedFile(userId);

        if (hasStagedFileUrl || hasStagedFileFirebase) {
          await this.firebaseService.cleanupStagedFile(userId);
          this.imageUrlManager.clearStagedFile(userId);
        }

        // Get current database state
        const user = await firstValueFrom(this.userService.getUser(userId));
        const wasDeleted = this.originalProfileImage !== null && !user.imgUrl;

        // If original was deleted or never existed, show avatar and ensure database is updated
        if (wasDeleted || this.originalProfileImage === null) {
          // Only clear URLs and reset if the image was actually deleted
          if (wasDeleted) {
            // Ensure database reflects the null state
            const updatedUser = {
              ...this.currentUser,
              imgUrl: null,
              profilePictureSettings: null
            };
            await firstValueFrom(this.userService.updateUser(updatedUser));

            // Reset UI to show avatar
            this.currentUser.imgUrl = null;
            this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
            this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
            
            // If it was a provider URL, ensure complete cleanup
            if (this.originalProfileImage && this.imageManagementService.isProviderUrl(this.originalProfileImage)) {
              const subject = this.imageManagementService.getUserImagesSubject(userId);
              const current = subject.value;
              const updatedUrls = current.urls.filter(url => url !== this.originalProfileImage);
              subject.next({
                urls: updatedUrls,
                currentIndex: 0
              });

              // Clear all references to this provider URL
              if (this.imageManagementService.temporaryUrl === this.originalProfileImage) {
                this.imageManagementService.clearTemporaryUrl();
              }
            }
            
            this.originalProfileImage = null;
          }

          this.imageStyles = {
            'background-image': 'none',
            'background-position': `${this.position.x}% ${this.position.y}%`,
            'background-repeat': 'no-repeat',
            'background-size': `${this.zoomLevel * 100}%`,
            'background-color': '#c7ff20'
          };
          
          if (this.profileImg?.nativeElement) {
            this.renderer.addClass(this.profileImg.nativeElement, 'no-image');
            Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
          }
          
          this.resetImage();
          this.imageNotFound = false;
          this.imageManagementService.clearAllState(userId);
        } else if (user.imgUrl && this.originalProfileImage) {
          // Restore original image and its settings
          const displayUrl = await this.storageService.convertFirebaseUrl(user.imgUrl);
          
          if (this.originalPosition && this.originalZoom !== null) {
            this.position = { ...this.originalPosition };
            this.zoomLevel = this.originalZoom;
            this.isDragged = this.position.x !== 0 || this.position.y !== 0;
            this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
          }

          if (this.profileImg?.nativeElement) {
            this.renderer.removeClass(this.profileImg.nativeElement, 'no-image');
          }

          this.pictureForm.patchValue({
            imgUrl: displayUrl
          }, { emitEvent: false });
          
          this.currentUser.imgUrl = this.originalProfileImage;
          
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

          await this.updateImageTransform();
        }

        // Reset all states
        this.isInitialChangingPictureState = false;
        this.currentState = ProfileState.Viewing;
        this.originalPosition = null;
        this.originalZoom = null;
        this.storageService.clearStagedUrlCache(userId);
        this.resetHoverState();
        this.hasStartedNavigating = false;
        this.showUploadSuccess = false;
        this.providerUrlPasted = false;
        this.xDirection = '';

      } finally {
        if (this.profileImg?.nativeElement) {
          this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
        }
        this.isUploadingOrPasting = false; 
        this.cdr.detectChanges();
      }
    });

    this.hoverCount = 0;
  } catch (error) {
    console.error('Error in cancelAction:', error);
    this.currentState = ProfileState.Viewing;
    this.cdr.detectChanges();
  }
}

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
//           // Add no-image class if there's no image
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

//         // If original was deleted, show avatar and update database
//         if (this.originalProfileImage === null) {
//           // Update database to null
//           const updatedUser = {
//             ...this.currentUser,
//             imgUrl: null,
//             profilePictureSettings: null
//           };
//           await firstValueFrom(this.userService.updateUser(updatedUser));

//           // Reset UI to show avatar
//           this.currentUser.imgUrl = null;
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
//           this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
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
//         } else if (this.originalProfileImage) {
//           // Restore original image and its settings
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.originalProfileImage);
          
//           if (this.originalPosition && this.originalZoom !== null) {
//             this.position = { ...this.originalPosition };
//             this.zoomLevel = this.originalZoom;
//             this.isDragged = this.position.x !== 0 || this.position.y !== 0;
//             this.isDefaultPosition = this.position.x === 0 && this.position.y === 0;
//           }

//           // Remove no-image class if restoring image
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

//       } finally {
//         if (this.profileImg?.nativeElement) {
//           this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         }
//         this.cdr.detectChanges();
//       }
//     });

//     // Clear temporary URL when canceling
//     this.imageManagementService.clearTemporaryUrl();
//     this.hoverCount = 0;
//   } catch (error) {
//     console.error('Error in cancelAction:', error);
//     this.currentState = ProfileState.Viewing;
//     this.cdr.detectChanges();
//   }
// }

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

  // resetPasswordForm(): void {
  //   this.passwordForm.reset();
  //   Object.keys(this.passwordForm.controls).forEach(key => {
  //     const control = this.passwordForm.get(key);
  //     control?.setErrors(null);
  //     control?.updateValueAndValidity();
  //   });
  //   this.passwordGroup.reset();
  //   this.passwordGroup.disable();
  //   this.authenticating = false;
  //   this.oldPasswordError = '';
  //   this.isOldPasswordCorrect = false;
  //   this.isWaitingToCheck = false;
  //   this.passwordMismatch = false;
  //   this.isPopupVisible = false;
  //   this.cdr.detectChanges();
  // }

  // Helper methods to keep the code organized
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

private resetProfileForm(): void {
  this.profileForm.reset();
  this.isPopupVisible = false;
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

  // private setupImageUrlSubscription() {
  //   if (this.pictureForm) {
  //     this.styleSubscription = this.pictureForm.get('imgUrl')?.valueChanges
  //       .subscribe(() => {
  //         this.updateStyles();
  //       });
  //   }
  // }
  private setupImageUrlSubscription() {
    // Handle form value changes for styles
    if (this.pictureForm) {
      this.styleSubscription = this.pictureForm.get('imgUrl')?.valueChanges
        .pipe(takeUntil(this.destroy$))
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
          return;
        }
  
        // Convert and preload image
        const displayUrl = await this.storageService.convertFirebaseUrl(newValue);
        
        this.ngZone.run(() => {
          this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
          this.currentUser.imgUrl = displayUrl;
          this.preloadImage(displayUrl);
          this.updateImageTransform();
        });
  
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

  // changePicture() {
  //   this.currentState = ProfileState.ChangingPicture;
  //   console.log('Entered change picture mode:', {
  //     currentState: this.currentState,
  //     stateName: ProfileState[this.currentState],
  //     canDrag: this.canDrag()
  //   });
  //   // this.syncFormWithCurrentUser();
  // }

  // async changePicture() {
  //   this.currentState = ProfileState.ChangingPicture;
    
  //   if (this.currentUser.imgUrl) {
  //     try {
  //       // Get proxied URL synchronously
  //       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
        
  //       // Update form with resolved URL
  //       this.ngZone.run(() => {
  //         this.pictureForm.patchValue({
  //           imgUrl: displayUrl
  //         }, { emitEvent: false });
          
  //         // Ensure image is displayed
  //         this.imageLoadedSuccessfully = true;
  //         this.imageNotFound = false;
          
  //         // Update transform with saved settings
  //         this.updateImageTransform();
  //         this.cdr.detectChanges();
  //       });
  //     } catch (error) {
  //       console.error('Error converting URL:', error);
  //       this.imageNotFound = true;
  //     }
  //   }
  // }

// async changePicture() {
//   try {
//     // Store original image URL before changing state
//     this.originalProfileImage = this.currentUser?.imgUrl || null;
    
//     // Change state first
//     this.currentState = ProfileState.ChangingPicture;
    
//     if (this.currentUser?.imgUrl) {
//       // Get proxied URL
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
      
//       // Run UI updates in NgZone
//       this.ngZone.run(() => {
//         // Update form with resolved URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });
        
//         // Update component URL
//         this.profileImageUrl = displayUrl;
        
//         // Update image states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
        
//         // Update transform with saved settings
//         this.updateImageTransform();
        
//         // Ensure view is updated
//         this.cdr.detectChanges();
//       });
//     } else {
//       // Handle case where there's no current image
//       this.ngZone.run(() => {
//         this.pictureForm.patchValue({
//           imgUrl: null
//         }, { emitEvent: false });
        
//         this.profileImageUrl = null;
//         this.imageLoadedSuccessfully = false;
//         this.imageNotFound = false;
        
//         this.cdr.detectChanges();
//       });
//     }
//   } catch (error) {
//     console.error('Error in changePicture:', error);
    
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async changePicture() {
//   try {
//     // Store original full URL before state change
//     if (this.currentUser?.imgUrl) {
//       this.originalProfileImage = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//     }
    
//     this.currentState = ProfileState.ChangingPicture;
    
//     if (this.currentUser?.imgUrl) {
//       // Get proxied URL
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
      
//       this.ngZone.run(() => {
//         // Update form with resolved URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });
        
//         // Store the current URL
//         this.profileImageUrl = displayUrl;
        
//         // Reset image states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
        
//         // Update transform
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }
//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async changePicture() {
//   try {
//     if (this.currentUser?.imgUrl) {
//       // Store the current URL and styles before entering edit mode
//       this.originalProfileImage = this.currentUser.imgUrl;
//       this.originalImageStyles = { ...this.imageStyles };
//     }
    
//     this.currentState = ProfileState.ChangingPicture;
    
//     if (this.currentUser?.imgUrl) {
//       // Get proxied URL
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
      
//       this.ngZone.run(() => {
//         // Update form with resolved URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });
        
//         // Reset image states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
        
//         // Update transform with saved settings
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }
//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async changePicture() {
//   try {
//     this.currentState = ProfileState.ChangingPicture;

//     // Clear any existing temporary URL when entering change picture state
//     this.imageManagementService.clearTemporaryUrl();

//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;

//     if (this.currentUser?.imgUrl) {
//       // Store the full API URL as original
//       const fullUrl = this.currentUser.imgUrl.startsWith('http') ?
//         this.currentUser.imgUrl :
//         await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
      
//       this.originalProfileImage = fullUrl;
      
//       this.ngZone.run(() => {
//         // Update form with resolved URL
//         this.pictureForm.patchValue({
//           imgUrl: fullUrl
//         }, { emitEvent: false });
        
//         // Reset image states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
        
//         // Update transform
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     // Initialize image navigation
//     this.initializeImageNavigation().then(() => {
//       console.log('Image navigation initialized');
//     }).catch(error => {
//       console.error('Failed to initialize image navigation:', error);
//     });

//     // Log state after initialization
//     console.log('State after navigation init:', {
//       currentState: this.currentState,
//       showImageNavigation: this.showImageNavigation,
//       imageCount: this.imageCount
//     });

//     console.log('Stored original transforms:', {
//       position: this.originalPosition,
//       zoom: this.originalZoom
//     });

    
//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async changePicture() {
//   try {
//     this.hasStartedNavigating = false;
//     // Store original image and transforms before changing state
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl!;

//     // Get current image URL and index from ImageManagementService
//     const currentState = this.imageManagementService.getUserImagesSubject(this.userId).value;
//     const currentUrl = this.currentUser.imgUrl;

//     // Change state first
//     this.currentState = ProfileState.ChangingPicture;

//     if (currentUrl) {
//       // Convert Firebase URL if needed
//       const displayUrl = await this.storageService.convertFirebaseUrl(currentUrl);

//       this.ngZone.run(() => {
//         // Update form with current URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });

//         // Update states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;

//         // Update transform with saved settings
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });

//       // Initialize image navigation while maintaining current index
//       await this.imageManagementService.loadUserImages(this.userId);
      
//       // Find index of current image in the loaded images
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const updatedState = subject.value;
//       const currentIndex = updatedState.urls.findIndex(url => 
//         this.imageManagementService.normalizeUrl(url) === 
//         this.imageManagementService.normalizeUrl(currentUrl)
//       );

//       // If found, update the current index
//       if (currentIndex !== -1) {
//         subject.next({
//           ...updatedState,
//           currentIndex
//         });
//       }
//     }

//     // Initialize image navigation
//     await this.initializeImageNavigation();

//     console.log('State after navigation init:', {
//       currentState: this.currentState,
//       showImageNavigation: this.showImageNavigation,
//       imageCount: this.imageCount
//     });

//     console.log('Stored original transforms:', {
//       position: this.originalPosition,
//       zoom: this.originalZoom
//     });

//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }
// async changePicture() {
//   try {
//     this.canHoverDelete = false;
//     this.hasStartedNavigating = false;
    
//     // Store original values
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl!;

//     // Set current profile image in service
//     if (this.currentUser.imgUrl) {
//       this.imageManagementService.setCurrentProfileImage(this.currentUser.imgUrl);
//       const profilePath = this.imageManagementService.getImagePath(this.currentUser.imgUrl);
//       console.log('Current profile image path:', profilePath);
//     }


//     this.isLoadingImages = true;
//     this.allImagesLoaded = false;

//     // Change state
//     this.currentState = ProfileState.ChangingPicture;

//     // if (!this.allImagesLoaded) {
//     //   this.isLoadingImages = true;
//     //   try {
//     //     await this.preloadAllImages();
//     //   } finally {
//     //     this.isLoadingImages = false;
//     //   }
//     // }

//      // Get image count
//     //  const count = await firstValueFrom(this.imageManagementService.getImageCount(this.userId));
//     //  this.imageCount = count;

//      // Load all images
//      try {
//        await this.imageManagementService.loadUserImages(this.userId);
//        this.allImagesLoaded = true;
//      } finally {
//        // Hide loading spinner
//        this.isLoadingImages = false;
//      }
    

//     if (this.currentUser.imgUrl) {
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);

//       this.ngZone.run(() => {
//         // Update form with current URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });

//         // Update states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;

//         // Update transform
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     // Initialize navigation
//     await this.initializeImageNavigation();

//     console.log('State after navigation init:', {
//       currentState: this.currentState,
//       showImageNavigation: this.showImageNavigation,
//       imageCount: this.imageCount
//     });

//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.isLoadingImages = false;
//       this.allImagesLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// async changePicture() {
//   try {
//     // Initial state setup
//     // this.isLoadingImages = true;
//     // this.allImagesLoaded = false;
//     this.canHoverDelete = false;
//     this.hasStartedNavigating = false;
    
//     // Store original state
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl!;

//     // Set current profile image in service
//     if (this.currentUser.imgUrl) {
//       this.imageManagementService.setCurrentProfileImage(this.currentUser.imgUrl);
//     }

//     // Change state first
//     this.currentState = ProfileState.ChangingPicture;

//     // Load and preload all images
//     try {
//       // First load current image while others preload
//       if (this.currentUser.imgUrl) {
//         const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//         await this.updateImageDisplay(displayUrl, true); // true indicates it's the initial load
//       }

//       // Load and preload all images
//       await this.imageManagementService.loadUserImages(this.userId);

//       // Get image count for navigation
//       const count = await firstValueFrom(this.imageManagementService.getImageCount(this.userId));
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;

//       // Mark loading as complete
//       this.allImagesLoaded = true;
//     } finally {
//       this.isLoadingImages = false;
//     }

//     // Update form and UI
//     this.ngZone.run(() => {
//       if (this.currentUser.imgUrl) {
//         this.pictureForm.patchValue({
//           imgUrl: this.currentUser.imgUrl
//         }, { emitEvent: false });
//       }
//       this.cdr.detectChanges();
//     });

//     console.log('Change picture completed:', {
//       currentState: this.currentState,
//       showImageNavigation: this.showImageNavigation,
//       imageCount: this.imageCount
//     });

//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.isLoadingImages = false;
//       this.allImagesLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// Main method 1
// async changePicture() {
//   try {

//     this.imageManagementService.logNavigationState(this.userId);

//     // Update display and form with proxied URL
//     if (this.currentUser.imgUrl) {
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);

//       this.ngZone.run(() => {
//         // Update form with proxied URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });

//         // Update states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;

//         // this.imageManagementService.hasAnyFirebaseImages();

//         // Update transform
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     // if (!this.isInitialLoadComplete) {
//     //   // Wait for initial count to be ready
//     //   await new Promise(resolve => setTimeout(resolve, 100));
//     // }

//     this.controlsAnimationComplete = false;
//     this.imageAnimationComplete = false;
//     this.canHoverDelete = false;
//     this.hasStartedNavigating = false;
//     this.imageManagementService.hasAnyFirebaseImages();
    
//     // Store original values
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl!;

//     this.isLoadingImages = true;
//     this.allImagesLoaded = false;

//     // Change state
//     this.currentState = ProfileState.ChangingPicture;

//     // Check if we're starting from avatar
//     // const startingFromAvatar = !this.currentUser.imgUrl;

//     // Load all images
//     try {
//       // await this.imageManagementService.loadUserImages(this.userId);
//       await this.imageManagementService.loadUserImages(this.userId, true);
//       this.allImagesLoaded = true;
//     } finally {
//       this.isLoadingImages = false;
//     }

//     // Add fade-in class before updating the image
//     // if (startingFromAvatar) {
//     //   this.renderer.addClass(this.profileImg.nativeElement, 'fade-in-image');
//     // }

//     // Update display and form with proxied URL
//     if (this.currentUser.imgUrl) {
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);

//       this.ngZone.run(() => {
//         // Update form with proxied URL
//         this.pictureForm.patchValue({
//           imgUrl: displayUrl
//         }, { emitEvent: false });

//         // Update states
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;

//         // Update transform
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     // Initialize navigation
//     await this.initializeImageNavigation();

//     console.log('State after navigation init:', {
//       currentState: this.currentState,
//       showImageNavigation: this.showImageNavigation,
//       imageCount: this.imageCount
//     });

//     // // Remove fade-in class after animation completes
//     // if (startingFromAvatar) {
//     //   setTimeout(() => {
//     //     this.renderer.removeClass(this.profileImg.nativeElement, 'fade-in-image');
//     //   }, 300);
//     // }

//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.isLoadingImages = false;
//       this.allImagesLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// Main method 2
// async changePicture() {
//   try {
//     this.imageManagementService.logNavigationState(this.userId);

//     // If there's a current image, update the form with a proxied URL initially
//     if (this.currentUser.imgUrl) {
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//       this.ngZone.run(() => {
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     this.controlsAnimationComplete = false;
//     this.imageAnimationComplete = false;
//     this.canHoverDelete = false;
//     this.hasStartedNavigating = false;
//     this.imageManagementService.hasAnyFirebaseImages();
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl!;
//     this.isLoadingImages = true;
//     this.allImagesLoaded = false;
//     this.currentState = ProfileState.ChangingPicture;

//     try {
//       await this.imageManagementService.loadUserImages(this.userId, true);
//       this.allImagesLoaded = true;
//     } finally {
//       this.isLoadingImages = false;
//     }

//     // Preload all images (including current provider image if any) before navigation
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const loadedUrls = subject.value.urls; // All images available for navigation
//     await this.preloadAllImages(loadedUrls);

//     // Update the display and form again after everything is preloaded
//     if (this.currentUser.imgUrl) {
//       const displayUrl = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
//       this.ngZone.run(() => {
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     // Now that images are preloaded, initialize navigation without extra async tasks
//     await this.initializeImageNavigation();

//     console.log('State after navigation init:', {
//       currentState: this.currentState,
//       showImageNavigation: this.showImageNavigation,
//       imageCount: this.imageCount
//     });

//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.isLoadingImages = false;
//       this.allImagesLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// Main method 3
// async changePicture() {
//   try {
//     console.log('Entering changePicture()...');

//     // Log the current state for debugging
//     this.imageManagementService.logNavigationState(this.userId);

//     // If there is a current image, convert it once and patch the form
//     if (this.currentUser.imgUrl) {
//       const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//       this.ngZone.run(() => {
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     // Reset some flags
//     this.controlsAnimationComplete = false;
//     this.imageAnimationComplete = false;
//     this.canHoverDelete = false;
//     this.hasStartedNavigating = false;
//     this.imageManagementService.hasAnyFirebaseImages(); // Refresh internal state

//     // Save original transform info
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl || null;

//     // Indicate loading
//     this.isLoadingImages = true;
//     this.allImagesLoaded = false;

//     // Move into ChangingPicture state
//     this.currentState = ProfileState.ChangingPicture;

//     try {
//       // Load and gather all user images
//       await this.imageManagementService.loadUserImages(this.userId, true);
//       this.allImagesLoaded = true;
//     } finally {
//       this.isLoadingImages = false;
//     }

//     // Preload everything so no flicker occurs later
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const loadedUrls = subject.value.urls; // All images available
//     await this.preloadAllImages(loadedUrls);

//     // After preloading, patch the form again if we still have a currentUser.imgUrl
//     if (this.currentUser.imgUrl) {
//       const displayUrl = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
//       this.ngZone.run(() => {
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//         this.imageLoadedSuccessfully = true;
//         this.imageNotFound = false;
//         this.updateImageTransform();
//         this.cdr.detectChanges();
//       });
//     }

//     // Initialize navigation without extra <img>.onload checks
//     await this.initializeImageNavigation();

//     console.log('State after navigation init:', {
//       currentState: this.currentState,
//       showImageNavigation: this.showImageNavigation,
//       imageCount: this.imageCount
//     });

//   } catch (error) {
//     console.error('Error in changePicture:', error);
//     this.ngZone.run(() => {
//       // Only set this once if we truly have no images
//       this.imageNotFound = true;
//       this.isLoadingImages = false;
//       this.allImagesLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// Main method
// async changePicture() {
//   try {
//     console.log('Entering changePicture()...');
//     this.imageManagementService.logNavigationState(this.userId);

//     // Reset states first
//     this.controlsAnimationComplete = false;
//     this.imageAnimationComplete = false;
//     this.resetHoverState();
//     this.isInitialChangingPictureState = true;
//     // this.canHoverDelete = false;
//     this.hasStartedNavigating = false;
//     this.imageNotFound = false; // Reset error state
//     this.imageLoadedSuccessfully = false;
//     this.imageManagementService.hasAnyFirebaseImages(); // Refresh internal state
    
//     // Store original states
//     this.originalPosition = { ...this.position };
//     this.originalZoom = this.zoomLevel;
//     this.originalProfileImage = this.currentUser.imgUrl || null;

//     // Enter changing picture state
//     this.currentState = ProfileState.ChangingPicture;
    
//     // Start loading state
//     this.isLoadingImages = true;
//     this.allImagesLoaded = false;

//     try {
//       // Initial image setup if we have one
//       if (this.currentUser.imgUrl) {
//         try {
//           const displayUrl = await this.storageService.convertFirebaseUrl(this.currentUser.imgUrl);
//           this.ngZone.run(() => {
//             this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//             this.imageLoadedSuccessfully = true;
//             this.updateImageTransform();
//             this.cdr.detectChanges();
//           });
//         } catch (initialError) {
//           console.error('Error setting initial image:', initialError);
//           // Don't set error state, just log the error
//         }
//       }

//       // Load user images first
//       await this.imageManagementService.loadUserImages(this.userId, true);
      
//       // Get all available URLs and preload
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const loadedUrls = subject.value.urls;
//       await this.preloadAllImages(loadedUrls);
//       this.allImagesLoaded = true;

//       // After preloading, update current image display if we have one
//       if (this.currentUser.imgUrl) {
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
//           // Don't set error state here, just log it
//         }
//       }

//       // Initialize navigation without extra <img>.onload checks
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
//   }
// }

async changePicture() {
  try {

    const user = await firstValueFrom(this.userService.getUser(this.userId));
    if (!user.imgUrl) {
      // Ensure clean state if database has no image
      this.currentUser.imgUrl = null;
      this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
      this.profileForm.patchValue({ imgUrl: null }, { emitEvent: false });
      this.imageManagementService.resetAll(this.userId);
    }
    
    console.log('Entering changePicture()...');
    this.imageManagementService.logNavigationState(this.userId);

    // Reset states first
    this.controlsAnimationComplete = false;
    this.imageAnimationComplete = false;
    this.resetHoverState();
    this.isInitialChangingPictureState = true;
    this.hasStartedNavigating = false;
    this.imageNotFound = false;
    this.imageLoadedSuccessfully = false;
    this.isUploadingOrPasting = false;
    this.firebaseImageLoaded = false;
    this.imageManagementService.hasAnyFirebaseImages();
    
    // Store original states
    this.originalPosition = { ...this.position };
    this.originalZoom = this.zoomLevel;
    this.originalProfileImage = this.currentUser.imgUrl || null;

    // Enter changing picture state
    this.currentState = ProfileState.ChangingPicture;
    
    // Start loading state
    this.isLoadingImages = true;
    this.allImagesLoaded = false;

    try {
      // Important: Check actual database state first
      const user = await firstValueFrom(this.userService.getUser(this.userId));
      
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

      // Load user images
      await this.imageManagementService.loadUserImages(this.userId, true);
      
      // Get all available URLs and preload
      const subject = this.imageManagementService.getUserImagesSubject(this.userId);
      const loadedUrls = subject.value.urls;
      await this.preloadAllImages(loadedUrls);
      this.allImagesLoaded = true;

      // Only update display if database state still matches
      if (this.currentUser.imgUrl && this.currentUser.imgUrl === user.imgUrl) {
        try {
          const displayUrl = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
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

      console.log('State after navigation init:', {
        currentState: this.currentState,
        showImageNavigation: this.showImageNavigation,
        imageCount: this.imageCount
      });

    } finally {
      this.isLoadingImages = false;
    }

  } catch (error) {
    console.error('Error in changePicture:', error);
    // Only set error state if we truly have no images
    const hasAnyImages = this.imageManagementService.hasAnyFirebaseImages();
    if (!hasAnyImages) {
      this.ngZone.run(() => {
        this.imageNotFound = true;
        this.isLoadingImages = false;
        this.allImagesLoaded = false;
        this.imageLoadedSuccessfully = false;
        this.cdr.detectChanges();
      });
    } else {
      // If we have images but encountered an error, just reset loading states
      this.ngZone.run(() => {
        this.isLoadingImages = false;
        this.allImagesLoaded = true;
        this.cdr.detectChanges();
      });
    }
  }
}


// Helper method to preload and cache all images
private async preloadAllImages(urls: string[]): Promise<void> {
  const promises = urls.map(async (originalUrl) => {
    let displayUrl = originalUrl;
    if (displayUrl.includes('firebasestorage.googleapis.com')) {
      displayUrl = await this.storageService.convertFirebaseUrl(displayUrl);
    }

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(`Failed to load image: ${displayUrl}`);
      img.src = displayUrl;
    });
  });

  await Promise.all(promises);
}

// Main method
// private async getDisplayableUrlOnce(url: string): Promise<string> {
//   if (this.convertedUrlCache.has(url)) {
//     return this.convertedUrlCache.get(url)!;
//   }

//   let displayUrl = url;
//   if (url.includes('firebasestorage.googleapis.com')) {
//     displayUrl = await this.storageService.convertFirebaseUrl(url);
//   }

//   // Preload this specific image
//   await new Promise<void>((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => resolve();
//     img.onerror = () => reject(`Failed to load image: ${displayUrl}`);
//     img.src = displayUrl;
//   });

//   this.convertedUrlCache.set(url, displayUrl);
//   return displayUrl;
// }

private async getDisplayableUrlOnce(url: string): Promise<string | null> {
  if (!url) return null;

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
    } else if (this.imageManagementService.isProviderUrl(url)) {
      displayUrl = url; // Provider URL, use as is
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

// logNavigationConditions(): boolean {
//   const canDragResult = this.canDrag();
//   const isFilledResult = this.isImageUrlFilled();
  
//   console.log('Navigation visibility conditions:', {
//     canDrag: canDragResult,
//     isImageUrlFilled: isFilledResult,
//     showImageNavigation: this.showImageNavigation,
//     imageCount: this.imageCount,
//     allConditions: canDragResult && isFilledResult && this.showImageNavigation
//   });
  
//   return canDragResult && isFilledResult && this.showImageNavigation;
// }

private async getDisplayUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.includes('firebasestorage.googleapis.com')) {
    return await this.storageService.convertFirebaseUrl(url);
  }
  return url;
}

get shouldShowLoadingOverlay(): boolean {
  // Only show loading overlay if we're loading AND there are Firebase images
  return this.isLoadingImages && 
         this.imageManagementService.hasAnyFirebaseImages();
}

// get loadingText(): string {
//   const count = this.imageCount;
//   return `Loading image${count > 1 ? 's' : ''}...`;
// }

// Latest working
get loadingText(): string {
  const count = this.imageCount;
  const hasProviderProfileImage = this.currentUser?.imgUrl && 
                                this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
  const totalCount = hasProviderProfileImage ? count + 1 : count;
  return `Loading image${totalCount > 1 ? 's' : ''}...`;
}

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

onImageAnimationDone() {
  this.imageAnimationComplete = true;
  this.cdr.detectChanges();
}

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

shouldShowNavigation(): boolean {
  // return this.onlyFirebaseImageCount >= 1;
  if (this.isUploadingOrPasting) {
    return false;
  }
  return this.imageCount > 1;
}

getResetControlOpacity(): number {
  // Logic to compute the opacity value
  // For example, return a value between 0 and 1 based on some condition
  return this.isInDefaultPosition() ? 0.4 : 1;
}

// shouldShowPluralText(): boolean {
//   return this.imageCount > 1 || 
//          (this.hasFirebaseImages && this.imageManagementService.temporaryUrl !== null);
// }

shouldShowPluralText(): boolean {
  const hasProviderProfileImage = this.currentUser?.imgUrl && 
                                this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
  return this.imageCount > 1 || 
         (hasProviderProfileImage && this.imageCount > 0) || 
         (this.hasFirebaseImages && this.imageManagementService.temporaryUrl !== null);
}



  // private async updateImageDisplay(url: string) {
  //   try {
  //     const displayUrl = await this.getDisplayUrl(url);
  //     this.ngZone.run(() => {
  //       if (this.profileImg?.nativeElement) {
  //         this.profileImg.nativeElement.style.backgroundImage = `url(${displayUrl})`;
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error updating image display:', error);
  //   }
  // }

  // private async updateImageDisplay(url: string) {
  //   if (!this.profileImg?.nativeElement) return;
  
  //   try {
  
  //     // Use cached or convert URL
  //     const displayUrl = await this.storageService.convertFirebaseUrl(url);
      
  //     // Set background image immediately from cache if available
  //     this.ngZone.run(() => {
  //       this.profileImg.nativeElement.style.backgroundImage = `url(${displayUrl})`;
  //       this.imageLoadedSuccessfully = true;
  //       this.imageNotFound = false;
  //       this.cdr.detectChanges();
  //     });
  
  //     // Preload image
  //     const img = new Image();
  //     img.src = displayUrl;
  //     await new Promise((resolve, reject) => {
  //       img.onload = resolve;
  //       img.onerror = reject;
  //     });
  
  //   } catch (error) {
  //     console.error('Error displaying image:', error);
  //     this.imageNotFound = true;
  //     this.imageLoadedSuccessfully = false;
  //   } finally {
  //     this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
  //     this.cdr.detectChanges();
  //   }
  // }

  private async updateImageDisplay(url: string, isInitialLoad: boolean = false): Promise<void> {
    if (!this.profileImg?.nativeElement) return;
  
    try {
      // Add loading class if it's initial load
      if (isInitialLoad) {
        this.renderer.addClass(this.profileImg.nativeElement, 'loading');
      }
  
      // Convert URL if needed
      const displayUrl = url.includes('firebasestorage.googleapis.com') ?
        await this.storageService.convertFirebaseUrl(url) : url;
  
      // Preload image before updating display
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.ngZone.run(() => {
            // Update styles
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
            
            resolve();
          });
        };
  
        img.onerror = () => {
          this.ngZone.run(() => {
            this.imageNotFound = true;
            this.imageLoadedSuccessfully = false;
            reject(new Error('Failed to load image'));
          });
        };
  
        img.src = displayUrl;
      });
  
    } catch (error) {
      console.error('Error displaying image:', error);
      this.imageNotFound = true;
      this.imageLoadedSuccessfully = false;
    } finally {
      // Remove loading class if it was initial load
      if (isInitialLoad) {
        this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
      }
      this.cdr.detectChanges();
    }
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

  // onImageUrlInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const newValue = input.value.trim();
  
  //   // Early return if already processing to prevent duplicate work
  //   // if (this.isProcessingUrl) return;
  
  //   // Batch immediate UI updates inside NgZone
  //   this.ngZone.run(() => {
  //     // Update form state without triggering validation
  //     this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
      
  //     // Reset flags
  //     this.imageNotFound = false;
  //     this.isInitialLoad = false;
      
  //     // Reset position and zoom for new input
  //     this.resetImagePositionAndZoom();
  
  //     // Single change detection call for immediate updates
  //     this.stateUpdateDebouncer.next();
  //   });
  
  //   // Queue the value for debounced processing
  //   this.imageUrlDebouncer.next(newValue);
  // }

  // async onImageUrlInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const newValue = input.value.trim();
  
  //   try {
  //     // If it's a Firebase URL, convert it before updating the form
  //     if (newValue.includes('firebasestorage.googleapis.com')) {
  //       const displayUrl = await this.storageService.convertFirebaseUrl(newValue);
  //       this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
  //     } else {
  //       this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
  //     }
  
  //     // Reset flags
  //     this.imageNotFound = false;
  //     this.isInitialLoad = false;
      
  //     // Queue the value for processing
  //     this.imageUrlDebouncer.next(newValue);
  
  //   } catch (error) {
  //     console.error('Error processing URL:', error);
  //     this.imageNotFound = true;
  //   }
  
  //   // Queue a single state update
  //   this.stateUpdateDebouncer.next();
  // }

private async updateProfileImageUrl(url: string | null): Promise<void> {
  try {
    if (!url) {
      this.profileImageUrl = null;
      return;
    }

    // Convert to proxied URL if needed
    const displayUrl = url.includes('firebasestorage.googleapis.com') ?
      await this.storageService.convertFirebaseUrl(url) :
      url;
    
    // Update the form and component state
    this.setImageUrl(displayUrl);
    this.profileImageUrl = displayUrl;
    
    // Trigger image transform update
    await this.updateImageTransform();
  } catch (error) {
    console.error('Error updating profile image URL:', error);
  }
}

  // async onImageUrlInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const newValue = input.value.trim();
  
  //   this.ngZone.run(() => {
  //     // Don't update form value yet
  //     this.imageNotFound = false;
  //     this.isInitialLoad = false;

  //     // If it's a provider URL (Unsplash, etc.), add it to navigation
  //     if (this.isProviderUrl(newValue)) {
  //       this.imageManagementService.setTemporaryUrl(newValue);
  //       // Reload images to include the temporary URL
  //       this.initializeImageNavigation();
  //     }

  //     this.imageUrlDebouncer.next(newValue);
  //   });
  
  //   try {
  //     let displayUrl = newValue;
      
  //     // Convert Firebase URL if needed
  //     if (newValue.includes('firebasestorage.googleapis.com')) {
  //       displayUrl = await this.storageService.convertFirebaseUrl(newValue);
  //     }
  
  //     // Now update form with resolved URL
  //     this.ngZone.run(() => {
  //       this.pictureForm.patchValue({ 
  //         imgUrl: displayUrl 
  //       }, { emitEvent: false });
        
  //       if (displayUrl) {
  //         this.preloadImage(displayUrl);
  //         this.updateImageTransform();
  //       } else {
  //         this.resetImage();
  //       }
  //     });
  
  //   } catch (error) {
  //     console.error('Error processing URL:', error);
  //     this.ngZone.run(() => {
  //       this.imageNotFound = true;
  //       this.pictureForm.get('imgUrl')?.setErrors({ 'invalidImage': true });
  //     });
  //   }
  
  //   // Queue state update
  //   this.stateUpdateDebouncer.next();
  // }

// async onImageUrlInput(event: Event) {
//   const input = event.target as HTMLInputElement;
//   const newValue = input.value.trim();

//   this.ngZone.run(() => {
//     // Don't update form value yet
//     this.imageNotFound = false;
//     this.isInitialLoad = false;

//     // If it's a provider URL (Unsplash, etc.), add it to navigation
//     if (this.isProviderUrl(newValue)) {
//       this.imageManagementService.setTemporaryUrl(newValue);
//       // Reload images to include the temporary URL
//       this.initializeImageNavigation();
//     }

//     this.imageUrlDebouncer.next(newValue);
//   });

//   try {
//     let displayUrl = newValue;
    
//     // Convert Firebase URL if needed
//     if (newValue.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(newValue);
//     }

//     // Now update form with resolved URL
//     this.ngZone.run(() => {
//       this.pictureForm.patchValue({ 
//         imgUrl: displayUrl 
//       }, { emitEvent: false });
      
//       if (displayUrl) {
//         this.preloadImage(displayUrl);
//         this.updateImageTransform();
//       } else {
//         this.resetImage();
//       }
//     });

//   } catch (error) {
//     console.error('Error processing URL:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.pictureForm.get('imgUrl')?.setErrors({ 'invalidImage': true });
//     });
//   }

//   // Queue state update
//   this.stateUpdateDebouncer.next();
// }

// async onImageUrlInput(event: Event) {
//   const input = event.target as HTMLInputElement;
//   const newValue = input.value.trim();

//   this.ngZone.run(() => {
//     // Don't update form value yet
//     this.imageNotFound = false;
//     this.isInitialLoad = false;

//     // If it's a provider URL (Unsplash, etc.), handle it first
//     if (this.isProviderUrl(newValue)) {
//       this.imageManagementService.setCurrentProfileImage(''); // Clear current profile image
//       this.imageManagementService.setTemporaryUrl(newValue);
//     }

//     this.imageUrlDebouncer.next(newValue);
//   });

//   try {
//     let displayUrl = newValue;
    
//     // Convert Firebase URL if needed
//     if (newValue.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(newValue);
//     }

//     // Now update form with resolved URL
//     this.ngZone.run(() => {
//       this.pictureForm.patchValue({ 
//         imgUrl: displayUrl 
//       }, { emitEvent: false });
      
//       if (displayUrl) {
//         this.preloadImage(displayUrl);
//         this.updateImageTransform();
//       } else {
//         this.resetImage();
//       }
//     });

//   } catch (error) {
//     console.error('Error processing URL:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.pictureForm.get('imgUrl')?.setErrors({ 'invalidImage': true });
//     });
//   }

//   // Queue state update
//   this.stateUpdateDebouncer.next();
// }

// Last Working
// async onImageUrlInput(event: Event) {
//   const input = event.target as HTMLInputElement;
//   const newValue = input.value.trim();

//   this.ngZone.run(() => {
//     // Reset states without affecting loading
//     this.imageNotFound = false;
//     this.isInitialLoad = false;
//     this.loadingComplete = true; // Keep page loaded while handling URL input

//     // Handle provider URLs (like Unsplash)
//     if (this.isProviderUrl(newValue)) {
//       // this.imageManagementService.setCurrentProfileImage(''); // Clear current profile image
//       this.imageManagementService.setTemporaryUrl(newValue);
//     }

//     // Check if this is a paste event with a complete URL
//     // if (event.type === 'paste' || ((newValue.startsWith('http://') || newValue.startsWith('https://')) && newValue !== this.currentInputValue)) {
//     //   // Completely replace the input value
//     //   this.ngZone.run(() => {
//     //     this.pictureForm.patchValue({
//     //       imgUrl: newValue
//     //     }, { emitEvent: false });
        
//     //     this.currentInputValue = newValue;
//     //   });
//     // }

//     this.imageUrlDebouncer.next(newValue);
//   });

//   try {
//     let displayUrl = newValue;
    
//     // Convert Firebase URL if needed
//     if (newValue.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(newValue);
//     }

//     // Update form with resolved URL
//     this.ngZone.run(() => {
//       this.pictureForm.patchValue({
//         imgUrl: displayUrl
//       }, { emitEvent: false });
      
//       if (displayUrl) {
//         // Pass false to prevent loading state changes
//         this.preloadImage(displayUrl, false);
//         this.updateImageTransform();
//       } else {
//         this.resetImage();
//       }
//     });

//   } catch (error) {
//     console.error('Error processing URL:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.pictureForm.get('imgUrl')?.setErrors({ 'invalidImage': true });
//     });
//   }

//   // Queue state update
//   this.stateUpdateDebouncer.next();
// }

// Update onImageUrlInput to handle paste events better
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

// async onImageUrlInput(event: Event) {
//   const input = event.target as HTMLInputElement;
//   const newValue = input.value.trim();

//   this.ngZone.run(() => {
//     // Reset states without affecting loading
//     this.imageNotFound = false;
//     this.isInitialLoad = false;
//     this.loadingComplete = true;

//     // Handle provider URLs (like Unsplash)
//     if (this.isProviderUrl(newValue)) {
//       // Add to navigation sequence at the beginning
//       this.imageManagementService.setTemporaryUrl(newValue);
      
//       // Reset navigation index to show the newly added image
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const currentState = subject.value;
      
//       // Set current index to 0 to show the temporary URL first
//       subject.next({
//         ...currentState,
//         currentIndex: 0
//       });

//       // Update image count to include temporary URL
//       this.imageCount = currentState.urls.length;
//       this.showImageNavigation = this.imageCount > 1;
//     }

//     this.imageUrlDebouncer.next(newValue);
//   });

//   try {
//     let displayUrl = newValue;
    
//     // Convert Firebase URL if needed
//     if (newValue.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(newValue);
//     }

//     // Update form and display
//     this.ngZone.run(() => {
//       this.pictureForm.patchValue({
//         imgUrl: displayUrl
//       }, { emitEvent: false });

//       if (displayUrl) {
//         // Update image immediately
//         const img = new Image();
//         img.onload = () => {
//           this.ngZone.run(() => {
//             if (this.profileImg?.nativeElement) {
//               this.imageStyles = {
//                 'background-image': `url("${displayUrl}")`,
//                 'background-position': `${this.position.x}% ${this.position.y}%`,
//                 'background-repeat': 'no-repeat',
//                 'background-size': `${this.zoomLevel * 100}%`,
//                 'background-color': '#c7ff20'
//               };
              
//               Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//               this.imageLoadedSuccessfully = true;
//               this.cdr.detectChanges();
//             }
//           });
//         };

//         img.onerror = () => {
//           this.ngZone.run(() => {
//             this.imageNotFound = true;
//             this.imageLoadedSuccessfully = false;
//             this.cdr.detectChanges();
//           });
//         };

//         img.src = displayUrl;
        
//         // Reset position for temporary URL
//         this.resetImagePositionAndZoom();
//       } else {
//         this.resetImage();
//       }
//     });

//   } catch (error) {
//     console.error('Error processing URL:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.pictureForm.get('imgUrl')?.setErrors({ 'invalidImage': true });
//     });
//   }

//   // Queue state update
//   this.stateUpdateDebouncer.next();
// }


// Helper method to check if URL is from a provider
private isProviderUrl(url: string): boolean {
  if (!url) return false;

  const providerDomains = [
    'unsplash.com',
    'images.unsplash.com',
    'pexels.com',
    'images.pexels.com',
    'pixabay.com'
  ];

  try {
    const urlObj = new URL(url);
    return providerDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

private updateImageStyles(displayUrl: string) {
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
}



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

private resetImageState() {
  this.imageNotFound = false;
  this.currentUser.imgUrl = null;
  this.lastValidUrl = null;
  this.resetImagePositionAndZoom();
}

private updateImageSuccess(url: string) {
  this.imageNotFound = false;
  this.currentUser.imgUrl = url;
  this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
  this.lastValidUrl = url;
  this.updateImageTransform();
}

private updateImageFailure() {
  this.imageNotFound = true;
  this.currentUser.imgUrl = null;
  this.pictureForm.get('imgUrl')?.setErrors({ 'invalidImage': true });
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

// Optional: Add helper method for basic URL validation
private isValidUrl(url: string): boolean {
try {
  new URL(url);
  return true;
} catch {
  return false;
}
}

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

async handleImageUrlChange(newValue: string) {
  if (this.isProcessingUrl) return;
  this.isProcessingUrl = true;

  try {
    // Reset states
    this.imageNotFound = false;
    this.pictureForm.patchValue({ imgUrl: newValue }, { emitEvent: false });
    this.currentUser.imgUrl = newValue === '' ? null : newValue;

    if (newValue) {
      this.isInitialLoad = false;
      // Wait for URL conversion before updating display
      const displayUrl = await this.storageService.convertFirebaseUrl(newValue);
      
      this.ngZone.run(() => {
        // Update form with converted URL
        this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
        this.preloadImage(displayUrl);
      });
    } else {
      this.resetImage();
    }
  } catch (error) {
    console.error('Error handling URL change:', error);
    this.imageNotFound = true;
  } finally {
    this.isProcessingUrl = false;
    this.cdr.detectChanges();
  }
}

// Latest working
// async saveProfilePicture(): Promise<void> {
//   if (!this.pictureForm.valid) {
//     console.log('Form validation failed');
//     return;
//   }

//   try {
//     this.isSavingPicture = true;
//     console.log('Starting save process...');

//     // Get and validate user ID
//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');

//     // Get and validate form image URL
//     const formImageUrl = this.pictureForm.get('imgUrl')?.value;
//     if (!formImageUrl) throw new Error('No image URL provided');

//     // Create settings object with safe number conversions
//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     let storagePath: string;

//     console.log('Processing image:', { 
//       hasStaged: this.imageUrlManager.hasStagedFile(userId),
//       formUrl: formImageUrl
//     });

//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       try {
//         const fileName = stagedFile.fileName;
//         storagePath = `profileImages/${userId}/${fileName}`;

//         console.log('Moving staged file:', { fileName, storagePath });

//         // Move to permanent storage with retry on auth error
//         await this.imageUrlManager.saveProfileImage(
//           userId,
//           fileName
//         ).catch(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.imageUrlManager.saveProfileImage(userId, fileName);
//           }
//           throw error;
//         });

//         console.log('File moved successfully:', { storagePath });

//       } catch (error: any) {
//         console.error('Error moving staged file:', error);
//         throw new Error(`Failed to move staged file: ${error.message}`);
//       }
//     } else {
//       // Use existing image path
//       storagePath = this.currentUser.imgUrl!;
//       console.log('Using existing image:', { storagePath });
//     }

//     // Prepare and update user data
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: storagePath,
//       profilePictureSettings: settings
//     };

//     console.log('Updating user profile:', updatedUser);

//     // Update user with retry on auth error
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

//     // Update UI inside NgZone
//     await this.ngZone.run(async () => {
//       try {
//         // Update current user with response and original storage path
//         this.currentUser = {
//           ...this.currentUser,
//           ...response,
//           imgUrl: storagePath,
//           profilePictureSettings: settings
//         };

//         // Get proxied URL for display
//         // const displayUrl = await this.storageService.convertFirebaseUrl(storagePath);
        
//         // // Update form with proxied URL
//         // this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });

//         // // Update image display
//         // await this.updateProfileImageDisplay(displayUrl);
        
//         // Update state
//         this.currentState = ProfileState.Viewing;
//         await this.updateImageTransform();

//         // console.log('UI updated successfully:', {
//         //   displayUrl,
//         //   storagePath,
//         //   settings
//         // });

//       // Clear temporary URL after successful save
//       this.imageManagementService.clearTemporaryUrl();

//       } catch (uiError: any) {
//         console.error('Error updating UI:', uiError);
//         throw new Error(`Failed to update UI: ${uiError.message}`);
//       }
//     });

//     // Clean up staged files
//     try {
//       await this.imageUrlManager.clearStagedFile(userId);
//       console.log('Cleanup completed');
//     } catch (error) {
//       console.warn('Non-critical cleanup error:', error);
//     }

//     // this.isStagedImage = false;

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.cdr.detectChanges();
//   }
// }

// Latest Working
// async saveProfilePicture(): Promise<void> {
//   if (!this.pictureForm.valid) {
//     console.log('Form validation failed');
//     return;
//   }

//   try {
//     this.isSavingPicture = true;
//     console.log('Starting save process...');

//     // Get and validate user ID
//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');

//     // Get and validate form image URL
//     const formImageUrl = this.pictureForm.get('imgUrl')?.value;
//     if (!formImageUrl) throw new Error('No image URL provided');

//     // Create settings object with safe number conversions
//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     // Extract proper storage path based on URL type
//     let storagePath: string;

//     console.log('Processing image:', { 
//       hasStaged: this.imageUrlManager.hasStagedFile(userId),
//       formUrl: formImageUrl
//     });

//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       // Handle newly uploaded file
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       try {
//         const fileName = stagedFile.fileName;
//         storagePath = `profileImages/${userId}/${fileName}`;

//         console.log('Moving staged file:', { fileName, storagePath });

//         // Move to permanent storage with retry on auth error
//         await this.imageUrlManager.saveProfileImage(
//           userId,
//           fileName
//         ).catch(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.imageUrlManager.saveProfileImage(userId, fileName);
//           }
//           throw error;
//         });

//         console.log('File moved successfully:', { storagePath });

//       } catch (error: any) {
//         console.error('Error moving staged file:', error);
//         throw new Error(`Failed to move staged file: ${error.message}`);
//       }
//     } else {
//       // Handle navigation case or existing image
//       if (formImageUrl.includes('/api/storage/')) {
//         // Extract path from API URL
//         storagePath = formImageUrl.split('/api/storage/')[1];
//       } else if (formImageUrl.includes('firebasestorage.googleapis.com')) {
//         // Extract path from Firebase URL
//         const urlObj = new URL(formImageUrl);
//         storagePath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       } else if (formImageUrl.startsWith('profileImages/')) {
//         // Already a clean path
//         storagePath = formImageUrl;
//       } else {
//         // Fallback to current user's image path
//         storagePath = this.currentUser.imgUrl!;
//       }
//       console.log('Using existing image path:', { storagePath });
//     }

//     // Verify storage path
//     if (!storagePath.startsWith('profileImages/')) {
//       console.error('Invalid storage path:', storagePath);
//       throw new Error('Invalid storage path format');
//     }

//     // Prepare user update with verified path
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: storagePath,
//       profilePictureSettings: settings
//     };

//     console.log('Updating user profile:', updatedUser);

//     // Update user with retry on auth error
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

//     // Update UI inside NgZone
//     await this.ngZone.run(async () => {
//       try {
//         // Update current user with response and verified storage path
//         this.currentUser = {
//           ...this.currentUser,
//           ...response,
//           imgUrl: storagePath,
//           profilePictureSettings: settings
//         };

//         // Reset states
//         this.currentState = ProfileState.Viewing;
//         this.hasStartedNavigating = false;

//         // Update transform and display
//         await this.updateImageTransform();

//         // Clear temporary URL after successful save
//         this.imageManagementService.clearTemporaryUrl();

//         console.log('Profile updated successfully with path:', storagePath);

//       } catch (uiError: any) {
//         console.error('Error updating UI:', uiError);
//         throw new Error(`Failed to update UI: ${uiError.message}`);
//       }
//     });

//     // Clean up staged files if they exist
//     try {
//       if (this.imageUrlManager.hasStagedFile(userId)) {
//         await this.imageUrlManager.clearStagedFile(userId);
//         console.log('Staged file cleanup completed');
//       }
//     } catch (error) {
//       console.warn('Non-critical cleanup error:', error);
//     }

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.showUploadSuccess = false;
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

//     // Get and validate user ID
//     const userId = this.userService.getUserId();
//     if (!userId) throw new Error('User ID not found');

//     // Get and validate form image URL
//     const formImageUrl = this.pictureForm.get('imgUrl')?.value;
//     if (!formImageUrl) throw new Error('No image URL provided');

//     // Create settings object with safe number conversions
//     const settings = {
//       zoom: Number(this.zoomLevel || 1),
//       x: Number(this.position.x || 0),
//       y: Number(this.position.y || 0)
//     };

//     // Check if this is a provider URL before processing storage path
//     const isProviderUrl = formImageUrl.includes('unsplash.com') || 
//                          formImageUrl.includes('pexels.com') ||
//                          formImageUrl.includes('pixabay.com');

//     let storagePath: string;

//     console.log('Processing image:', { 
//       hasStaged: this.imageUrlManager.hasStagedFile(userId),
//       formUrl: formImageUrl
//     });

//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       // Handle newly uploaded file - keep your original code
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       try {
//         const fileName = stagedFile.fileName;
//         storagePath = `profileImages/${userId}/${fileName}`;

//         console.log('Moving staged file:', { fileName, storagePath });

//         await this.imageUrlManager.saveProfileImage(
//           userId,
//           fileName
//         ).catch(async (error) => {
//           if (error instanceof HttpErrorResponse && error.status === 401) {
//             await this.authService.refreshToken();
//             return this.imageUrlManager.saveProfileImage(userId, fileName);
//           }
//           throw error;
//         });

//         console.log('File moved successfully:', { storagePath });

//       } catch (error: any) {
//         console.error('Error moving staged file:', error);
//         throw new Error(`Failed to move staged file: ${error.message}`);
//       }
//     } else if (isProviderUrl) {
//       // For provider URLs, use the URL directly
//       storagePath = formImageUrl;
//       console.log('Using provider URL:', { storagePath });
//     } else {
//       // Your original path handling for Firebase/API URLs
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

//     // Only verify storage path for non-provider URLs
//     if (!isProviderUrl && !storagePath.startsWith('profileImages/')) {
//       console.error('Invalid storage path:', storagePath);
//       throw new Error('Invalid storage path format');
//     }

//     // Rest of your original code remains the same
//     const updatedUser = {
//       ...this.currentUser,
//       imgUrl: storagePath,
//       profilePictureSettings: settings
//     };

//     console.log('Updating user profile:', updatedUser);

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

//     await this.ngZone.run(async () => {
//       try {
//         this.currentUser = {
//           ...this.currentUser,
//           ...response,
//           imgUrl: storagePath,
//           profilePictureSettings: settings
//         };

//         this.currentState = ProfileState.Viewing;
//         this.hasStartedNavigating = false;

//         await this.updateImageTransform();

//         this.imageManagementService.clearTemporaryUrl();

//         console.log('Profile updated successfully with path:', storagePath);

//       } catch (uiError: any) {
//         console.error('Error updating UI:', uiError);
//         throw new Error(`Failed to update UI: ${uiError.message}`);
//       }
//     });

//     try {
//       if (this.imageUrlManager.hasStagedFile(userId)) {
//         await this.imageUrlManager.clearStagedFile(userId);
//         console.log('Staged file cleanup completed');
//       }
//     } catch (error) {
//       console.warn('Non-critical cleanup error:', error);
//     }

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.showUploadSuccess = false;
//     this.cdr.detectChanges();
//   }
// }

// Working
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

//     // Handle staged files first
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       try {
//         storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//         console.log('Moving staged file:', { fileName: stagedFile.fileName, storagePath });

//         await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//           .catch(async (error) => {
//             if (error instanceof HttpErrorResponse && error.status === 401) {
//               await this.authService.refreshToken();
//               return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//             }
//             throw error;
//           });

//           // Increment counter after successful move from staging to permanent storage
//           this.onlyFirebaseImageCount++;

//       } catch (error: any) {
//         console.error('Error moving staged file:', error);
//         throw new Error(`Failed to move staged file: ${error.message}`);
//       }
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
//         } else {
//           storagePath = currentUrl;
//         }
//       } else {
//         throw new Error('No valid image selected during navigation');
//       }
//     }
//     // Handle provider URLs
//     else if (this.imageManagementService.isProviderUrl(formImageUrl)) {
//       storagePath = formImageUrl;
//       console.log('Using provider URL:', { storagePath });
//     }
//     // Handle existing URLs
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

//     // Validate storage path
//     if (!this.imageManagementService.isProviderUrl(storagePath) && !storagePath.startsWith('profileImages/')) {
//       console.error('Invalid storage path:', storagePath);
//       throw new Error('Invalid storage path format');
//     }

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

//     await this.ngZone.run(async () => {
//       this.currentUser = {
//         ...this.currentUser,
//         ...response,
//         imgUrl: storagePath,
//         profilePictureSettings: settings
//       };

//       this.currentState = ProfileState.Viewing;
//       this.hasStartedNavigating = false;
//       await this.updateImageTransform();
//       this.imageManagementService.clearTemporaryUrl();
//     });

//     // Cleanup staged files
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       await this.imageUrlManager.clearStagedFile(userId);
//       console.log('Staged file cleanup completed');
//     }

//   } catch (error) {
//     console.error('Save profile picture error:', error);
//     this.handleSaveError(error);
//   } finally {
//     this.isSavingPicture = false;
//     this.showUploadSuccess = false;
//     this.cdr.detectChanges();
//   }
// }

// Main method
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

//     // Handle staged files first
//     if (this.imageUrlManager.hasStagedFile(userId)) {
//       const stagedFile = this.imageUrlManager.getStagedFile(userId);
//       if (!stagedFile) throw new Error('Staged file info not found');

//       try {
//         storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
//         console.log('Moving staged file:', { fileName: stagedFile.fileName, storagePath });

//         await this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName)
//           .catch(async (error) => {
//             if (error instanceof HttpErrorResponse && error.status === 401) {
//               await this.authService.refreshToken();
//               return this.imageUrlManager.saveProfileImage(userId, stagedFile.fileName);
//             }
//             throw error;
//           });

//         this.onlyFirebaseImageCount++;

//       } catch (error: any) {
//         console.error('Error moving staged file:', error);
//         throw new Error(`Failed to move staged file: ${error.message}`);
//       }
//     }
//     // Handle navigated images (when user clicks through carousel)
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

//     // Update user with retry on auth error
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

//     // Update UI state in NgZone
//     await this.ngZone.run(async () => {
//       this.currentUser = {
//         ...this.currentUser,
//         ...response,
//         imgUrl: storagePath,
//         profilePictureSettings: settings
//       };

//       this.currentState = ProfileState.Viewing;
//       this.hasStartedNavigating = false;
//       this.showUploadSuccess = false;
//       await this.updateImageTransform();
//       this.imageManagementService.clearTemporaryUrl();
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
//     this.cdr.detectChanges();
//   }
// }

// almost works
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

//     // Once successfully updated the user...
//     if (this.imageManagementService.isProviderUrl(storagePath)) {
//       // Inform the imageManagementService that the profile is now a provider image
//       this.imageManagementService.setCurrentProfileImage(storagePath);
//     }

//     // Update UI state in NgZone
//     await this.ngZone.run(async () => {
//       this.currentUser = {
//         ...this.currentUser,
//         ...response,
//         imgUrl: storagePath,
//         profilePictureSettings: settings
//       };

//       this.currentState = ProfileState.Viewing;
//       this.hasStartedNavigating = false;
//       this.showUploadSuccess = false;
//       await this.updateImageTransform();
//       this.imageManagementService.clearTemporaryUrl();
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
//     this.cdr.detectChanges();
//   }
// }

async saveProfilePicture(): Promise<void> {
  if (!this.pictureForm.valid) {
    console.log('Form validation failed');
    return;
  }

  try {
    this.isSavingPicture = true;
    console.log('Starting save process...');

    const userId = this.userService.getUserId();
    if (!userId) throw new Error('User ID not found');

    const formImageUrl = this.pictureForm.get('imgUrl')?.value;
    if (!formImageUrl) throw new Error('No image URL provided');

    const settings = {
      zoom: Number(this.zoomLevel || 1),
      x: Number(this.position.x || 0),
      y: Number(this.position.y || 0)
    };

    let storagePath: string;

    // Handle staged files
    if (this.imageUrlManager.hasStagedFile(userId)) {
      const stagedFile = this.imageUrlManager.getStagedFile(userId);
      if (!stagedFile) throw new Error('Staged file info not found');

      storagePath = `profileImages/${userId}/${stagedFile.fileName}`;
      console.log('Moving staged file:', { fileName: stagedFile.fileName, storagePath });

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
    // Handle navigated images
    else if (this.hasStartedNavigating) {
      const subject = this.imageManagementService.getUserImagesSubject(userId);
      const currentState = subject.value;

      if (currentState.currentIndex >= 0 && currentState.urls.length > 0) {
        const currentUrl = currentState.urls[currentState.currentIndex];
        
        if (currentUrl.startsWith('blob:')) {
          const originalPath = await this.imageManagementService.getOriginalPath(userId, currentState.currentIndex);
          if (!originalPath) throw new Error('Could not determine storage path');
          storagePath = originalPath;
        } else if (currentUrl.includes('/api/storage/')) {
          storagePath = currentUrl.split('/api/storage/')[1];
        } else {
          storagePath = currentUrl;
        }
      } else {
        throw new Error('No valid image selected during navigation');
      }
    }
    // Handle provider URLs (Unsplash, etc.)
    else if (this.imageManagementService.isProviderUrl(formImageUrl)) {
      storagePath = formImageUrl;
      console.log('Using provider URL:', { storagePath });
    }
    // Handle existing URLs and paths
    else {
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
      console.log('Using existing image path:', { storagePath });
    }

    // Validate storage path format
    if (!this.imageManagementService.isProviderUrl(storagePath) && 
        !storagePath.startsWith('profileImages/')) {
      console.error('Invalid storage path:', storagePath);
      throw new Error('Invalid storage path format');
    }

    // Update user with new path and settings
    const updatedUser = {
      ...this.currentUser,
      imgUrl: storagePath,
      profilePictureSettings: settings
    };

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

    // Update UI state in NgZone
    await this.ngZone.run(async () => {
      this.currentUser = {
        ...this.currentUser,
        ...response,
        imgUrl: storagePath,
        profilePictureSettings: settings
      };

      this.isInitialChangingPictureState = false;
      this.currentState = ProfileState.Viewing;
      this.hasStartedNavigating = false;
      this.showUploadSuccess = false;
      this.resetHoverState();
      this.providerUrlPasted = false;
      await this.updateImageTransform();
      this.imageManagementService.clearTemporaryUrl();
      this.isUploadingOrPasting = false;
      this.xDirection = '';
      this.cdr.detectChanges();
    });

    // Clean up staged files if they exist
    if (this.imageUrlManager.hasStagedFile(userId)) {
      await this.imageUrlManager.clearStagedFile(userId);
      console.log('Staged file cleanup completed');
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

private getUpdatedStyles(imgUrl?: string): any {
  return {
    'background-image': imgUrl ? `url(${imgUrl})` : 'none',
    'background-position': `${this.position.x}% ${this.position.y}%`,
    'background-repeat': 'no-repeat',
    'background-size': `${this.zoomLevel * 100}%`,
    'background-color': '#c7ff20',
  };
}

private initializeProfilePictureSettings() {
  if (typeof this.currentUser.profilePictureSettings === 'string') {
    try {
      this.currentUser.profilePictureSettings = JSON.parse(this.currentUser.profilePictureSettings);
    } catch (e) {
      console.error('Error parsing profilePictureSettings:', e);
      this.currentUser.profilePictureSettings = {
        zoom: 1,
        x: 0,
        y: 0
      };
    }
  }

  // Apply settings if they exist, otherwise use defaults
  if (this.currentUser.profilePictureSettings) {
    this.position = {
      x: this.currentUser.profilePictureSettings.x || 0,
      y: this.currentUser.profilePictureSettings.y || 0
    };
    this.zoomLevel = this.currentUser.profilePictureSettings.zoom || 1;
    this.isDragged = this.position.x !== 0 || this.position.y !== 0;

    // Update isDefaultPosition based on initial settings
    this.isDefaultPosition = this.zoomLevel === 1 && this.position.x === 0 && this.position.y === 0;
  } else {
    this.resetImagePositionAndZoom();
  }
}


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

//  Working
// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage', { isInitialLoad, imgUrl: url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Batch initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first using cached promise
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

//   // Early return if no image URL provided
//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.finishLoading();
//     });
//     return;
//   }

//   try {
//     // Get cached or convert URL
//     const displayUrl = await this.storageService.convertFirebaseUrl(url);
//     console.log('Using converted URL:', displayUrl);

//     // Verify image exists
//     const headers = await this.storageService.getAuthHeaders();
//     const checkResponse = await fetch(displayUrl, { 
//       headers,
//       method: 'HEAD'
//     });

//     if (!checkResponse.ok) {
//       throw new Error(`Failed to verify image: ${checkResponse.status}`);
//     }

//     // Update the image display
//     this.ngZone.run(() => {
//       if (this.profileImg?.nativeElement) {
//         // Update background image and styles
//         this.imageStyles = {
//           'background-image': `url("${displayUrl}")`,
//           'background-position': `${this.position.x}% ${this.position.y}%`,
//           'background-repeat': 'no-repeat',
//           'background-size': `${this.zoomLevel * 100}%`,
//           'background-color': '#c7ff20'
//         };
        
//         Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//       }

//       // Update states
//       this.imageLoaded = true;
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = true;
//       this.currentUser.imgUrl = url;
//       this.urlImageLoaded.next(true);

//       if (isInitialLoad) {
//         this.finishLoading();
//       }

//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error in preloadImage:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.imageLoaded = true;
//       this.urlImageLoaded.next(true);
//       this.finishLoading();
//     });
//   }
// }

// private async preloadAllImages(): Promise<void> {
//   const imagesToPreload = [];

//   // Always preload avatar
//   imagesToPreload.push(this.preloadSingleImage('assets/Images/avatar.png'));

//   // Preload user profile image if exists
//   if (this.currentUser?.imgUrl) {
//     const displayUrl = await this.storageService.generateImageUrl(
//       this.userId,
//       this.currentUser.imgUrl,
//       false
//     );
//     imagesToPreload.push(this.preloadSingleImage(displayUrl));
//   }

//   await Promise.all(imagesToPreload);
// }

// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
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

//   // Early return if no URL
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
//     // Always convert to proxied URL first
//     const displayUrl = await this.storageService.convertFirebaseUrl(url);
    
//     // Get auth headers if needed
//     const headers = displayUrl.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Create a promise that resolves when the image loads
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           if (this.profileImg?.nativeElement) {
//             // Directly use proxied URL in styles
//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           // Update states
//           this.imageLoaded = true;
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = true;
//           this.currentUser.imgUrl = url;
//           this.urlImageLoaded.next(true);
//           this.allImagesLoaded = true;

//           resolve();
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

//       // Load the image with headers if needed
//       if (headers) {
//         fetch(displayUrl, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             img.src = displayUrl; // Use proxied URL directly
//           })
//           .catch(() => {
//             img.src = displayUrl;
//           });
//       } else {
//         img.src = displayUrl;
//       }
//     });

//     // Complete loading
//     if (isInitialLoad) {
//       console.log('Image loaded successfully, finishing loading state');
//       this.finishLoading();
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

// Latest working
// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
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

//   // Early return if no URL
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
//     // Always convert to proxied URL first
//     const displayUrl = await this.storageService.convertFirebaseUrl(url);
    
//     // Get auth headers if needed
//     const headers = displayUrl.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Create a promise that resolves when the image loads
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           if (this.profileImg?.nativeElement) {
//             // Keep loading state true until transforms are applied
//             this.loadingComplete = false;

//             // Directly use proxied URL in styles
//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           // Update states
//           this.imageLoaded = true;
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = true;
//           this.currentUser.imgUrl = url;
//           this.urlImageLoaded.next(true);
//           this.allImagesLoaded = true;

//           // Let the transforms apply before resolving
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

//       // Load the image with headers if needed
//       if (headers) {
//         fetch(displayUrl, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             img.src = displayUrl; // Use proxied URL directly
//           })
//           .catch(() => {
//             img.src = displayUrl;
//           });
//       } else {
//         img.src = displayUrl;
//       }
//     });

//     // Complete loading only after image and transforms are fully applied
//     if (isInitialLoad) {
//       // Give transforms time to apply before checking
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

// Latest working
async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
  // Only affect loadingComplete state during initial load
  if (!isInitialLoad) {
    this.loadingComplete = true; // Keep page loaded during URL changes
  }

  console.log('Starting preloadImage:', { isInitialLoad, url });

  this.imageLoadedSuccessfully = false;
  // Remove this line since we're handling it with the check above
  // this.loadingComplete = false;

  // Initial state updates
  this.ngZone.run(() => {
    if (isInitialLoad) {
      this.imageLoaded = false;
    }
    this.avatarLoaded.next(false);
    this.urlImageLoaded.next(false);
  });

  // Rest of your original method remains exactly the same
  try {
    if (!this.avatarLoadPromise) {
      this.avatarLoadPromise = new Promise<void>((resolve, reject) => {
        const avatarImg = new Image();
        avatarImg.onload = () => resolve();
        avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
        avatarImg.src = 'assets/Images/avatar.png';
      });
    }
    
    await this.avatarLoadPromise;
    this.ngZone.run(() => {
      this.avatarLoaded.next(true);
    });
  } catch (error) {
    console.error('Error loading avatar:', error);
  }

  if (!url) {
    this.ngZone.run(() => {
      this.imageNotFound = false;
      this.imageLoadedSuccessfully = false;
      this.currentUser.imgUrl = null;
      this.urlImageLoaded.next(true);
      this.imageLoaded = true;
      this.allImagesLoaded = true;
      if (isInitialLoad) {
        this.finishLoading();
      }
    });
    return;
  }

  try {
    const displayUrl = await this.storageService.convertFirebaseUrl(url);
    const headers = displayUrl.includes('/api/storage/') ? 
      await this.storageService.getAuthHeaders() : 
      undefined;

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.ngZone.run(() => {
          if (this.profileImg?.nativeElement) {
            // Keep loading state true until transforms are applied
            if (isInitialLoad) {
              this.loadingComplete = false;
            }

            this.imageStyles = {
              'background-image': `url("${displayUrl}")`,
              'background-position': `${this.position.x}% ${this.position.y}%`,
              'background-repeat': 'no-repeat',
              'background-size': `${this.zoomLevel * 100}%`,
              'background-color': '#c7ff20'
            };
            
            Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
          }

          this.imageLoaded = true;
          this.imageNotFound = false;
          this.imageLoadedSuccessfully = true;
          this.currentUser.imgUrl = url;
          this.urlImageLoaded.next(true);
          this.allImagesLoaded = true;

          requestAnimationFrame(() => {
            resolve();
          });
        });
      };

      img.onerror = () => {
        this.ngZone.run(() => {
          console.error('Error loading image:', displayUrl);
          this.imageNotFound = true;
          this.imageLoadedSuccessfully = false;
          this.currentUser.imgUrl = null;
          this.imageLoaded = false;
          this.urlImageLoaded.next(true);
          reject(new Error('Failed to load image'));
        });
      };

      if (headers) {
        fetch(displayUrl, { headers })
          .then(response => response.blob())
          .then(blob => {
            img.src = displayUrl;
          })
          .catch(() => {
            img.src = displayUrl;
          });
      } else {
        img.src = displayUrl;
      }
    });

    if (isInitialLoad) {
      requestAnimationFrame(() => {
        console.log('Image loaded successfully, finishing loading state');
        this.finishLoading();
      });
    }

  } catch (error) {
    console.error('Error in preloadImage:', error);
    this.ngZone.run(() => {
      this.imageNotFound = true;
      this.imageLoadedSuccessfully = false;
      this.currentUser.imgUrl = null;
      this.imageLoaded = false;
      this.urlImageLoaded.next(true);
      this.allImagesLoaded = true;
      if (isInitialLoad) {
        this.finishLoading();
      }
    });
  }
}

// New Working but image loads after spinner
// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   // Only affect loadingComplete state during initial load
//   if (!isInitialLoad) {
//     this.loadingComplete = true; // Keep page loaded during URL changes
//   }

//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
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

//   // Handle no URL case
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
//     // Convert Firebase URL if needed
//     const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//       await this.storageService.convertFirebaseUrl(url) : url;

//     // Get auth headers if needed
//     const headers = displayUrl.includes('/api/storage/') ?
//       await this.storageService.getAuthHeaders() : undefined;

//     // Verify image exists before attempting to load
//     try {
//       const response = await fetch(displayUrl, { 
//         method: 'HEAD',
//         headers 
//       });

//       if (!response.ok) {
//         throw new Error('Image not accessible');
//       }
//     } catch (error) {
//       // Image not accessible, show avatar
//       this.ngZone.run(() => {
//         this.imageNotFound = false;
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//         this.urlImageLoaded.next(true);
//         if (isInitialLoad) {
//           this.finishLoading();
//         }
//       });
//       return;
//     }

//     // Load and display image
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
//           this.imageNotFound = false; // Show avatar instead of error
//           this.imageLoadedSuccessfully = false;
//           this.currentUser.imgUrl = null;
//           this.imageLoaded = false;
//           this.urlImageLoaded.next(true);
//           this.resetImage();
//           reject(new Error('Failed to load image'));
//         });
//       };

//       if (headers) {
//         fetch(displayUrl, { headers })
//           .then(response => {
//             if (!response.ok) throw new Error('Failed to fetch image');
//             return response.blob();
//           })
//           .then(blob => {
//             img.src = URL.createObjectURL(blob);
//           })
//           .catch(() => {
//             // Fallback to direct loading if fetch fails
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
//       this.imageNotFound = false; // Show avatar instead of error
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.resetImage();
//       this.urlImageLoaded.next(true);
//       this.allImagesLoaded = true;
//       if (isInitialLoad) {
//         this.finishLoading();
//       }
//     });
//   }
// }


// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
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

//   // Early return if no URL
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
//     // Get auth headers if needed
//     const headers = url.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Create a blob URL for the image
//     let blobUrl: string | null = null;
    
//     if (headers) {
//       const response = await fetch(url, { headers });
//       if (!response.ok) throw new Error('Failed to load image');
//       const blob = await response.blob();
//       blobUrl = URL.createObjectURL(blob);
//     }

//     // Create a promise that resolves when the image loads
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           if (this.profileImg?.nativeElement) {
//             // Update styles
//             this.imageStyles = {
//               'background-image': `url("${blobUrl || url}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);

//             // Update states
//             this.imageLoaded = true;
//             this.imageNotFound = false;
//             this.imageLoadedSuccessfully = true;
//             this.currentUser.imgUrl = url;
//             this.urlImageLoaded.next(true);
//             this.allImagesLoaded = true;

//             // Cleanup blob URL
//             if (blobUrl) {
//               setTimeout(() => URL.revokeObjectURL(blobUrl!), 1000);
//             }
//           }
//           resolve();
//         });
//       };

//       img.onerror = () => {
//         if (blobUrl) URL.revokeObjectURL(blobUrl);
//         reject(new Error('Failed to load image'));
//       };

//       // Set the source
//       img.src = blobUrl || url;
//     });

//     // Complete loading if initial load
//     if (isInitialLoad) {
//       console.log('Image loaded successfully, finishing loading state');
//       this.finishLoading();
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


// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
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

//   // Early return if no URL
//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.imageLoaded = true;
//       this.allImagesLoaded = true;
//       this.finishLoading();
//     });
//     return;
//   }

//   try {
//     // Get auth headers if needed
//     const headers = url.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Create a promise that resolves when the image is loaded
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
//       let imageUrl = url;
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           // Update states first
//           this.imageLoaded = true;
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = true;
//           this.currentUser.imgUrl = url;
//           this.urlImageLoaded.next(true);
//           this.allImagesLoaded = true;

//           // Update styles in next tick after DOM is ready
//           setTimeout(() => {
//             if (this.profileImg?.nativeElement) {
//               this.imageStyles = {
//                 'background-image': `url("${imageUrl}")`,
//                 'background-position': `${this.position.x}% ${this.position.y}%`,
//                 'background-repeat': 'no-repeat',
//                 'background-size': `${this.zoomLevel * 100}%`,
//                 'background-color': '#c7ff20'
//               };
              
//               Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
              
//               // Clean up blob URL if we created one
//               if (imageUrl !== url) {
//                 URL.revokeObjectURL(imageUrl);
//               }

//               this.cdr.detectChanges();
//               resolve();
//             } else {
//               // If element still not found, continue anyway to avoid spinner hang
//               console.warn('Profile image element not found, but continuing');
//               resolve();
//             }
//           });
//         });
//       };

//       img.onerror = () => {
//         this.ngZone.run(() => {
//           console.error('Error loading image:', url);
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           this.currentUser.imgUrl = null;
//           this.imageLoaded = false;
//           this.urlImageLoaded.next(true);
//           if (imageUrl !== url) {
//             URL.revokeObjectURL(imageUrl);
//           }
//           reject(new Error('Failed to load image'));
//         });
//       };

//       // Load image with auth if needed
//       if (headers) {
//         fetch(url, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             imageUrl = URL.createObjectURL(blob);
//             img.src = imageUrl;
//           })
//           .catch(() => {
//             img.src = url;
//           });
//       } else {
//         img.src = url;
//       }
//     });

//     // Complete loading
//     if (isInitialLoad) {
//       console.log('Image loaded successfully, finishing loading state');
//       this.finishLoading();
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

// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
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

//   // Early return if no URL
//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.imageLoaded = true;
//       this.allImagesLoaded = true;
//       this.finishLoading();
//     });
//     return;
//   }

//   // Wait for profile image element to be available
//   const maxAttempts = 10;
//   const interval = 100;
//   let attempts = 0;

//   while (!this.profileImg?.nativeElement && attempts < maxAttempts) {
//     await new Promise(resolve => setTimeout(resolve, interval));
//     attempts++;
//   }

//   if (!this.profileImg?.nativeElement) {
//     console.error('Profile image element not found after multiple attempts');
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
//     return;
//   }

//   try {
//     // Get auth headers if needed
//     const headers = url.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Create a promise that resolves when the image is loaded AND applied to UI
//     await new Promise<void>((resolve, reject) => {
//       let imageUrl = url;
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           if (this.profileImg?.nativeElement) {
//             // Update image styles
//             this.imageStyles = {
//               'background-image': `url("${imageUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             // Apply styles
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);

//             // Wait for next frame to ensure styles are applied
//             requestAnimationFrame(() => {
//               // Verify image is applied
//               const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
//               const backgroundImage = computedStyle.backgroundImage;
//               const imageApplied = backgroundImage.includes(imageUrl) || backgroundImage.includes(url);

//               if (imageApplied) {
//                 // Update all states
//                 this.imageLoaded = true;
//                 this.imageNotFound = false;
//                 this.imageLoadedSuccessfully = true;
//                 this.currentUser.imgUrl = url;
//                 this.urlImageLoaded.next(true);
//                 this.allImagesLoaded = true;

//                 // Clean up blob URL if we created one
//                 if (imageUrl !== url) {
//                   URL.revokeObjectURL(imageUrl);
//                 }

//                 console.log('Image successfully loaded and applied to UI');
//                 resolve();
//               } else {
//                 reject(new Error('Image loaded but not applied to UI'));
//               }
//             });
//           } else {
//             reject(new Error('Profile image element not found'));
//           }
//         });
//       };

//       img.onerror = () => {
//         this.ngZone.run(() => {
//           console.error('Error loading image:', url);
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           this.currentUser.imgUrl = null;
//           this.imageLoaded = false;
//           this.urlImageLoaded.next(true);
//           if (imageUrl !== url) {
//             URL.revokeObjectURL(imageUrl);
//           }
//           reject(new Error('Failed to load image'));
//         });
//       };

//       // Load image with auth if needed
//       if (headers) {
//         fetch(url, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             imageUrl = URL.createObjectURL(blob);
//             img.src = imageUrl;
//           })
//           .catch(() => {
//             img.src = url;
//           });
//       } else {
//         img.src = url;
//       }
//     });

//     // Only finish loading after image is successfully loaded and applied
//     if (isInitialLoad) {
//       console.log('Image loaded successfully, finishing loading state');
//       this.finishLoading();
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

// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first
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

//   // Early return if no URL
//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.imageLoaded = true;
//       this.allImagesLoaded = true;
//       this.finishLoading();
//     });
//     return;
//   }

//   try {
//     // Get auth headers if needed
//     const headers = url.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Create a promise that resolves when the image is loaded AND applied to UI
//     await new Promise<void>(async (resolve, reject) => {
//       try {
//         // First fetch the image with auth if needed
//         let imageUrl = url;
//         if (headers) {
//           const response = await fetch(url, { headers });
//           if (!response.ok) throw new Error('Failed to fetch image');
//           const blob = await response.blob();
//           imageUrl = URL.createObjectURL(blob);
//         }

//         const img = new Image();
//         let imageApplied = false;

//         img.onload = () => {
//           this.ngZone.run(() => {
//             // Update display
//             if (this.profileImg?.nativeElement) {
//               this.imageStyles = {
//                 'background-image': `url("${imageUrl}")`,
//                 'background-position': `${this.position.x}% ${this.position.y}%`,
//                 'background-repeat': 'no-repeat',
//                 'background-size': `${this.zoomLevel * 100}%`,
//                 'background-color': '#c7ff20'
//               };
              
//               Object.assign(this.profileImg.nativeElement.style, this.imageStyles);

//               // Wait for next frame to ensure styles are applied
//               requestAnimationFrame(() => {
//                 // Update states
//                 this.imageLoaded = true;
//                 this.imageNotFound = false;
//                 this.imageLoadedSuccessfully = true;
//                 this.currentUser.imgUrl = url;
//                 this.urlImageLoaded.next(true);
//                 this.allImagesLoaded = true;
                
//                 // Clean up blob URL if we created one
//                 if (imageUrl !== url) {
//                   URL.revokeObjectURL(imageUrl);
//                 }

//                 // Verify image is actually visible
//                 const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
//                 const backgroundImage = computedStyle.backgroundImage;
//                 imageApplied = backgroundImage.includes(imageUrl) || backgroundImage.includes(url);

//                 if (imageApplied) {
//                   console.log('Image successfully loaded and applied to UI');
//                   resolve();
//                 } else {
//                   console.error('Image loaded but not applied to UI');
//                   reject(new Error('Image not applied to UI'));
//                 }
//               });
//             } else {
//               reject(new Error('Profile image element not found'));
//             }
//           });
//         };

//         img.onerror = () => {
//           this.ngZone.run(() => {
//             console.error('Error loading image:', url);
//             this.imageNotFound = true;
//             this.imageLoadedSuccessfully = false;
//             this.currentUser.imgUrl = null;
//             this.imageLoaded = false;
//             this.urlImageLoaded.next(true);
//             if (imageUrl !== url) {
//               URL.revokeObjectURL(imageUrl);
//             }
//             reject(new Error('Failed to load image'));
//           });
//         };

//         img.src = imageUrl;
//       } catch (error) {
//         reject(error);
//       }
//     });

//     // Only finish loading after image is successfully loaded and applied
//     if (isInitialLoad) {
//       console.log('Image loaded successfully, finishing loading state');
//       this.finishLoading();
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


// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar
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

//   // Early return if no URL
//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.imageLoaded = true; // Set to true for no-image case
//       this.allImagesLoaded = true; // Set all images loaded flag
//       this.finishLoading();
//     });
//     return;
//   }

//   try {
//     // Get auth headers if needed
//     const headers = url.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Load main profile image
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           // Update display
//           if (this.profileImg?.nativeElement) {
//             this.imageStyles = {
//               'background-image': `url("${url}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           // Update states
//           this.imageLoaded = true;
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = true;
//           this.currentUser.imgUrl = url;
//           this.urlImageLoaded.next(true);
//           this.allImagesLoaded = true; // Set all images loaded flag

//           resolve();
//         });
//       };

//       img.onerror = () => {
//         this.ngZone.run(() => {
//           console.error('Error loading image:', url);
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           this.currentUser.imgUrl = null;
//           this.imageLoaded = false;
//           this.urlImageLoaded.next(true);
//           reject(new Error('Failed to load image'));
//         });
//       };

//       // Set source with credentials if needed
//       if (headers) {
//         fetch(url, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             img.src = URL.createObjectURL(blob);
//           })
//           .catch(() => {
//             img.src = url;
//           });
//       } else {
//         img.src = url;
//       }
//     });

//     // Finish loading only after successful image load
//     if (isInitialLoad) {
//       this.finishLoading();
//     }

//   } catch (error) {
//     console.error('Error in preloadImage:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.imageLoaded = false;
//       this.urlImageLoaded.next(true);
//       this.allImagesLoaded = true; // Set for error case
//       if (isInitialLoad) {
//         this.finishLoading();
//       }
//     });
//   }
// }

// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar
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

//   // Early return if no URL
//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.finishLoading();
//     });
//     return;
//   }

//   try {
//     // Already converted in loadProfile, use URL directly
//     const displayUrl = url;
    
//     // Get auth headers if needed
//     const headers = url.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Verify the URL is accessible
//     if (headers) {
//       const verifyResponse = await fetch(displayUrl, { 
//         method: 'HEAD',
//         headers 
//       });
      
//       if (!verifyResponse.ok) {
//         throw new Error('Image URL not accessible');
//       }
//     }

//     // Create promise for image loading
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           // Update display
//           if (this.profileImg?.nativeElement) {
//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           // Update states
//           this.imageLoaded = true;
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = true;
//           this.currentUser.imgUrl = url;
//           this.urlImageLoaded.next(true);

//           resolve();
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

//       // Set source with credentials if needed
//       if (headers) {
//         fetch(displayUrl, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             img.src = URL.createObjectURL(blob);
//           })
//           .catch(() => {
//             img.src = displayUrl;
//           });
//       } else {
//         img.src = displayUrl;
//       }
//     });

//     // Complete loading
//     if (isInitialLoad) {
//       this.finishLoading();
//     }

//   } catch (error) {
//     console.error('Error in preloadImage:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.imageLoaded = false;
//       this.urlImageLoaded.next(true);
//       if (isInitialLoad) {
//         this.finishLoading();
//       }
//     });
//   }
// }

// async preloadImage(url: string | null, isInitialLoad = false): Promise<void> {
//   console.log('Starting preloadImage:', { isInitialLoad, url });

//   this.imageLoadedSuccessfully = false;
//   this.loadingComplete = false;

//   // Batch initial state updates
//   this.ngZone.run(() => {
//     if (isInitialLoad) {
//       this.imageLoaded = false;
//     }
//     this.avatarLoaded.next(false);
//     this.urlImageLoaded.next(false);
//   });

//   // Load avatar first using cached promise
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

//   // Early return if no image URL provided
//   if (!url) {
//     this.ngZone.run(() => {
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.urlImageLoaded.next(true);
//       this.finishLoading();
//     });
//     return;
//   }

//   try {
//     // Get auth headers if needed
//     const headers = url.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       undefined;

//     // Convert Firebase URL if needed
//     let displayUrl = url;
//     if (url.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(url);
//     }

//     // Create a promise that resolves when the image loads
//     const imageLoadPromise = new Promise<void>((resolve, reject) => {
//       const img = new Image();
      
//       img.onload = () => {
//         this.ngZone.run(() => {
//           if (this.profileImg?.nativeElement) {
//             // Update background image and styles
//             this.imageStyles = {
//               'background-image': `url("${displayUrl}")`,
//               'background-position': `${this.position.x}% ${this.position.y}%`,
//               'background-repeat': 'no-repeat',
//               'background-size': `${this.zoomLevel * 100}%`,
//               'background-color': '#c7ff20'
//             };
            
//             Object.assign(this.profileImg.nativeElement.style, this.imageStyles);
//           }

//           // Update states
//           this.imageLoaded = true;
//           this.imageNotFound = false;
//           this.imageLoadedSuccessfully = true;
//           this.currentUser.imgUrl = url;
//           this.urlImageLoaded.next(true);

//           resolve();
//         });
//       };

//       img.onerror = () => {
//         this.ngZone.run(() => {
//           console.error('Error loading image:', displayUrl);
//           this.imageNotFound = true;
//           this.imageLoadedSuccessfully = false;
//           this.currentUser.imgUrl = null;
//           this.imageLoaded = true;
//           this.urlImageLoaded.next(true);
//           reject(new Error('Failed to load image'));
//         });
//       };

//       // If headers are needed, fetch with credentials first
//       if (headers) {
//         fetch(displayUrl, { headers })
//           .then(response => response.blob())
//           .then(blob => {
//             img.src = URL.createObjectURL(blob);
//           })
//           .catch(error => {
//             console.error('Error fetching image:', error);
//             img.src = displayUrl; // Fallback to direct loading
//           });
//       } else {
//         img.src = displayUrl;
//       }
//     });

//     // Wait for both avatar and profile image to load
//     await Promise.all([
//       this.avatarLoadPromise,
//       imageLoadPromise
//     ]);

//     // Only finish loading after both images are ready
//     this.ngZone.run(() => {
//       if (isInitialLoad) {
//         this.finishLoading();
//       }
//     });

//   } catch (error) {
//     console.error('Error in preloadImage:', error);
//     this.ngZone.run(() => {
//       this.imageNotFound = true;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null;
//       this.imageLoaded = true;
//       this.urlImageLoaded.next(true);
//       this.finishLoading();
//     });
//   }
// }

// private async preloadAllImages(): Promise<void> {
//   const imagesToPreload = [];

//   // Always preload avatar
//   imagesToPreload.push(this.preloadSingleImage('assets/Images/avatar.png'));

//   // Preload user profile image if exists
//   if (this.currentUser?.imgUrl) {
//     const displayUrl = await this.storageService.generateImageUrl(
//       this.userId,
//       this.currentUser.imgUrl,
//       false
//     );
//     imagesToPreload.push(this.preloadSingleImage(displayUrl));
//   }

//   await Promise.all(imagesToPreload);
// }

// Main method
// private async preloadAllImages(): Promise<void> {
//   try {
//     // Load all images while maintaining current profile
//     // await this.imageManagementService.loadUserImages(this.userId);
//     this.imageManagementService.loadUserImages(this.userId, false);
    
//     // Wait for loading to complete
//     while (this.imageManagementService.isLoading()) {
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }
//   } catch (error) {
//     console.error('Error preloading images:', error);
//   }
// }

private preloadSingleImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.error(`Failed to preload image: ${src}`);
      resolve(); // Resolve anyway to not block loading
    };
    img.src = src;
  });
}

// Helper method to finish loading with a small delay
// private finishLoading(): void {
//   // Small delay to ensure UI is updated before hiding spinner
//   setTimeout(() => {
//     this.ngZone.run(() => {
//       this.loadingComplete = true;
//       this.cdr.detectChanges();
//     });
//   }, 500); // Adjust delay as needed
// }
// private finishLoading(): void {
//   const allLoaded = this.imageLoaded && 
//                    this.avatarLoaded.getValue() && 
//                    this.urlImageLoaded.getValue();

//   if (allLoaded) {
//     // Small delay to ensure UI is updated before hiding spinner
//     setTimeout(() => {
//       this.ngZone.run(() => {
//         this.loadingComplete = true;
//         this.cdr.detectChanges();
//       });
//     }, 500);
//   } else {
//     console.log('Waiting for all assets to load:', {
//       imageLoaded: this.imageLoaded,
//       avatarLoaded: this.avatarLoaded.getValue(),
//       urlImageLoaded: this.urlImageLoaded.getValue()
//     });
//   }
// }

// private finishLoading(): void {
//   const allLoaded = this.imageLoaded && 
//                    this.avatarLoaded.getValue() && 
//                    this.urlImageLoaded.getValue() &&
//                    this.allImagesLoaded;

//   if (allLoaded) {
//     // Small delay to ensure UI is updated before hiding spinner
//     setTimeout(() => {
//       this.ngZone.run(() => {
//         this.loadingComplete = true;
//         this.cdr.detectChanges();
//       });
//     }, 100);
//   } else {
//     console.log('Waiting for all assets to load:', {
//       imageLoaded: this.imageLoaded,
//       avatarLoaded: this.avatarLoaded.getValue(),
//       urlImageLoaded: this.urlImageLoaded.getValue(),
//       allImagesLoaded: this.allImagesLoaded
//     });
//   }
// }

// private finishLoading(): void {
//   const allLoaded = this.imageLoaded && 
//                    this.avatarLoaded.getValue() && 
//                    this.urlImageLoaded.getValue() &&
//                    this.allImagesLoaded;

//   if (allLoaded) {
//     // Add a small delay to ensure UI is fully updated
//     setTimeout(() => {
//       this.ngZone.run(() => {
//         // Double check image is actually visible before completing
//         if (this.profileImg?.nativeElement) {
//           const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
//           const backgroundImage = computedStyle.backgroundImage;
//           if (backgroundImage !== 'none' && backgroundImage !== '') {
//             console.log('Loading complete, image verified');
//             this.loadingComplete = true;
//             this.cdr.detectChanges();
//           } else {
//             console.log('Image not visible in UI, retrying...');
//             setTimeout(() => this.finishLoading(), 100);
//           }
//         } else {
//           this.loadingComplete = true;
//           this.cdr.detectChanges();
//         }
//       });
//     }, 100);
//   }
// // }

// private finishLoading(): void {
//   const allLoaded = this.imageLoaded &&
//                    this.avatarLoaded.getValue() &&
//                    this.urlImageLoaded.getValue() &&
//                    this.allImagesLoaded;

//   if (allLoaded) {
//     // Add a small delay to ensure UI is fully updated
//     setTimeout(() => {
//       this.ngZone.run(() => {
//         // Double check image is actually visible before completing
//         if (this.profileImg?.nativeElement) {
//           const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
//           const backgroundImage = computedStyle.backgroundImage;
//           const imageVisible = backgroundImage !== 'none' && 
//                              backgroundImage !== '' && 
//                              !backgroundImage.includes('avatar.png');

//           if (imageVisible) {
//             console.log('Loading complete, image verified');
//             this.loadingComplete = true;
//             this.cdr.detectChanges();
//           } else {
//             console.log('Image not visible in UI, retrying...');
//             // Add max retry count to avoid infinite loops
//             if (!this.retryCount) {
//               this.retryCount = 0;
//             }
//             if (this.retryCount < 5) {
//               this.retryCount++;
//               setTimeout(() => this.finishLoading(), 100);
//             } else {
//               console.log('Max retries reached, completing anyway');
//               this.loadingComplete = true;
//               this.cdr.detectChanges();
//             }
//           }
//         } else {
//           console.log('Profile element not found, completing anyway');
//           this.loadingComplete = true;
//           this.cdr.detectChanges();
//         }
//       });
//     }, 100);
//   } else {
//     console.log('Waiting for assets to load:', {
//       imageLoaded: this.imageLoaded,
//       avatarLoaded: this.avatarLoaded.getValue(),
//       urlImageLoaded: this.urlImageLoaded.getValue(),
//       allImagesLoaded: this.allImagesLoaded
//     });
//   }
// // }

// private finishLoading(): void {
//   const allLoaded = this.imageLoaded && 
//                    this.avatarLoaded.getValue() && 
//                    this.urlImageLoaded.getValue() &&
//                    this.allImagesLoaded;

//   if (allLoaded) {
//     if (this.profileImg?.nativeElement) {
//       const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
//       const backgroundImage = computedStyle.backgroundImage;

//       // Extract blob URL if present
//       const blobMatch = backgroundImage.match(/url\("(blob:[^"]+)"\)/);
//       if (blobMatch) {
//         const blobUrl = blobMatch[1];
//         // Keep the blob URL alive until the image is fully displayed
//         setTimeout(() => {
//           URL.revokeObjectURL(blobUrl);
//         }, 1000); // Give enough time for the image to be displayed
//       }

//       const hasValidImage = backgroundImage !== 'none' && 
//                           backgroundImage !== '' && 
//                           !backgroundImage.includes('avatar.png');

//       if (hasValidImage) {
//         this.ngZone.run(() => {
//           console.log('Image verified, completing load');
//           this.loadingComplete = true;
//           this.cdr.detectChanges();
//         });
//       } else {
//         if (!this.retryCount) {
//           this.retryCount = 0;
//         }
//         if (this.retryCount < 10) {
//           this.retryCount++;
//           console.log(`Waiting for image to apply (${this.retryCount})`);
//           setTimeout(() => this.finishLoading(), 100);
//         } else {
//           console.log('Max retries reached, completing anyway');
//           this.loadingComplete = true;
//           this.cdr.detectChanges();
//         }
//       }
//     } else {
//       console.error('Profile image element not found');
//       this.loadingComplete = true;
//       this.cdr.detectChanges();
//     }
//   }
// }


private finishLoading(): void {
  if (this.profileImg?.nativeElement) {
    const computedStyle = window.getComputedStyle(this.profileImg.nativeElement);
    const backgroundImage = computedStyle.backgroundImage;

    const hasValidImage = backgroundImage !== 'none' && 
                       backgroundImage !== '' && 
                       !backgroundImage.includes('avatar.png');

    if (hasValidImage) {
      this.ngZone.run(() => {
        console.log('Image verified, completing load');
        this.loadingComplete = true;
        this.cdr.detectChanges();
      });
    } else {
      if (!this.retryCount) {
        this.retryCount = 0;
      }
      if (this.retryCount < 10) {
        this.retryCount++;
        console.log(`Waiting for image to apply (${this.retryCount})`);
        setTimeout(() => this.finishLoading(), 100);
      } else {
        console.log('Max retries reached, completing anyway');
        this.loadingComplete = true;
        this.cdr.detectChanges();
      }
    }
  }
}


private initializeLoadingState() {
  this.avatarLoaded.subscribe(loaded => {
    console.log('Avatar loaded:', loaded);
    this.checkAllImagesLoaded();
  });

  this.urlImageLoaded.subscribe(loaded => {
    console.log('URL image loaded:', loaded);
    this.checkAllImagesLoaded();
  });
}

// private checkAllImagesLoaded() {
//   const allLoaded = this.imageLoaded && 
//                    this.avatarLoaded.getValue() && 
//                    this.urlImageLoaded.getValue();
                   
//   if (allLoaded) {
//     console.log('All images loaded, completing loading state');
//     this.finishLoading();
//   }
// }

private checkAllImagesLoaded(): void {
  const allLoaded = this.imageLoaded && 
                   this.avatarLoaded.getValue() && 
                   this.urlImageLoaded.getValue() &&
                   this.allImagesLoaded;
                   
  if (allLoaded) {
    console.log('All images loaded, completing loading state');
    this.finishLoading();
  }
}

// Helper method to check if all images are loaded
// private checkAllImagesLoaded(isInitialLoad: boolean) {
//   const avatarLoaded = this.avatarLoaded.getValue();
//   const urlLoaded = this.urlImageLoaded.getValue();
  
//   console.log('Checking image loading status:', { avatarLoaded, urlLoaded });

//   if (avatarLoaded && urlLoaded) {
//     this.imageLoaded = true;
//     this.checkLoadingComplete();
//     this.cdr.detectChanges();
//   }
// }

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

// async refreshImages(forceRefresh: boolean = false) {
//   try {
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     if (this.currentUser.imgUrl) {
//       if (forceRefresh) {
//         // Add cache-busting parameter to the URL
//         const cacheBuster = `?t=${Date.now()}`;
//         const baseUrl = this.currentUser.imgUrl.split('?')[0];
//         await this.preloadImage(baseUrl + cacheBuster);
//       } else {
//         await this.preloadImage(this.currentUser.imgUrl);
//       }
//     }
//   } catch (error) {
//     console.error('Error refreshing images:', error);
//   }
// }

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

// isImageUrlFilled(): boolean {
//   // this.imageNotFound = false;
//   if (!this.pictureForm) return false;
//   if (this.imageNotFound) return false;

//   const imgUrlControl = this.pictureForm.get('imgUrl');
//   if (!imgUrlControl) return false;
  
//   const formValue = imgUrlControl.value?.trim();
//   if (!formValue) return false;

//   if (this._isFirebaseUrl(formValue)) {
//     return !this.imageNotFound;
//   }

//   // For uploaded images (Firebase URLs)
//   // if (formValue.includes('firebasestorage.googleapis.com')) return true;

//   // For external URLs
//   try {
//     const url = new URL(formValue);
//     const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';
//     return isValidProtocol && !this.imageNotFound;
//   } catch {
//     return false;
//   }
// }

// private _isFirebaseUrl(url: string): boolean {
//   return url.includes('firebasestorage.googleapis.com');
// }

// isImageUrlFilled(): boolean {
//   // Get the form control
//   if (!this.pictureForm) return false;
//   if (this.imageNotFound) return false;

//   const imgUrlControl = this.pictureForm.get('imgUrl');
//   if (!imgUrlControl) return false;
  
//   const formValue = imgUrlControl.value;
//   // Check if value exists and convert to string if needed
//   if (!formValue) return false;
  
//   const stringValue = typeof formValue === 'string' ? formValue.trim() : String(formValue).trim();
//   if (!stringValue) return false;

//   // For uploaded images (Firebase URLs)
//   if (this.isFirebaseUrl(stringValue)) {
//     return !this.imageNotFound;
//   }

//   // For external URLs
//   try {
//     const url = new URL(stringValue);
//     const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';
//     return isValidProtocol && !this.imageNotFound;
//   } catch {
//     return false;
//   }
// }

// isImageUrlFilled(): boolean {
//   // Early returns for invalid states
//   if (!this.pictureForm || this.imageNotFound) return false;

//   // First check currentUser.imgUrl since that's the actual image being displayed
//   if (this.currentUser.imgUrl && this.imageLoadedSuccessfully) {
//     return true;
//   }

//   // Then check form control
//   const imgUrlControl = this.pictureForm.get('imgUrl');
//   if (!imgUrlControl) return false;
  
//   const value = imgUrlControl.value;
//   if (!value) return false;

//   // Handle both string and promise values
//   if (value instanceof Promise) {
//     return this.imageLoadedSuccessfully;
//   }

//   const stringValue = typeof value === 'string' ? value.trim() : String(value).trim();
//   if (!stringValue) return false;

//   return this.imageLoadedSuccessfully && !this.imageNotFound;
// }

// isImageUrlFilled(): boolean {
//   // Early returns for invalid states
//   if (!this.pictureForm || this.imageNotFound) return false;

//   // First check currentUser.imgUrl since that's the actual image being displayed
//   if (this.currentUser.imgUrl && this.imageLoadedSuccessfully) {
//     return true;
//   }

//   // Then check form control
//   const imgUrlControl = this.pictureForm.get('imgUrl');
//   if (!imgUrlControl) return false;
  
//   const value = imgUrlControl.value;
//   if (!value) return false;

//   // Handle both string and promise values
//   if (value instanceof Promise) {
//     return this.imageLoadedSuccessfully;
//   }

//   const stringValue = typeof value === 'string' ? value.trim() : String(value).trim();
//   if (!stringValue) return false;

//   return this.imageLoadedSuccessfully && !this.imageNotFound;
// }

// isImageUrlFilled(): boolean {
//   // Early returns for invalid states
//   if (!this.pictureForm || this.imageNotFound) {
//     // console.log('Early return check failed:', {
//     //   hasForm: !!this.pictureForm,
//     //   imageNotFound: this.imageNotFound
//     // });
//     return false;
//   }

//   // First check currentUser.imgUrl since that's the actual image being displayed
//   if (this.currentUser.imgUrl && this.imageLoadedSuccessfully) {
//     // console.log('Current user image check passed:', {
//     //   imgUrl: this.currentUser.imgUrl,
//     //   imageLoadedSuccessfully: this.imageLoadedSuccessfully
//     // });
//     return true;
//   }

//   // Then check form control
//   const imgUrlControl = this.pictureForm.get('imgUrl');
//   if (!imgUrlControl) {
//     console.log('No imgUrl control found');
//     return false;
//   }
  
//   const value = imgUrlControl.value;
//   if (!value) {
//     console.log('No value in imgUrl control');
//     return false;
//   }

//   // Handle both string and promise values
//   if (value instanceof Promise) {
//     console.log('Value is a Promise:', {
//       imageLoadedSuccessfully: this.imageLoadedSuccessfully
//     });
//     return this.imageLoadedSuccessfully;
//   }

//   const stringValue = typeof value === 'string' ? value.trim() : String(value).trim();
//   if (!stringValue) {
//     console.log('Empty string value after trimming');
//     return false;
//   }

//   console.log('Final check:', {
//     stringValue,
//     imageLoadedSuccessfully: this.imageLoadedSuccessfully,
//     imageNotFound: this.imageNotFound
//   });

//   return this.imageLoadedSuccessfully && !this.imageNotFound;
// }

// Latest working
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

  // Attach event listeners
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

  // this.ngZone.run(() => {
    requestAnimationFrame(() => {
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    // Calculate new position based on the initial offset
    const newX = clientX - this.startX;
    const newY = clientY - this.startY;

    // Get dimensions
    const imgRect = this.profileImg.nativeElement.getBoundingClientRect();
    const containerRect = this.profileImg.nativeElement.parentElement!.getBoundingClientRect();

    // Calculate maximum allowed movement - implement later for better UX (so image edges never show in div)
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

    // this.renderer.setStyle(
    //   this.profileImg.nativeElement,
    //   'background-position',
    //   `${this.position.x}% ${this.position.y}%`
    // );

    // this.imageStyles = {
    //   ...this.imageStyles,
    //   'background-position': `${this.position.x}% ${this.position.y}%`
    // };

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

  // resetImagePositionAndZoom() {
  //   this.position = { x: 0, y: 0 };
  //   this.zoomLevel = 1;
  //   this.isDragged = false;
  //   this.isDefaultPosition = true;
  //   this.updateImageTransform();
  //   this.cdr.detectChanges();
  // }

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

resetImagePositionAndZoomDuringNavigation(){
  this.position = { x: 0, y: 0 };
  this.zoomLevel = 1;
  this.isDragged = false;
  this.isDefaultPosition = true;

  setTimeout(() => {
    this.updateImageTransform();
    this.cdr.detectChanges();
  }, 0);
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


async updateImageTransform() {
  if (!this.profileImg?.nativeElement) return;

  const imgElement = this.profileImg.nativeElement;
  
  try {
    this.renderer.addClass(imgElement, 'smooth-transform');

    // Get current URL from form or user
    let currentUrl = this.pictureForm.get('imgUrl')?.value || this.currentUser?.imgUrl;
    if (!currentUrl) return;

    // Handle Promise/ZoneAwarePromise
    if (currentUrl instanceof Promise || (currentUrl && typeof currentUrl === 'object' && '__zone_symbol__value' in currentUrl)) {
      currentUrl = await currentUrl;
    }

    if (!currentUrl) return;

    // Convert Firebase URLs if needed
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
        // Create a new image element
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

    // Create the styles object
    const styles = {
      'background-image': backgroundImage,
      'background-position': `${this.position.x}% ${this.position.y}%`,
      'background-repeat': 'no-repeat',
      'background-size': `${this.zoomLevel * 100}%`,
      'background-color': '#c7ff20'
    };

    // Apply styles
    Object.entries(styles).forEach(([key, value]) => {
      if (key !== 'background-image' || this.isImageUrlChanged) {
        this.renderer.setStyle(imgElement, key, value);
      }
    });
    
    // Store styles for reference
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

//     // Get auth headers for API storage URLs
//     const headers = currentUrl.includes('/api/storage/') ? 
//       await this.storageService.getAuthHeaders() : 
//       null;

//     // Get current background image
//     const currentBgImage = window.getComputedStyle(imgElement).backgroundImage;

//     // If we have a valid current background image and it's not changing, keep it
//     const backgroundImage = currentBgImage !== 'none' && !this.isImageUrlChanged ? 
//       currentBgImage : 
//       `url("${currentUrl}")`;

//     // Determine position and zoom based on navigation state
//     let position = { x: 0, y: 0 };
//     let zoom = 1;

//     if (this.currentState === ProfileState.ChangingPicture && 
//         this.imageManagementService.isFirstImage(this.userId) && 
//         !this.hasStartedNavigating) {
//       // Use saved settings only for profile picture before navigation starts
//       position = {
//         x: this.currentUser.profilePictureSettings?.x || 0,
//         y: this.currentUser.profilePictureSettings?.y || 0
//       };
//       zoom = this.currentUser.profilePictureSettings?.zoom || 1;
//     } else {
//       // Use current position and zoom for other cases
//       position = { x: 0, y: 0 };
//       zoom = 1;
//     }

//     // Create the styles object with determined position and zoom
//     const styles = {
//       'background-image': backgroundImage,
//       'background-position': `${position.x}% ${position.y}%`,
//       'background-repeat': 'no-repeat',
//       'background-size': `${zoom * 100}%`,
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

//     // Update component position and zoom to match what was applied
//     this.position = position;
//     this.zoomLevel = zoom;

//     // Update user settings if they exist and we're using saved settings
//     if (this.currentUser && !this.hasStartedNavigating && 
//         this.imageManagementService.isFirstImage(this.userId)) {
//       this.currentUser.profilePictureSettings = {
//         zoom,
//         x: position.x,
//         y: position.y
//       };
//     }

//     // Reset the image URL changed flag
//     this.isImageUrlChanged = false;

//   } catch (error) {
//     console.error('Error updating image transform:', error);
//   }
// }


// setImageUrl(url: string | null) {
//   const currentUrl = this.pictureForm.get('imgUrl')?.value;
//   this.isImageUrlChanged = currentUrl !== url;
//   if (url) {
//     this.pictureForm.patchValue({ imgUrl: url });
//   } else {
//     this.pictureForm.get('imgUrl')?.reset();
//   }
// }

setImageUrl(url: string) {
  const currentUrl = this.pictureForm.get('imgUrl')?.value;
  this.isImageUrlChanged = currentUrl !== url;
  this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
}


private invalidateStyleCache() {
  this.cachedStyles = null;
}


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


// async getProfileImageStyles(): Promise<any> {
//   try {
//     // Check if form is initialized
//     if (!this.pictureForm) {
//       return this.getDefaultStyles();
//     }

//     // Get and validate the current URL
//     const formUrl = this.pictureForm.get('imgUrl')?.value;
//     const currentUrl = typeof formUrl === 'string' ? formUrl : this.currentUser?.imgUrl || '';

//     // Add logging to debug URL handling
//     console.log('Current URL:', {
//       formUrl,
//       currentUrl,
//       userImgUrl: this.currentUser?.imgUrl
//     });

//     // Cache check with logging
//     if (this.imageTransformCache?.url === currentUrl) {
//       console.log('Using cached styles for URL:', currentUrl);
//       return this.imageTransformCache!.styles;
//     }

//     // Get settings with better error handling
//     let settings = this.currentUser.profilePictureSettings;
//     if (typeof settings === 'string') {
//       try {
//         settings = JSON.parse(settings);
//       } catch (e) {
//         console.warn('Error parsing settings, using defaults:', e);
//         settings = {
//           zoom: this.zoomLevel || 1,
//           x: this.position.x || 0,
//           y: this.position.y || 0
//         };
//       }
//     }

//     // Process image URL with better error handling
//     // let displayUrl = currentUrl;
//     // if (typeof currentUrl === 'string' && currentUrl.includes('firebasestorage.googleapis.com')) {
//     //   try {
//     //     displayUrl = await this.storageService.convertFirebaseUrl(currentUrl);
//     //     console.log('Converted Firebase URL:', { original: currentUrl, converted: displayUrl });
//     //   } catch (error) {
//     //     console.error('Error converting Firebase URL:', error);
//     //     displayUrl = currentUrl;
//     //   }
//     // }

//     let displayUrl = currentUrl;
//     if (typeof currentUrl === 'string' && currentUrl.includes('firebasestorage.googleapis.com')) {
//       try {
//         // Check if we have a cached proxied URL
//         displayUrl = await this.storageService.getProxiedUrl(currentUrl);
//       } catch (error) {
//         console.error('Error converting Firebase URL:', error);
//         displayUrl = currentUrl;
//       }
//     }

//     // Create styles object with nullish coalescing
//     const styles = {
//       'background-image': displayUrl ? `url(${displayUrl})` : 'none',
//       'background-position': `${Number(this.position.x ?? 0)}% ${Number(this.position.y ?? 0)}%`,
//       'background-repeat': 'no-repeat',
//       'background-size': `${(Number(this.zoomLevel ?? 1) * 100)}%`,
//       'background-color': '#c7ff20'
//     };

//     // Cache the result
//     this.imageTransformCache = {
//       url: currentUrl,
//       styles
//     };

//     // Add logging for final styles
//     console.log('Generated styles:', {
//       currentUrl,
//       displayUrl,
//       styles
//     });

//     // Update imageStyles property
//     this.imageStyles = styles;

//     return styles;

//   } catch (error) {
//     console.error('Error generating image styles:', error);
//     return this.getDefaultStyles();
//   }
// }

// async getProfileImageStyles(): Promise<any> {
//   try {
//     // Check if form is initialized
//     if (!this.pictureForm) {
//       return this.getDefaultStyles();
//     }

//     // Get and validate the current URL
//     const formUrl = this.pictureForm.get('imgUrl')?.value;
//     const currentUrl = typeof formUrl === 'string' ? formUrl : this.currentUser?.imgUrl || '';

//     // Add logging to debug URL handling
//     console.log('Current URL:', {
//       formUrl,
//       currentUrl,
//       userImgUrl: this.currentUser?.imgUrl
//     });

//     // Cache check with logging
//     if (this.imageTransformCache?.url === currentUrl) {
//       console.log('Using cached styles for URL:', currentUrl);
//       return this.imageTransformCache!.styles;
//     }

//     // Get settings with better error handling
//     let settings = this.currentUser.profilePictureSettings;
//     if (typeof settings === 'string') {
//       try {
//         settings = JSON.parse(settings);
//       } catch (e) {
//         console.warn('Error parsing settings, using defaults:', e);
//         settings = {
//           zoom: this.zoomLevel || 1,
//           x: this.position.x || 0,
//           y: this.position.y || 0
//         };
//       }
//     }

//     let displayUrl = currentUrl;
//     if (typeof currentUrl === 'string' && currentUrl.includes('firebasestorage.googleapis.com')) {
//       try {
//         // Get auth headers
//         const headers = await this.storageService.getAuthHeaders();
        
//         // Get proxied URL and fetch with auth
//         displayUrl = await this.storageService.getProxiedUrl(currentUrl);
//         const response = await fetch(displayUrl, { headers });
        
//         if (!response.ok) {
//           throw new Error('Failed to load image');
//         }

//         const blob = await response.blob();
//         displayUrl = URL.createObjectURL(blob);

//         // Clean up blob URL after a delay
//         setTimeout(() => URL.revokeObjectURL(displayUrl), 1000);
//       } catch (error) {
//         console.error('Error processing Firebase URL:', error);
//         displayUrl = currentUrl;
//       }
//     }

//     // Create styles object with nullish coalescing
//     const styles = {
//       'background-image': displayUrl ? `url(${displayUrl})` : 'none',
//       'background-position': `${Number(this.position.x ?? 0)}% ${Number(this.position.y ?? 0)}%`,
//       'background-repeat': 'no-repeat',
//       'background-size': `${(Number(this.zoomLevel ?? 1) * 100)}%`,
//       'background-color': '#c7ff20'
//     };

//     // Cache the result
//     this.imageTransformCache = {
//       url: currentUrl,
//       styles
//     };

//     // Add logging for final styles
//     console.log('Generated styles:', {
//       currentUrl,
//       displayUrl,
//       styles
//     });

//     // Update imageStyles property
//     this.imageStyles = styles;

//     return styles;

//   } catch (error) {
//     console.error('Error generating image styles:', error);
//     return this.getDefaultStyles();
//   }
// }

async getProfileImageStyles(): Promise<any> {
  try {
    // Check if form is initialized
    if (!this.pictureForm) {
      return this.getDefaultStyles();
    }

    // Get and validate the current URL
    const formUrl = this.pictureForm.get('imgUrl')?.value;
    const currentUrl = typeof formUrl === 'string' ? formUrl : this.currentUser?.imgUrl || '';

    // Add logging to debug URL handling
    console.log('Current URL:', {
      formUrl,
      currentUrl,
      userImgUrl: this.currentUser?.imgUrl,
      isStaged: currentUrl.includes('staging/')
    });

    // Cache check with logging
    if (this.imageTransformCache?.url === currentUrl) {
      console.log('Using cached styles for URL:', currentUrl);
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
      'background-color': '#c7ff20'
    };

    // Cache the result
    this.imageTransformCache = {
      url: currentUrl,  // Cache original URL, not blob URL
      styles
    };

    // Add logging for final styles
    console.log('Generated styles:', {
      originalUrl: currentUrl,
      displayUrl,
      isBlob: displayUrl.startsWith('blob:'),
      styles
    });

    // Update imageStyles property
    this.imageStyles = styles;

    return styles;

  } catch (error) {
    console.error('Error generating image styles:', error);
    return this.getDefaultStyles();
  }
}


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



// Add a helper method to determine if we're using a Firebase URL
private isFirebaseUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com');
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


// zoomIn() {
//   if (this.zoomLevel < this.maxZoom) {
//     this.zoomLevel += this.zoomStep;
//     this.zoomLevel = Math.min(this.zoomLevel, this.maxZoom);
//     this.isDefaultPosition = false;
//     this.updateImageTransform();
//   }
// }

// zoomOut() {
//   if (this.zoomLevel > this.minZoom) {
//     this.zoomLevel -= this.zoomStep;
//     this.zoomLevel = Math.max(this.zoomLevel, this.minZoom);
//     this.isDefaultPosition = this.zoomLevel === 1 && this.position.x === 0 && this.position.y === 0;
//     this.updateImageTransform();
//   }
// }

// zoomIn() {
//   if (this.zoomLevel < this.maxZoom) {
//     this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
//     this.isDefaultPosition = false;
//     // this.isDefaultPosition = this.zoomLevel === 1 && this.position.x === 0 && this.position.y === 0;
//     requestAnimationFrame(() => this.updateImageTransform());
//   }
// }

// zoomOut() {
//   if (this.zoomLevel > this.minZoom) {
//     this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
//     this.isDefaultPosition = this.zoomLevel === 1 && 
//                            this.position.x === 0 && 
//                            this.position.y === 0;
//     requestAnimationFrame(() => this.updateImageTransform());
//   }
// }

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
  if (button === 'reset') return this.isInDefaultPosition() && !this.isDragging;
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


// handleMouseEnter() {
//   if (this.currentState === ProfileState.ChangingPicture) {
//     this.hoverCount++;
//       if (this.hoverCount < 1) return;
//       else if (this.hoverCount > 1) {
//       this.canHoverDelete = true; // Enable hover capability after first mouseenter
//     }
//   }
// }

handleMouseEnter() {
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

private resetHoverState() {
  this.hoverCount = 0;
  this.canHoverDelete = false;
}

handleMouseLeave() {
  if (this.hoverCount === 1) {
    // If we leave during first hover, make sure hover is disabled
    this.canHoverDelete = false;
    this.cdr.detectChanges();
  }
}

getCancelButtonText(): string {
  return this.isInitialChangingPictureState ? 'Cancel' : 'Back';
}

private initializeDragging() {
  if (this.container && this.profileImg) {
    console.log('Container and profile image found, initializing dragging');
    this.setupDragListeners();
    // this.loadSavedPosition();
  }
}

// isInDefaultPosition(): boolean {
//   return this.isDefaultPosition;
// }

// isInDefaultPosition(): boolean {
//   if (!this.currentUser?.imgUrl && !this.imageManagementService.hasAnyFirebaseImages()) {
//     return true;
//   }
  
//   // Check both position and zoom level
//   const isDefaultZoom = this.zoomLevel === 1;
//   const isDefaultPosition = this.position.x === 0 && this.position.y === 0;
  
//   // Update the class field for performance
//   this.isDefaultPosition = isDefaultZoom && isDefaultPosition;
  
//   return this.isDefaultPosition;
// }

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

disableTooltip(): void {
  this.tooltipDisabled = true;
}

enableTooltip(): void {
  this.tooltipDisabled = false;
}

/*-----------------------------------------------------------------------*/


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


///// Google Firebase Image Upload Functions ///// 
async onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (!file) return;

  try {
    this.isUploading = true;
    this.showUploadSuccess = false;
    this.providerUrlPasted = false;
    this.uploadProgress = 0;
    console.log('1. Starting upload...');

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
    console.log('2. Got display URL:', displayUrl);

    // Set progress to 100% and wait briefly
    this.ngZone.run(() => {
      this.uploadProgress = 100;
      this.cdr.detectChanges();
    });

    // Wait for progress animation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get auth headers before entering NgZone
    const headers = await this.storageService.getAuthHeaders();
    console.log('3. Got auth headers');

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


private showError(message: string) {
  // Implement your error display logic here
  console.error(message);
  // Example: this.snackBar.open(message, 'Close', { duration: 3000 });
}

// private async updateProfileImageDisplay(imageUrl: string) {
//   try {
//     if (!this.profileImg?.nativeElement) {
//       console.error('Profile image element not found');
//       return;
//     }

//     console.log('Setting background image:', imageUrl);
    
//     // Add loading state
//     this.renderer.addClass(this.profileImg.nativeElement, 'loading');

//     // Fetch with auth headers
//     // const response = await fetch(imageUrl, {
//     //   headers: this.storageService.getAuthHeaders(),
//     //   credentials: 'include'
//     // });
//     const response = await fetch(imageUrl, {
//       headers: await this.storageService.getAuthHeaders(), // Await here to resolve the Promise
//       credentials: 'include'
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
//     }

//     const blob = await response.blob();
//     const objectUrl = URL.createObjectURL(blob);
    
//     const img = new Image();
    
//     await new Promise<void>((resolve, reject) => {
//       img.onload = () => {
//         this.ngZone.run(() => {
//           try {
//             this.profileImg.nativeElement.style.backgroundImage = `url(${objectUrl})`;
//             // Remove loading state
//             this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//             // Cleanup object URL
//             URL.revokeObjectURL(objectUrl);
//             this.cdr.detectChanges();
//             resolve();
//           } catch (error) {
//             reject(error);
//           }
//         });
//       };
      
//       img.onerror = (error) => {
//         URL.revokeObjectURL(objectUrl);
//         this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//         console.error('Error loading image:', error);
//         reject(error);
//       };
      
//       img.src = objectUrl;
//     });

//   } catch (error) {
//     console.error('Error updating image display:', error);
//     // Remove loading state on error
//     if (this.profileImg?.nativeElement) {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     }
//   }
// }

// private async updateProfileImageDisplay(imageUrl: string) {
//   if (!this.profileImg?.nativeElement) {
//     console.error('Profile image element not found');
//     return;
//   }

//   try {
//     // Add loading state
//     this.renderer.addClass(this.profileImg.nativeElement, 'loading');

//     // Get auth headers
//     const headers = await this.storageService.getAuthHeaders();

//     // Fetch image with auth headers and proper credentials
//     const response = await fetch(imageUrl, {
//       headers,
//       credentials: 'include'
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to load image: ${response.status}`);
//     }

//     // Convert to object URL
//     const blob = await response.blob();
//     const objectUrl = URL.createObjectURL(blob);

//     // Apply image in NgZone
//     this.ngZone.run(() => {
//       this.profileImg.nativeElement.style.backgroundImage = `url(${objectUrl})`;
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');

//       // Clean up old object URL after image loads
//       const img = new Image();
//       img.onload = () => {
//         URL.revokeObjectURL(objectUrl);
//       };
//       img.src = objectUrl;

//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error updating image display:', error);
//     this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     this.imageNotFound = true;
//   }
// }

// private async updateProfileImageDisplay(imageUrl: string) {
//   if (!this.profileImg?.nativeElement) {
//     console.error('Profile image element not found');
//     return;
//   }

//   try {
//     // Add loading state
//     this.renderer.addClass(this.profileImg.nativeElement, 'loading');

//     // Convert Firebase URL if needed
//     const displayUrl = await this.storageService.convertFirebaseUrl(imageUrl);

//     // Fetch with auth headers
//     const headers = await this.storageService.getAuthHeaders();
//     const response = await fetch(displayUrl, {
//       headers,
//       credentials: 'include'
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to load image: ${response.status}`);
//     }

//     const blob = await response.blob();
//     const objectUrl = URL.createObjectURL(blob);

//     // Apply image in NgZone
//     this.ngZone.run(() => {
//       this.profileImg.nativeElement.style.backgroundImage = `url(${displayUrl})`;
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       this.imageLoaded = true;
//       this.imageNotFound = false;

//       // Clean up old object URL after image loads
//       const img = new Image();
//       img.onload = () => {
//         URL.revokeObjectURL(objectUrl);
//       };
//       img.src = objectUrl;

//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error updating image display:', error);
//     this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//     this.imageNotFound = true;
//     this.imageLoaded = false;
//     this.cdr.detectChanges();
//   }
// }

// private async updateProfileImageDisplay(imageUrl: string) {
//   if (!this.profileImg?.nativeElement) {
//     console.error('Profile image element not found');
//     return;
//   }

//   try {
//     // Add loading state
//     this.renderer.addClass(this.profileImg.nativeElement, 'loading');

//     // Convert Firebase URL if needed and get from cache if available
//     const displayUrl = await this.storageService.convertFirebaseUrl(imageUrl);

//     // Verify image exists first with HEAD request
//     const headers = await this.storageService.getAuthHeaders();
//     const checkResponse = await fetch(displayUrl, { 
//       headers,
//       method: 'HEAD'
//     });

//     if (!checkResponse.ok) {
//       throw new Error(`Failed to verify image: ${checkResponse.status}`);
//     }

//     // Set the image URL directly and update styles
//     this.ngZone.run(() => {
//       // Update background image
//       this.profileImg.nativeElement.style.backgroundImage = `url("${displayUrl}")`;
      
//       // Update all styles to ensure consistency
//       this.imageStyles = {
//         'background-image': `url("${displayUrl}")`,
//         'background-position': `${this.position.x}% ${this.position.y}%`,
//         'background-repeat': 'no-repeat',
//         'background-size': `${this.zoomLevel * 100}%`,
//         'background-color': '#c7ff20'
//       };

//       // Update states
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       this.imageLoaded = true;
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = true;

//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error updating image display:', error);
//     this.ngZone.run(() => {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       this.imageNotFound = true;
//       this.imageLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

// private async updateProfileImageDisplay(imageUrl: string) {
//   if (!this.profileImg?.nativeElement) {
//     console.error('Profile image element not found');
//     return;
//   }

//   try {
//     // Add loading state
//     this.renderer.addClass(this.profileImg.nativeElement, 'loading');

//     // Convert Firebase URL if needed and get from cache if available
//     const displayUrl = await this.storageService.convertFirebaseUrl(imageUrl);

//     // Verify image exists first with HEAD request
//     const headers = await this.storageService.getAuthHeaders();
//     const checkResponse = await fetch(displayUrl, { 
//       headers,
//       method: 'HEAD'
//     });

//     if (!checkResponse.ok) {
//       throw new Error(`Failed to verify image: ${checkResponse.status}`);
//     }

//     // Set the image URL directly and update styles
//     this.ngZone.run(() => {
//       // Update background image and styles
//       this.profileImg.nativeElement.style.backgroundImage = `url("${displayUrl}")`;
      
//       // Update all styles to ensure consistency
//       this.imageStyles = {
//         'background-image': `url("${displayUrl}")`,
//         'background-position': `${this.position.x}% ${this.position.y}%`,
//         'background-repeat': 'no-repeat',
//         'background-size': `${this.zoomLevel * 100}%`,
//         'background-color': '#c7ff20'
//       };

//       // Update form with the actual URL, not the promise
//       this.pictureForm.patchValue({
//         imgUrl: displayUrl
//       }, { emitEvent: false });

//       // Update states
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       this.imageLoaded = true;
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = true;
//       this.currentUser.imgUrl = imageUrl; // Keep original URL in currentUser

//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error updating image display:', error);
//     this.ngZone.run(() => {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       this.imageNotFound = true;
//       this.imageLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.currentUser.imgUrl = null; // Clear the URL on error
//       this.cdr.detectChanges();
//     });
//   }
// }

// private async updateProfileImageDisplay(imageUrl: string) {
//   if (!this.profileImg?.nativeElement) return;

//   try {
//     this.renderer.addClass(this.profileImg.nativeElement, 'loading');
//     const displayUrl = await this.storageService.convertFirebaseUrl(imageUrl);

//     // Verify image exists
//     const headers = await this.storageService.getAuthHeaders();
//     const checkResponse = await fetch(displayUrl, { 
//       headers,
//       method: 'HEAD'
//     });

//     if (!checkResponse.ok) {
//       throw new Error(`Failed to verify image: ${checkResponse.status}`);
//     }

//     this.ngZone.run(() => {
//       // Update form with resolved URL
//       this.pictureForm.patchValue({
//         imgUrl: displayUrl
//       }, { emitEvent: false });

//       // Update image display
//       this.imageStyles = {
//         'background-image': `url("${displayUrl}")`,
//         'background-position': `${this.position.x}% ${this.position.y}%`,
//         'background-repeat': 'no-repeat',
//         'background-size': `${this.zoomLevel * 100}%`,
//         'background-color': '#c7ff20'
//       };

//       Object.assign(this.profileImg.nativeElement.style, this.imageStyles);

//       // Update states
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       this.imageLoaded = true;
//       this.imageNotFound = false;
//       this.imageLoadedSuccessfully = true;
//       this.currentUser.imgUrl = imageUrl;

//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error updating image display:', error);
//     this.ngZone.run(() => {
//       this.renderer.removeClass(this.profileImg.nativeElement, 'loading');
//       this.imageNotFound = true;
//       this.imageLoaded = false;
//       this.imageLoadedSuccessfully = false;
//       this.cdr.detectChanges();
//     });
//   }
// }

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

  // async initializeImageNavigation() {
  //   await this.imageManagementService.loadUserImages(this.userId);
  //   this.imageManagementService.getImageCount(this.userId).subscribe(count => {
  //     this.imageCount = count;
  //     this.showImageNavigation = count > 1;
  //   });

  //   this.imageManagementService.getCurrentImage(this.userId).subscribe(url => {
  //     if (url) {
  //       this.currentUser.imgUrl = url;
  //       this.updateImageTransform();
  //     }
  //   });
  // }

// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     // Load all images for the user
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Image count received:', count);
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//       console.log('showImageNavigation set to:', this.showImageNavigation);
//       this.cdr.detectChanges();
//     });

//     // Subscribe to current image
//     this.imageManagementService.getCurrentImage(this.userId).subscribe(async url => {
//       console.log('Current image URL:', url);
//       if (url) {
//         // Update the display with the new image
//         const displayUrl = await this.storageService.convertFirebaseUrl(url);
//         this.currentUser.imgUrl = url;
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//         await this.updateImageTransform();
//         this.cdr.detectChanges();
//       }
//     });
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }

// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {

//     // Store current profile image URL
//     const currentProfileUrl = this.currentUser.imgUrl;
//     console.log('Current profile image:', currentProfileUrl);

//     // Load all images first
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//       console.log('Navigation visibility updated:', {
//         newShowNav: this.showImageNavigation,
//         imageCount: this.imageCount
//       });
//       this.cdr.detectChanges();
//     });
    
//     // Subscribe to current image changes
//     this.imageManagementService.getCurrentImage(this.userId).subscribe(async newUrl => {
//     console.log('Current image changed:', { newUrl });
//     if (newUrl) {
//       const isFirstImage = this.imageManagementService.isFirstImage(this.userId);
//       console.log('Image position check:', { isFirstImage });
      
//       if (!isFirstImage) {
//         // Reset position and zoom for non-first images
//         this.currentUser.imgUrl = newUrl;
//         this.resetImagePositionAndZoom();
//       } else {
//         // Keep current position and zoom for first image (profile picture)
//         this.currentUser.imgUrl = newUrl;
//         this.updateImageTransform();
//       }
      
//       this.cdr.detectChanges();
//     }
//   });

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//     throw error;
//   }
// }

// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     // Store current image URL
//     const currentImageUrl = this.currentUser.imgUrl;
//     console.log('Current profile image:', currentImageUrl);

//     // If current image is from a provider, set it as temporary URL
//     if (currentImageUrl && this.imageManagementService.isProviderUrl(currentImageUrl)) {
//       console.log('Setting provider URL as temporary:', currentImageUrl);
//       this.imageManagementService.setTemporaryUrl(currentImageUrl);
//     } else {
//       // Clear any existing temporary URL if current image is from Firebase
//       this.imageManagementService.clearTemporaryUrl();
//     }

//     // Load all images
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//       console.log('Navigation visibility updated:', {
//         newShowNav: this.showImageNavigation,
//         imageCount: this.imageCount
//       });
//       this.cdr.detectChanges();
//     });

//     // Subscribe to current image changes
//     this.imageManagementService.getCurrentImage(this.userId).subscribe(async newUrl => {
//       console.log('Current image changed:', { newUrl });
//       if (newUrl) {
//         const isFirstImage = this.imageManagementService.isFirstImage(this.userId);
//         console.log('Image position check:', { isFirstImage });
        
//         if (!isFirstImage) {
//           // Reset position and zoom for non-first images
//           this.currentUser.imgUrl = newUrl;
//           this.resetImagePositionAndZoom();
//         } else {
//           // Keep current position and zoom for first image (profile picture)
//           this.currentUser.imgUrl = newUrl;
//           this.updateImageTransform();
//         }
        
//         this.cdr.detectChanges();
//       }
//     });

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//     throw error;
//   }
// // }

// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     // Store current image URL
//     const currentImageUrl = this.currentUser.imgUrl;
//     console.log('Current profile image:', currentImageUrl);

//     // If current image is from a provider, set it as temporary URL
//     if (currentImageUrl && this.imageManagementService.isProviderUrl(currentImageUrl)) {
//       console.log('Setting provider URL as temporary:', currentImageUrl);
//       this.imageManagementService.setTemporaryUrl(currentImageUrl);
//     }

//     // Load all images while maintaining current image
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//       this.cdr.detectChanges();
//     });

//     // Subscribe to current image changes
//     this.imageManagementService.getCurrentImage(this.userId).subscribe(async newUrl => {
//       console.log('Current image changed:', { newUrl });
//       if (newUrl) {
//         const isFirstImage = this.imageManagementService.isFirstImage(this.userId);
//         console.log('Image position check:', { isFirstImage });
        
//         // Only update if this is a legitimate change
//         if (newUrl !== this.currentUser.imgUrl) {
//           if (!isFirstImage) {
//             // Reset position and zoom for non-first images
//             this.currentUser.imgUrl = newUrl;
//             this.resetImagePositionAndZoom();
//           } else {
//             // Keep current position and zoom for first image (profile picture)
//             this.currentUser.imgUrl = newUrl;
//             this.updateImageTransform();
//           }
          
//           this.cdr.detectChanges();
//         }
//       }
//     });

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }


// //// most recent working
// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     // Store current image URL
//     const currentImageUrl = this.currentUser.imgUrl;
//     console.log('Current profile image:', currentImageUrl);

//     // If current image is from a provider, set it as temporary URL
//     if (currentImageUrl && this.imageManagementService.isProviderUrl(currentImageUrl)) {
//       console.log('Setting provider URL as temporary:', currentImageUrl);
//       this.imageManagementService.setTemporaryUrl(currentImageUrl);
//     }

//     // Load all images while maintaining current image
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//       this.cdr.detectChanges();
//     });

//     // Subscribe to current image changes
//     this.imageManagementService.getCurrentImage(this.userId).subscribe(async newUrl => {
//       console.log('Current image changed:', { newUrl });
//       if (newUrl) {
//         const isFirstImage = this.imageManagementService.isFirstImage(this.userId);
//         console.log('Image position check:', { isFirstImage });
        
//         // Only update if this is a legitimate change
//         if (this.normalizeUrl(newUrl) !== this.normalizeUrl(this.currentUser.imgUrl!)) {
//           if (!isFirstImage) {
//             // Reset position and zoom for non-first images
//             this.currentUser.imgUrl = newUrl;
//             this.resetImagePositionAndZoom();
//           } else {
//             // Keep current position and zoom for first image (profile picture)
//             this.currentUser.imgUrl = newUrl;
//             this.updateImageTransform();
//           }
          
//           this.cdr.detectChanges();
//         }
//       }
//     });

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }

// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     // Store current image URL
//     const currentImageUrl = this.currentUser.imgUrl;
//     console.log('Current profile image:', currentImageUrl);

//     // If current image is from a provider, set it as temporary URL
//     if (currentImageUrl && this.imageManagementService.isProviderUrl(currentImageUrl)) {
//       console.log('Setting provider URL as temporary:', currentImageUrl);
//       this.imageManagementService.setTemporaryUrl(currentImageUrl);
//     }

//     // Load all images while maintaining current image
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//       this.cdr.detectChanges();
//     });

//     // Subscribe to current image changes
//     this.imageManagementService.getCurrentImage(this.userId).subscribe(async newUrl => {
//       // console.log('Current image changed:', { newUrl });
//       if (newUrl) {
//         const isFirstImage = this.imageManagementService.isFirstImage(this.userId);
//         console.log('Image position check:', { isFirstImage });

//         // Update form URL regardless of change in actual image
//         this.ngZone.run(async () => {
//           // Get displayable URL
//           const displayUrl = await this.getDisplayableUrl(newUrl);
//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false }); // Prevent triggering input event
//           this.cdr.detectChanges();
//         });
        
//         // Only update if this is a legitimate change
//         if (this.normalizeUrl(newUrl) !== this.normalizeUrl(this.currentUser.imgUrl!)) {
//           if (!isFirstImage) {
//             // Reset position and zoom for non-first images
//             this.currentUser.imgUrl = newUrl;
//             this.resetImagePositionAndZoom();
//           } else {
//             // Keep current position and zoom for first image (profile picture)
//             this.currentUser.imgUrl = newUrl;
//             this.updateImageTransform();
//           }
          
//         }
//       }
//     });

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }

// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    
//     // First ensure we have the current image set correctly
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       // Get the current state
//       const currentState = subject.value;
      
//       // Convert URLs for comparison
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(url => 
//         this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );

//       if (currentIndex !== -1) {
//         // Update the state to maintain current image position
//         subject.next({
//           ...currentState,
//           currentIndex
//         });
//       }
//     }

//     // Now load all images while maintaining the current index
//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count after loading
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//     });

//     // Check if we're still on the first image
//     const hasStartedNav = this.hasStartedNavigating;
//     console.log('Image position check:', { isFirstImage: !hasStartedNav });

//     // Update display URL
//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrl(this.currentUser.imgUrl);
//       this.pictureForm.patchValue({
//         imgUrl: url
//       }, { emitEvent: false });
//     }

//     console.log('Image navigation initialization complete');

//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }
// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    
//     // First ensure we have the current image set correctly
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       // Get the current state
//       const currentState = subject.value;
      
//       // Convert URLs for comparison
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(url => 
//         this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );

//       if (currentIndex !== -1) {
//         console.log('Setting initial state with current image at index:', currentIndex);
//         // Update the state to maintain current image position
//         subject.next({
//           ...currentState,
//           currentIndex
//         });
//         // Force the current index to stick
//         await new Promise(resolve => setTimeout(resolve, 0));
//       }
//     }

//     // Now load all images while maintaining the current index
//     const previousState = subject.value;
//     const previousIndex = previousState.currentIndex;
//     console.log('State before loading:', { previousIndex });

//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Recheck index after loading
//     const newState = subject.value;
//     console.log('State after loading:', { 
//       newIndex: newState.currentIndex,
//       previousIndex: previousIndex
//     });

//     // If the index changed unexpectedly, restore it
//     if (previousIndex !== newState.currentIndex && !this.hasStartedNavigating) {
//       subject.next({
//         ...newState,
//         currentIndex: previousIndex
//       });
//     }
    
//     // Subscribe to image count after loading
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//     });

//     // Check if we're still on the first image
//     const hasStartedNav = this.hasStartedNavigating;
//     console.log('Image position check:', { 
//       isFirstImage: !hasStartedNav,
//       currentIndex: subject.value.currentIndex
//     });

//     // Update display URL using the current index
//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrl(this.currentUser.imgUrl);
//       if (url) {
//         this.pictureForm.patchValue({
//           imgUrl: url
//         }, { emitEvent: false });
//       }
//     }

//     console.log('Image navigation initialization complete');

//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }


// Working
// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    
//     // First ensure we have the current image set correctly
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       // Get the current state
//       const currentState = subject.value;
      
//       // Convert URLs for comparison
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(url => 
//         this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );

//       if (currentIndex !== -1) {
//         console.log('Setting initial state with current image at index:', currentIndex);
//         // Update the state to maintain current image position
//         subject.next({
//           ...currentState,
//           currentIndex
//         });
//         // Force the current index to stick
//         await new Promise(resolve => setTimeout(resolve, 0));
//       }
//     }

//     // Now load all images while maintaining the current index
//     const previousState = subject.value;
//     const expectedIndex = previousState.currentIndex;
//     const expectedUrl = this.currentUser.imgUrl ? 
//       this.imageManagementService.normalizeUrl(this.currentUser.imgUrl) : null;
    
//     console.log('State before loading:', { 
//       expectedIndex,
//       expectedUrl 
//     });

//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Recheck index after loading
//     const newState = subject.value;
//     const newIndex = newState.currentIndex;
    
//     console.log('State after loading:', { 
//       newIndex,
//       expectedIndex,
//       newUrl: newState.urls[newIndex] ? 
//         this.imageManagementService.normalizeUrl(newState.urls[newIndex]) : null,
//       expectedUrl
//     });

//     // Only restore if we moved away from our profile image
//     if (expectedUrl && newState.urls[newIndex] && 
//         this.imageManagementService.normalizeUrl(newState.urls[newIndex]) !== expectedUrl && 
//         !this.hasStartedNavigating) {
//       // Find our expected image in the new URLs
//       const correctIndex = newState.urls.findIndex(url => 
//         this.imageManagementService.normalizeUrl(url) === expectedUrl
//       );
      
//       if (correctIndex !== -1) {
//         console.log('Restoring to correct index:', correctIndex);
//         subject.next({
//           ...newState,
//           currentIndex: correctIndex
//         });
//       }
//     }
    
//     // // Rest of the method remains the same...
//     // this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//     //   console.log('Setting navigation visibility:', {
//     //     count,
//     //     previousShowNav: this.showImageNavigation
//     //   });
//     //   this.imageCount = count;
//     //   this.showImageNavigation = count > 1;
//     // });

//      // Subscribe to image changes to update URL input
//      this.imageManagementService.getCurrentImageUrl(this.userId)
//      .subscribe(async url => {
//        if (url) {
//          let displayUrl = url;
//          if (url.includes('firebasestorage.googleapis.com')) {
//            displayUrl = await this.storageService.convertFirebaseUrl(url);
//          }
//          this.pictureForm.patchValue({
//            imgUrl: displayUrl
//          }, { emitEvent: false });
//        }
//      });

//     const hasStartedNav = this.hasStartedNavigating;
//     console.log('Image position check:', { 
//       isFirstImage: !hasStartedNav,
//       currentIndex: subject.value.currentIndex
//     });

//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrl(this.currentUser.imgUrl);
//       if (url) {
//         this.pictureForm.patchValue({
//           imgUrl: url
//         }, { emitEvent: false });
//       }
//     }

//     console.log('Image navigation initialization complete');

//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }

// Working
// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {

//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    
//     // First ensure we have the current image set correctly
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       // Get the current state
//       const currentState = subject.value;
      
//       // Convert URLs for comparison
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(url => 
//         this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );

//       if (currentIndex !== -1) {
//         console.log('Setting initial state with current image at index:', currentIndex);
//         // Update the state to maintain current image position
//         subject.next({
//           ...currentState,
//           currentIndex
//         });
//         // Force the current index to stick
//         await new Promise(resolve => setTimeout(resolve, 0));
//       }
//     }

//     // Now load all images while maintaining the current index
//     const previousState = subject.value;
//     const expectedIndex = previousState.currentIndex;
//     const expectedUrl = this.currentUser.imgUrl ? 
//       this.imageManagementService.normalizeUrl(this.currentUser.imgUrl) : null;
    
//     console.log('State before loading:', { 
//       expectedIndex,
//       expectedUrl 
//     });

//     // await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count after loading
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//     });

//     // Subscribe to image changes to update URL input
//     // this.imageManagementService.getCurrentImageUrl(this.userId)
//     //   .subscribe(async url => {
//     //     if (url) {
//     //       let displayUrl = url;
//     //       if (url.includes('firebasestorage.googleapis.com')) {
//     //         displayUrl = await this.storageService.convertFirebaseUrl(url);
//     //       }
//     //       this.pictureForm.patchValue({
//     //         imgUrl: displayUrl
//     //       }, { emitEvent: false });
//     //     }
//     //   });
//     this.imageManagementService.getCurrentImageUrl(this.userId)
//     .subscribe(async url => {
//       if (url) {
//         // Never use blob URLs, always convert to proxied URLs
//         let displayUrl = url;
//         if (url.includes('firebasestorage.googleapis.com')) {
//           displayUrl = await this.storageService.convertFirebaseUrl(url);
//         } else if (url.startsWith('blob:')) {
//           // Convert blob URL to proxied URL
//           const pathMatch = url.match(/\/([^/]+)$/);
//           if (pathMatch) {
//             displayUrl = `${environment.apiUrl}/api/storage/profileImages/${this.userId}/${pathMatch[1]}`;
//           }
//         }

//         this.ngZone.run(() => {
//           this.pictureForm.patchValue({
//             imgUrl: displayUrl
//           }, { emitEvent: false });
//         });
//       }
//     });

//     const hasStartedNav = this.hasStartedNavigating;
//     console.log('Image position check:', { 
//       isFirstImage: !hasStartedNav,
//       currentIndex: subject.value.currentIndex
//     });

//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrl(this.currentUser.imgUrl);
//       if (url) {
//         this.pictureForm.patchValue({
//           imgUrl: url
//         }, { emitEvent: false });
//       }
//     }

//     console.log('Image navigation initialization complete');

//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }

// Latest working
// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     this.firebaseImageLoaded = false;

//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    
//     // Handle current image state first
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       const currentState = subject.value;
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(url => 
//         this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );

//       if (currentIndex !== -1) {
//         console.log('Setting initial state with current image at index:', currentIndex);
//         subject.next({
//           ...currentState,
//           currentIndex
//         });
//         await new Promise(resolve => setTimeout(resolve, 0));
//       } else if (currentState.urls.length === 0) {
//         // No images available, show avatar
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//       }
//     }

//     // Track state before loading
//     const previousState = subject.value;
//     const expectedIndex = previousState.currentIndex;
//     const expectedUrl = this.currentUser.imgUrl ? 
//       this.imageManagementService.normalizeUrl(this.currentUser.imgUrl) : null;
    
//     console.log('State before loading:', { 
//       expectedIndex,
//       expectedUrl 
//     });

//     // Subscribe to image count updates
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//     });

//     // Subscribe to current image updates
//     this.imageManagementService.getCurrentImageUrl(this.userId)
//       .subscribe(async url => {
//         if (url) {
//           let displayUrl = url;
//           if (url.includes('firebasestorage.googleapis.com')) {
//             displayUrl = await this.storageService.convertFirebaseUrl(url);
//           } else if (url.startsWith('blob:')) {
//             const pathMatch = url.match(/\/([^/]+)$/);
//             if (pathMatch) {
//               displayUrl = `${environment.apiUrl}/api/storage/profileImages/${this.userId}/${pathMatch[1]}`;
//             }
//           }

//           this.ngZone.run(() => {
//             this.pictureForm.patchValue({
//               imgUrl: displayUrl
//             }, { emitEvent: false });
//           });
//         } else {
//           // No image available, show avatar
//           this.resetImage();
//         }
//       });

//     const hasStartedNav = this.hasStartedNavigating;
//     console.log('Image position check:', { 
//       isFirstImage: !hasStartedNav,
//       currentIndex: subject.value.currentIndex
//     });

//     // Update current image if available
//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrl(this.currentUser.imgUrl);
//       if (url) {
//         this.pictureForm.patchValue({
//           imgUrl: url
//         }, { emitEvent: false });
//       }
//     }

//     console.log('Image navigation initialization complete');

//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//     // Fallback to avatar on error
//     this.resetImage();
//   }
// }

// Main method
// // async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     this.firebaseImageLoaded = false;
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);

//     // Handle current image state first
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       const currentState = subject.value;
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(url =>
//         this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );

//       if (currentIndex !== -1) {
//         console.log('Setting initial state with current image at index:', currentIndex);
//         subject.next({
//           ...currentState,
//           currentIndex
//         });
//         await new Promise(resolve => setTimeout(resolve, 0));
//       } else if (currentState.urls.length === 0) {
//         // No images available, show avatar
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//       }
//     }

//     // Track state before loading
//     const previousState = subject.value;
//     const expectedIndex = previousState.currentIndex;
//     const expectedUrl = this.currentUser.imgUrl ?
//       this.imageManagementService.normalizeUrl(this.currentUser.imgUrl) : null;

//     console.log('State before loading:', {
//       expectedIndex,
//       expectedUrl
//     });

//     // Subscribe to image count updates
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//     });

//     // Subscribe to current image updates
//     this.imageManagementService.getCurrentImageUrl(this.userId)
//       .subscribe(async url => {
//         if (url) {
//           let displayUrl = url;
//           if (url.includes('firebasestorage.googleapis.com')) {
//             displayUrl = await this.storageService.convertFirebaseUrl(url);
//           } else if (url.startsWith('blob:')) {
//             const pathMatch = url.match(/\/([^/]+)$/);
//             if (pathMatch) {
//               displayUrl = `${environment.apiUrl}/api/storage/profileImages/${this.userId}/${pathMatch[1]}`;
//             }
//           }

//           // Wait for image to load before updating UI
//           await new Promise<void>((resolve) => {
//             const img = new Image();
//             img.onload = () => {
//               this.ngZone.run(() => {
//                 this.pictureForm.patchValue({
//                   imgUrl: displayUrl
//                 }, { emitEvent: false });
//                 setTimeout(() => {
//                   this.firebaseImageLoaded = true;
//                 }, 150)
//                 this.cdr.detectChanges();
//                 resolve();
//               });
//             };
//             img.src = displayUrl;
//           });
//         } else {
//           // No image available, show avatar
//           this.resetImage();
//         }
//       });

//     const hasStartedNav = this.hasStartedNavigating;
//     console.log('Image position check:', {
//       isFirstImage: !hasStartedNav,
//       currentIndex: subject.value.currentIndex
//     });

//     // Update current image if available
//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrl(this.currentUser.imgUrl);
//       if (url) {
//         this.pictureForm.patchValue({
//           imgUrl: url
//         }, { emitEvent: false });
//       }
//     }

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//     // Fallback to avatar on error
//     this.resetImage();
//   }
// }

// Main method 2
// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     this.firebaseImageLoaded = false;
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);

//     // Set currentIndex if current image exists
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       const currentState = subject.value;
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(
//         url => this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );

//       if (currentIndex !== -1) {
//         console.log('Setting initial state with current image at index:', currentIndex);
//         subject.next({ ...currentState, currentIndex });
//       } else if (currentState.urls.length === 0) {
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//       }
//     }

//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', { count, previousShowNav: this.showImageNavigation });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//     });

//     // At this point, images are already preloaded
//     // If needed, you can directly set firebaseImageLoaded = true without re-checking the image
//     this.firebaseImageLoaded = true;

//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
//       this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
//     }

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//     this.resetImage();
//   }
// }

// Latest working
// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     // This indicates we won't do any further .onload checks
//     this.firebaseImageLoaded = true; 

//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);

//     // If there's a current user image and we haven't navigated yet, align the index
//     if (this.currentUser.imgUrl && !this.hasStartedNavigating) {
//       const currentState = subject.value;
//       const normalizedCurrentUrl = this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
//       const currentIndex = currentState.urls.findIndex(
//         url => this.imageManagementService.normalizeUrl(url) === normalizedCurrentUrl
//       );
//       if (currentIndex !== -1) {
//         console.log('Setting initial state with current image at index:', currentIndex);
//         subject.next({ ...currentState, currentIndex });
//       } else if (currentState.urls.length === 0) {
//         // If no images exist, fallback to avatar
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//       }
//     }

//     // Subscribe to image count for navigation
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', { 
//         count, 
//         previousShowNav: this.showImageNavigation 
//       });
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
//       this.cdr.detectChanges();
//     });

//     // If we need to patch the form with the final display URL, do it once:
//     if (this.currentUser.imgUrl) {
//       const url = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
//       this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
//     }

//     console.log('Image navigation initialization complete');
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//     // If we can’t navigate or we fail to load user images, revert to an avatar
//     this.resetImage();
//   }
// }

async initializeImageNavigation() {
  console.log('Starting image navigation initialization');
  try {
    // Get initial count before setting loading state
    const initialCount = await firstValueFrom(
      this.imageManagementService.getImageCount(this.userId)
    );
    
    const hasProviderProfileImage = this.currentUser?.imgUrl && 
                                  this.imageManagementService.isProviderUrl(this.currentUser.imgUrl);
    this.stableImageCount = hasProviderProfileImage ? initialCount + 1 : initialCount;
    
    // Now set loading states
    this.isLoadingImages = true;
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
        console.log('Setting initial state with current image at index:', currentIndex);
        subject.next({ ...currentState, currentIndex });
      } else if (currentState.urls.length === 0) {
        // If no images exist, fallback to avatar
        this.currentUser.imgUrl = null;
        this.resetImage();
      }
    }

    // Subscribe to image count for navigation
    this.imageManagementService.getImageCount(this.userId).subscribe(count => {
      console.log('Setting navigation visibility:', { 
        count, 
        previousShowNav: this.showImageNavigation 
      });
      this.imageCount = count;
      this.showImageNavigation = count > 1;
      this.cdr.detectChanges();
    });

    // If we need to patch the form with the final display URL, do it once:
    if (this.currentUser.imgUrl) {
      const url = await this.getDisplayableUrlOnce(this.currentUser.imgUrl);
      this.pictureForm.patchValue({ imgUrl: url }, { emitEvent: false });
    }

    console.log('Image navigation initialization complete');
  } catch (error) {
    console.error('Error initializing image navigation:', error);
    // If we can't navigate or we fail to load user images, revert to an avatar
    this.resetImage();
  }
}

// private shouldApplyStoredTransforms(): boolean {
//   // Only apply stored transforms if:
//   // 1. We haven't started navigating yet
//   // 2. The current image is the profile image
//   return !this.hasStartedNavigating && 
//          this.imageManagementService.isProfileImage(
//            this.userId, 
//            this.currentUser.imgUrl!
//          );
// }

private normalizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Remove any protocol, domain, and storage prefix to compare just the paths
    return url
      .replace(/^https?:\/\//, '')  // Remove protocol
      .replace(/[^/]+\//, '')       // Remove domain
      .replace(/^.*?(profileImages\/)/, 'profileImages/') // Normalize storage path
      .replace(/\?.*$/, '');        // Remove query parameters
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return url;
  }
}

// private async getDisplayableUrl(url: string): Promise<string> {
//   if (!url) return '';

//   console.log('Converting URL for display:', { originalUrl: url });

//   let displayUrl = url;
  
//   // If it's a Firebase URL, convert it to a proxied URL
//   if (url.includes('firebasestorage.googleapis.com')) {
//     displayUrl = await this.storageService.convertFirebaseUrl(url);
//     console.log('Converted Firebase URL:', { displayUrl });
//   }

//   // If it's already a proxied URL, keep it as is
//   if (url.includes('/api/storage/')) {
//     console.log('Using proxied URL as is');
//     return url;
//   }

//   // For provider URLs (like Unsplash), return as is
//   if (this.imageManagementService.isProviderUrl(url)) {
//     console.log('Using provider URL as is');
//     return url;
//   }

//   // Default case - return the URL as is
//   console.log('Using default URL:', { displayUrl });
//   return displayUrl;
// }

private async getDisplayableUrl(url: string): Promise<string> {
  console.log('Converting URL for display:', { originalUrl: url });

  // If it's a Firebase URL, convert it
  if (url.includes('firebasestorage.googleapis.com')) {
    return await this.storageService.convertFirebaseUrl(url);
  }

  // If it's already a proxied URL, use it as is
  if (url.includes('/api/storage/')) {
    console.log('Using proxied URL as is');
    return url;
  }

  // For provider URLs, return as is
  if (this.imageManagementService.isProviderUrl(url)) {
    console.log('Using provider URL as is');
    return url;
  }

  // Default case - convert to proxied URL
  return await this.storageService.convertFirebaseUrl(url);
}

// async initializeImageNavigation() {
//   console.log('Starting image navigation initialization');
//   try {
//     // Get current image URL before loading all images
//     const currentImageUrl = this.currentUser.imgUrl;
//     console.log('Current image before navigation:', currentImageUrl);

//     await this.imageManagementService.loadUserImages(this.userId);
    
//     // Subscribe to image count
//     this.imageManagementService.getImageCount(this.userId).subscribe(count => {
//       console.log('Setting navigation visibility:', {
//         count,
//         previousShowNav: this.showImageNavigation
//       });
      
//       this.imageCount = count;
//       this.showImageNavigation = count > 1;
      
//       // If we have the current image, make sure it's the first one
//       if (count > 0 && currentImageUrl) {
//         this.imageManagementService.setInitialImage(this.userId, currentImageUrl);
//       }
      
//       this.cdr.detectChanges();
//     });

//     // ... rest of the method
//   } catch (error) {
//     console.error('Error initializing image navigation:', error);
//   }
// }

  // async deleteCurrentImage() {
  //   try {
  //     await this.imageManagementService.deleteCurrentImage(this.userId);
  //     if (this.imageCount === 0) {
  //       this.currentUser.imgUrl = null;
  //       // this.onlyFirebaseImageCount--;
  //       this.resetImage();        
  //     }
  //   } catch (error) {
  //     console.error('Error deleting image:', error);
  //   }
  // }

  // that kind of works, but the db is still not being updated to null

// async deleteCurrentImage() {
//   try {
//     // Get current state before deletion
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
//     const isFirebaseImage = !this.imageManagementService.isProviderUrl(previousState.currentUrl!);

//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     // Decrement counter if it was a Firebase image
//     if (isFirebaseImage) {
//       this.onlyFirebaseImageCount = Math.max(0, this.onlyFirebaseImageCount - 1);
//     }

//     // Get new state after deletion
//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     this.ngZone.run(async () => {
//       if (!newState.hasImages) {
//         // No images left, show avatar and update database
//         this.currentUser.imgUrl = null;
//         this.resetImage();
        
//         // Update the database to set imgUrl to null
//         const updatedUser = {
//           ...this.currentUser,
//           imgUrl: null,
//           profilePictureSettings: null
//         };
//         await firstValueFrom(this.userService.updateUser(updatedUser));
        
//       } else if (wasProfileImage) {
//         // If we deleted the profile image, update with the next image
//         const updatedUser = {
//           ...this.currentUser,
//           imgUrl: newState.currentUrl
//         };
//         await firstValueFrom(this.userService.updateUser(updatedUser));
//       }

//       // Update original profile image reference
//       this.originalProfileImage = this.currentUser.imgUrl!;
      
//       this.showUploadSuccess = false;
//       this.hasStartedNavigating = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     // Handle error state
//     this.imageNotFound = false; // Reset error state
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

// async deleteCurrentImage() {
//   try {
//     // Get current state before deletion
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
//     const isFirebaseImage = !this.imageManagementService.isProviderUrl(previousState.currentUrl!);
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     // Decrement counter if it was a Firebase image
//     if (isFirebaseImage) {
//       this.onlyFirebaseImageCount = Math.max(0, this.onlyFirebaseImageCount - 1);
//     }

//     // Get new state after deletion
//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     this.ngZone.run(async () => {
//       if (!newState.hasImages) {
//         // No images left, show avatar and update database
//         this.currentUser.imgUrl = null;
//         this.resetImage();
        
//         // Update the database to set imgUrl to null
//         const updatedUser = {
//           ...this.currentUser,
//           imgUrl: null,
//           profilePictureSettings: null
//         };
//         await firstValueFrom(this.userService.updateUser(updatedUser));
//       }

//       // Don't update database with new image yet - wait for user to save
//       if (wasProfileImage) {
//         // Just update the UI state without saving to database
//         this.currentUser.imgUrl = newState.currentUrl;
//       }

//       // Set flag to indicate deletion occurred
//       this.originalProfileImage = null; // Clear original image reference
      
//       this.showUploadSuccess = false;
//       this.hasStartedNavigating = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     // Handle error state
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
//     const isFirebaseImage = !this.imageManagementService.isProviderUrl(previousState.currentUrl!);
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     if (isFirebaseImage) {
//       this.onlyFirebaseImageCount = Math.max(0, this.onlyFirebaseImageCount - 1);
//     }

//     this.ngZone.run(async () => {
//       // Set deletion flag
//       this.imageWasDeleted = true;
//       this.originalProfileImage = null;

//       if (!previousState.hasImages) {
//         // No images left
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//         await this.updateDatabaseToNull();
//       } else if (wasProfileImage) {
//         // Just update UI state temporarily
//         const newState = this.imageManagementService.getCurrentState(this.userId);
//         this.currentUser.imgUrl = newState.currentUrl;
//         // Don't update database yet - wait for save
//       }

//       this.showUploadSuccess = false;
//       this.hasStartedNavigating = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

// Main method
// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
//     const isFirebaseImage = !this.imageManagementService.isProviderUrl(previousState.currentUrl!);
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     if (isFirebaseImage) {
//       this.onlyFirebaseImageCount = Math.max(0, this.onlyFirebaseImageCount - 1);
//     }

//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     this.ngZone.run(async () => {
//       this.imageWasDeleted = true;
//       this.originalProfileImage = null;

//       if (!newState.hasImages) {
//         this.isInitialChangingPictureState = false;
//         this.currentUser.imgUrl = null;
//         this.imageStyles = {
//           'background-image': 'none',
//           'background-position': `${this.position.x}% ${this.position.y}%`,
//           'background-repeat': 'no-repeat',
//           'background-size': `${this.zoomLevel * 100}%`,
//           'background-color': '#c7ff20'
//         };
//         this.resetImage();
//         await this.updateDatabaseToNull();
//       } else if (wasProfileImage) {
//         this.currentUser.imgUrl = newState.currentUrl;
//       }

//       this.showUploadSuccess = false;
//       this.hasStartedNavigating = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     // Update form and UI based on new state
//     this.ngZone.run(async () => {
//       if (!newState.hasImages) {
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//         await this.updateDatabaseToNull();
//       } else {
//         // Get the new current URL
//         const currentUrl = await firstValueFrom(
//           this.imageManagementService.getCurrentImage(this.userId)
//         );
        
//         if (currentUrl) {
//           // Update form with new URL
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

// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const urlBeingDeleted = previousState.currentUrl; 
//     const wasProfileImage = this.currentUser.imgUrl === urlBeingDeleted;

//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     console.log('URL being deleted:', urlBeingDeleted);
//     console.log('temporaryUrl:', this.imageManagementService.temporaryUrl);

//     // Only clear the temporary URL if the one you're deleting is that *same* ephemeral provider URL.
//     // if (this.imageManagementService.isProviderUrl(urlBeingDeleted!)) {
//     //   console.log('Clearing temporary URL');
//     //   this.imageManagementService.clearTemporaryUrl();
//     //   this.imageManagementService.temporaryUrl = null;
//     // }

//     // Now get the new state
//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     this.ngZone.run(async () => {
//       if (!newState.hasImages) {
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//         await this.updateDatabaseToNull();
//       } else {
//         const currentUrl = await firstValueFrom(
//           this.imageManagementService.getCurrentImage(this.userId)
//         );
//         if (currentUrl) {
//           this.pictureForm.patchValue({ imgUrl: currentUrl }, { emitEvent: false });
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

// Testing
// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     // Update form and UI based on new state
//     this.ngZone.run(async () => {
//       if (!newState.hasImages) {
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//         await this.updateDatabaseToNull();
//       } else {
//         // Get the new current URL
//         const currentUrl = await firstValueFrom(
//           this.imageManagementService.getCurrentImage(this.userId)
//         );
        
//         if (currentUrl) {
//           // Update form with new URL
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

async deleteCurrentImage() {
  try {
    const previousState = this.imageManagementService.getCurrentState(this.userId);
    const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
    
    await this.imageManagementService.deleteCurrentImage(this.userId);
    const newState = this.imageManagementService.getCurrentState(this.userId);

    // Update form and UI based on new state
    this.ngZone.run(async () => {
      if (!newState.hasImages) {
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
        const currentUrl = await firstValueFrom(
          this.imageManagementService.getCurrentImage(this.userId)
        );
        
        if (currentUrl) {
          this.pictureForm.patchValue({
            imgUrl: currentUrl
          }, { emitEvent: false });
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

// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
//     const isProviderUrl = this.imageManagementService.isProviderUrl(previousState.currentUrl!);
//     const isFirebaseImage = !isProviderUrl;
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     if (isFirebaseImage) {
//       this.onlyFirebaseImageCount = Math.max(0, this.onlyFirebaseImageCount - 1);
//     }

//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     this.ngZone.run(async () => {
//       this.imageWasDeleted = true;
      
//       // If we deleted a provider URL (Unsplash)
//       if (isProviderUrl) {
//         // Clear it from temporary storage
//         this.imageManagementService.clearTemporaryUrl();
        
//         // If it was the profile picture, clear it properly
//         if (wasProfileImage) {
//           this.currentUser.imgUrl = null;
//           this.originalProfileImage = null;
//           await this.updateDatabaseToNull();
          
//           // Clear the form
//           this.pictureForm.patchValue({ imgUrl: null }, { emitEvent: false });
          
//           // Reset image display
//           this.imageStyles = {
//             'background-image': 'none',
//             'background-position': `${this.position.x}% ${this.position.y}%`,
//             'background-repeat': 'no-repeat',
//             'background-size': `${this.zoomLevel * 100}%`,
//             'background-color': '#c7ff20'
//           };
//         }
//       }

//       if (!newState.hasImages) {
//         this.currentUser.imgUrl = null;
//         this.resetImage();
//         await this.updateDatabaseToNull();
//       }

//       this.showUploadSuccess = false;
//       this.hasStartedNavigating = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
//     const isFirebaseImage = !this.imageManagementService.isProviderUrl(previousState.currentUrl!);
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     if (isFirebaseImage) {
//       this.onlyFirebaseImageCount = Math.max(0, this.onlyFirebaseImageCount - 1);
//     }

//     this.ngZone.run(async () => {
//       if (wasProfileImage) {
//         // Always set to null if we deleted the profile image
//         this.currentUser.imgUrl = null;
//         this.originalProfileImage = null;
        
//         // Update database immediately
//         const updatedUser = {
//           ...this.currentUser,
//           imgUrl: null,
//           profilePictureSettings: null
//         };
//         await firstValueFrom(this.userService.updateUser(updatedUser));
        
//         // Reset UI to show avatar
//         this.resetImage();
//         this.imageNotFound = false;
//       }

//       this.showUploadSuccess = false;
//       this.hasStartedNavigating = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

// async deleteCurrentImage() {
//   try {
//     const previousState = this.imageManagementService.getCurrentState(this.userId);
//     const wasProfileImage = this.currentUser.imgUrl === previousState.currentUrl;
//     const isFirebaseImage = !this.imageManagementService.isProviderUrl(previousState.currentUrl!);
    
//     await this.imageManagementService.deleteCurrentImage(this.userId);

//     if (isFirebaseImage) {
//       this.onlyFirebaseImageCount = Math.max(0, this.onlyFirebaseImageCount - 1);
//     }

//     const newState = this.imageManagementService.getCurrentState(this.userId);

//     this.ngZone.run(async () => {
//       if (wasProfileImage) {
//         // Just update the UI with next image, don't save to database
//         if (newState.hasImages) {
//           const displayUrl = await this.storageService.convertFirebaseUrl(newState.currentUrl!);
//           this.pictureForm.patchValue({ 
//             imgUrl: displayUrl 
//           }, { emitEvent: false });
//         }
        
//         // Mark original as deleted
//         this.originalProfileImage = null;
//       }

//       this.showUploadSuccess = false;
//       this.hasStartedNavigating = false;
//       this.cdr.detectChanges();
//     });

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     this.imageNotFound = false;
//     this.currentUser.imgUrl = null;
//     this.resetImage();
//   }
// }

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

// async nextImage() {
//     if (this.rightClicked) return;
    
//     try {
//       this.rightClicked = true;
//       this.hasStartedNavigating = true;
//       this.showUploadSuccess = false;
//       this.resetImagePositionAndZoomDuringNavigation();

//       // if(this.imageManagementService.isProviderUrl(this.pictureForm.get('imgUrl')?.value)) {
//       //   this.pictureForm.patchValue({ imgUrl: this.pictureForm.get('imgUrl')?.value }, { emitEvent: false });
//       // } else {

//       // // Get the original storage path
//       // const originalPath = await this.imageManagementService.getOriginalPath(this.userId, 
//       // this.imageManagementService.getUserImagesSubject(this.userId).value.currentIndex);
      
//       // if (originalPath) {
//       //   // Generate the proper API URL format
//       //   const displayUrl = `${environment.apiUrl}/api/storage/${originalPath}`;
//       //   this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//       // }

//       // }

//     await this.imageManagementService.nextImage(this.userId);
      
//     } catch (error) {
//       console.error('Error navigating to next image:', error);
//     } finally {
//       setTimeout(() => {
//         this.rightClicked = false;
//         this.cdr.detectChanges();
//       }, 0);
//     }
// }


// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;

//     this.resetImagePositionAndZoomDuringNavigation();

//     // if(this.imageManagementService.isProviderUrl(this.pictureForm.get('imgUrl')?.value)) {
//     //   this.pictureForm.patchValue({ imgUrl: this.pictureForm.get('imgUrl')?.value }, { emitEvent: false });
//     // } else {
//     //     // Get the original storage path
//     //     const originalPath = await this.imageManagementService.getOriginalPath(this.userId, 
//     //     this.imageManagementService.getUserImagesSubject(this.userId).value.currentIndex);
      
//     //   if (originalPath) {
//     //     // Generate the proper API URL format
//     //     const displayUrl = `${environment.apiUrl}/api/storage/${originalPath}`;
//     //     this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//     //   }
//     // }

//     await this.imageManagementService.previousImage(this.userId);
    
//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.cdr.detectChanges();
//     }, 0);
//   }
// }

// Latest WORKING
// async nextImage() {
//   if (this.rightClicked) return;
  
//   try {
//     this.rightClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Get subject before navigation
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
    
//     // Calculate next index
//     const nextIndex = (currentState.currentIndex + 1) % currentState.urls.length;
//     const nextUrl = currentState.urls[nextIndex];

//     // Navigate first
//     await this.imageManagementService.nextImage(this.userId);

//     // Update form with the correct URL based on type
//     if (this.imageManagementService.isProviderUrl(nextUrl)) {
//       // For provider URLs, use the URL directly
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//     } else {
//       // For Firebase URLs, get the proper API URL
//       const originalPath = await this.imageManagementService.getOriginalPath(
//         this.userId,
//         nextIndex
//       );
      
//       if (originalPath) {
//         const displayUrl = `${environment.apiUrl}/api/storage/${originalPath}`;
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//       }
//     }

//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     setTimeout(() => {
//       this.rightClicked = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Get subject before navigation
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
    
//     // Calculate previous index
//     const prevIndex = (currentState.currentIndex - 1 + currentState.urls.length) % currentState.urls.length;
//     const prevUrl = currentState.urls[prevIndex];

//     // Navigate first
//     await this.imageManagementService.previousImage(this.userId);

//     // Update form with the correct URL based on type
//     if (this.imageManagementService.isProviderUrl(prevUrl)) {
//       // For provider URLs, use the URL directly
//       this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
//     } else {
//       // For Firebase URLs, get the proper API URL
//       const originalPath = await this.imageManagementService.getOriginalPath(
//         this.userId,
//         prevIndex
//       );
      
//       if (originalPath) {
//         const displayUrl = `${environment.apiUrl}/api/storage/${originalPath}`;
//         this.pictureForm.patchValue({ imgUrl: displayUrl }, { emitEvent: false });
//       }
//     }

//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

// Latest Working
// async nextImage() {
//   if (this.rightClicked) return;
  
//   try {
//     this.rightClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Navigate first
//     this.imageManagementService.nextImage(this.userId);

//     // After navigation, get the updated state
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;

//     const newIndex = currentState.currentIndex;
//     const nextUrl = currentState.urls[newIndex];

//     // Update form with the new URL directly
//     this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
    
//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     setTimeout(() => {
//       this.rightClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

// Latest Working
// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Navigate first
//     this.imageManagementService.previousImage(this.userId);

//     // After navigation, get the updated state
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;

//     const newIndex = currentState.currentIndex;
//     const prevUrl = currentState.urls[newIndex];

//     // Update form with the new URL directly
//     this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
    
//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

// Working
// async nextImage() {
//   if (this.rightClicked) return;
  
//   try {
//     this.rightClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // --- 1) The old image URL
//     const oldUrl = this.pictureForm.get('imgUrl')?.value || '';

//     // --- 2) Navigate
//     this.imageManagementService.nextImage(this.userId);

//     // After navigation, get the updated state
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
//     const newIndex = currentState.currentIndex;
//     const nextUrl = currentState.urls[newIndex] || '';

//     // --- 3) Store the old/new URLs for the sliding animation
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = nextUrl;

//     // --- 4) Trigger the "slide-right" animation
//     this.newImageStartingClass = 'start-slide-right';
//     this.isSlidingRight = true;
//     this.isSlidingLeft = false;

//     // --- 5) Temporarily patch the form with the new URL
//     // but do NOT immediately switch the real background (we'll do that after animation).
//     this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
    
//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     setTimeout(() => {
//       this.rightClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

// Working
// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     const oldUrl = this.pictureForm.get('imgUrl')?.value || '';
//     this.imageManagementService.previousImage(this.userId);

//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
//     const newIndex = currentState.currentIndex;
//     const prevUrl = currentState.urls[newIndex] || '';

//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = prevUrl;

//     // Trigger the slide-left animation
//     this.newImageStartingClass = 'start-slide-left';
//     this.isSlidingLeft = true;
//     this.isSlidingRight = false;

//     this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
    
//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

/**
 * Called when the CSS animation finishes (via (animationend) on mat-card).
 * Use this to do final cleanup: actually set the mat-card's background-image
 * to the new URL, remove the sliding classes, etc.
 */
// onSlideAnimationEnd(event: AnimationEvent) {
//   // 1) Remove the classes
//   this.isSlidingRight = false;
//   this.isSlidingLeft = false;

//   // 2) Actually update the mat-card’s real background to the new URL 
//   // so that the pseudo-elements aren’t needed
//   if (this.newBackgroundUrl) {
//     this.imageStyles['background-image'] = `url('${this.newBackgroundUrl}')`;
//   }
//   // 3) Clear the old/new references
//   this.oldBackgroundUrl = null;
//   this.newBackgroundUrl = null;
// }

// Last working
// onSlideAnimationEnd(event: TransitionEvent) {
//   // If we only want to handle the transitionend from the ::after pseudo-element,
//   // check something like this (pseudo-code!):
//   const element = event.target as HTMLElement;  
  
//   // Often, event.target will be the mat-card itself or the pseudo-element.
//   // You can inspect event.propertyName === 'transform' to be sure it’s the transform ending.
//   // If you want to handle only the ::after, you can do e.g.:
//   if (element.matches('.profilePicture::after') || element === this.profileImg.nativeElement /* if that’s what's happening */) {
//     this.finalizeSlideAnimation();
//   }
// }

// last working
// finalizeSlideAnimation() {
//   this.isSlidingRight = false;
//   this.isSlidingLeft = false;

//   if (this.newBackgroundUrl) {
//     this.imageStyles['background-image'] = `url('${this.newBackgroundUrl}')`;
//   }

//   this.oldBackgroundUrl = null;
//   this.newBackgroundUrl = null;
// }

// Last working animation code
// async nextImage() {
//   if (this.rightClicked) return;
  
//   try {
//     this.rightClicked = true;
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

//     // 3) Prepare for slide-right
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = nextUrl;

//     this.newImageStartingClass = 'start-slide-right';
//     this.isSlidingRight = true;
//     this.isSlidingLeft = false;

//     // 4) Temporarily patch new URL in form (don't set real bg yet)
//     this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
    
//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     setTimeout(() => {
//       this.rightClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
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

//     // 3) Prepare for slide-left
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = prevUrl;

//     this.newImageStartingClass = 'start-slide-left';
//     this.isSlidingLeft = true;
//     this.isSlidingRight = false;

//     // 4) Temporarily patch new URL in form
//     this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
    
//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.isNavigating = false;
//       this.cdr.detectChanges();
//     }, 200);
//   }
// }

// onSlideAnimationEnd(event: TransitionEvent) {
//   // We only want to finalize once, typically for the ::after transform transition
//   const element = event.target as HTMLElement;

//   // Example check: propertyName === 'transform'
//   // or if you want to ensure it's specifically the new image 
//   // (some browsers won't let you easily match pseudo-elements):
//   if (event.propertyName === 'transform') {
//     this.finalizeSlideAnimation();
//   }
// }

// finalizeSlideAnimation() {
//   this.isSlidingRight = false;
//   this.isSlidingLeft = false;
//   this.newImageStartingClass = '';

//   if (this.newBackgroundUrl) {
//     this.imageStyles['background-image'] = `url('${this.newBackgroundUrl}')`;
//   }

//   this.oldBackgroundUrl = null;
//   this.newBackgroundUrl = null;
// }

////animation working with glitches////
// async nextImage() {
//   if (this.rightClicked) return;
  
//   try {
//     this.rightClicked = true;
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

//     // 3) Prepare for slide-right
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = nextUrl;

//     this.newImageStartingClass = 'start-slide-right';
//     this.xDirection = '100%';
//     this.cdr.detectChanges();

//     // B) Animate in
//     requestAnimationFrame(() => {
//       this.isSlidingRight = true; 
//       this.isSlidingLeft = false;
     
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//     });

//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     setTimeout(() => {
//       this.rightClicked = false;
//       this.isNavigating = false;
//       // this.xDirection = '';
//       this.cdr.detectChanges();
//     }, 400);
//   }
// }

// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
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

//     // 3) Prepare for slide-left
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = prevUrl;

//     this.newImageStartingClass = 'start-slide-left';
//     this.xDirection = '-100%';
//     // Force detection so the browser sees the .start-slide-left state
//     this.cdr.detectChanges();

//     // Step B: in the next animation frame, apply the slide
//     requestAnimationFrame(() => {
//       // Actually trigger the slide-left
//       this.isSlidingLeft = true;
//       this.isSlidingRight = false;

//       // setTimeout(()=>{
//       //   this.xDirection = '';
//       // }, 0);

//       // Patch new URL
//       this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
//     });
    
//     this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     setTimeout(() => {
//       this.leftClicked = false;
//       this.isNavigating = false;
//       // this.xDirection = '';
//       this.cdr.detectChanges();
//     }, 400);
//   }
// }

// onSlideAnimationEnd(event: TransitionEvent) {
//   // We only want to finalize once, typically for the ::after transform transition
//   const element = event.target as HTMLElement;

//   // Example check: propertyName === 'transform'
//   // or if you want to ensure it's specifically the new image 
//   // (some browsers won't let you easily match pseudo-elements):
//   if (event.propertyName === 'transform') {
//     this.finalizeSlideAnimation();
//   }
// }

// finalizeSlideAnimation() {
//   this.isSlidingRight = false;
//   this.isSlidingLeft = false;
//   this.newImageStartingClass = '';

//   if (this.newBackgroundUrl) {
//     this.imageStyles['background-image'] = `url('${this.newBackgroundUrl}')`;
//   }

//   this.oldBackgroundUrl = null;
//   this.newBackgroundUrl = null;
// }

//
// async nextImage() {
//   if (this.rightClicked) return;
  
//   try {
//     this.rightClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // 1) Current image
//     const oldUrl = this.pictureForm.get('imgUrl')?.value || '';

//     // 2) Move index forward
//     this.imageManagementService.nextImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
//     const nextUrl = currentState.urls[currentState.currentIndex] || '';

//     // 3) Set up initial state
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = nextUrl;
//     this.isSlidingLeft = false;
//     this.isSlidingRight = false;
//     this.newImageStartingClass = 'start-slide-right';
//     this.xDirection = '100%';
    
//     // Force state update
//     this.cdr.detectChanges();
//     await new Promise(resolve => requestAnimationFrame(resolve));

//     // 4) Trigger animation
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
//     }, 400);
//   }
// }

// async previousImage() {
//   if (this.leftClicked) return;
  
//   try {
//     this.leftClicked = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // 1) Current image
//     const oldUrl = this.pictureForm.get('imgUrl')?.value || '';

//     // 2) Move index backward
//     this.imageManagementService.previousImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const currentState = subject.value;
//     const prevUrl = currentState.urls[currentState.currentIndex] || '';

//     // 3) Set up initial state
//     this.oldBackgroundUrl = oldUrl;
//     this.newBackgroundUrl = prevUrl;
//     this.isSlidingLeft = false;
//     this.isSlidingRight = false;
//     this.newImageStartingClass = 'start-slide-left';
//     this.xDirection = '-100%';
    
//     // Force state update
//     this.cdr.detectChanges();
//     await new Promise(resolve => requestAnimationFrame(resolve));

//     // 4) Trigger animation
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
//     }, 400);
//   }
// }

/////////

// ///// animation working but too fast ////
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
//     }, 100); // Increased timeout to match transition duration
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
//     }, 100); // Increased timeout to match transition duration
//   }
// }

// onSlideAnimationEnd(event: TransitionEvent) {
//   if (event.propertyName === 'transform') {
//     this.finalizeSlideAnimation();
//   }
//   // if (
//   //   event.propertyName === 'transform' &&
//   //   event.target === event.currentTarget
//   // ) {
//   //   this.finalizeSlideAnimation();
//   // }
// }

// finalizeSlideAnimation() {
//   // Add a small delay to ensure the animation completes
//   setTimeout(() => {
//     this.isSlidingRight = false;
//     this.isSlidingLeft = false;
//     this.newImageStartingClass = '';
//     this.xDirection = '';
//     this.isAnimating = false;

//     if (this.newBackgroundUrl) {
//       this.imageStyles['background-image'] = `url('${this.newBackgroundUrl}')`;
//     }

//     this.oldBackgroundUrl = null;
//     this.newBackgroundUrl = null;
    
//     this.cdr.detectChanges();
//   }, 0); // Small buffer after transition ends
// }

/////////


// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//     this.rightClicked = true;
//     this.isTransitioning = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Get current and next URLs
//     const currentUrl = this.pictureForm.get('imgUrl')?.value;
    
//     // Update image management service
//     this.imageManagementService.nextImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const nextUrl = subject.value.urls[subject.value.currentIndex];

//     // Position the next image off-screen to the right
//     this.nextImageStyles = {
//       'background-image': `url("${nextUrl}")`,
//       'background-position': '0% 0%',
//       'background-size': '100%'
//     };

//     // Force a reflow before starting animation
//     this.profileImg?.nativeElement.offsetHeight;

//     // Start the slide animation
//     this.isSlidingRight = true;
//     this.cdr.detectChanges();

//     // Wait for animation to complete
//     // await new Promise(resolve => setTimeout(resolve, this.ANIMATION_DURATION));

//     // Update the current image
//     this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//     this.imageStyles = { ...this.nextImageStyles };

//     // Reset animation states
//     // this.isSlidingRight = false;
//     // this.nextImageStyles = null;

//     this.imageManagementService.logNavigationState(this.userId);
    
//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     this.rightClicked = false;
//     this.isTransitioning = false;
//     this.cdr.detectChanges();
//   }
// }

// async previousImage() {
//   if (this.leftClicked || this.isTransitioning) return;
  
//   try {
//     this.leftClicked = true;
//     this.isTransitioning = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Get current and previous URLs
//     const currentUrl = this.pictureForm.get('imgUrl')?.value;
    
//     // Update image management service
//     this.imageManagementService.previousImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const prevUrl = subject.value.urls[subject.value.currentIndex];

//     // Position the previous image off-screen to the left
//     this.nextImageStyles = {
//       'background-image': `url("${prevUrl}")`,
//       'background-position': '0% 0%',
//       'background-size': '100%'
//     };

//     // Force a reflow before starting animation
//     this.profileImg?.nativeElement.offsetHeight;

//     // Start the slide animation
//     this.isSlidingLeft = true;
//     this.cdr.detectChanges();

//     // Wait for animation to complete
//     // await new Promise(resolve => setTimeout(resolve, this.ANIMATION_DURATION));

//     // Update the current image
//     this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
//     this.imageStyles = { ...this.nextImageStyles };

//     // Reset animation states
//     // this.isSlidingLeft = false;
//     // this.nextImageStyles = null;

//     this.imageManagementService.logNavigationState(this.userId);
    
//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     this.leftClicked = false;
//     this.isTransitioning = false;
//     this.cdr.detectChanges();
//   }
// }

// onSlideAnimationEnd(event: TransitionEvent) {
//   // Only handle transform transitions
//   if (event.propertyName === 'transform') {
//     // Reset all animation states
//     this.isSlidingRight = false;
//     this.isSlidingLeft = false;
//     this.isTransitioning = false;

//     // Update the current styles to the new image's styles
//     if (this.nextImageStyles) {
//       this.imageStyles = { ...this.nextImageStyles };
//       this.nextImageStyles = null;
//     }

//     this.cdr.detectChanges();
//   }
// }

// profile.component.ts
// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//     this.rightClicked = true;
//     this.isTransitioning = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
//     this.resetImagePositionAndZoomDuringNavigation();

//     // Update image management service first
//     this.imageManagementService.nextImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const nextUrl = subject.value.urls[subject.value.currentIndex];

//     // Set up the next image styles
//     this.nextImageStyles = {
//       'background-image': `url("${nextUrl}")`,
//       'background-position': '0% 0%',
//       'background-size': '100%'
//     };

//     // Force a reflow
//     void this.profileImg?.nativeElement.offsetHeight;
    
//     // Start the slide animation
//     this.isSlidingRight = true;
    
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
//     this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//     this.imageStyles = { ...this.nextImageStyles };
//     this.nextImageStyles = null;
    
//     this.imageManagementService.logNavigationState(this.userId);
//   } catch (error) {
//     console.error('Error navigating to next image:', error);
//   } finally {
//     this.rightClicked = false;
//     this.isTransitioning = false;
//     this.isSlidingRight = false;
//     this.cdr.detectChanges();
//   }
// }

// Updated nextImage() function
// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//       this.rightClicked = true;
//       this.isTransitioning = true;
//       this.hasStartedNavigating = true;
//       this.showUploadSuccess = false;
//       this.resetImagePositionAndZoomDuringNavigation();

//       // Update image management service first
//       this.imageManagementService.nextImage(this.userId);
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const nextUrl = subject.value.urls[subject.value.currentIndex];

//       // Set up the next image styles
//       this.nextImageStyles = {
//           'background-image': `url("${nextUrl}")`,
//           'background-position': '0% 0%',
//           'background-size': '100%'
//       };

//       // Force a reflow to ensure new styles are applied
//       void this.profileImg?.nativeElement.offsetHeight;

//       // Start the slide animation
//       requestAnimationFrame(() => {
//           this.isSlidingRight = true;
//           this.cdr.detectChanges();

//           // Add sliding-complete class after a small delay to trigger the animation
//           requestAnimationFrame(() => {
//               const incomingElement = this.profileImg?.nativeElement.querySelector('.incoming');
//               if (incomingElement) {
//                   incomingElement.classList.add('sliding-complete');
//               }
//           });
//       });

//       // Wait for the animation to complete
//       await new Promise<void>(resolve => {
//           const onAnimationComplete = (event: TransitionEvent) => {
//               if (event.propertyName === 'transform' && 
//                   (event.target as HTMLElement).classList.contains('current')) {
//                   this.profileImg?.nativeElement.removeEventListener('transitionend', onAnimationComplete);
//                   resolve();
//               }
//           };
//           this.profileImg?.nativeElement.addEventListener('transitionend', onAnimationComplete);
//       });

//       // Update the current image after animation completes
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//       this.imageStyles = { ...this.nextImageStyles };
//       this.nextImageStyles = null;
//       this.imageManagementService.logNavigationState(this.userId);

//   } catch (error) {
//       console.error('Error navigating to next image:', error);
//   } finally {
//       this.rightClicked = false;
//       this.isTransitioning = false;
//       this.isSlidingRight = false;
//       const incomingElement = this.profileImg?.nativeElement.querySelector('.incoming');
//       if (incomingElement) {
//           incomingElement.classList.remove('sliding-complete');
//       }
//       this.cdr.detectChanges();
//   }
// }

// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//       this.rightClicked = true;
//       this.isTransitioning = true;
//       this.hasStartedNavigating = true;
//       this.showUploadSuccess = false;
      
//       // Get next image URL
//       this.imageManagementService.nextImage(this.userId);
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const nextUrl = subject.value.urls[subject.value.currentIndex];
      
//       // Set up next image
//       this.nextImageStyles = {
//           'background-image': `url("${nextUrl}")`,
//           'background-position': '0% 0%',
//           'background-size': '100%'
//       };
      
//       // Force reflow
//       void this.profileImg?.nativeElement.offsetHeight;
      
//       // Start sliding animation
//       this.isSliding = true;
      
//       // Wait for animation to complete
//       await new Promise<void>(resolve => {
//           const onTransitionEnd = (event: TransitionEvent) => {
//               if (event.propertyName === 'transform') {
//                   this.profileImg?.nativeElement.removeEventListener('transitionend', onTransitionEnd);
//                   resolve();
//               }
//           };
//           this.profileImg?.nativeElement.addEventListener('transitionend', onTransitionEnd);
//       });
      
//       // Update current image
//       this.imageStyles = { ...this.nextImageStyles };
//       this.nextImageStyles = null;
//       this.isSliding = false;
      
//       // Update form and log state
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//       this.imageManagementService.logNavigationState(this.userId);
      
//   } catch (error) {
//       console.error('Error navigating to next image:', error);
//   } finally {
//       this.rightClicked = false;
//       this.isTransitioning = false;
//       this.isSliding = false;
//       this.cdr.detectChanges();
//   }
// }

// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//       this.rightClicked = true;
//       this.isTransitioning = true;
//       this.hasStartedNavigating = true;
//       this.showUploadSuccess = false;
//       this.resetImagePositionAndZoomDuringNavigation();
      
//       // Get next image URL
//       this.imageManagementService.nextImage(this.userId);
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const nextUrl = subject.value.urls[subject.value.currentIndex];
      
//       // Prepare next image
//       this.nextImageStyles = {
//           'background-image': `url("${nextUrl}")`,
//           'background-position': '0% 0%',
//           'background-size': '100%'
//       };
      
//       // Force reflow
//       void this.profileImg?.nativeElement.offsetHeight;
      
//       // Start sliding animation
//       requestAnimationFrame(() => {
//           this.isSliding = true;
//           this.cdr.detectChanges();
//       });
      
//       // Wait for animation to complete
//       await new Promise<void>(resolve => {
//           const onTransitionEnd = (event: TransitionEvent) => {
//               if (event.propertyName === 'transform' && 
//                   (event.target as HTMLElement).classList.contains('next')) {
//                   this.profileImg?.nativeElement.removeEventListener('transitionend', onTransitionEnd);
//                   resolve();
//               }
//           };
//           this.profileImg?.nativeElement.addEventListener('transitionend', onTransitionEnd);
//       });
      
//       // Update current image
//       this.imageStyles = { ...this.nextImageStyles };
//       this.nextImageStyles = null;
      
//       // Update form and log state
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//       this.imageManagementService.logNavigationState(this.userId);
      
//   } catch (error) {
//       console.error('Error navigating to next image:', error);
//   } finally {
//       this.rightClicked = false;
//       this.isTransitioning = false;
//       this.isSliding = false;
//       this.cdr.detectChanges();
//   }
// }

// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;

//   console.log('[nextImage] Start. isSliding:', this.isSliding);
  
//   try {
//       // Clear any existing timeouts
//       if (this.transitionTimeout) {
//           clearTimeout(this.transitionTimeout);
//           this.transitionTimeout = null;
//       }

//       this.rightClicked = true;
//       this.isTransitioning = true;
//       this.hasStartedNavigating = true;
//       this.showUploadSuccess = false;
//       this.resetImagePositionAndZoomDuringNavigation();
      
//       // Get next image URL
//       this.imageManagementService.nextImage(this.userId);
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const nextUrl = subject.value.urls[subject.value.currentIndex];
      
//       // Set up next image
//       this.nextImageStyles = {
//           'background-image': `url("${nextUrl}")`,
//           'background-position': '0% 0%',
//           'background-size': '100%'
//       };
      
//       // Force reflow
//       void this.profileImg?.nativeElement.offsetHeight;
      
//       // Start sliding animation
//       this.isSliding = true;
//       console.log('[nextImage] isSliding set to true');
//       this.cdr.detectChanges();
      
//       // Wait for animation duration
//       await new Promise<void>(resolve => {
//           this.transitionTimeout = setTimeout(() => {
//               // Update current image without triggering new animation
//               console.log('[nextImage] Timeout firing, isSliding -> false');
//               this.isSliding = false;
//               this.imageStyles = {
//                   'background-image': `url("${nextUrl}")`,
//                   'background-position': '0% 0%',
//                   'background-size': '100%'
//               };
//               this.nextImageStyles = null;
//               this.cdr.detectChanges();
//               resolve();
//           }, 400); // Match transition duration
//       });
      
//       // Update form and log state
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//       this.imageManagementService.logNavigationState(this.userId);
      
//   } catch (error) {
//       console.error('Error navigating to next image:', error);
//   } finally {
//       this.rightClicked = false;
//       this.isTransitioning = false;
//       if (this.transitionTimeout) {
//           clearTimeout(this.transitionTimeout);
//           this.transitionTimeout = null;
//       }
//       // this.cdr.detectChanges();
//   }
//   console.log('[nextImage] End');
// }

// works + extra slide
// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//       // Clear any existing timeouts
//       if (this.transitionTimeout) {
//           clearTimeout(this.transitionTimeout);
//           this.transitionTimeout = null;
//       }

//       this.rightClicked = true;
//       this.isTransitioning = true;
//       this.hasStartedNavigating = true;
//       this.showUploadSuccess = false;
//       this.resetImagePositionAndZoomDuringNavigation();
      
//       // Get next image URL
//       this.imageManagementService.nextImage(this.userId);
//       const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//       const nextUrl = subject.value.urls[subject.value.currentIndex];
      
//       // Set up next image
//       this.nextImageStyles = {
//           'background-image': `url("${nextUrl}")`,
//           'background-position': '0% 0%',
//           'background-size': '100%'
//       };
      
      
//       // Force reflow
//       void this.profileImg?.nativeElement.offsetHeight;
      
//       // Start sliding animation
//       this.isSliding = true;
//       this.cdr.detectChanges();
      
//       // Wait for animation duration
//       await new Promise<void>(resolve => {
//           this.transitionTimeout = setTimeout(() => {
//               // Update current image without triggering new animation
//               this.isSliding = false;
//               this.imageStyles = {
//                   'background-image': `url("${nextUrl}")`,
//                   'background-position': '0% 0%',
//                   'background-size': '100%'
//               };
//               this.nextImageStyles = null;
//               this.cdr.detectChanges();
//               resolve();
//           }, 400); // Match transition duration
//       });
      
//       // Update form and log state
//       this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
//       this.imageManagementService.logNavigationState(this.userId);
      
//   } catch (error) {
//       console.error('Error navigating to next image:', error);
//   } finally {
//       this.rightClicked = false;
//       this.isTransitioning = false;
//       if (this.transitionTimeout) {
//           clearTimeout(this.transitionTimeout);
//           this.transitionTimeout = null;
//       }
//       // this.cdr.detectChanges();
//   }
// }

// works perfectly + 1 wrong direction when interchanging
// async nextImage() {
//   if (this.rightClicked || this.isTransitioning) return;
  
//   try {
//     if (this.transitionTimeout) {
//       clearTimeout(this.transitionTimeout);
//       this.transitionTimeout = null;
//     }

//     this.rightClicked = true;
//     this.isTransitioning = true;
    
//     // Get next image URL
//     this.imageManagementService.nextImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const nextUrl = subject.value.urls[subject.value.currentIndex];
    
//     // Preload next image
//     // await this.preloadImage(nextUrl, false);
    
//     // Set up next image styles
//     this.nextImageStyles = {
//       'background-image': `url("${nextUrl}")`,
//       'background-position': this.imageStyles['background-position'] || '0% 0%',
//       'background-size': this.imageStyles['background-size'] || '100%',
//       'background-repeat': 'no-repeat',
//       'background-color': '#c7ff20'
//     };
    
//     // Trigger animations
//     this.currentImageState = 'slideOutLeft';
//     this.nextImageState = 'slideIn';
    
//     // Wait for animation to complete
//     await new Promise<void>(resolve => {
//       this.transitionTimeout = setTimeout(() => {
//         // Update current image
//         this.imageStyles = { ...this.nextImageStyles };
//         this.nextImageStyles = null;
//         this.currentImageState = 'current';
//         this.nextImageState = 'next';
        
//         // Update form
//         this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
        
//         resolve();
//       }, 400);
//     });
    
//   } catch (error) {
//     console.error('Error in nextImage:', error);
//   } finally {
//     this.rightClicked = false;
//     this.isTransitioning = false;
//     if (this.transitionTimeout) {
//       clearTimeout(this.transitionTimeout);
//       this.transitionTimeout = null;
//     }
//   }
// }

// works perfectly + 1 wrong direction when interchanging
// async previousImage() {
//   if (this.leftClicked || this.isTransitioning) return;
//   try {
//     if (this.transitionTimeout) {
//       clearTimeout(this.transitionTimeout);
//       this.transitionTimeout = null;
//     }
    
//     this.leftClicked = true;
//     this.isTransitioning = true;
//     this.hasStartedNavigating = true;
//     this.showUploadSuccess = false;
    
//     // Reset position and zoom if needed
//     this.resetImagePositionAndZoomDuringNavigation();
    
//     // Get previous image URL
//     this.imageManagementService.previousImage(this.userId);
//     const subject = this.imageManagementService.getUserImagesSubject(this.userId);
//     const prevUrl = subject.value.urls[subject.value.currentIndex];
    
//     // Set up previous image styles
//     this.nextImageStyles = {
//       'background-image': `url("${prevUrl}")`,
//       'background-position': this.imageStyles['background-position'] || '0% 0%',
//       'background-size': this.imageStyles['background-size'] || '100%',
//       'background-repeat': 'no-repeat',
//       'background-color': '#c7ff20'
//     };

//     // Trigger animations
//     this.currentImageState = 'slideOutRight';
//     this.nextImageState = 'slideIn';

//     // Wait for animation to complete
//     await new Promise<void>(resolve => {
//       this.transitionTimeout = setTimeout(() => {
//         // Update current image
//         this.imageStyles = { ...this.nextImageStyles };
//         this.nextImageStyles = null;
//         this.currentImageState = 'current';
//         this.nextImageState = 'prev';
//         // Update form
//         this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
//         this.imageManagementService.logNavigationState(this.userId);
//         resolve();
//       }, 400);
//     });
    
//   } catch (error) {
//     console.error('Error navigating to previous image:', error);
//   } finally {
//     this.leftClicked = false;
//     this.isTransitioning = false;
//     if (this.transitionTimeout) {
//       clearTimeout(this.transitionTimeout);
//       this.transitionTimeout = null;
//     }
//   }
// }

async nextImage() {
  if (this.rightClicked || this.isTransitioning) return;
  try {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }

    this.rightClicked = true;
    this.isTransitioning = true;

    // Reset next image state if coming from opposite direction
    if (this.lastDirection === 'prev') {
      this.nextImageState = 'next';
      await this.cdr.detectChanges();
    }
    this.lastDirection = 'next';

    // Get next image URL
    this.imageManagementService.nextImage(this.userId);
    const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    const nextUrl = subject.value.urls[subject.value.currentIndex];

    // Set up next image styles
    this.nextImageStyles = {
      'background-image': `url("${nextUrl}")`,
      'background-position': this.imageStyles['background-position'] || '0% 0%',
      'background-size': this.imageStyles['background-size'] || '100%',
      'background-repeat': 'no-repeat',
      'background-color': '#c7ff20'
    };

    // Force a change detection cycle before animation
    await this.cdr.detectChanges();
    
    // Trigger animations
    requestAnimationFrame(() => {
      this.currentImageState = 'slideOutLeft';
      this.nextImageState = 'slideIn';
    });

    // Wait for animation to complete
    await new Promise<void>(resolve => {
      this.transitionTimeout = setTimeout(() => {
        // Update current image
        this.imageStyles = { ...this.nextImageStyles };
        this.nextImageStyles = null;
        this.currentImageState = 'current';
        this.nextImageState = 'next';
        // Update form
        this.pictureForm.patchValue({ imgUrl: nextUrl }, { emitEvent: false });
        resolve();
      }, 400);
    });
  } catch (error) {
    console.error('Error in nextImage:', error);
  } finally {
    this.rightClicked = false;
    this.isTransitioning = false;
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }
}

async previousImage() {
  if (this.leftClicked || this.isTransitioning) return;
  try {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }

    this.leftClicked = true;
    this.isTransitioning = true;
    this.hasStartedNavigating = true;
    this.showUploadSuccess = false;

    // Reset next image state if coming from opposite direction
    if (this.lastDirection === 'next') {
      this.nextImageState = 'prev';
      await this.cdr.detectChanges();
    }
    this.lastDirection = 'prev';

    this.resetImagePositionAndZoomDuringNavigation();

    // Get previous image URL
    this.imageManagementService.previousImage(this.userId);
    const subject = this.imageManagementService.getUserImagesSubject(this.userId);
    const prevUrl = subject.value.urls[subject.value.currentIndex];

    // Set up previous image styles
    this.nextImageStyles = {
      'background-image': `url("${prevUrl}")`,
      'background-position': this.imageStyles['background-position'] || '0% 0%',
      'background-size': this.imageStyles['background-size'] || '100%',
      'background-repeat': 'no-repeat',
      'background-color': '#c7ff20'
    };

    // Force a change detection cycle before animation
    await this.cdr.detectChanges();

    // Trigger animations
    requestAnimationFrame(() => {
      this.currentImageState = 'slideOutRight';
      this.nextImageState = 'slideIn';
    });

    // Wait for animation to complete
    await new Promise<void>(resolve => {
      this.transitionTimeout = setTimeout(() => {
        // Update current image
        this.imageStyles = { ...this.nextImageStyles };
        this.nextImageStyles = null;
        this.currentImageState = 'current';
        this.nextImageState = 'prev';
        // Update form
        this.pictureForm.patchValue({ imgUrl: prevUrl }, { emitEvent: false });
        this.imageManagementService.logNavigationState(this.userId);
        resolve();
      }, 400);
    });
  } catch (error) {
    console.error('Error navigating to previous image:', error);
  } finally {
    this.leftClicked = false;
    this.isTransitioning = false;
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }
}

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

getProfileClasses() {
  return {
    'changing-picture': this.currentState === ProfileState.ChangingPicture,
    'default-position': !this.isDragged,
    'loaded': this.imageLoadedSuccessfully,
    'loading': !this.imageLoadedSuccessfully || this.isLoadingImages,
    'firstTimeAnimation': this.firstTimeAnimation && this.tierThree,
    'tierThreeStyle': this.tierThree,
    'draggable': this.canDrag()
  };
}



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

onSlideAnimationEnd(event: TransitionEvent) {
  console.log('[onSlideAnimationEnd]', event);
  // Only handle transform transitions
  // if (event.propertyName === 'transform') {
  //   // No need to update styles here since it's handled in the navigation methods
  //   this.cdr.detectChanges();
  // }
  if (event.propertyName !== 'transform') return;
}

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

// Last working
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

onUrlPaste(event: ClipboardEvent) {
  event.preventDefault();
  
  const pastedText = event.clipboardData?.getData('text/plain')?.trim();
  if (!pastedText) return;

  this.ngZone.run(() => {
    this.isUploadingOrPasting = true;
    this.providerUrlPasted = true;

    // Reset position and zoom to default state
    this.position = { x: 0, y: 0 };
    this.zoomLevel = 1;
    this.isDragged = false;
    this.isDefaultPosition = true;

    // Update the form value with the pasted URL
    this.pictureForm.patchValue({
      imgUrl: pastedText
    });

    // Show loading state
    if (this.profileImg?.nativeElement) {
      this.renderer.addClass(this.profileImg.nativeElement, 'loading');
    }

    // Preload the image and set success state
    const img = new Image();
    img.onload = () => {
      this.ngZone.run(() => {
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

        // Important: Set these flags for drag controls to appear
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

    img.src = pastedText;

    // Create and dispatch synthetic input event
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

private isValidImageUrl(url: string): boolean {
  const supportedDomains = [
    'unsplash.com',
    'images.unsplash.com',
    'pexels.com',
    'images.pexels.com',
    'pixabay.com'
  ];

  try {
    const urlObj = new URL(url);
    return supportedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

isCurrentImage(url: string): boolean {
  if (!this.currentUser.imgUrl || !url) return false;
  return this.imageManagementService.normalizeUrl(url) === 
         this.imageManagementService.normalizeUrl(this.currentUser.imgUrl);
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

}
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
/*-----------------------------------------------------------------------*/
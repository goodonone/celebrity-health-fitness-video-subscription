import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { UserService } from './services/user.service';
import { CartService } from './services/cart.service';
import { catchError, combineLatest, filter, of, Subscription, switchMap, tap } from 'rxjs';
import { AuthService } from './services/auth.service';
import { CustomOAuthService } from './services/oauth.service';
import { AuthStateService } from './services/authstate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {

  // @ViewChild('navbar') navbarElement!: ElementRef;
  
  title = 'Hugh Jackedman';

  searchString: string = '';

  viewSearchBar: boolean = false;

  userIsLoggedIn: boolean = false;

  UserId: string = '';

  cartQuantity: number = 0;

  navbar!: HTMLElement | null;

  isVisibleNavbar = false;

  // @ViewChild('toggle') toggleElement!: ElementRef;

  isMenuOpen: boolean = false;
  isMenuHovered: boolean = false;
  closeTimeout: any;
  // isMobile: boolean = window.innerWidth <= 900;
  isTouchDevice: boolean = false;
  // Define a custom breakpoint
  // CUSTOM_MOBILE_BREAKPOINT = '(max-width: 500px)';

  private cartSubscription: Subscription | null = null;
  // private authSubscription: Subscription | null = null;
  // private routerSubscription!: Subscription;

  private subscription: Subscription = new Subscription();
  

  private closeMenuTimer: any;
  private hoverTimer: any;

  constructor(
    private actRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private cartService: CartService,
    private authService: AuthService,
    private oauthService: CustomOAuthService,
    private authStateService: AuthStateService,
    private cdr: ChangeDetectorRef,
    // private breakpointObserver: ReportingObserver,
  ) {
    // this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //     this.UpdateStatus();
    //   }
    // });

    // if(this.authService.isAuthenticated()) {
      
        // this.subscribeToCart();
      // }
  }

  ngOnInit(): void {
    
    // For touch devices, disable hover events
    this.detectTouchDevice();
    // Observe screen size changes 
    // this.breakpointObserver
    // .observe([this.CUSTOM_MOBILE_BREAKPOINT])
    // .subscribe((result) => {
    //   this.isMobile = result.matches;
    // });

    // this.oauthService.handleRedirectResult();
    // this.oauthService.checkForRedirectResult();
    // this.oauthService.checkForStoredAuthResult();
    // this.loadUserId();
    // this.UpdateStatus();

    // this.oauthService.loadDiscoveryDocumentAndTryLogin().then((loginResult) => {
    //   if (loginResult) {
    //     console.log('User logged in successfully after redirect');
    //     this.authStateService.checkAuthStatus();
    //   } else {
    //     console.log('No user is currently logged in');
    //   }
    // }).catch(error => {
    //   console.error('Error during OAuth initialization:', error);
    // });

    // this.oauthService.isAuthenticated$.subscribe(isAuthenticated => {
    //   if (isAuthenticated) {
    //     console.log('User logged in successfully');
    //     // You can perform any actions needed when the user becomes authenticated
    //   } else {
    //     console.log('User is not authenticated');
    //     // You can perform any actions needed when the user becomes unauthenticated
    //   }
    // });

    this.cartSubscription = this.cartService.getCartObservable().subscribe((newCart) => {
      // console.log('Cart received in navbar:', newCart); 
      this.cartQuantity = newCart.totalCount || 0;
      });

      this.subscription.add(
        this.userService.isLoggedIn$.pipe(
          tap(isLoggedIn => {
            this.userIsLoggedIn = isLoggedIn;
            if (isLoggedIn) {
              this.cartService.loadCart();
            } else {
              this.cartQuantity = 0;
            }
          }),
          switchMap(() => this.cartService.getCartObservable())
        ).subscribe(cart => {
          this.cartQuantity = cart.totalCount || 0;
          // console.log('Cart received in navbar:', cart);
        })
      );

      // this.subscription.add(
      //   combineLatest([
      //     this.userService.isLoggedIn$,
      //     this.authStateService.isAuthenticated$
      //   ]).subscribe(([userServiceLoggedIn, authStateLoggedIn]) => {
      //     this.userIsLoggedIn = userServiceLoggedIn || authStateLoggedIn;
      //     if (this.userIsLoggedIn) {
      //       this.UserId = this.userService.getUserId();
      //     } else {
      //       this.UserId = '';
      //     }
      //     console.log('Login state updated:', this.userIsLoggedIn);
      //   })
      // );

      this.subscription.add(
        combineLatest([
          this.userService.isLoggedIn$,
          this.authStateService.isAuthenticated$,
          this.oauthService.isAuthenticated$
        ]).subscribe(([userServiceLoggedIn, authStateLoggedIn, oauthLoggedIn]) => {
          this.userIsLoggedIn = userServiceLoggedIn || authStateLoggedIn || oauthLoggedIn;
          if (this.userIsLoggedIn) {
            this.UserId = this.userService.getUserId();
          } else {
            this.UserId = '';
          }
          console.log('Login state updated:', this.userIsLoggedIn);
          console.log("user service logged in", userServiceLoggedIn);
          console.log("auth state logged in", authStateLoggedIn);
          console.log("oauth logged in", oauthLoggedIn);
        })
      );
    
  
      // this.subscription.add(
      //   this.router.events.subscribe((event) => {
      //     if (event instanceof NavigationEnd) {
      //       this.UpdateStatus();
      //     }
      //   })
      // );

      this.subscription.add(
        this.router.events.pipe(
          filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
          this.UpdateStatus();
        })
      );
  
      this.UpdateStatus();

      // this.userService.isLoggedIn$.subscribe(status => {
      //   this.userIsLoggedIn = status;
      // });

      // Check if the user has visited the page before to serve animations or not
      const hasVisited = localStorage.getItem('hasVisitedHomeBefore');
      if (!hasVisited) {
        // Trigger animations
        this.triggerAnimations();
        // Store the flag in localStorage
        localStorage.setItem('hasVisitedHomeBefore', 'true');
      } else {
        // Skip animations
        this.skipAnimations();
      }

    // Listen for route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (
          !this.router.url.includes('home') ||
          !this.router.url.includes('login') ||
          !this.router.url.includes('reset-password')
        ) {
          this.isVisibleNavbar = false; // Reset when navigating away from home
          this.isMenuOpen = false;
        }
      }
    });

    // Add event listener for the hamburger button
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('menu');
    hamburger!.addEventListener('click', () => {
      hamburger!.classList.toggle('active');
    });

    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    // this.cartService.clearCart();
    // this.unsubscribeFromCart();
    // if (this.routerSubscription) {
    //   this.routerSubscription.unsubscribe();
    // }
    // if (this.authSubscription) {
    //   this.authSubscription.unsubscribe();
    // }
  }

  // private subscribeToCart() {
  //   if (!this.cartSubscription) {
  //     this.cartSubscription = this.cartService.getCartObservable().subscribe((newCart) => {
  //       // console.log('Cart received in navbar:', newCart);
  //       this.cartQuantity = newCart.totalCount || 0;
  //     });
  //   }
  // }

  // private unsubscribeFromCart() {
  //   if (this.cartSubscription) {
  //     this.cartSubscription.unsubscribe();
  //     this.cartSubscription = null;
  //   }
  //   this.cartQuantity = 0; // Reset cart quantity when logging out
  // }

  triggerAnimations(){
    const navBar = document.querySelector('.navBar') as HTMLElement;
    navBar?.classList.add('firstVisitAnimation');
  }
  skipAnimations(){
    const navBar = document.querySelector('.navBar') as HTMLElement;
    navBar?.classList.remove('firstVisitAnimation');
  }


  // loadUserId(): void {
  //   this.userService.getUserId().subscribe(
  //     userId => {
  //       this.UserId = userId;  // Assign the userId once it's fetched
  //       console.log('User ID:', this.UserId);  // Log the userId for debugging
  //     },
  //     error => {
  //       console.error('Error fetching userId:', error);
  //       this.UserId = '';  // Set a fallback value in case of an error
  //     }
  //   );
  // }


    // Add event listener for the hamburger button
    // const hamburger = document.getElementById('hamburger');
    // if (hamburger) {
    //   hamburger.addEventListener('click', () => this.toggleMenu());
    // }

  ngAfterViewInit() {
    // Ensure the toggle element is available
    // const toggleCheckbox = document.getElementById('toggle') as HTMLInputElement;
    // if (toggleCheckbox && toggleCheckbox.checked) {
    //   this.isMenuOpen = true;
    //   this.startCloseTimer();
    // }
  }

  // Toggles Navbar Color When Over Content of same color
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const navbar = document.querySelector('.navBar');
    const banners = document.querySelectorAll('.bannerThree, .bannerFour');
    this.isVisibleNavbar = Array.from(banners).some((banner) => {
      const rect = banner.getBoundingClientRect();
      return rect.top <= navbar!.clientHeight && rect.bottom >= 0;
    });
  }

  // @HostListener('window:resize', [])
  // onWindowResize() {
  //   this.isMobile = window.innerWidth <= 500;
  // }

  onNavbarChangeColor(isVisibleNavbar: boolean) {
    this.isVisibleNavbar = isVisibleNavbar;
  }

  // Toggles the visiblity of the search input field

  // toggleSearch() {
  //   if (this.viewSearchBar) {
  //     this.viewSearchBar = false;
  //   } else {
  //     this.viewSearchBar = true;
  //   }
  //   setTimeout(() => {
  //     this.viewSearchBar = false;
  //   }, 10000);
  // }

  // // Search Function(INCOMPLETE)
  // search(searchString: string) {
  //   var search = (<HTMLInputElement>document.getElementById('mySearch') ?? '')
  //     .value;
  //   if (search !== '') {
  //     var input = search.charAt(0).toUpperCase() + search.slice(1);
  //     this.router.navigate(['/search', input]);
  //   } else {
  //     this.viewSearchBar = false;
  //   }
  // }

  // UpdateStatus() {
  //   this.userService.getUserId().subscribe(
  //     userId => {
  //       this.UserId = userId;  // Assign the userId once fetched
  //     },
  //     error => {
  //       console.error('Error fetching userId:', error);
  //       this.UserId = '';  // Fallback value in case of error
  //     }
  //   );
  // }

  // UpdateStatus() {
  //   this.userIsLoggedIn = this.userService.isloggedIn();
  //   if (this.userIsLoggedIn) {
  //     this.userService.getUserId().subscribe(
  //       userId => {
  //         this.UserId = userId || '';
  //         console.log('User ID updated:', this.UserId);
  //       },
  //       error => {
  //         console.error('Error fetching user ID:', error);
  //         this.UserId = '';
  //       }
  //     );
  //   } else {
  //     this.UserId = '';
  //   }
  // }

  // UpdateStatus() {
  //   this.userIsLoggedIn = this.userService.isloggedIn();
  //   console.log('User is logged in:, updateStatus() called');
  //   if (this.userIsLoggedIn) {
  //     this.UserId = this.userService.getUserId() ?? '';
  //   }
  // }

  // private UpdateStatus(): void {
  //   if (this.authService.isAuthenticated()) {
  //     this.UserId = (this.userService.getUserId() ?? '') || (this.authService.getUserIdFromToken() ?? '');
  //     this.userService.updateLoginStatus(true);
  //     this.cartService.loadCart();
  //   } else {
  //     this.userService.updateLoginStatus(false);
  //   }
  // }

  // private UpdateStatus(): void {
  //   if (this.authService.isAuthenticated()) {
  //     this.UserId = (this.userService.getUserId() ?? '') || (this.authService.getUserIdFromToken() || '');
  //     if (this.UserId) {
  //       this.userService.updateLoginStatus(true);
  //       this.cartService.loadCart();
  //     } else {
  //       console.error('User is authenticated but UserId is not available');
  //       // Handle this edge case as needed
  //     }
  //   } else {
  //     this.userService.updateLoginStatus(false);
  //   }
  // }

  // private UpdateStatus(): void {
  //   console.log('UpdateStatus called');
  //   if (this.authService.isAuthenticated()) {
  //     console.log('User is authenticated');
  //     const userServiceId = this.userService.getUserId();
  //     const authServiceId = this.authService.getUserIdFromToken();
  //     console.log('UserService ID:', userServiceId);
  //     console.log('AuthService ID:', authServiceId);

  //     this.UserId = (userServiceId ?? '') || (authServiceId || '');
  //     console.log('Final UserId:', this.UserId);

  //     if (this.UserId) {
  //       this.userService.updateLoginStatus(true);
  //       this.cartService.loadCart();
  //     } else {
  //       console.error('User is authenticated but UserId is not available');
  //       // Log the contents of localStorage for debugging
  //       console.log('localStorage contents:', JSON.stringify(localStorage));
  //     }
  //   } else {
  //     console.log('User is not authenticated');
  //     this.userService.updateLoginStatus(false);
  //   }
  // }

  private UpdateStatus(): void {
    // console.log('UpdateStatus called');
    if (this.authService.isAuthenticated()) {
      // console.log('User is authenticated');/
      const userServiceId = this.userService.getUserId();
      const authServiceId = this.authService.getUserIdFromToken();
      // console.log('UserService ID:', userServiceId);
      // console.log('AuthService ID:', authServiceId);

      this.UserId = userServiceId || authServiceId || '';
      // console.log('Final UserId:', this.UserId);

      if (this.UserId) {
        this.userService.updateLoginStatus(true);
        this.cartService.loadCart();
      } else {
        // console.error('User is authenticated but UserId is not available');
        // console.log('localStorage contents:', JSON.stringify(localStorage));
      }
    } else {
      // console.log('User is not authenticated');
      this.userService.updateLoginStatus(false);
    }
  }

  logOut() {
    // this.cartService.clearCart();
    this.userService.logoutUser();
  }

  // Hamburger Menu Functions
  menuToggle() {
    this.isMenuOpen = !this.isMenuOpen;
    const toggle = document.querySelector('#toggle') as HTMLInputElement;
    const hamburger = document.getElementById('hamburger');
  
    if (this.isMenuOpen) {
      if (!this.isTouchDevice) {  // Only set the timer if not on mobile
        // Set a timer to auto-close the menu if the mouse doesn't enter
        this.closeMenuTimer = setTimeout(() => {
          if (!this.isMenuHovered) {
            toggle.checked = false;
            this.isMenuOpen = false;
            hamburger!.classList.remove('active');
            // console.log('Menu auto-closed due to inactivity.');
          }
        }, 2000);
      }
    } else {
      // Clear any existing timers if the menu is closed
      this.clearTimers();
    }
  }
  // menuToggle() {
  //   this.isMenuOpen = !this.isMenuOpen;
  //   // console.log(`Menu toggled. IsMenuOpen: ${this.isMenuOpen}`);
  //   const toggle = document.querySelector('#toggle') as HTMLInputElement;
  //   const hamburger = document.getElementById('hamburger');

  //   if (this.isMenuOpen) {
  //     // Set a timer to auto-close the menu if the mouse doesn't enter
  //     this.closeMenuTimer = setTimeout(() => {
  //       if (!this.isMenuHovered) {
  //         toggle.checked = false;
  //         this.isMenuOpen = false;
  //         hamburger!.classList.remove('active');
  //         // console.log('Menu auto-closed due to inactivity.');
  //       }
  //     }, 2000);
  //   } else {
  //     // Clear any existing timers if the menu is closed
  //     this.clearTimers();
  //   }
  // }

  onMenuMouseEnter() {
    if (this.isTouchDevice) return;
    this.isMenuHovered = true;
    // console.log('Menu hovered.');

    // Clear the initial close timer
    this.clearTimers();
  }

  onMenuMouseLeave() {
    if (this.isTouchDevice) return;
    this.isMenuHovered = false;
    // console.log('Menu hover exited.');
    const toggle = document.querySelector('#toggle') as HTMLInputElement;
    const hamburger = document.getElementById('hamburger');

    // Set a timer to auto-close the menu if the mouse leaves without clicking
    this.hoverTimer = setTimeout(() => {
      if (!this.isMenuOpen) return;
      this.isMenuOpen = false;
      toggle.checked = false;
      hamburger!.classList.remove('active');
      // console.log('Menu auto-closed after hover exit.');
    }, 100);
  }

  onMenuMouseLeaveHamburger() {
    if (this.isTouchDevice) return;
    this.isMenuHovered = false;
    // console.log('Menu hover exited.');
    const toggle = document.querySelector('#toggle') as HTMLInputElement;
    const hamburger = document.getElementById('hamburger');

    // Set a timer to auto-close the menu if the mouse leaves without clicking
    this.hoverTimer = setTimeout(() => {
      if (!this.isMenuOpen) return;
      this.isMenuOpen = false;
      toggle.checked = false;
      hamburger!.classList.remove('active');
      // console.log('Menu auto-closed after hover exit.');
    }, 1000);
  }

  clearMenu() {
    const toggle = document.querySelector('#toggle') as HTMLInputElement;
    toggle.checked = false;
    const hamburger = document.getElementById('hamburger');
    hamburger!.classList.remove('active');
    this.clearTimers();
  }

  clearTimers() {
    if (this.closeMenuTimer) {
      clearTimeout(this.closeMenuTimer);
      this.closeMenuTimer = null;
      // console.log('Initial close timer cleared.');
    }

    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
      // console.log('Hover exit timer cleared.');
    }
  }

  detectTouchDevice() {
    this.isTouchDevice =
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);
  }
}

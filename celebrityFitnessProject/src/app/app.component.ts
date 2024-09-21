import {
  AfterViewInit,
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
import { catchError, of, Subscription, switchMap } from 'rxjs';
import { AuthService } from './services/auth.service';

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

  private cartSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private routerSubscription!: Subscription;

  private closeMenuTimer: any;
  private hoverTimer: any;

  constructor(
    private actRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private cartService: CartService,
    private authService: AuthService
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
    // this.loadUserId();
    // this.UpdateStatus();

    this.cartService.getCartObservable().subscribe((newCart) => {
      console.log('Cart received in navbar:', newCart); 
      this.cartQuantity = newCart.totalCount || 0;
      });

    this.userService.isLoggedIn$.subscribe(status => {
      this.userIsLoggedIn = status;
    });


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
          !this.router.url.includes('sign-in') ||
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
  }

  ngOnDestroy() {
    // this.unsubscribeFromCart();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
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

  onNavbarChangeColor(isVisibleNavbar: boolean) {
    this.isVisibleNavbar = isVisibleNavbar;
  }

  // Toggles the visiblity of the search input field

  toggleSearch() {
    if (this.viewSearchBar) {
      this.viewSearchBar = false;
    } else {
      this.viewSearchBar = true;
    }
    setTimeout(() => {
      this.viewSearchBar = false;
    }, 10000);
  }

  // Search Function(INCOMPLETE)
  search(searchString: string) {
    var search = (<HTMLInputElement>document.getElementById('mySearch') ?? '')
      .value;
    if (search !== '') {
      var input = search.charAt(0).toUpperCase() + search.slice(1);
      this.router.navigate(['/search', input]);
    } else {
      this.viewSearchBar = false;
    }
  }

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

  logOut() {
    // this.cartService.clearCart();
    this.userService.logoutUser();
  }

  // Hamburger Menu Functions
  menuToggle() {
    this.isMenuOpen = !this.isMenuOpen;
    // console.log(`Menu toggled. IsMenuOpen: ${this.isMenuOpen}`);
    const toggle = document.querySelector('#toggle') as HTMLInputElement;
    const hamburger = document.getElementById('hamburger');

    if (this.isMenuOpen) {
      // Set a timer to auto-close the menu if the mouse doesn't enter
      this.closeMenuTimer = setTimeout(() => {
        if (!this.isMenuHovered) {
          toggle.checked = false;
          this.isMenuOpen = false;
          hamburger!.classList.remove('active');
          // console.log('Menu auto-closed due to inactivity.');
        }
      }, 2000);
    } else {
      // Clear any existing timers if the menu is closed
      this.clearTimers();
    }
  }

  onMenuMouseEnter() {
    this.isMenuHovered = true;
    // console.log('Menu hovered.');

    // Clear the initial close timer
    this.clearTimers();
  }

  onMenuMouseLeave() {
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
}

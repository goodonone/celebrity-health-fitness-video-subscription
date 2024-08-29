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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'Hugh Jackedman';

  searchString: string = '';

  viewSearchBar: boolean = false;

  userIsLoggedIn: boolean = false;

  UserId: string = '';

  cartQuantity = 0;

  navbar!: HTMLElement | null;

  isVisibleNavbar = false;

  // @ViewChild('toggle') toggleElement!: ElementRef;

  isMenuOpen: boolean = false;
  isMenuHovered: boolean = false;
  closeTimeout: any;

  private closeMenuTimer: any;
  private hoverTimer: any;

  constructor(
    private actRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private cartService: CartService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.UpdateStatus();
      }
    });

    this.cartService.getCartObservable().subscribe((newCart) => {
      this.cartQuantity = newCart.totalCount;
    });
  }

  ngOnInit(): void {
    this.UpdateStatus();

    // Listen for route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (
          !this.router.url.includes('home') ||
          !this.router.url.includes('signin')
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


    // Add event listener for the hamburger button
    // const hamburger = document.getElementById('hamburger');
    // if (hamburger) {
    //   hamburger.addEventListener('click', () => this.toggleMenu());
    // }
  }

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

// import { Component, ContentChild, Input, OnInit } from '@angular/core';
// import { NavigationEnd, Router } from '@angular/router';
// import { UserService } from '../../services/user.service';

// @Component({
//   selector: 'app-sign-in',
//   templateUrl: './sign-in.component.html',
//   styleUrls: ['./sign-in.component.css'],
// })
// export class SignInComponent implements OnInit {
//   email: string = '';
//   password: string = '';

//   errorMessage = false;

//   navbar!: HTMLElement | null;
//   menu!: HTMLElement | null;

//   constructor(private userService: UserService, private router: Router) {}

//   ngOnInit(): void {
//     if (localStorage.getItem('userId')) {
//       this.router.navigateByUrl(`/sign-in`);
//     }

//     this.navbar = document.getElementById('navbar');
//     this.menu = document.querySelector('.menu'); 
//     this.navbar?.classList.add('shadow');
//     this.menu?.classList.add('shadow'); 

//     // Reset navbar state when navigating away
//     this.router.events.subscribe((event) => {
//       if (event instanceof NavigationEnd) {
//         this.resetNavbarState();
//       }
//     });
//   }

//   signIn() {
//     this.userService.login(this.email, this.password).subscribe(
//       (response: any) => {
//         const userId = response.userId;
//         localStorage.setItem('tier', response.tier);
//         localStorage.setItem('billing', response.paymentFrequency);
//         localStorage.setItem('token', response.token);

//         this.router.navigateByUrl(`/content/${userId}`);
//       },
//       (error) => {
//         console.log('Error: ', error);
//         this.errorMessage = true;
//         this.router.navigateByUrl('/sign-in');
//       }
//     );
//   }

//   resetNavbarState(): void {
//     this.navbar?.classList.remove('black');
//     this.menu?.classList.remove('black');
//     const navBarTextElements = document.querySelectorAll('.navBarText');
//     navBarTextElements.forEach((element) => {
//       element.classList.remove('black');
//     });
//   }
// }

import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { CustomOAuthService } from 'src/app/services/oauth.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage = false;
  navbar!: HTMLElement | null;
  menu!: HTMLElement | null;
  passwordVisible = false;
  isLoadingGoogle = false;
  isLoadingApple = false;
  buttonText = 'Log In';
  
  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  private authSubscription: Subscription = new Subscription();
  private subscriptions: Subscription = new Subscription();

  // isLoadingGoogleSignin$!: Observable<boolean>;

  constructor(
    private userService: UserService,
    private authService: AuthService, // Inject AuthService
    private router: Router,
    private oauthService: CustomOAuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/content/' + localStorage.getItem('userId'));
    }

    this.navbar = document.getElementById('navbar');
    this.menu = document.querySelector('.menu');
    this.navbar?.classList.add('shadow');
    this.menu?.classList.add('shadow');

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.resetNavbarState();
      }
    });

    // Handle loading spinner oauth - error
    this.subscriptions.add(
      this.oauthService.authError$.subscribe(error => {
        this.zone.run(() => {
          this.isLoadingGoogle = false;
          this.cdr.detectChanges();
        });
      })
    );

    // Reset loading spinner state upon error
    // this.authSubscription.add(
    //   this.oauthService.authError$.subscribe(error => {
    //     this.zone.run(() => {
    //       this.isLoadingGoogle = false;
    //       console.error('Authentication error:', error);
    //       // Handle error (e.g., show error message to user)
    //       this.cdr.detectChanges();
    //     });
    //   })
    // );

    // // Handle popup closed without completing authentication
    this.subscriptions.add(
      this.oauthService.popupClosed$.subscribe(() => {
        if (this.isLoadingGoogle) {
          this.isLoadingGoogle = false;
          // Handle popup closed without completing authentication
        }
      })
    );

    // Handle loading spinner oauth
    // this.subscriptions.add(
    //   this.oauthService.isLoadingLogin$.subscribe(isLoading => {
    //     this.zone.run(() => {
    //       this.isLoadingGoogle = isLoading;
    //       console.log('isLoadingGoogle changed:', isLoading);
    //       this.cdr.detectChanges();
    //     });
    //   })
    // );

    // this.oauthService.getAuthComplete().subscribe(() => {
    //   this.isLoadingGoogle = false;
    // });
  }

  signIn() {
    this.userService.login(this.email, this.password).subscribe(
      (response: any) => {
        const userId = response.userId;
        localStorage.setItem('tier', response.tier);
        localStorage.setItem('billing', response.billing);
        
        // Use AuthService to handle the login
        this.authService.login(response.token);
        
        // Navigate to the content page
      this.router.navigateByUrl(`/content/${userId}`).then(() => {
        // After navigation, authenticate with Firebase
        this.userService.authenticateWithFirebase(response.token);
      });
      },
      (error) => {
        console.log('Error: ', error);
        this.errorMessage = true;
        this.buttonText = "Invalid Email or Password";
        setTimeout(() => {
          this.buttonText = 'Log In';
          this.errorMessage = false;
        }, 1800);
        this.router.navigateByUrl('/login');
      }
    );
  }

  onClickGoogle() {
    this.isLoadingGoogle = true;
    this.oauthService.initiateLogin(false);

    // this.oauthService.isLoadingLogin$.subscribe((isLoading) => {
    //   this.isLoadingGoogle = isLoading;
    //   console.log('isLoadingGoogle changed:', isLoading);
    // })
  
    
    // this.oauthService.authResult$.subscribe(
    //   (user) => {
    //     this.isLoadingGoogle = false;
    //     if (user) {
    //       this.router.navigate(['/content', user.userId]);
    //     }
    //   },
    //   (error) => {
    //     this.isLoadingGoogle = false;
    //     console.error('Google login error:', error);
    //     // Handle error (e.g., show error message)
    //   }
    // );
  }

  resetNavbarState(): void {
    this.navbar?.classList.remove('shadow');
    this.menu?.classList.remove('shadow');
    // const navBarTextElements = document.querySelectorAll('.navBarText');
    // navBarTextElements.forEach((element) => {
    //   element.classList.remove('black');
    // });
  }


  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  // onClickGoogle() {
  //   this.isLoadingGoogle = true;
  //   this.isLoadingApple = false;

  // }

  onClickApple() {
    this.isLoadingApple = true;
    this.isLoadingGoogle = false;
    // Simulating authentication process
    // setTimeout(() => {
    //   this.isLoading = false;
    // }, 3000); 

    // keep spinning until the user is authenticated, if user clicks google apple oauth is cancelled
  }
}
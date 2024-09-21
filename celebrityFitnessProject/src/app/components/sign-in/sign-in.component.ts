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

import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

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

  constructor(
    private userService: UserService,
    private authService: AuthService, // Inject AuthService
    private router: Router
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
        this.router.navigateByUrl(`/content/${userId}`);
      },
      (error) => {
        console.log('Error: ', error);
        this.errorMessage = true;
        this.buttonText = "Invalid Email or Password";
        setTimeout(() => {
          this.buttonText = 'Log In';
          this.errorMessage = false;
        }, 1800);
        this.router.navigateByUrl('/sign-in');
      }
    );
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

  onClickGoogle() {
    this.isLoadingGoogle = true;
    this.isLoadingApple = false;
    

    // Simulating authentication process
    // setTimeout(() => {
    //   this.isLoading = false;
    // }, 3000); 

    // keep spinning until the user is authenticated, if user clicks apple google oauth is cancelled
  }

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
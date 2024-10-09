import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service'; 
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { FormService } from 'src/app/shared/Multi-Step-Form/form/form.service';
import { CustomOAuthService } from 'src/app/services/oauth.service';


@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {

  newUser: User = new User();
  private routerSubscription?: Subscription;
  // private routerSubscription?: Subscription;

  

  constructor(private userService: UserService, private router: Router, private formService: FormService, private oauthService: CustomOAuthService) { }

  private subscription: Subscription = new Subscription();

  ngOnInit(): void {

    console.log('SignUpComponent initialized');
    this.clearUserData();
    

    // window.addEventListener('message', (event) => {
    //   console.log('Received message:', event);
    //   // Validate the origin to prevent security issues
    //   if (event.origin !== 'http://localhost:3000') {
    //     return;
    //   
   
    
    // this.routerSubscription = this.router.events.pipe(
    //   filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    // ).subscribe((event: NavigationEnd) => {
    //   if (!event.urlAfterRedirects.includes('change-plan') && 
    //       !event.urlAfterRedirects.includes('signup') && 
    //       !event.urlAfterRedirects.includes('checkout') && 
    //       !event.urlAfterRedirects.includes('upgrade')) {
    //         console.log('Form reset');
    //     this.formService.resetForm();
    //   }
    // });

    // this.routerSubscription = this.router.events.pipe(
    //   filter((event): event is NavigationEnd => {
    //     console.log('Router event:', event);
    //     return event instanceof NavigationEnd;
    //   })
    // ).subscribe((event: NavigationEnd) => {
    //   console.log('NavigationEnd event:', event.urlAfterRedirects);
    //   if (!event.urlAfterRedirects.includes('change-plan') && 
    //       !event.urlAfterRedirects.includes('signup') && 
    //       !event.urlAfterRedirects.includes('checkout') && 
    //       !event.urlAfterRedirects.includes('upgrade')) {
    //     console.log('Form reset');
    //     this.formService.resetForm();
    //   } else {
    //     console.log('Not resetting form - URL includes one of the specified paths');
    //   }
    // });
  
    
    
    //   const { type, payload } = event.data;

    //   if (type === 'GOOGLE_AUTH_SUCCESS') {
    //     console.log('Google auth successful:', payload);
    //     localStorage.setItem('oauthResult', JSON.stringify(payload));
    //     // Call your form service to populate the form with data
    //     this.populateForm(payload.user);
    //   } else if (type === 'GOOGLE_AUTH_ERROR') {
    //     console.error('Google auth error:', event.data.error);
    //   }
    // }, false);

    // this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //     this.formSevice
    //   }


    // Check if the user has visited the page before to serve animations or not
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      // Trigger animations
      this.triggerAnimations();
      // Store the flag in localStorage
      localStorage.setItem('hasVisitedBefore', 'true');
    } else {
      // Skip animations
      this.skipAnimations();
    }

    this.subscription.add(
      this.oauthService.oauthSuccess$.subscribe(user => {
        console.log('OAuth successful, moving to next step');
        this.formService.goToNextStep(1); 
         // Or whatever step number is appropriate
      })
    );
  }

  ngOnDestroy(): void {
    console.log('SignUpComponent destroyed');
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private clearUserData(): void {
    localStorage.removeItem('user');
    this.userService.setGoogleAuthEnabled(false);
    this.formService.resetForm();
  }



   // Trigger animations when page is loaded for the first time
   triggerAnimations() {

    // Triggers animation when page is loaded only for the first time
    const welcomeAnimation = document.querySelector('.welcome') as HTMLElement;
    welcomeAnimation?.classList.add('firstVisitAnimation');
    const otherTextAnimation = document.querySelector('.otherText') as HTMLElement;
    otherTextAnimation?.classList.add('firstVisitAnimation');
   }

  // Skips animations if page is loaded after the first time
  skipAnimations() {
    // Restore z-index to make button clickable if page is loaded for the not for the first time
    const welcomeAnimation = document.querySelector('.welcome') as HTMLElement;
    welcomeAnimation?.classList.remove('firstVisitAnimation');
    const otherTextAnimation = document.querySelector('.otherText') as HTMLElement;
    otherTextAnimation?.classList.remove('firstVisitAnimation');
    otherTextAnimation?.classList.add('skipVisitAnimation');
  }

  // populateForm(user: any) {
  //   // Your logic here to update the form in Step 1 with the received user data
  //   console.log('Populating form with:', user);
  // }

  signUp() {
    this.userService.signUp(this.newUser).subscribe(() => {
        window.alert("User Registered Successfully");
        this.router.navigate(['sign-in']);
    }, error => {
        window.alert("User Registration Error");
        console.log('Error: ', error)
    });
  }
}


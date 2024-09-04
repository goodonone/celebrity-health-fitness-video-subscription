import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {

  newUser: User = new User();

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {

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

  // resetAnimations() {
  //   const otherTextAnimation = document.querySelector('.otherText') as HTMLElement;
  //   otherTextAnimation.style.display = 'block';
  // }

  signUp() {
    this.userService.signUp(this.newUser).subscribe(() => {
        window.alert("User Registered Successfully");
        this.router.navigate(['signin']);
    }, error => {
        window.alert("User Registration Error");
        console.log('Error: ', error)
    });
  }
}


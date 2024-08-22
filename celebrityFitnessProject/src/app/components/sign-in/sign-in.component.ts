import { Component, ContentChild, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../services/user.service';

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

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    if (localStorage.getItem('userId')) {
      this.router.navigateByUrl(`/signin`);
    }

    this.navbar = document.getElementById('navbar');
    this.menu = document.querySelector('.menu'); 
    this.navbar?.classList.add('black');
    this.menu?.classList.add('black'); 

    // Reset navbar state when navigating away
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.resetNavbarState();
      }
    });
  }

  signin() {
    this.userService.login(this.email, this.password).subscribe(
      (response: any) => {
        const userId = response.userId;
        localStorage.setItem('tier', response.tier);
        localStorage.setItem('billing', response.paymentFrequency);
        localStorage.setItem('token', response.token);

        this.router.navigateByUrl(`/content/${userId}`);
      },
      (error) => {
        console.log('Error: ', error);
        this.errorMessage = true;
        this.router.navigateByUrl('/signin');
      }
    );
  }

  resetNavbarState(): void {
    this.navbar?.classList.remove('black');
    this.menu?.classList.remove('black');
    const navBarTextElements = document.querySelectorAll('.navBarText');
    navBarTextElements.forEach((element) => {
      element.classList.remove('black');
    });
  }
}

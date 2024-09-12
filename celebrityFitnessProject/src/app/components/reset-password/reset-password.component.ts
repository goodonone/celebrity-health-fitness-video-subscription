import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  navbar!: HTMLElement | null;
  menu!: HTMLElement | null;
  form!: FormGroup;
  private destroy$ = new Subject<void>();
  showEmailError = false;
  fullWidth = false;

  constructor(private router: Router, private userService: UserService, private fb: FormBuilder) { }

  ngOnInit(): void {

    // this.form = this.fb.group({
    //     email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]]
    //   });
    this.form = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]]
    });
          
    this.form.get('email')?.valueChanges
      .pipe(
        debounceTime(1500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.showEmailError = true;
      });

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

sendResetEmail() {
throw new Error('Method not implemented.');
}

resetNavbarState(): void {
  this.navbar?.classList.remove('black');
  this.menu?.classList.remove('black');
  const navBarTextElements = document.querySelectorAll('.navBarText');
  navBarTextElements.forEach((element) => {
    element.classList.remove('black');
  });
}

onEmailBlur() {
  this.showEmailError = true;
}

}

import { Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class FormService implements OnInit {

  userIsLoggedIn: boolean = false;
  UserId?: string;
  userId?: number;
  currentUser: User = new User();

  private activeStepSubject = new BehaviorSubject<number>(1);
  activeStep$ = this.activeStepSubject.asObservable();

  ngOnInit(): void {
  }

  constructor(private fb: FormBuilder, private user: UserService, private router: Router, private payment: PaymentService) { }

  multiStepForm: FormGroup = this.fb.group({
    personalDetails: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    }),
    planDetails: this.fb.group({
      plan: [localStorage.getItem('tier') ?? 'Just Looking', [Validators.required]],
      billing: [localStorage.getItem('billing') ?? 'monthly', [Validators.required]],
      planCost: [0],
      totalCost: []
    }),
    paymentDetails: this.fb.group({
      nameOnCard: ['', [Validators.required, Validators.minLength(4)]],
      ccNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(19)]],
      expDate: ['', [Validators.required]],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]]
    }),
  })


  get stepForm(): FormGroup {
    return this.multiStepForm;
  }

  goToNextStep(number: number) {
    this.activeStepSubject.next(number + 1);
  }

  goBackToPreviousStep(number: number) {
    this.activeStepSubject.next(number - 1);
  }

  submit() {
    const type: string = "subscription";
    const userInfo = this.multiStepForm.get('personalDetails')?.value;
    const planInfo = this.multiStepForm.get('planDetails')?.value;

    // Creating a new user/new payment for initial signUp of new user if not signed in else update user

    if (!localStorage.getItem('userId')) {
      const userData = {
        name: userInfo.name,
        password: userInfo.password,
        email: userInfo.email,
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost,
        purchaseType: type,
        paymentType: type
      }
      this.user.signUp(userData).subscribe(() => {
      });
    }
    else {
      this.UserId = this.user.getUserId() ?? "";

      this.userId = parseInt(this.UserId);

      this.user.getUser(this.userId).subscribe((user)=>{
        this.currentUser = user;
      });
      this.currentUser = {
        userId: this.userId,
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost
      }
      this.user.updateUser(this.currentUser).subscribe(() => {
      });

      const planData = {
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost,
        purchaseType: type,
      }
      this.payment.newPayment(planData).subscribe(() => {
      });
    }


    if (!localStorage.getItem('userId')) {
      this.goToNextStep(4);
      setTimeout(() => {
        this.activeStepSubject.next(1); this.router.navigate(['signin']);
      }, 4000);
      this.multiStepForm = this.fb.group({
        personalDetails: this.fb.group({
          name: ['', [Validators.required, Validators.minLength(4)]],
          email: ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required, Validators.minLength(8)]]
        }),
        planDetails: this.fb.group({
          plan: [localStorage.getItem('tier') ?? 'Just Looking', [Validators.required]],
          billing: [localStorage.getItem('billing') ?? 'monthly', [Validators.required]],
          planCost: [0],
          totalCost: []
        }),
        paymentDetails: this.fb.group({
          nameOnCard: ['', [Validators.required, Validators.minLength(4)]],
          ccNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(16)]],
          expDate: ['', [Validators.required]],
          cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
          zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]]
        }),
      })
    } else {
      localStorage.removeItem('tier');
      localStorage.removeItem('billing');
      localStorage.setItem('tier', planInfo.plan);
      localStorage.setItem('billing', planInfo.billing);
      location.href
      this.router.navigateByUrl(`/content/${this.UserId}`);
    }

  }

}



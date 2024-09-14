import { Injectable, OnInit } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn, 
         Validator, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user';
import { PaymentService } from 'src/app/services/payment.service';


// Custom Validator Function
export const passwordMatchValidator: ValidatorFn = (formGroup: AbstractControl): ValidationErrors | null => {
  const password = formGroup.get('password')?.value;
  const confirmPassword = formGroup.get('confirmPassword')?.value;
  
  return password === confirmPassword ? null : { mismatch: true };
};

@Injectable({
  providedIn: 'root'
})

export class FormService implements OnInit {

  userIsLoggedIn: boolean = false;
  UserId?: string;
  userId?: number;
  currentUser: User = new User();
  shipping?: boolean;

  private activeStepSubject = new BehaviorSubject<number>(1);
  activeStep$ = this.activeStepSubject.asObservable();

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');

    // Optionally remove confirmPassword after validation if you don't want to store it in the form
    const personalDetailsGroup = this.multiStepForm.get('personalDetails') as FormGroup;
    if (personalDetailsGroup && personalDetailsGroup.valid) {
      personalDetailsGroup.removeControl('confirmPassword');
    }
  }

  constructor(private fb: FormBuilder, private user: UserService, private router: Router, private payment: PaymentService) { 
  }

  multiStepForm: FormGroup = this.fb.group({
    personalDetails: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z]+ [A-Za-z]+$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, { validator: passwordMatchValidator }),
    planDetails: this.fb.group({
      plan: [localStorage.getItem('tier') ?? 'Just Looking', [Validators.required]],
      billing: [localStorage.getItem('billing') ?? 'monthly', [Validators.required]],
      planCost: [0],
      totalCost: []
    }),
    paymentDetails: this.fb.group({
      nameOnCard: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z\s]{4,}$/)]],
      ccNumber: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19), Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
      expDate: ['', [Validators.required], Validators.minLength(5), Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3), Validators.pattern(/^\d{3}$/)]],
      zipCode: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern(/^\d{5}$/), // Ensures it's exactly 5 digits
        (control: AbstractControl) => {
          const value = control.value;
          const numValue = parseInt(value, 10);
    
          // Check if the value is between 00501 and 99950
          if (numValue < 501 || numValue > 99950) {
            return { zipCodeOutOfRange: true }; // Return error object if out of range
          }
    
          return null; // Valid
        }
      ]],
      billingAddress: ['', [Validators.required, Validators.minLength(15), Validators.pattern(/^[A-Za-z0-9\s,.-]{15,}$/)]],
      billingZip: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern(/^\d{5}$/), // Ensures it's exactly 5 digits
        (control: AbstractControl) => {
          const value = control.value;
          const numValue = parseInt(value, 10);
    
          // Check if the value is between 00501 and 99950
          if (numValue < 501 || numValue > 99950) {
            return { zipCodeOutOfRange: true }; // Return error object if out of range
          }
    
          return null; // Valid
        }
      ]],
    }),
  });
  

  updateFormFields(shipping: boolean) {
    const paymentDetailsGroup = this.multiStepForm.get('paymentDetails') as FormGroup;
  
    if (shipping) {
      paymentDetailsGroup.addControl('shippingAddress', this.fb.control('', [Validators.required, Validators.minLength(30)]));
      paymentDetailsGroup.addControl('shippingZip', this.fb.control('',  [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern(/^\d{5}$/), // Ensures it's exactly 5 digits
        (control: AbstractControl) => {
          const value = control.value;
          const numValue = parseInt(value, 10);
    
          // Check if the value is between 00501 and 99950
          if (numValue < 501 || numValue > 99950) {
            return { zipCodeOutOfRange: true }; // Return error object if out of range
          }
    
          return null; // Valid
        }
      ]));
    } else {
      paymentDetailsGroup.removeControl('shippingAddress');
      paymentDetailsGroup.removeControl('shippingZip');
    }
  }


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
        this.activeStepSubject.next(1); this.router.navigate(['sign-in']);
      }, 4000);
      this.multiStepForm = this.fb.group({
    personalDetails: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z]+ [A-Za-z]+$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirmPassword: ['', { validators: [Validators.required]}]
    }, { validator: passwordMatchValidator 
    }),
    planDetails: this.fb.group({
      plan: [localStorage.getItem('tier') ?? 'Just Looking', [Validators.required]],
      billing: [localStorage.getItem('billing') ?? 'monthly', [Validators.required]],
      planCost: [0],
      totalCost: []
    }),
    paymentDetails: this.fb.group({
      nameOnCard: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z\s]{4,}$/)]],
      ccNumber: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19), Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
      expDate: ['', [Validators.required], Validators.minLength(5), Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3), Validators.pattern(/^\d{3}$/)]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^\d{5}$/)]],
      billingAddress: ['', [Validators.required, Validators.minLength(15), Validators.pattern(/^[A-Za-z0-9\s,.-]{15,}$/)]],
      billingZip: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^\d{5}$/)]],
    }),
  });
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



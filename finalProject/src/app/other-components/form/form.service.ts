// import { Injectable, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { BehaviorSubject } from 'rxjs';
// import { UserService } from 'src/app/services/user.service';
// import { Router } from '@angular/router';
// import { PaymentService } from 'src/app/services/payment.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class FormService implements OnInit {

//   userIsLoggedIn: boolean = false;
//   UserId: string = "";

//   private activeStepSubject = new BehaviorSubject<number>(1);
//   activeStep$ = this.activeStepSubject.asObservable();



//   ngOnInit(): void {

//     // if (localStorage.getItem('userSignedIn')) {
//     //   !this.userIsLoggedIn;
//     //   console.log(this.userIsLoggedIn);
//     // }

//     console.log("Testing" + "Testing");
//     // this.UpdateStatus();
//   }

//   multiStepForm: FormGroup = this.fb.group({
//     personalDetails: this.fb.group({
//       name: ['', [Validators.required, Validators.minLength(4)]],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(8)]]
//     }),
//     planDetails: this.fb.group({
//       plan: ['Just Looking', [Validators.required]],
//       billing: ['monthly', [Validators.required]],
//       planCost: [0],
//       totalCost: []
//     }),
//     paymentDetails: this.fb.group({
//       nameOnCard: ['', [Validators.required, Validators.minLength(4)]],
//       ccNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(16)]],
//       expDate: ['', [Validators.required]],
//       cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
//       zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]]
//     }),
//   })


//   get stepForm(): FormGroup {
//     return this.multiStepForm;
//   }

//   constructor(private fb: FormBuilder, private user: UserService, private router: Router, private payment: PaymentService) { }

//   goToNextStep(number: number) {
//     this.activeStepSubject.next(number + 1);
//   }

//   goBackToPreviousStep(number: number) {
//     this.activeStepSubject.next(number - 1);
//   }

//   submit() {
//     const type: string = "subscription";
//     const userInfo = this.multiStepForm.get('personalDetails')?.value;
//     const planInfo = this.multiStepForm.get('planDetails')?.value;
//     const generatedUserId: string = Math.random().toString(18).slice(2);

//     // console.log(this.multiStepForm.value);
//     // console.log(generatedUserId);

//     console.log("userInfo" + userInfo.name + userInfo.password + userInfo.email);
//     console.log("planDetails" + planInfo.billing + " " + planInfo.plan + planInfo.totalCost);

//     if (!localStorage.getItem('userSignedIn')) {
//       const userData = {
//         // remove generated UsesrId when added to backend
//         userId: generatedUserId,
//         name: userInfo.name,
//         password: userInfo.password,
//         email: userInfo.email,
//         tier: planInfo.plan,
//         paymentFrequency: planInfo.billing,
//         price: planInfo.totalCost
//       }
//       this.user.signUp(userData).subscribe(() => {
//       });
//       const planData = {
//         tier: planInfo.plan,
//         paymentFrequency: planInfo.billing,
//         price: planInfo.totalCost,
//         purchaseType: type
//       }
//       this.payment.newPayment(planData).subscribe(() => {
//       });
//     }
//     else {
//       this.UserId = this.user.getUserId() ?? "";
//       const userData = {
//         userId: this.UserId,
//         tier: planInfo.plan,
//         paymentFrequency: planInfo.billing,
//         price: planInfo.totalCost
//       }
//       this.user.updateUser(userData).subscribe(() => {
//       });
//       const planData = {
//         tier: planInfo.plan,
//         paymentFrequency: planInfo.billing,
//         price: planInfo.totalCost,
//         purchaseType: type
//       }
//       // Update not create a new payment or they will have two subscriptions
//       this.payment.updatePayment(planData).subscribe(() => {
//       });

//     }

//     this.multiStepForm = this.fb.group({
//       personalDetails: this.fb.group({
//         name: ['', [Validators.required, Validators.minLength(4)]],
//         email: ['', [Validators.required, Validators.email]],
//         password: ['', [Validators.required, Validators.minLength(8)]]
//       }),
//       planDetails: this.fb.group({
//         plan: ['Just Looking', [Validators.required]],
//         billing: ['monthly', [Validators.required]],
//         planCost: [0],
//         totalCost: []
//       }),
//       paymentDetails: this.fb.group({
//         nameOnCard: ['', [Validators.required, Validators.minLength(4)]],
//         ccNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(16)]],
//         expDate: ['', [Validators.required]],
//         cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
//         zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]]
//       }),
//     })

//     if (!localStorage.getItem('userSignedIn')) {
//       this.goToNextStep(4);
//       setTimeout(() => {
//         this.activeStepSubject.next(1); this.router.navigate(['signin']);
//       }, 4000);
//     } else {
//       // Change this to route to workouts/this.UserId
//       this.router.navigateByUrl(`/test`);
//     }

//   }

// }


import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { PaymentService } from 'src/app/services/payment.service';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  private activeStepSubject = new BehaviorSubject<number>(1);
  activeStep$ = this.activeStepSubject.asObservable();

  multiStepForm: FormGroup = this.fb.group({
    personalDetails: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    }),
    planDetails: this.fb.group({
      plan: ['Just Looking', [Validators.required]],
      billing: ['monthly', [Validators.required]],
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

  get stepForm(): FormGroup {
    return this.multiStepForm;
  }

  constructor(private fb: FormBuilder, private user: UserService, private router: Router, private payment: PaymentService) { }

  goToNextStep(number: number) {
    this.activeStepSubject.next(number + 1);
  }

  goBackToPreviousStep(number: number) {
    this.activeStepSubject.next(number - 1);
  }

  submit() {
    const type : string ="subscription"; 
    const userInfo = this.multiStepForm.get('personalDetails')?.value;
    const planInfo = this.multiStepForm.get('planDetails')?.value;
    const generatedUserId: string = Math.random().toString(18).slice(2);

    console.log(this.multiStepForm.value);
    // console.log(generatedUserId);
    console.log("userInfo" + userInfo.name + userInfo.password + userInfo.email);
    console.log("planDetails" + planInfo.billing + " " + planInfo.plan + planInfo.totalCost);

    const userData = {
      userId: generatedUserId,
      name:userInfo.name,
      password:userInfo.password,
      email:userInfo.email,
      tier: planInfo.plan
    }

    const planData = {
      tier: planInfo.plan,
      paymentFrequency: planInfo.billing,
      price: planInfo.totalCost,
      purchaseType: type
    }

    this.user.signUp(userData).subscribe(() => {
   });

    this.payment.newPayment(planData).subscribe(()=>{
  });

    this.multiStepForm = this.fb.group({
      personalDetails: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]]
      }),
      planDetails: this.fb.group({
        plan: ['Just Looking', [Validators.required]],
        billing: ['monthly', [Validators.required]],
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

    this.goToNextStep(4);
    setTimeout(() => {
      this.activeStepSubject.next(1); this.router.navigate(['signin']);
    }, 4000);
  }


}
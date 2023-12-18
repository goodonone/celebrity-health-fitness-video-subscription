import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

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
      planCost: [],
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

  constructor(private fb: FormBuilder, private user: UserService, private router: Router) { }

  goToNextStep(number: number) {
    this.activeStepSubject.next(number + 1);
  }

  goBackToPreviousStep(number: number) {
    this.activeStepSubject.next(number - 1);
  }

  submit() {
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
      price: planInfo.totalCost
    }

    this.user.signUp(userData).subscribe(() => {
      // window.alert("User Registered Successfully");
      this.router.navigate(['login']);
  // }, error => {
  //     window.alert("User Registration Error");
  //     console.log('Error: ', error)
  });

    // function to send payment to backend;

    this.goToNextStep(4);
    // setTimeout(() => {
    //   this.activeStepSubject.next(1);
    // }, 8000);
  }


}
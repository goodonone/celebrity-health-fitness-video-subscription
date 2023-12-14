import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UserService } from 'src/app/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  // change plan to tier everywhere

  private activeStepSubject = new BehaviorSubject<number>(1);
  activeStep$ = this.activeStepSubject.asObservable();

  multiStepForm: FormGroup = this.fb.group({
    personalDetails: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    }),
    planDetails: this.fb.group({
      plan: ['', [Validators.required]],
      billing: ['', [Validators.required]],
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

// Change plan to tier

  get stepForm(): FormGroup {
    return this.multiStepForm;
  }

  constructor(private fb: FormBuilder, private user: UserService) { }

  goToNextStep(number: number) {
    this.activeStepSubject.next(number + 1);
  }

  goBackToPreviousStep(number: number) {
    this.activeStepSubject.next(number - 1);
  }

  submit() {

    const userdata = {}
    this.user.signUp(userdata);



    //TO-DO => validate form
    this.goToNextStep(4);
    setTimeout(() => {
      this.activeStepSubject.next(1);
    }, 8000);
  }



}
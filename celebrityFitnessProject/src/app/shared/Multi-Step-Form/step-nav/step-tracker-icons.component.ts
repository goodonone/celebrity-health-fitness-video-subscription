import { Component, OnInit } from '@angular/core';
import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';
import { combineLatest, Subscription } from 'rxjs';



@Component({
  selector: 'app-step-tracker-icons',
  templateUrl: './step-tracker-icons.component.html',
  styleUrls: ['./step-tracker-icons.component.css'],
})
export class StepTrackerIconsComponent implements OnInit {

  userIsLoggedIn : boolean = false;
  activeStep$?: number;
  activeStep: number = 1;
  selectedPlanType: string = 'Just Looking';
  // private planTypeSubscription!: Subscription;
  private subscription!: Subscription;
  isPaymentStepDisabled: boolean = false;

  
  constructor(private formService: FormService, private user: UserService) { }

  ngOnInit(): void {
    
    // if(localStorage.getItem('userSignedIn')){
    //   !this.userIsLoggedIn;
    // }

  this.formService.activeStep$.subscribe(
    activeStep => this.activeStep$ = activeStep);

  // this.planTypeSubscription = this.formService.selectedPlanType$.subscribe(
  //   planType => {
  //     this.selectedPlanType = planType;
  //     this.updateStepDetails();
  //   }
  // );     
  
  this.subscription = combineLatest([
    this.formService.activeStep$,
    this.formService.selectedPlan$
  ]).subscribe(([activeStep, selectedPlan]) => {
    this.activeStep = activeStep;
    this.updateStepDetails(activeStep, selectedPlan);
  });

  }

  ngOnDestroy(): void {
    // if (this.planTypeSubscription) {
    //   this.planTypeSubscription.unsubscribe();
    // }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  

stepDetails: { step: number; description: string; disabled?: boolean}[] = [
      { step: 1, description: 'Your info' },
      { step: 2, description: 'Select plan' },
      { step: 3, description: 'Summary' },
      { step: 4, description: 'Payment', disabled: false },
      { step: 5, description: 'Confirmation' }
    ]

// stepDetails: { step: number; description: string; }[] = [
//   { step: 1, description: 'Your info' },
//   { step: 2, description: 'Select plan' },
//   { step: 3, description: 'Summary' },
//   { step: 4, description: 'Confirmation' }
// ]    

  UpdateStatus() {
    if (this.user.isloggedIn()) {
      this.userIsLoggedIn = !this.userIsLoggedIn;
    }
    
  }

  // updateStepDetails() {
  //   if (this.selectedPlanType === 'Just Looking' && this.activeStep$ === 2) {
  //     this.stepDetails[3].disabled = true;
  //   } else {
  //     this.stepDetails[3].disabled = false;
  //   }
  // }

  updateStepDetails(activeStep: number, selectedPlan: string) {
    this.isPaymentStepDisabled = activeStep === 2 && selectedPlan === 'Just Looking';
    this.stepDetails[3].disabled = this.isPaymentStepDisabled;
  }

}
  

  
  
  

  



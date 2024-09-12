import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { planOptions } from './planDetails.model';

@Component({
  selector: 'app-step-two-plan-details',
  templateUrl: './step-two-plan-details.component.html',
  styleUrls: ['./step-two-plan-details.component.css'],
})

export class StepTwoPlanDetailsComponent implements OnInit {

  stepForm!: FormGroup;
  planType: string = 'Just Looking';
  chosenPlan : string = "";
  typeOfBilling: string = 'monthly';
  totalCost: number = 0;
  checked: boolean = false;
  planOptions: any[] = planOptions;
  billing!: string;
  cardCounter: number[] = [1,2,3];

  constructor(private rootFormGroup: FormGroupDirective, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.stepForm = this.rootFormGroup.control.get('planDetails') as FormGroup;
    const formVals = this.rootFormGroup.form.get('planDetails') ?.value;
    
    this.typeOfBilling = formVals?.billing || 'monthly';
    this.chosenPlan = formVals?.plan;
    this.checked = this.typeOfBilling === 'monthly' ? false : true;
    this.planType = formVals?.plan || 'Just Looking';
    this.updateBilling();

    // setTimeout(() => {
    //   this.cdr.detectChanges();
    // }, 0);
  }

  ngAfterViewInit(): void {
    const formVals = this.rootFormGroup.form.get('planDetails')?.value;

    this.typeOfBilling = formVals?.billing || 'monthly';
    this.chosenPlan = formVals?.plan;
    this.checked = this.typeOfBilling === 'monthly' ? false : true;
    this.planType = formVals?.plan || 'Just Looking';
    this.updateBilling();

    // Trigger change detection manually if needed
    // setTimeout(() => {
    //   this.cdr.detectChanges();
    // }, 0);
    this.cdr.detectChanges();
  }

  public onPlanChange(plan: string) {
    this.planType = plan;
  }

  updatePlanType(plan: string, cost: number) {
    this.planType = plan;
    this.totalCost = cost;
    this.stepForm.patchValue({
      plan: plan,
      planCost: cost,
      totalCost: cost,
    })

    // setTimeout(() => {
    //   this.cdr.detectChanges();
    // }, 0);
  }

  updateBilling() {
    const planIndex = this.planOptions.findIndex(p => p.plan == this.planType);
    const planDetails:  any = this.planOptions[planIndex];
    const planDetailsBilling = planDetails.billing[this.typeOfBilling];
    this.stepForm.patchValue({
      plan: this.planType, 
    })
    if (this.checked === false) {
      this.stepForm.patchValue({
        billing: 'monthly',
        planCost: planDetailsBilling.addToTotal,
        totalCost: planDetailsBilling.addToTotal,
      })
      
    } 
    if (this.checked === true) {
      this.stepForm.patchValue({
        billing: 'yearly',
        planCost: planDetailsBilling.addToTotal,
        totalCost: planDetailsBilling.addToTotal
      })
    }
  }

  toggleBilling() {
    this.checked = !this.checked;
    this.typeOfBilling = this.checked ? 'yearly' : 'monthly';
    this.updateBilling();
    // if (this.checked === false) {
    //   this.typeOfBilling = 'monthly'
    //   this.updateBilling();
    // }
    // if (this.checked === true) {
    //   this.typeOfBilling = 'yearly';
    //   this.updateBilling();
    // }
  }

  // Disable if the first plan is selected
  // get isPlanDisabled(): boolean {
  //   return this.planOptions[0].plan === this.planType; // Disable if the first plan is selected
  // }
  
  // toggleFirstPlan() {
  //   if (!this.isPlanDisabled) {
  //     this.checked = !this.checked; // Toggle only if it's not disabled
  //   }
  // }

  
}
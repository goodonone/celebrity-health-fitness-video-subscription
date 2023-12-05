import { Component, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { planOptions } from './planDetails.model';

@Component({
  selector: 'app-step-two-plan-details',
  templateUrl: './step-two-plan-details.component.html',
  styleUrls: ['./step-two-plan-details.component.css']
})

export class StepTwoPlanDetailsComponent implements OnInit {

  stepForm!: FormGroup;
  planType: string = 'Just Looking' || 'Motivated' || 'All In!';
  billing: string = 'monthly' || 'yearly';
  totalCost: number = 0;
  checked = false;
  planOptions = planOptions;

  constructor(private rootFormGroup: FormGroupDirective) { }

  ngOnInit(): void {
    this.stepForm = this.rootFormGroup.control.get('planDetails') as FormGroup;
    this.billing = this.stepForm.controls['duration'].value || 'monthly';
    this.checked = this.billing === 'monthly' ? false : true;
    this.planType = this.planType || 'Just Looking';
  }

  public onPlanChange(plan: string) {
    this.planType = plan;
  }

  updatePlanType(plan: string, cost: number) {
    this.planType = plan;``
    this.totalCost = cost;
    this.stepForm.patchValue({
      plan: plan,
      planCost: cost,
      totalCost: cost
    })
  }

  updateDuration() {
    const planDetails = this.planOptions?[this.planOptions.findIndex(p => p.plan == this.planType)].billing[this.billing]: undefined;
    // const planDetails = this.planOptions.plan.billing[this.billing];
    this.stepForm.patchValue({
      plan: this.planType
    })
    if (this.checked === false) {
      this.stepForm.patchValue({
        billing: 'monthly',
        planCost: planDetails.addToTotal,
        totalCost: planDetails.addToTotal
      })

    } if (this.checked === true) {
      this.stepForm.patchValue({
        billing: 'yearly',
        planCost: planDetails.addToTotal,
        totalCost: planDetails.addToTotal
      })
    }
  }

  toggleDuration() {
    this.checked = !this.checked;
    if (this.checked === false) {
      this.billing = 'monthly'
      this.updateDuration();
    }
    if (this.checked === true) {
      this.billing = 'yearly';
      this.updateDuration();
    }
  }


}
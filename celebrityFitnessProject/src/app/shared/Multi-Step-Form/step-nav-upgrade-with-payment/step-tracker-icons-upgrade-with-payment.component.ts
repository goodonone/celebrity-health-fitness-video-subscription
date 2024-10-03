import { Component, Input, OnInit } from '@angular/core';

import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-step-tracker-icons-upgrade-with-payment',
  templateUrl: './step-tracker-icons-upgrade-with-payment.component.html',
  styleUrls: ['./step-tracker-icons-upgrade-with-payment.css'],
})
export class StepTrackerIconsUpgradeComponentWithPayment implements OnInit {

  activeStep$?: number;

  constructor(private formService: FormService, private user: UserService) { }

  ngOnInit(): void {
      this.formService.activeStep$.subscribe(
      activeStep => this.activeStep$ = activeStep);
      
  }

  stepDetails: { step: number; description: string; }[] = [
    { step: 1, description: 'Select Plan' },
    { step: 2, description: 'Summary' },
    { step: 3, description: 'Payment' }
  ]

}










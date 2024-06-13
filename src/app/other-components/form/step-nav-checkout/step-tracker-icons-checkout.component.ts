import { Component, Input, OnInit } from '@angular/core';

import { UserService } from 'src/app/services/user.service';
import { FormService } from '../form.service';

@Component({
  selector: 'app-step-tracker-icons-checkout',
  templateUrl: './step-tracker-icons-checkout.component.html',
  styleUrls: ['./step-tracker-icons-checkout.css'],
})
export class StepTrackerIconsCheckout implements OnInit {

  activeStep$?: number;

  constructor(private formService: FormService, private user: UserService) { }

  ngOnInit(): void {

    this.formService.activeStep$.subscribe(
      activeStep => this.activeStep$ = activeStep);
  }

  stepDetails: { step: number; description: string; }[] = [
    { step: 1, description: 'Payment' },
    { step: 2, description: 'Confirmation' },
  ]

}










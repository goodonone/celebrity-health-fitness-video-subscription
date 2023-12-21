import { Component, OnInit } from '@angular/core';
import { FormService } from '../form/form.service';

@Component({
  selector: 'app-step-tracker-icons',
  templateUrl: './step-tracker-icons.component.html',
  styleUrls: ['./step-tracker-icons.component.css'],
})
export class StepTrackerIconsComponent implements OnInit {

  stepDetails: { step: number; description: string; }[] = [
    { step: 1, description: 'Your info' },
    { step: 2, description: 'Select plan' },
    { step: 3, description: 'Summary' },
    { step: 4, description: 'Payment' },
    { step: 5, description: 'Confirmation' }
  ]
  activeStep$?: number;

  constructor(private formService: FormService) { }

  ngOnInit(): void {
    this.formService.activeStep$.subscribe(
      activeStep => this.activeStep$ = activeStep);
  }
}
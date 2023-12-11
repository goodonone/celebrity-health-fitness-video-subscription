import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormService } from './form.service';
// import { StepOnePersonalInfoComponent } from './form-steps/step-one-personal-info/step-one-personal-info.component';
// import { StepTrackerIconsComponent } from '../step-nav/step-tracker-icons.component';
// import { ProgressionButtonsComponent } from '../progression-buttons/progression-buttons.component';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
})

export class FormComponent implements OnInit {
  stepForm!: FormGroup;
  activeStep$?: number;

  constructor(private formService: FormService) { }

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;

    this.formService.activeStep$.subscribe(
      step => this.activeStep$ = step
    );
  }

  confirmAndSubmitForm() {
    this.formService.submit();
  }
}
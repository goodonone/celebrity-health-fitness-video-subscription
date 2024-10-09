import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormService } from './form.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
})

export class FormComponent implements OnInit {
  stepForm!: FormGroup;
  activeStep$?: number;
  
  
  @Input() loggedIn!: boolean;
  @Input() payment!: boolean;
  @Input() checkout!: boolean;
  @Input() shipping!: boolean;
  @Input() tierTwoThree!: boolean;

  constructor(private formService: FormService) { }

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;

    this.formService.activeStep$.subscribe(
      step => this.activeStep$ = step
    );

    this.formService.getTierAndBilling();

    console.log('FormComponent: tierTwoThree value received:', this.tierTwoThree);

  
  }

  confirmAndSubmitForm() {
    this.formService.submit();
  }
}
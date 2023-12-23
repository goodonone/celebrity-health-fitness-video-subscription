import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';

@Component({
  selector: 'app-step-four-payment',
  templateUrl: './step-four-payment.component.html',
  styleUrls: ['./step-four-payment.component.css'],
})

export class StepFourPaymentComponent implements OnInit {
  stepForm!: FormGroup;

  @Input() formGroupName!: string;
  
  constructor(private rootFormGroup: FormGroupDirective) { }

  ngOnInit(): void {
    this.stepForm = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;
  }


}
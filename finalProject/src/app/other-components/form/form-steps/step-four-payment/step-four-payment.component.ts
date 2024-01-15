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

    const ccNumber: number | any = document.getElementById("ccNumber");
    ccNumber.addEventListener("input", () => ccNumber.value = formatCCNumber(ccNumber.value.replaceAll(" ", "")));;
    const formatCCNumber = (number: string) => number.split("").reduce((seed, next, index) => {
      if (index !== 0 && !(index % 4)) seed += " ";
      return seed + next;
    }, "");

  // Implement 00/00 format for date input


  }


  

}
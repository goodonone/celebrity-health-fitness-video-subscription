import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { FormService } from '../../form.service';

@Component({
  selector: 'app-step-three-summary',
  templateUrl: './step-three-summary.component.html',
  styleUrls: ['./step-three-summary.component.css']
})
export class StepThreeSummaryComponent implements OnInit {
  @Input() stepForm!: FormGroup;
  @Input() tierTwoThree!: boolean;

  personalDetails = this.rootFormGroup.form.get('personalDetails') ?.value;
  planDetails = this.rootFormGroup.form.get('planDetails') ?.value;


  constructor(private rootFormGroup: FormGroupDirective, private formService: FormService) { }
  ngOnInit(): void {

    console.log(`This is step three summary component${this.tierTwoThree}`);
      }

  changePlan() {
    this.formService.goBackToPreviousStep(3)
  }

}
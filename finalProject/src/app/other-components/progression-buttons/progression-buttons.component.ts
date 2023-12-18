import { Component, OnInit} from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { FormService } from '../form/form.service';


@Component({
  selector: 'app-progression-buttons',
  templateUrl: './progression-buttons.component.html',
  styleUrls: ['./progression-buttons.component.css'],
  // standalone: true,
})
export class ProgressionButtonsComponent implements OnInit {
  stepForm!: FormGroup;
  activeStep$: number = 0;
  

  constructor(private formService: FormService, private rootFormGroup: FormGroupDirective) { }

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;
    this.formService.activeStep$.subscribe(
      step => this.activeStep$ = step
    );
  }

  nextStep() {
    if ((this.activeStep$ == 1) && (this.stepForm.controls['personalDetails'].pristine) && (!this.stepForm.controls['personalDetails'].touched)) {
      // TO-DO => display error message if step 1 is skipped

      console.log(this.stepForm.controls['personalDetails'].pristine, !this.stepForm.controls['personalDetails'].touched)

    } else {
      this.formService.goToNextStep(this.activeStep$);
    }
  }

  goBack() {
    this.formService.goBackToPreviousStep(this.activeStep$);
  }

  confirmAndSubmitForm() {
    this.formService.submit();
  }

//  planDetails = this.stepForm.controls['personalDetails']
// if (planDetails){
  
// }

// value = this.stepForm.controls['personalDetails.plan'] === 'Just Looking';

// stepForm.valid = true;

// planDetails = this.rootFormGroup.form.get('planDetails') ?.value;
}
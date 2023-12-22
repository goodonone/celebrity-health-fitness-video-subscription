import { Component, OnInit} from '@angular/core';
import { FormGroup } from '@angular/forms';
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
  planCost: number = 0;
  


  constructor(private formService: FormService) { }

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;
    this.formService.activeStep$.subscribe(
      step => {
        this.activeStep$ = step;
        this.planCost = this.stepForm.controls['planDetails'].value.planCost;
  });

    this.formService.activeStep$.subscribe(
      step => {
        console.log(step);
        console.log(this.stepForm.controls['planDetails'].value.planCost);
        console.log(this.stepForm.controls);
      });
  }

  nextStep() {
    if ((this.activeStep$ == 1) && (this.stepForm.controls['personalDetails'].pristine) && (!this.stepForm.controls['personalDetails'].touched)) {
      // TO-DO => display error message if step 1 is skipped

      // console.log(this.stepForm.controls['personalDetails'].pristine, !this.stepForm.controls['personalDetails'].touched)

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



}
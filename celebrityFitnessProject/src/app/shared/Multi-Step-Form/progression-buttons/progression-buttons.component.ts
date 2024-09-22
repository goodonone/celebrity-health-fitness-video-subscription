import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';


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

  @Input() loggedIn!: boolean;
  @Input() payment!: boolean;
  @Input() checkout!: boolean;

  constructor(private formService: FormService, private user: UserService, private router: Router, private cartService: CartService) { }

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;
    this.formService.activeStep$.subscribe(
      step => {
        this.activeStep$ = step;
        this.planCost = this.stepForm.controls['planDetails'].value.planCost;
      });

  }

  nextStep() {
    if (!this.loggedIn) {
      if ((this.activeStep$ == 1) && (this.stepForm.controls['personalDetails'].pristine) && (!this.stepForm.controls['personalDetails'].touched)) {
        
      } else {
        this.formService.goToNextStep(this.activeStep$);
      }
    }
    else {
      if (this.activeStep$ == 1) {
        
        this.formService.goToNextStep(this.activeStep$);
      }
        else {
          this.formService.goToNextStep(this.activeStep$);
        }

    }

  }

  // onEnterKey(event: KeyboardEvent) {
  //   // Check if the pressed key is Enter
  //   if (event.key === 'Enter') {
  //     // Prevent the default action for the Enter key
  //     event.preventDefault();

  //     // Trigger the Next button action programmatically
  //     const nextButton = document.getElementById('nextButton') as HTMLButtonElement;
  //     if (nextButton) {
  //       nextButton.click(); // Trigger Next button click
  //     }
  //   }
  // }

  goBack() {
    this.formService.goBackToPreviousStep(this.activeStep$);
  }

  confirmAndSubmitForm() {
    this.formService.submit();
  }

  purchase() {
    this.formService.goToNextStep(this.activeStep$);
    this.cartService.clearCart();
    localStorage.removeItem("cart");
    setInterval(()=>{
      this.router.navigate(['cart']);
    },3000)
  }


}
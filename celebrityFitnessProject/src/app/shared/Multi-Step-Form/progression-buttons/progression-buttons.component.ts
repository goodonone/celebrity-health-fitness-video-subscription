import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { AuthService } from 'src/app/services/auth.service';


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

  constructor(private formService: FormService, private user: UserService, private router: Router, private cartService: CartService, private authService: AuthService) { }

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;
    this.formService.activeStep$.subscribe(
      step => {
        this.activeStep$ = step;
        this.planCost = this.stepForm.controls['planDetails'].value.planCost;
      });

    this.formService.formUpdatedWithGoogleData$.subscribe(() => {
      // Check if we can proceed after Google data is loaded
      if (this.canProceed()) {
        console.log('Form is valid after Google OAuth, ready to proceed');
      }
    });

  }

  canProceed(): boolean {
    const personalDetails = this.stepForm.get('personalDetails');
    if (this.activeStep$ === 1 && personalDetails) {
      return personalDetails.valid || personalDetails.get('isGoogleAuth')?.value === true;
    }
    // Add logic for other steps if needed
    return true;
  }

  // nextStep() {
  //   if (!this.loggedIn) {
  //     if ((this.activeStep$ == 1) && (this.stepForm.controls['personalDetails'].pristine) && (!this.stepForm.controls['personalDetails'].touched)) {
        
  //     } else {
  //       this.formService.goToNextStep(this.activeStep$);
  //     }
  //   }
  //   else {
  //     if (this.activeStep$ == 1) {
        
  //       this.formService.goToNextStep(this.activeStep$);
  //     }
  //       else {
  //         this.formService.goToNextStep(this.activeStep$);
  //       }

  //   }

  // }

  // nextStep() {
  //   if (this.canProceed()) {
  //     if (!this.loggedIn) {
  //       const personalDetails = this.stepForm.get('personalDetails');
  //       if (this.activeStep$ === 1 && personalDetails) {
  //         if (personalDetails.get('isGoogleAuth')?.value === true || personalDetails.valid) {
  //           this.formService.goToNextStep(this.activeStep$);
  //         } else if (!personalDetails.pristine || personalDetails.touched) {
  //           this.formService.goToNextStep(this.activeStep$);
  //         }
  //       } else {
  //         this.formService.goToNextStep(this.activeStep$);
  //       }
  //     } else {
  //       this.formService.goToNextStep(this.activeStep$);
  //     }
  //   }
  // }

  nextStep() {
    if (this.canProceed()) {
      if (this.activeStep$ < 4) {
        if (!this.loggedIn) {
          const personalDetails = this.stepForm.get('personalDetails');
          if (this.activeStep$ === 1 && personalDetails) {
            if (personalDetails.get('isGoogleAuth')?.value === true || personalDetails.valid) {
              this.formService.goToNextStep(this.activeStep$);
            } else if (!personalDetails.pristine || personalDetails.touched) {
              this.formService.goToNextStep(this.activeStep$);
            }
          } else {
            this.formService.goToNextStep(this.activeStep$);
          }
        } else {
          this.formService.goToNextStep(this.activeStep$);
        }
      } else if (this.activeStep$ === 4) {
        // Step 4: Submit the form
        this.confirmAndSubmitForm();
      } else if (this.activeStep$ === 5) {
        // Step 5: Handle post-confirmation
        this.handlePostConfirmation();
      }
    }
  }

  private handlePostConfirmation() {
    setTimeout(() => {
      const isGoogleAuth = this.stepForm.get('personalDetails.isGoogleAuth')?.value;
      if (isGoogleAuth || !this.loggedIn) {
        // For Google auth users and new non-Google auth users
        this.authService.clearAuthState();
        this.router.navigate(['sign-in']);
      } else {
        // For existing non-Google auth users
        const userId = this.user.getUserId();
        if (userId) {
          this.router.navigateByUrl(`/content/${userId}`);
        } else {
          this.router.navigate(['sign-in']);
        }
      }
      this.formService.resetForm();
    }, 100); // 5 seconds delay, adjust as needed
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
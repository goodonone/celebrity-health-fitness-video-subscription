import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { AuthService } from 'src/app/services/auth.service';
import { Subject, takeUntil } from 'rxjs';


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

  private destroy$ = new Subject<void>();


  constructor(private formService: FormService, private user: UserService, private router: Router, private cartService: CartService, private authService: AuthService, private cdr: ChangeDetectorRef) {
    // this.cdr.detectChanges = (...args) => {
    //   console.log('Change detection run in ProgressionButtonsComponent');
    //   Object.getPrototypeOf(this.cdr).detectChanges.apply(this.cdr, args);
    };
   

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;
    this.formService.activeStep$.subscribe(
      step => {
        // console.log('Form state:', JSON.stringify(this.stepForm.value, null, 2));
        // console.log('ProgressionButtonsComponent received new step:', step);
        this.activeStep$ = step;
        this.planCost = this.stepForm.controls['planDetails'].value.planCost;
        // this.cdr.detectChanges();
      });

    this.formService.formUpdatedWithGoogleData$.subscribe(() => {
      // Check if we can proceed after Google data is loaded
      if (this.canProceed()) {
        console.log('Form is valid after Google OAuth, ready to proceed');
      }
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // console.log('Key pressed:', event.key);
    if (event.key === 'Enter') {
      // console.log('Enter key pressed');
      const maxStep = this.getMaxStep();
      
      if (this.activeStep$ === maxStep) {
        // console.log('Calling confirmAndSubmitForm');
        this.confirmAndSubmitForm();
      } else if (this.checkout) {
        // console.log('Calling purchase');
        this.purchase();
      }
    }
  }
 

  // canProceed(): boolean {
  //   const personalDetails = this.stepForm.get('personalDetails');
  //   if (this.activeStep$ === 1 && personalDetails) {
  //     return personalDetails.valid || personalDetails.get('isGoogleAuth')?.value === true;
  //   }
  //   // Add logic for other steps if needed
  //   return true;
  // }


  canProceed(): boolean {
    const personalDetails = this.stepForm.get('personalDetails');
    const planDetails = this.stepForm.get('planDetails');
    const paymentDetails = this.stepForm.get('paymentDetails');
  
    // For logged-in users upgrading their plan
    if (this.loggedIn) {
      if (this.activeStep$ === 1) {
        return planDetails?.valid ?? true;
      }
      if (this.activeStep$ === 2) {
        return true; // Summary step, always valid
      }
      if (this.activeStep$ === 3 && this.payment) {
        return paymentDetails?.valid ?? true;
      }
    }
  
    // For checkout process
    else if (this.checkout) {
      if (this.activeStep$ === 1) {
        return true; // Summary step, always valid
      }
      if (this.activeStep$ === 2) {
        return paymentDetails?.valid ?? true;
      }
    }
  
    // For new users signing up
    else if (!this.loggedIn && !this.checkout) {
      if (this.activeStep$ === 1) {
        return personalDetails?.valid || personalDetails?.get('isGoogleAuth')?.value === true || true;
      }
      if (this.activeStep$ === 2) {
        return planDetails?.valid ?? true;
      }
      if (this.activeStep$ === 3) {
        return true; // Summary step, always valid
      }
      if (this.activeStep$ === 4) {
        return paymentDetails?.valid ?? true;
      }
    }
  
    // Default to true for any unhandled cases
    return true;
  }


  // canProceed(): boolean {
  //   console.log('canProceed called');
  //   return true; // Temporarily always return true for testing
  // }

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

  // nextStep() {
  //   if (this.canProceed()) {
  //     if (this.activeStep$ < 4) {
  //       if (!this.loggedIn) {
  //         const personalDetails = this.stepForm.get('personalDetails');
  //         if (this.activeStep$ === 1 && personalDetails) {
  //           if (personalDetails.get('isGoogleAuth')?.value === true || personalDetails.valid) {
  //             this.formService.goToNextStep(this.activeStep$);
  //           } else if (!personalDetails.pristine || personalDetails.touched) {
  //             this.formService.goToNextStep(this.activeStep$);
  //           }
  //         } else {
  //           this.formService.goToNextStep(this.activeStep$);
  //         }
  //       } else {
  //         this.formService.goToNextStep(this.activeStep$);
  //       }
  //     } else if (this.activeStep$ === 4) {
  //       // Step 4: Submit the form
  //       this.confirmAndSubmitForm();
  //     } else if (this.activeStep$ === 5) {
  //       // Step 5: Handle post-confirmation
  //       this.handlePostConfirmation();
  //     }
  //   }
  // }

  // nextStep() {
  //   if (this.canProceed()) {
  //     const maxStep = this.getMaxStep();
      
  //     if (this.activeStep$ < maxStep) {
  //       this.formService.goToNextStep(this.activeStep$);
  //     } else if (this.activeStep$ === maxStep) {
  //       this.confirmAndSubmitForm();
  //     }
  //     // } else if (this.activeStep$ === maxStep + 1) {
  //     //   this.handlePostConfirmation();
  //     // }
  //   }
  // }

  nextStep() {
    if (this.canProceed()) {
      const maxStep = this.getMaxStep();
      if (this.activeStep$ < maxStep) {
        this.formService.goToNextStep(this.activeStep$);
      } else if (this.activeStep$ === maxStep) {
        this.confirmAndSubmitForm();
      }
    }
  }
  
  // private getMaxStep(): number {
  //   if (this.loggedIn) {
  //     return this.payment ? 3 : 2;
  //   }
  //   if (this.checkout) {
  //     return 3;
  //   }
  //   return 4; // For new user signup
  // }

  // private getMaxStep(): number {
  //   if (this.loggedIn) {
  //     // For logged-in users upgrading their plan
  //     return this.payment ? 3 : 2;
  //   }
  //   if (this.checkout) {
  //     // For checkout process
  //     return 2;
  //   }
  //   // For new user signup
  //   if (this.planCost > 0) {
  //     // Paid plan: Personal Details, Plan Selection, Summary, Payment, Confirmation
  //     return 5;
  //   } else {
  //     // Free plan: Personal Details, Plan Selection, Summary, Confirmation
  //     return 4;
  //   }
  // }

  private getMaxStep(): number {
    if (this.loggedIn) {
      return this.payment ? 3 : 2;
    }
    else if (this.checkout) {
      return 2;
    }
    return this.planCost > 0 ? 5 : 4;
  }

  // private getMaxStep(): number {
  //   if (this.loggedIn) {
  //     return this.payment ? 3 : 2;
  //   }
  //   if (this.checkout) {
  //     return 2; // Assuming checkout is always 2 steps
  //   }
  //   // For new user signup
  //   return this.planCost > 0 ? 4 : 3; // 4 steps if payment is required, 3 if it's a free plan
  // }

  // private handlePostConfirmation() {
  //   setTimeout(() => {
  //     const isGoogleAuth = this.stepForm.get('personalDetails.isGoogleAuth')?.value;
  //     if (isGoogleAuth || !this.loggedIn) {
  //       // For Google auth users and new non-Google auth users
  //       this.authService.clearAuthState();
  //       this.router.navigate(['sign-in']);
  //     } else {
  //       // For existing non-Google auth users
  //       const userId = this.user.getUserId();
  //       if (userId) {
  //         this.router.navigateByUrl(`/content/${userId}`);
  //       } else {
  //         this.router.navigate(['sign-in']);
  //       }
  //     }
  //     this.formService.resetForm();
  //   }, 100); 
  // }

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
    // this.formService.goToNextStep(this.activeStep$);
  }

  // onExternalSubmit() {
  //   this.confirmAndSubmitForm(); // This triggers the same logic as the button click
  // }

  purchase() {
    this.formService.goToNextStep(this.activeStep$);
    this.cartService.clearCart();
    localStorage.removeItem("cart");
    setInterval(()=>{
      this.router.navigate(['cart']);
    },3000)
  }

  // handleKeyDown(event: KeyboardEvent) {
  //   console.log('Key pressed:', event.key);
  //   if (event.key === 'Enter') {
  //     console.log('Enter key pressed');
  //     event.preventDefault(); // Prevent default button click
  //     const maxStep = this.getMaxStep();
      
  //     if (this.activeStep$ === maxStep) {
  //       console.log('Calling confirmAndSubmitForm');
  //       this.confirmAndSubmitForm();
  //     } else if (this.checkout) {
  //       console.log('Calling purchase');
  //       this.purchase();
  //     }
  //   }
  // }


}
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { AuthService } from 'src/app/services/auth.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CustomOAuthService } from 'src/app/services/oauth.service';


@Component({
  selector: 'app-progression-buttons',
  templateUrl: './progression-buttons.component.html',
  styleUrls: ['./progression-buttons.component.css'],
})
export class ProgressionButtonsComponent implements OnInit {

  stepForm!: FormGroup;
  activeStep$: number = 0;
  planCost: number = 0;

  @Input() loggedIn!: boolean;
  @Input() payment!: boolean;
  @Input() checkout!: boolean;

  private destroy$ = new Subject<void>();
  isGoogleAuthEnabled: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(private formService: FormService, private user: UserService, private router: Router, private cartService: CartService, private authService: AuthService, private cdr: ChangeDetectorRef,
    private oauthService: CustomOAuthService
  ) {};
   
  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;

    this.subscription.add(
      this.formService.activeStep$.subscribe(step => {
        this.activeStep$ = step;
        this.planCost = this.stepForm.controls['planDetails'].value.planCost;
        console.log('ACTIVE STEP:', this.activeStep$);
      })
    );

  this.formService.formUpdatedWithGoogleData$.subscribe(() => {
    // Check if we can proceed after Google data is loaded
    if (this.canProceed()) {
      console.log('Form is valid after Google OAuth, ready to proceed');
    }
  });
      
    this.subscription.add(
      this.formService.isGoogleAuthEnabled$.subscribe(isEnabled => {
        this.isGoogleAuthEnabled = isEnabled;
        console.log('Google Auth Enabled:', this.isGoogleAuthEnabled);
      })
    );

    // this.oauthService.oauthSuccess$.subscribe(user => {
    //   console.log('OAuth successful, moving to next step');
    //   this.isGoogleAuthEnabled = true;
    //    // Or whatever step number is appropriate
    // })
    this.subscription.add(
      this.oauthService.oauthSuccess$.subscribe(() => {
        console.log('OAuth successful, updating button state');
        this.isGoogleAuthEnabled = true;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
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
  
  private getMaxStep(): number {
    if (this.loggedIn) {
      return this.payment ? 3 : 2;
    }
    else if (this.checkout) {
      return 2;
    }
    return this.planCost > 0 ? 5 : 4;
  }

  goBack() {
    if (this.isBackButtonDisabled()) {
      console.log('Back button is disabled, cannot go back');
      return;
    }
    this.formService.goBackToPreviousStep(this.activeStep$);
  }

  isBackButtonDisabled(): boolean {
    const isDisabled = this.activeStep$ === 2 && this.isGoogleAuthEnabled;
    console.log('Is back button disabled:', isDisabled, 'Step:', this.activeStep$, 'Google Auth:', this.isGoogleAuthEnabled);
    return isDisabled;
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
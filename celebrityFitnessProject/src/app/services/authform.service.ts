import { Injectable } from '@angular/core';
// import { CustomOAuthService } from './oauth.service';
import { FormService } from '../shared/Multi-Step-Form/form/form.service';
import { StateManagementService } from './statemanagement.service';

@Injectable({
  providedIn: 'root'
})
export class AuthFormService {
  constructor(
    private formService: FormService,
    private stateManagementService: StateManagementService
  ) {}

  updateFormWithGoogleData(user: any) {
    const personalDetails = this.formService.multiStepForm.get('personalDetails');
    if (personalDetails) {
      personalDetails.patchValue({
        name: user.name,
        email: user.email,
        isGoogleAuth: true
      });
      personalDetails.get('password')?.disable();
      personalDetails.get('confirmPassword')?.disable();
    }
    this.formService.saveFormState();
  }

  handleSuccessfulLogin(payload: any) {
    this.updateFormWithGoogleData(payload.user);
    this.formService.goToNextStep(1);
    this.stateManagementService.setAuthenticationStatus(true);
  }
}


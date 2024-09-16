import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { AppPasswordDirective } from './app-password.directive';
import { FormComponent } from './Multi-Step-Form/form/form.component';
import { StepOnePersonalInfoComponent } from './Multi-Step-Form/form/form-steps/step-one-personal-info/step-one-personal-info.component';
import { StepTwoPlanDetailsComponent } from './Multi-Step-Form/form/form-steps/step-two-select-plan/step-two-plan-details.component';
import { StepThreeSummaryComponent } from './Multi-Step-Form/form/form-steps/step-three-summary/step-three-summary.component';
import { StepFourPaymentComponent } from './Multi-Step-Form/form/form-steps/step-four-payment/step-four-payment.component';
import { StepFiveConfimComponent } from './Multi-Step-Form/form/form-steps/step-five-confirm/step-five-confim.component';
import { StepTrackerIconsCheckout } from './Multi-Step-Form/step-nav-checkout/step-tracker-icons-checkout.component';
import { StepTrackerIconsComponent } from './Multi-Step-Form/step-nav/step-tracker-icons.component';
import { StepTrackerIconsUpgradeComponent } from './Multi-Step-Form/step-nav-upgrade/step-tracker-icons-upgrade.component';
import { ProgressionButtonsComponent } from './Multi-Step-Form/progression-buttons/progression-buttons.component';
import { StepTrackerIconsUpgradeComponentWithPayment } from './Multi-Step-Form/step-nav-upgrade-with-payment/step-tracker-icons-upgrade-with-payment.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { ScrollToTopDirective } from './scroll-to-top.directive';
import { HeightFormatDirective } from './height-format.directive';

@NgModule({
  declarations: [
    FormComponent,
    StepOnePersonalInfoComponent,
    StepTwoPlanDetailsComponent,
    StepThreeSummaryComponent,
    StepFourPaymentComponent,
    StepFiveConfimComponent,
    ProgressionButtonsComponent,
    StepTrackerIconsComponent,
    StepTrackerIconsCheckout,
    StepTrackerIconsUpgradeComponent,
    StepTrackerIconsUpgradeComponentWithPayment,
    AppPasswordDirective,
    ScrollToTopDirective,
    HeightFormatDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    FontAwesomeModule,
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    FormsModule,
    FormComponent,
    ProgressionButtonsComponent,
    StepTrackerIconsComponent,
    StepOnePersonalInfoComponent,
    StepTwoPlanDetailsComponent,
    StepThreeSummaryComponent,
    StepFourPaymentComponent,
    StepFiveConfimComponent,
    AppPasswordDirective,
    StepTrackerIconsCheckout,
    StepTrackerIconsUpgradeComponent,
    StepTrackerIconsUpgradeComponentWithPayment,
    FontAwesomeModule,
    ScrollToTopDirective,
    HeightFormatDirective,
  ] 
})
export class SharedModule { 

  constructor(library: FaIconLibrary) {
    library.addIcons(faEye, faEyeSlash, faAngleDown);
  }

  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faAngleDown = faAngleDown;
}

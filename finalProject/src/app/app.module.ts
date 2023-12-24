import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { ContentComponent } from './components/content/content.component';
import { ProfileComponent } from './components/profile/profile.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreateProfileComponent } from './components/create-profile/create-profile.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SearchComponent } from './components/search/search.component';
import { StoreComponent } from './components/store/store.component';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card'
import { MatGridListModule } from '@angular/material/grid-list';
import { CarouselModule } from './other-components/carousel/carousel.module';
import { VideoPlayerModule } from './other-components/video-player/video-player.module';

import { MatStepperModule } from '@angular/material/stepper';
import { FormComponent } from './other-components/form/form.component';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MaterialModule } from './material.module';
import { StepFiveConfimComponent } from './other-components/form/form-steps/step-five-confirm/step-five-confim.component';
import { StepOnePersonalInfoComponent } from './other-components/form/form-steps/step-one-personal-info/step-one-personal-info.component';
import { StepTwoPlanDetailsComponent } from './other-components/form/form-steps/step-two-select-plan/step-two-plan-details.component';
import { StepTrackerIconsComponent } from './other-components/step-nav/step-tracker-icons.component';
import { ProgressionButtonsComponent } from './other-components/progression-buttons/progression-buttons.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
// import { MatSlideToggle } from '@angular/material/slide-toggle';
import { StepThreeSummaryComponent } from './other-components/form/form-steps/step-three-summary/step-three-summary.component';
import { StepFourPaymentComponent } from './other-components/form/form-steps/step-four-payment/step-four-payment.component';
import { UpgradeComponent } from './components/upgrade/upgrade.component';
import { PaymentComponent } from './components/payment/payment.component';
import { CartComponent } from './components/cart/cart.component';




@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    ContactComponent,
    ContentComponent,
    ProfileComponent,
    CreateProfileComponent,
    EditProfileComponent,
    NotFoundComponent,
    SignInComponent,
    SearchComponent,
    StoreComponent,

    FormComponent,
    ProgressionButtonsComponent,
    SignUpComponent,
    StepTrackerIconsComponent,
    StepOnePersonalInfoComponent,
    StepTwoPlanDetailsComponent,
    StepFiveConfimComponent,
    StepThreeSummaryComponent,
    StepFourPaymentComponent,
    UpgradeComponent,

    PaymentComponent,
      CartComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatGridListModule,
    CarouselModule,
    VideoPlayerModule,
    MatStepperModule,
    ReactiveFormsModule,
    MaterialModule,
    
  ],
  providers: [{ provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher}],
  bootstrap: [AppComponent]
})
export class AppModule { }

import {FormBuilder, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatStepperModule} from '@angular/material/stepper';
import {MatButtonModule} from '@angular/material/button';
import { MatCardModule } from '@angular/material/card'
import { RouterModule } from '@angular/router';
import { Component, NgModule, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service'; 
import { Router } from '@angular/router';
// import { FormComponent } from 'src/app/other-components/form/form.component';
// import { FormModule } from 'src/app/other-components/form/form.module';
// import { StepTrackerIconsComponent } from 'src/app/other-components/step-nav/step-tracker-icons.component';
// import { ProgressionButtonsComponent } from 'src/app/other-components/progression-buttons/progression-buttons.component';
// import { ProgressionButtonsModule } from 'src/app/other-components/progression-buttons/progression-buttons.module';ç
// import { FormComponent } from 'src/app/other-components/form/form.component';
// import { CommonModule } from '@angular/common';
// import { FormComponent } from 'src/app/other-components/form/form.component';
// import { StepTrackerIconsComponent } from 'src/app/other-components/step-nav/step-tracker-icons.component';
// import { ProgressionButtonsComponent } from 'src/app/other-components/progression-buttons/progression-buttons.component';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
})
export class SignUpComponent implements OnInit {

  // firstFormGroup = this._formBuilder.group({
  //   firstCtrl: ['', Validators.required],
  // });
  // secondFormGroup = this._formBuilder.group({
  //   secondCtrl: ['', Validators.required],
  // });
  // isLinear = true;

  // constructor(private _formBuilder: FormBuilder) {}
  // ngOnInit(): void {
  //   throw new Error('Method not implemented.');
  // }


  newUser: User = new User();

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {
  }

  signUp() {
    this.userService.signUp(this.newUser).subscribe(() => {
        window.alert("User Registered Successfully");
        this.router.navigate(['signin']);
    }, error => {
        window.alert("User Registration Error");
        console.log('Error: ', error)
    });
  }
}


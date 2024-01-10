import { Component, Input, OnInit } from '@angular/core';

import { UserService } from 'src/app/services/user.service';
import { FormService } from '../form.service';

@Component({
  selector: 'app-step-tracker-icons-checkout',
  templateUrl: './step-tracker-icons-checkout.component.html',
  styleUrls: ['./step-tracker-icons-checkout.css'],
})
export class StepTrackerIconsCheckout implements OnInit {

  // @Input() userIsLoggedIn = "true";

  // userIsLoggedIn: boolean = false;
  
  // payment: boolean = false;
  // user!: string;
  activeStep$?: number;

  constructor(private formService: FormService, private user: UserService) { }

  ngOnInit(): void {

    // if(localStorage.getItem('userSignedIn')){
    //   !this.userIsLoggedIn;
    //   console.log("icons"+this.userIsLoggedIn);
    // }

    this.formService.activeStep$.subscribe(
      activeStep => this.activeStep$ = activeStep);

    // console.log("Tracker icons"+"testing")
    // this.UpdateStatus();
  }

  stepDetails: { step: number; description: string; }[] = [
    { step: 1, description: 'Payment' },
    { step: 2, description: 'Confirmation' },
  ]

  // UpdateStatus() {
  //   if (this.user.isloggedIn()) {
  //     this.userIsLoggedIn = !this.userIsLoggedIn;
  //     console.log("Upgrade"+this.userIsLoggedIn);
  //     // this.UserId = this.user.getUserId() ?? "";
  //   }

  // }

}










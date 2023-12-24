import { Component, Input, OnInit } from '@angular/core';
import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-step-tracker-icons-upgrade',
  templateUrl: './step-tracker-icons-upgrade.component.html',
  styleUrls: ['./step-tracker-icons-upgrade.component.css'],
})
export class StepTrackerIconsUpgradeComponent implements OnInit {

// @Input() userIsLoggedIn = "true";

  userIsLoggedIn : boolean = false;
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
      { step: 1, description: 'Select Plan' },
      { step: 2, description: 'Summary' },
    ]

    // UpdateStatus() {
    //   if (this.user.isloggedIn()) {
    //     this.userIsLoggedIn = !this.userIsLoggedIn;
    //     console.log("Upgrade"+this.userIsLoggedIn);
    //     // this.UserId = this.user.getUserId() ?? "";
    //   }
      
    // }

  }
  

  
  
  

  



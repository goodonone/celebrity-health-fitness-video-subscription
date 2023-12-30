import { Component, OnInit } from '@angular/core';
import { FormService } from '../form/form.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-step-tracker-icons',
  templateUrl: './step-tracker-icons.component.html',
  styleUrls: ['./step-tracker-icons.component.css'],
})
export class StepTrackerIconsComponent implements OnInit {

  userIsLoggedIn : boolean = false;
  // user!: string;
  activeStep$?: number;
  
  constructor(private formService: FormService, private user: UserService) { }

  ngOnInit(): void {
    
    if(localStorage.getItem('userSignedIn')){
      !this.userIsLoggedIn;
    }

    this.formService.activeStep$.subscribe(
      activeStep => this.activeStep$ = activeStep);

  }
    
stepDetails: { step: number; description: string; }[] = [
      { step: 1, description: 'Your info' },
      { step: 2, description: 'Select plan' },
      { step: 3, description: 'Summary' },
      { step: 4, description: 'Payment' },
      { step: 5, description: 'Confirmation' }
    ]

    UpdateStatus() {
      if (this.user.isloggedIn()) {
        this.userIsLoggedIn = !this.userIsLoggedIn;
        console.log("SignUp"+this.userIsLoggedIn);
        // this.UserId = this.user.getUserId() ?? "";
      }
      
    }

  }
  

  
  
  

  



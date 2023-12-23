import { Component, Input, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit{
  

  userLoggedIn = true;


  ngOnInit(): void {
    // this.UpdateStatus();
  }

  constructor() { }
  // private user: UserService
  
  // set the state of the token: tier, to new tier



  // UpdateStatus() {
  //   if (this.user.isloggedIn()) {
  //     this.userIsLoggedIn = !this.userIsLoggedIn;
  //     console.log("Upgrade"+ this.userIsLoggedIn);
  //   }
    
  // }

}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User = new User();
  UserId: string = "";
  monthOrYear!: string;

  tierOne = false;
  tierTwoThree = false;
  tierThree = false;
  freeTier = false;
  firstName?: string;

  constructor(private userService: UserService, private router: Router, private actRoute: ActivatedRoute) { }

  // ngOnInit(): void {
  //   const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
  //   this.userService.getUser(userId).subscribe(user => {
  //     this.currentUser = user;
  //     console.log(user);
  //   });
  // }

  ngOnInit(): void {
    // this.loadUserProfile();
    // console.log('UserId:', this.UserId);
    const UserId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    // console.log(UserId);
    this.userService.getUser(UserId).subscribe(user => {
      this.currentUser = user;
      // console.log(this.currentUser);
      if (this.currentUser.tier === "Just Looking") {
        this.tierOne = true;
      }
      else if (this.currentUser.tier === "Motivated" || "All In" ) {
        this.tierTwoThree = true;
      }
      if (this.currentUser.paymentFrequency === "monthly") {
        this.monthOrYear = "month";
      }
      else if (this.currentUser.paymentFrequency === "yearly") {
        this.monthOrYear = "year";
      }
  
      if (this.currentUser.paymentFrequency === "free" || 0)
       {
        this.freeTier = true;
       } 
       const displayName  = this.currentUser.name;
       //  console.log(displayName);
        this.firstName = displayName?.split(' ').slice(0,1).join(' ');
       
      //  console.log(firstName);
    });
    
   
  }

  // loadUserProfile() {
  //   const UserId = this.actRoute.snapshot.paramMap.get("id") ?? "";

  //   this.userService.getUser(UserId).subscribe(user => {
  //     this.currentUser = user;
  //     console.log(user);
  //   });
  // };




}

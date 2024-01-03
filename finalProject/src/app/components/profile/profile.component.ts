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
  tierTwo = false;
  tierThree = false;
  freeTier = false;

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
      console.log(this.currentUser);
      if (this.currentUser.tier === "Just Looking") {
        this.tierOne = true;
      }
      else if (this.currentUser.tier === "Motivated") {
        this.tierTwo = true;
      }
      else if (this.currentUser.tier === "All In") {
        this.tierThree = true;
      }
    });

    if (this.currentUser.paymentFrequency === "monthly") {
      this.monthOrYear = "month";
    }
    else if (this.currentUser.paymentFrequency === "yearly") {
      this.monthOrYear = "year";
    }

    if (this.currentUser.paymentFrequency === "free" || 0)
      this.freeTier = true;
  }

  // loadUserProfile() {
  //   const UserId = this.actRoute.snapshot.paramMap.get("id") ?? "";

  //   this.userService.getUser(UserId).subscribe(user => {
  //     this.currentUser = user;
  //     console.log(user);
  //   });
  // };




}

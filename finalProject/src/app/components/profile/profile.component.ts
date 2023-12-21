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

  

  constructor(private userService: UserService, private router: Router, private actRoute: ActivatedRoute) { }

  // ngOnInit(): void {
  //   const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
  //   this.userService.getUser(userId).subscribe(user => {
  //     this.currentUser = user;
  //     console.log(user);
  //   });
  // }

  ngOnInit(): void {
    this.loadUserProfile();
    console.log('UserId:', this.UserId);
    
     
}

loadUserProfile() {
  const UserId = this.actRoute.snapshot.paramMap.get("id") ?? "";

    this.userService.getUser(UserId).subscribe(user => {
        this.currentUser = user;
        console.log(user);
    });
};



}
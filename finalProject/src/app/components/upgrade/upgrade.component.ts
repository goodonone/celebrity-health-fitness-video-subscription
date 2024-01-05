import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit {


  userLoggedIn = true;
  showOrHide!: boolean;

  currentUser: User = new User;

  constructor(private router: Router, private userService: UserService, private actRoute: ActivatedRoute) { }

  ngOnInit(): void {
    const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userService.getUser(userId).subscribe(user => {
      this.currentUser = user;
      // this.currentUser.userId
    });
    // console.log(this.router.url);

    this.routeCheck();
      
    
    
}

routeCheck() {
  if (this.router.url.startsWith('/change-plan/')) {
    // console.log("Change-plan");
    this.showOrHide = true;
  }
  else{
    this.showOrHide = false;
  }
}

}

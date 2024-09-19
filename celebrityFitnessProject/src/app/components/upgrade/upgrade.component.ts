import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit, OnDestroy {


  userLoggedIn = true;
  showOrHide!: boolean;
  userId?: string;
  payment = false;

  currentUser: User = new User;

  constructor(private router: Router, private userService: UserService, private actRoute: ActivatedRoute) { }
 

  ngOnInit(): void {
    const UserId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userId = UserId;
    this.userService.getUser(this.userId).subscribe(user => {
      this.currentUser = user;
    });
    this.routeCheck();

    const tier = localStorage.getItem('tier')

    if(tier == "Just Looking"){
      this.togglePayment();
    }

  }


  ngOnDestroy(): void {
    location.reload();
  }
  

  routeCheck() {
    if (this.router.url.startsWith('/change-plan/')) {
      this.showOrHide = true;
    }
    else {
      this.showOrHide = false;
    }
  }

  togglePayment(){
    this.payment = !this.payment;
  }
 

}

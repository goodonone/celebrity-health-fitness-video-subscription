import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { FormService } from 'src/app/shared/Multi-Step-Form/form/form.service';

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css'],
})
export class UpgradeComponent implements OnInit, OnDestroy {
  userLoggedIn = true;
  showOrHide!: boolean;
  userId?: string;
  payment = false;
  tierTwoThree = false;

  currentUser: User = new User();

  constructor(
    private router: Router,
    private userService: UserService,
    private actRoute: ActivatedRoute,
    private authService: AuthService,
    private formService: FormService
  ) {}

  ngOnInit(): void {
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
    this.userId = UserId;
    this.userService.getUser(this.userId).subscribe((user) => {
      this.currentUser = user;
    });
    this.routeCheck();

   
    if (localStorage.getItem('tier')) {
      const tier = localStorage.getItem('tier');
      if (tier == 'Just Looking') {
        this.togglePayment();
        console.log(tier)
      }
    } else {
      const user = localStorage.getItem('user');
      const userObject = JSON.parse(user!);
      const tier = userObject.tier || '';
      console.log(tier);
      if (tier == 'Just Looking') {
        this.togglePayment();
        console.log(tier);
        // this.tierTwoThree = false;
      }
      else {
        console.log("right location" + tier);
        this.toggleSummary();
        // this.tierTwoThree = true;
      }
    }

    // const tier = localStorage.getItem('tier');
    // if (tier == 'Just Looking') {
    //   this.togglePayment();
    // }
  }

  ngOnDestroy(): void {
    location.reload();
    this.formService.resetForm();
  }

  routeCheck() {
    if (this.router.url.startsWith('/change-plan/')) {
      this.showOrHide = true;
    } else {
      this.showOrHide = false;
    }
  }

  togglePayment() {
    this.payment = !this.payment;
  }

  toggleSummary() {
    this.tierTwoThree = !this.tierTwoThree;
    console.log(`Toggle summary called. TierTwoThree: ${this.tierTwoThree}`);
  }
}

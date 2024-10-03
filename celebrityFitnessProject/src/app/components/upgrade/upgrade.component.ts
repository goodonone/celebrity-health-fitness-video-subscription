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
  // tierOne = true;

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
      this.initializePlanDetails();
    });
    this.routeCheck();

   
    if (localStorage.getItem('tier')) {
      const tier = localStorage.getItem('tier');
      if (tier == 'Just Looking') {
        this.togglePayment();
        console.log(tier);
      }
      else if (tier == 'Motivated'|| tier == 'All In') {
        console.log("right location" + tier);
        this.toggleSummary();
      }
    } else {
      const user = localStorage.getItem('user');
      const userObject = JSON.parse(user!);
      const tier = userObject.tier || '';
      console.log(tier);
      if (tier == 'Just Looking') {
        this.togglePayment();
        console.log(tier);
      }
      else {
        console.log("right location" + tier);
        this.toggleSummary();
      }
    }

    console.log('UpgradeComponent: tierTwoThree value:', this.tierTwoThree);

    // const tier = localStorage.getItem('tier');
    // if (tier == 'Just Looking') {
    //   this.togglePayment();
    // }
  }

  ngAfterViewInit(): void {
   this.formService.getTierAndBilling
  }

  ngOnDestroy(): void {
    location.reload();
    this.formService.resetForm();
  }


  private initializePlanDetails(): void {
    const { tier, billing } = this.formService.getTierAndBilling();
    console.log('Current plan details:', { tier, billing });

    // Set component state based on tier
    if (tier === 'Just Looking') {
      this.payment = true;
      this.tierTwoThree = false;
    } else {
      this.payment = false;
      this.tierTwoThree = true;
    }

    console.log('Component state:', { payment: this.payment, tierTwoThree: this.tierTwoThree });
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

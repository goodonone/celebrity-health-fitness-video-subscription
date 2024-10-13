import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { FormService } from 'src/app/shared/Multi-Step-Form/form/form.service';
import { filter, Subject, Subscription, take, takeUntil } from 'rxjs';

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
  
  private unsubscribe$ = new Subject<void>();
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private userService: UserService,
    private actRoute: ActivatedRoute,
    private formService: FormService,
    private cdr: ChangeDetectorRef,
  ) {
    this.initializeFromAvailableData();
  }

  private initializeFromAvailableData(): void {
    const { tier, billing } = this.formService.getInitialTierAndBilling();
    this.updateComponentState(tier, billing);
  }

  ngOnInit(): void {
    const UserId = this.actRoute.snapshot.paramMap.get('id') ?? '';
    // this.userId = UserId;
    // this.userService.getUser(this.userId).subscribe((user) => {
    //   this.currentUser = user;
    //   this.initializePlanDetails();
    // });
    this.routeCheck();

    this.userService.getUser(UserId).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((user : any) => {
      this.currentUser = {
        ...user,
        paymentFrequency: user.billing
      } 
      this.formService.updateFormWithUserData(user);
      this.updateComponentState(this.currentUser.tier!, this.currentUser.paymentFrequency!);
      this.cdr.detectChanges();
    });
  
    // this.formService.upgradeDataLoaded$.pipe(
    //   takeUntil(this.unsubscribe$)
    // ).subscribe(() => {
    //   this.initializePlanDetails();
    // });

    // this.routerSubscription = this.router.events.pipe(
    //   filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    // ).subscribe((event: NavigationEnd) => {
    //   if (!event.urlAfterRedirects.includes('change-plan') && 
    //       !event.urlAfterRedirects.includes('signup') && 
    //       !event.urlAfterRedirects.includes('checkout') && 
    //       !event.urlAfterRedirects.includes('upgrade')) {
    //     this.formService.resetForm();
    //   }
    // });
  
  
   
    // if (localStorage.getItem('tier')) {
    //   const tier = localStorage.getItem('tier');
    //   if (tier == 'Just Looking') {
    //     this.togglePayment();
    //     console.log(tier);
    //   }
    //   else if (tier == 'Motivated'|| tier == 'All In') {
    //     console.log("right location" + tier);
    //     this.toggleSummary();
    //   }
    // } else {
    //   const user = localStorage.getItem('user');
    //   const userObject = JSON.parse(user!);
    //   const tier = userObject.tier || '';
    //   console.log(tier);
    //   if (tier == 'Just Looking') {
    //     this.togglePayment();
    //     console.log(tier);
    //   }
    //   else {
    //     console.log("right location" + tier);
    //     this.toggleSummary();
    //   }
    // }

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
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    // this.formService.resetForm();
  }

  private updateComponentState(tier: string | undefined, billing: string | undefined): void {
    const finalTier = tier || 'Just Looking';
    const finalBilling = billing || 'monthly';
    
    console.log('Updating component state with:', { tier: finalTier, billing: finalBilling });
    this.payment = finalTier === 'Just Looking';
    this.tierTwoThree = finalTier !== 'Just Looking';
    
    // Update form service
    this.formService.updatePlanDetails(finalTier, finalBilling);
  }

  // private initializePlanDetails(): void {
  //   const { tier, billing } = this.formService.getTierAndBilling(this.currentUser);
  //   console.log('Current plan details:', { tier, billing });

  //   this.formService.updateFormWithUserData(this.currentUser);

  //   this.payment = tier === 'Just Looking';
  //   this.tierTwoThree = tier !== 'Just Looking';

  //   // Set component state based on tier
  //   // if (tier === 'Just Looking') {
  //   //   this.payment = true;
  //   //   this.tierTwoThree = false;
  //   // } else {
  //   //   this.payment = false;
  //   //   this.tierTwoThree = true;
  //   // }

  //   console.log('Component state:', { payment: this.payment, tierTwoThree: this.tierTwoThree });
  // }

  routeCheck() {
    this.showOrHide = this.router.url.startsWith('/change-plan/');
    // if (this.router.url.startsWith('/change-plan/')) {
    //   this.showOrHide = true;
    // } else {
    //   this.showOrHide = false;
    // }
  }

  // togglePayment() {
  //   this.payment = !this.payment;
  // }

  // toggleSummary() {
  //   this.tierTwoThree = !this.tierTwoThree;
  //   console.log(`Toggle summary called. TierTwoThree: ${this.tierTwoThree}`);
  // }
}

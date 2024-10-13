import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { FormService } from 'src/app/shared/Multi-Step-Form/form/form.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit{

  userLoggedIn = true;
  showOrHide!: boolean;
  userId?: number;
  shipping: boolean = true;

  currentUser: User = new User;
  stepForm: any;
  activeStep$?: number;
  checkout = true;

  // private routerSubscription?: Subscription;


  constructor(private router: Router, private userService: UserService, private actRoute: ActivatedRoute, private formService: FormService) { }
 

  ngOnInit(): void {
    this.formService.updateFormFields(this.shipping);

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

    
  }

  // ngOnDestroy(): void {
  //   location.reload();
  // }
  // ngOnDestroy(): void {
  //   if (this.routerSubscription) {
  //     this.routerSubscription.unsubscribe();
  //   }
  // }


}

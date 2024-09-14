import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(private router: Router, private userService: UserService, private actRoute: ActivatedRoute, private formService: FormService) { }
 

  ngOnInit(): void {
    this.formService.updateFormFields(this.shipping);
  }

  ngOnDestroy(): void {
    location.reload();
  }


}

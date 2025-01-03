import { Injectable, OnInit } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn, 
         Validator, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, filter, Subject, Subscription, takeUntil } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user';
import { PaymentService } from 'src/app/services/payment.service';
import { expirationDateValidator } from '../../expiry-date-validator';
import { AuthService } from 'src/app/services/auth.service';
import { NavigationService } from 'src/app/services/navigation.service';
import { sign } from 'crypto';
// import { CustomOAuthService} from 'src/app/services/oauth.service';
// import { expirationDateValidator } from '../../expiry-date-validator';

// Custom Validator Function
export const passwordMatchValidator: ValidatorFn = (formGroup: AbstractControl): ValidationErrors | null => {
  const password = formGroup.get('password')?.value;
  const confirmPassword = formGroup.get('confirmPassword')?.value;
  
  return password === confirmPassword ? null : { mismatch: true };
};

@Injectable({
  providedIn: 'root'
})

export class FormService implements OnInit {

  userIsLoggedIn: boolean = false;
  UserId?: string;
  userId?: string;
  currentUser: User = new User();
  shipping?: boolean;
  multiStepForm: FormGroup;
  private formUpdatedWithGoogleData = new Subject<boolean>();
  formUpdatedWithGoogleData$ = this.formUpdatedWithGoogleData.asObservable();

  private upgradeDataLoaded = new BehaviorSubject<boolean>(false);
  upgradeDataLoaded$ = this.upgradeDataLoaded.asObservable();

  public activeStepSubject = new BehaviorSubject<number>(1);
  activeStep$ = this.activeStepSubject.asObservable();

  private formResetSubject = new BehaviorSubject<boolean>(false);
  formReset$ = this.formResetSubject.asObservable();

  private isGoogleAuthEnabledSubject = new BehaviorSubject<boolean>(false);
  isGoogleAuthEnabled$ = this.isGoogleAuthEnabledSubject.asObservable();

  private selectedPlanTypeSubject = new BehaviorSubject<string>('Just Looking');
  selectedPlanType$ = this.selectedPlanTypeSubject.asObservable();

  private selectedPlanSubject = new BehaviorSubject<string>('Just Looking');
  selectedPlan$ = this.selectedPlanSubject.asObservable();


  // private destroy$ = new Subject<void>();

  private navigationSubscription!: Subscription;

  constructor(private fb: FormBuilder, private user: UserService, private router: Router, private payment: PaymentService, private authService: AuthService, private navigationService: NavigationService) {
    this.multiStepForm = this.createForm();
    // this.loadFormState();
    this.setupNavigationListener();
  }

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');

    // Optionally remove confirmPassword after validation if you don't want to store it in the form
    const personalDetailsGroup = this.multiStepForm.get('personalDetails') as FormGroup;
    if (personalDetailsGroup && personalDetailsGroup.valid) {
      personalDetailsGroup.removeControl('confirmPassword');
    }
  }

  ngOnDestroy() {
    // this.destroy$.next();
    // this.destroy$.complete();
      if (this.navigationSubscription) {
        this.navigationSubscription.unsubscribe();
      }
  }

  private setupNavigationListener() {
    this.navigationSubscription = this.navigationService.getNavigationEndEvents()
      .subscribe(event => {
        console.log('Navigation event:', event.url);
        if (this.navigationService.isLeavingFormPages(event.urlAfterRedirects)) {
          console.log('Navigating away from form pages');
          this.resetForm();
        }
      });
  }

  private createForm(): FormGroup {
    // const { tier, billing } = this.getTierAndBilling();
    const initialTierAndBilling = this.getInitialTierAndBilling();
  return this.fb.group({
    personalDetails: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/)]],
      password: [{value: '', disabled: false}, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirmPassword: [{value: '', disabled: false}, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      isGoogleAuth: [false]
    }, { validator: passwordMatchValidator }),
    planDetails: this.fb.group({
      plan: [initialTierAndBilling.tier, [Validators.required]],
      billing: [initialTierAndBilling.billing, [Validators.required]],
      planCost: [0],
      totalCost: []
    }),
    paymentDetails: this.fb.group({
      nameOnCard: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z]+ [A-Za-z]+$/)]],
      ccNumber: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19), Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
      expDate: ['', [Validators.required], Validators.minLength(5), Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3), Validators.pattern(/^\d{3}$/)]],
      zipCode: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern(/^\d{5}$/), // Ensures it's exactly 5 digits
        (control: AbstractControl) => {
          const value = control.value;
          const numValue = parseInt(value, 10);
    
          // Check if the value is between 00501 and 99950
          if (numValue < 501 || numValue > 99950) {
            return { zipCodeOutOfRange: true }; // Return error object if out of range
          }
    
          return null; // Valid
        }
      ]],
      billingAddress: ['', [Validators.required, Validators.minLength(15), Validators.pattern(/^[A-Za-z0-9\s,.-]{15,}$/)]],
      billingZip: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern(/^\d{5}$/), // Ensures it's exactly 5 digits
        this.zipCodeValidator
      ]],
    }),
  });
}

// updateFormWithUserData(user: User): void {
//   const planDetails = this.multiStepForm.get('planDetails');
//   if (planDetails) {
//     planDetails.patchValue({
//       plan: user.tier || 'Just Looking',
//       billing: user.paymentFrequency || 'monthly',
//       // Update other fields as necessary
//     });
//   }
//   this.upgradeDataLoaded.next(true);
// }



// public getTierAndBilling(user?: User): { tier: string, billing: string } {
//   if (user) {
//     return {
//       tier: user.tier || 'Just Looking',
//       billing: user.paymentFrequency || 'monthly'
//     };
//   }

//   let tier = localStorage.getItem('tier');
//   let billing = localStorage.getItem('billing');

//   if (!tier || !billing) {
//     const userString = localStorage.getItem('user');
//     if (userString) {
//       try {
//         const userObject = JSON.parse(userString);
//         tier = tier || userObject.tier;
//         billing = billing || userObject.billing; 
//       } catch (error) {
//         console.error('Error parsing user data:', error);
//       }
//     }
//   }

//   this.upgradeDataLoaded.next(true);
//   // console.log("form service tier and billing", tier, billing);
//   return {
//     tier: tier || 'Just Looking',
//     billing: billing || 'monthly'
//   };
  
// }

// public getTierAndBilling(user?: User): { tier: string, billing: string } {
//   if (user) {
//     return {
//       tier: user.tier || 'Just Looking',
//       billing: user.paymentFrequency || 'monthly'
//     };
//   }

//   const planDetails = this.multiStepForm.get('planDetails');
//   return {
//     tier: planDetails?.get('plan')?.value || 'Just Looking',
//     billing: planDetails?.get('billing')?.value || 'monthly'
//   };
// }
  
  // updateFormWithGoogleData(user: any) {
  //   const personalDetails = this.multiStepForm.get('personalDetails');
  //   if (personalDetails) {
  //     personalDetails.patchValue({
  //       name: user.name,
  //       email: user.email,
  //       isGoogleAuth: true
  //     });
  //     personalDetails.get('password')?.disable();
  //     personalDetails.get('confirmPassword')?.disable();
  //   }
  // }

  // updateFormWithGoogleData(user: any) {
  //   console.log('Updating form with Google data:', user);
  //   const personalDetails = this.multiStepForm.get('personalDetails');
  //   if (personalDetails) {
  //     personalDetails.patchValue({
  //       name: user.name,
  //       email: user.email,
  //       isGoogleAuth: true
  //     });
  //     personalDetails.get('password')?.disable();
  //     personalDetails.get('confirmPassword')?.disable();
  //   }
  //   this.saveFormState();
  // }

  getInitialTierAndBilling(): { tier: string, billing: string } {
    let tier: string | null = null;
    let billing: string | null = null;

    tier = localStorage.getItem('tier');
    billing = localStorage.getItem('billing');

    if (!tier || !billing) {
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const userObject = JSON.parse(userString);
          tier = tier || userObject.tier;
          billing = billing || userObject.billing;
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }

    return {
      tier: tier || 'Just Looking',
      billing: billing || 'monthly'
    };
  }

  // public getTierAndBilling(user?: User): { tier: string, billing: string } {
  //   if (user) {
  //     return {
  //       tier: user.tier || 'Just Looking',
  //       billing: user.paymentFrequency || 'monthly'
  //     };
  //   }

  //   const planDetails = this.multiStepForm.get('planDetails');
  //   return {
  //     tier: planDetails?.get('plan')?.value || 'Just Looking',
  //     billing: planDetails?.get('billing')?.value || 'monthly'
  //   };
  // }

  getTierAndBilling(): { tier: string, billing: string } {
    const planDetails = this.multiStepForm.get('planDetails');
    return {
      tier: planDetails?.get('plan')?.value || 'Just Looking',
      billing: planDetails?.get('billing')?.value || 'monthly'
    };
  }

  // updateFormWithUserData(user: User): void {
  //   const planDetails = this.multiStepForm.get('planDetails');
  //   if (planDetails) {
  //     planDetails.patchValue({
  //       plan: user.tier || 'Just Looking',
  //       billing: user.paymentFrequency || 'monthly',
  //     }, { emitEvent: false });  // Prevent unnecessary form value changes
  //   }
  //   this.upgradeDataLoaded.next(true);
  // }

  // updateFormWithUserData(user: User): void {
  //   this.updatePlanDetails(user.tier || 'Just Looking', user.paymentFrequency || 'monthly');
    
  //   // Update the 'user' object in localStorage
  //   const userString = JSON.stringify(user);
  //   localStorage.setItem('user', userString);
  // }

  updateFormWithUserData(user: User & { billing?: string }): void {
    // Use the 'billing' property if it exists, otherwise fall back to 'paymentFrequency'
    const billingFrequency = user.billing || user.paymentFrequency || 'monthly';
    
    this.updatePlanDetails(user.tier || 'Just Looking', billingFrequency);
    
    // Create a new user object with the correct property name
    const updatedUser = {
      ...user,
      paymentFrequency: billingFrequency
    };
  
    // Remove the 'billing' property if it exists
    if ('billing' in updatedUser) {
      delete (updatedUser as any).billing;
    }
  
    // Update the 'user' object in localStorage
    const userString = JSON.stringify(updatedUser);
    localStorage.setItem('user', userString);
  }

  updatePlanDetails(tier: string, billing: string): void {
    const planDetails = this.multiStepForm.get('planDetails');
    if (planDetails) {
      planDetails.patchValue({ plan: tier, billing: billing }, { emitEvent: false });
    }
    this.upgradeDataLoaded.next(true);

    // Update localStorage
    localStorage.setItem('tier', tier);
    localStorage.setItem('billing', billing);
  }

  updateFormWithGoogleData(user: any) {
    console.log('Updating form with Google data:', user);
    const personalDetails = this.multiStepForm.get('personalDetails') as FormGroup;
    if (personalDetails) {
      personalDetails.patchValue({
        name: user.name,
        email: user.email,
        isGoogleAuth: true
      });
      personalDetails.get('password')?.disable();
      personalDetails.get('confirmPassword')?.disable();

      // Manually mark the fields as touched and trigger validation
      Object.keys(personalDetails.controls).forEach(key => {
        const control = personalDetails.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });

      this.setGoogleAuthEnabled(true);
      // Manually validate the entire form group
      personalDetails.updateValueAndValidity();
      this.formUpdatedWithGoogleData.next(true);

      setTimeout(() => {
        this.formUpdatedWithGoogleData.next(true);
      }, 0);

    // this.formUpdatedWithGoogleData.subscribe((value) => {
    //   console.log("FORM SERVICE" + value);
    // });
      
    }
  }

    // const userInfo = this.multiStepForm.get('personalDetails')?.value;
    // console.log("MUlti step form value" + userInfo);
    
    // this.saveFormState();
    
    // Emit an event to notify that the form has been updated with Google data
    
  

  isPersonalDetailsValid(): boolean {
    const personalDetails = this.multiStepForm.get('personalDetails');
    return personalDetails ? personalDetails.valid : false;
  }

  updateFormFields(shipping: boolean) {
    const paymentDetailsGroup = this.multiStepForm.get('paymentDetails') as FormGroup;
  
    if (shipping) {
      paymentDetailsGroup.addControl('shippingAddress', this.fb.control('', [Validators.required, Validators.minLength(30)]));
      paymentDetailsGroup.addControl('shippingZip', this.fb.control('',  [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern(/^\d{5}$/), // Ensures it's exactly 5 digits
        this.zipCodeValidator
        ]
      ));
    } else {
      paymentDetailsGroup.removeControl('shippingAddress');
      paymentDetailsGroup.removeControl('shippingZip');
    }
  }

  // async initiateGoogleOAuth() {
  //   try {
  //     const success = await this.oauthService.loginWithPopup();
  //     if (success) {
  //       const googleUser = await this.oauthService.getUser();
  //       this.updateFormWithGoogleData(googleUser);
  //     }
  //   } catch (error) {
  //     console.error('Google OAuth error:', error);
  //     // Handle error (e.g., show error message to user)
  //   }
  // }

  // async initiateGoogleOAuth() {
  //   try {
  //     const success = await this.oauthService.loginWithPopup();
  //     if (success) {
  //       const googleUser = this.oauthService.getUser();
  //       if (googleUser) {
  //         console.log('Logged in user:', googleUser);
  //         // Use googleUser data as needed (e.g., to populate form fields)
  //       } else {
  //         console.log('Failed to get user information');
  //       }
  //     } else {
  //       console.log('Google login failed');
  //     }
  //   } catch (error) {
  //     console.error('Error during Google OAuth:', error);
  //   }
  // }

  // private populateFormWithGoogleData(googleUser: any) {
  //   const personalDetails = this.multiStepForm.get('personalDetails');
  //   if (personalDetails) {
  //     personalDetails.patchValue({
  //       name: googleUser.name,
  //       email: googleUser.email,
  //       isGoogleAuth: true
  //     });
  //     personalDetails.get('password')?.disable();
  //     personalDetails.get('confirmPassword')?.disable();
  //   }
  // }


  private zipCodeValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const numValue = parseInt(value, 10);

    if (numValue < 501 || numValue > 99950) {
      return { zipCodeOutOfRange: true };
    }

    return null;
  }


  // private expirationDateValidator(): ValidatorFn {
  //   return (control: AbstractControl): ValidationErrors | null => {
  //     const value = control.value;
  //     if (!value) {
  //       return null;
  //     }

  //     if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(value)) {
  //       return { 'invalidFormat': true };
  //     }

  //     const [month, year] = value.split('/');
  //     const expMonth = parseInt(month, 10);
  //     const expYear = parseInt(year, 10);

  //     const currentDate = new Date();
  //     const currentYear = currentDate.getFullYear() % 100;
  //     const currentMonth = currentDate.getMonth() + 1;

  //     if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
  //       return { 'expiredDate': true };
  //     }

  //     if (expYear > currentYear + 20) {
  //       return { 'invalidDate': true };
  //     }

  //     return null;
  //   };
  // }

  get stepForm(): FormGroup {
    return this.multiStepForm;
  }

  // goToNextStep(number: number) {
  //   console.log('Moving to next step from:', number);
  //   this.activeStepSubject.next(number + 1);
  // }

  goToNextStep(number: number) {
    // console.log('Going to next step from:', number, 'Stack:', new Error().stack);
    console.log('Going to next step from:', number);
    this.activeStepSubject.next(number + 1);
    console.log("Current step" + this.activeStepSubject.value)
  }

  // goBackToPreviousStep(number: number) {
  //   if (number > 1) {
  //     this.activeStepSubject.next(number - 1);
  //     // this.saveFormState();
  //   }
  //   // this.activeStepSubject.next(number - 1);
  // }

  goBackToPreviousStep(number: number) {
    console.log('Going back from step:', number);
    if (number > 1) {
      console.log('Going back to previous step from:', number);
      this.activeStepSubject.next(number - 1);
    }
  }
  

  // public saveFormState() {
  //   localStorage.setItem('formState', JSON.stringify(this.multiStepForm.value));
  //   localStorage.setItem('activeStep', this.activeStepSubject.value.toString());
  // }

  // private loadFormState() {
  //   const formState = localStorage.getItem('formState');
  //   const activeStep = localStorage.getItem('activeStep');
  //   if (formState) {
  //     this.multiStepForm.patchValue(JSON.parse(formState));
  //   }
  //   if (activeStep) {
  //     this.activeStepSubject.next(parseInt(activeStep, 10));
  //   }
  // }

  // private loadFormState() {
  //   const formState = localStorage.getItem('formState');
  //   const activeStep = localStorage.getItem('activeStep');
  //   if (formState) {
  //     this.multiStepForm.patchValue(JSON.parse(formState));
  
  //     // Reset isGoogleAuth to false after loading the form state
  //     const personalDetailsGroup = this.multiStepForm.get('personalDetails') as FormGroup;
  //     if (personalDetailsGroup) {
  //       personalDetailsGroup.patchValue({ isGoogleAuth: false });
  //     }
  //   }
  //   if (activeStep) {
  //     this.activeStepSubject.next(parseInt(activeStep, 10));
  //   }
  // }

  // private loadFormState() {
  //   const formState = localStorage.getItem('formState');
  //   const activeStep = localStorage.getItem('activeStep');
  //   if (formState) {
  //     this.multiStepForm.patchValue(JSON.parse(formState));
  
  //     // Access the personalDetails form group
  //     const personalDetailsGroup = this.multiStepForm.get('personalDetails') as FormGroup;
  //     if (personalDetailsGroup) {
  //       // Log the value before resetting
  //       console.log('isGoogleAuth before reset:', personalDetailsGroup.get('isGoogleAuth')?.value);
  
  //       // Reset isGoogleAuth to false
  //       personalDetailsGroup.patchValue({ isGoogleAuth: false });
  
  //       // Log the value after resetting
  //       console.log('isGoogleAuth after reset:', personalDetailsGroup.get('isGoogleAuth')?.value);
  //     }
  //   }
  //   if (activeStep) {
  //     this.activeStepSubject.next(parseInt(activeStep, 10));
  //   }
  // }


  // resetForm() {
    
  // }


  submit() {
    // console.log("Submit button clicked");
    const type: string = "subscription";
    const userInfo = this.multiStepForm.get('personalDetails')?.value;
    const planInfo = this.multiStepForm.get('planDetails')?.value;
    const paymentDetails = this.multiStepForm.get('paymentDetails')?.value;
  
    // Check if user is signed in
    // const userId = localStorage.getItem('userId') || '';
    let userId = '';
    const userIdFromStorage = localStorage.getItem('userId');
    const userDataString = localStorage.getItem('user');

    if (userIdFromStorage) {
      userId = userIdFromStorage;
    } else if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        userId = userData.userId;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // console.log('USER ID!!!!!!!!!!! AREA 1', userId);

    if (!userId) {
      userId = this.user.getUserId();
    }
  
    // Creating a new user/new payment for initial signUp of new user if not signed in else update user
    if (!userId) {
      const signupData = {
        name: userInfo.name,
        password: userInfo.isGoogleAuth ? null : userInfo.password,
        isGoogleAuth: userInfo.isGoogleAuth,
        email: userInfo.email,
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost,
        purchaseType: type,
        billingAddress: paymentDetails.billingAddress,
        billingZipcode: paymentDetails.billingZip,
      }

      this.user.signUp(signupData).subscribe(() => {
        this.handleNewUserSignup(false);
      });
    
    // Upgrading Plan for existing user & Google Auth User
    } else {

       if(userInfo.isGoogleAuth) {
        console.log('GOOGLE AUTH USER DATA:');
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const googleAuthUser = {
            userId: userData.userId, 
            tier: planInfo.plan,
            paymentFrequency: planInfo.billing,
            price: planInfo.totalCost,
            purchaseType: type,
            paymentType: type,
            billingAddress: paymentDetails.billingAddress,
            billingZipcode: paymentDetails.billingZip,
          };
      
          this.user.updateUser(googleAuthUser).subscribe(() => {
            this.handleNewUserSignup(true);
            this.createPayment(userId, googleAuthUser);
          });
        }
      }

      // console.log('USER ID!!!!!!!!!!! AREA 5', userId);
      this.UserId = this.user.getUserId() ?? "";
      this.userId = this.UserId;
  
      this.user.getUser(this.userId).subscribe((user) => {
        this.currentUser = user;
      });
      this.currentUser = {
        userId: this.userId,
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost
      }
      this.user.updateUser(this.currentUser).subscribe(() => {
      });
      const paymentData = {
        userId: this.userId,
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost,
        purchaseType: type,
        billingAddress: paymentDetails.billingAddress,
        billingZipcode: paymentDetails.billingZip,
        shippingAddress: paymentDetails.shippingAddress || null,
        shippingZipcode: paymentDetails.shippingZip || null
      }
    //   this.payment.newPayment(planData).subscribe((response) => {
    //     console.log('Payment created successfully', response);
    //   });
    //   console.log('Payment created successfully', planData);
    //   this.handleExistingUserUpdate(planInfo);
    // }
    // console.log('SENDING PLANDATA |||||||||||||||||||||', planData);

      this.payment.newPayment(paymentData).subscribe(
        (response) => {
          // console.log('||||||||||||||||||||| Payment created successfully', response);
          this.handleExistingUserUpdate(planInfo);
        },
        (error) => {
          console.error('Error creating payment', error);
        }
    );
  }
}

private createPayment(userId: string, planData: any) {
  const paymentData = {
    ...planData,
    userId: userId
  };

  this.payment.newPayment(paymentData).subscribe(
    (response) => {
      console.log('Payment created successfully', response);
    },
    (error) => {
      console.error('Error creating payment', error);
    }
  );
}
  
  // private handleNewUserSignup(isGoogleAuth: boolean) {
  //   this.goToNextStep(4);
  //   setTimeout(() => {
  //     this.multiStepForm.reset();
  //     if (isGoogleAuth) {
  //       const authUserId = this.user.getUserId();
  //       console.log('authUserId:', authUserId);
  //       this.router.navigateByUrl(`/content/${authUserId}`);
  //     }
  //     this.activeStepSubject.next(1);
  //     this.router.navigate(['sign-in']);
  //   }, 4000);
  //   this.resetForm();
  // }

  // private handleNewUserSignup(isGoogleAuth: boolean) {
  //   this.goToNextStep(4);
  //   setTimeout(() => {
  //     this.multiStepForm.reset();
  //     if (isGoogleAuth) {
  //       const userDataString = localStorage.getItem('user');
  //       if (userDataString) {
  //         const userData = JSON.parse(userDataString);
  //         const authUserId = userData.userId;
  //         console.log('authUserId:', authUserId);
  //         if (authUserId) {
  //           this.router.navigateByUrl(`/content/${authUserId}`);
  //         } else {
  //           console.error('No userId found for Google auth user');
  //           this.router.navigate(['sign-in']);
  //         }
  //       } else {
  //         console.error('No user data found in localStorage');
  //         this.router.navigate(['sign-in']);
  //       }
  //     } else {
  //       this.router.navigate(['sign-in']);
  //     }
  //     this.activeStepSubject.next(1);
  //   }, 4000);
  //   // this.resetForm();
  // }

  private handleNewUserSignup(isGoogleAuth: boolean) {
    // const planInfo = this.multiStepForm.get('planDetails')?.value;
    // if(planInfo.plan === 'Just Looking') {
    //   this.goToNextStep(3);
    // }
    this.goToNextStep(4); 
    setTimeout(() => {
      if (isGoogleAuth) {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const authUserId = userData.userId;
          console.log('authUserId:', authUserId);
          if (authUserId) {
            this.router.navigateByUrl(`/content/${authUserId}`);
          } else {
            console.error('No userId found for Google auth user');
            this.router.navigate(['login']);
          }
        } else {
          console.error('No user data found in localStorage');
          this.router.navigate(['login']);
        }
      } else {
        this.router.navigate(['login']);
      }
      this.multiStepForm.reset();
      // this.activeStepSubject.next(1);
    }, 2000);
  }

  // setSelectedPlanType(planType: string) {
  //   this.selectedPlanTypeSubject.next(planType);
  // }

  setActiveStep(step: number) {
    this.activeStepSubject.next(step);
  }

  setSelectedPlan(plan: string) {
    this.selectedPlanSubject.next(plan);
  }
  // private clearGoogleAuthState() {
  //   localStorage.removeItem('user');
  //   localStorage.removeItem('userId');
  //   localStorage.removeItem('authToken');
  //   // Add any other necessary cleanup for Google auth state
  // }
  
  private handleExistingUserUpdate(planInfo: any) {
    localStorage.removeItem('tier');
    localStorage.removeItem('billing');
    localStorage.setItem('tier', planInfo.plan);
    localStorage.setItem('billing', planInfo.billing);
    localStorage.removeItem('hasVisitedProfileBefore');
    console.log("removed from local storage");
    // this.activeStepSubject.next(1);
    console.log("Current URL:", this.router.url); // Log current URL

  if (this.router.url.includes('sign-up')) {
    console.log("Signup URL detected, initiating goToNextStep...");
    setTimeout(() => {
      this.goToNextStep(4);
      this.router.navigateByUrl(`/content/${this.UserId}`);
    }, 2000);
  } else {
    console.log("Signup URL not detected, redirecting immediately.");
    this.router.navigateByUrl(`/content/${this.UserId}`);
  }
}
    // if(this.router.url.includes('signup')) {
    //   setTimeout(() => {
    //     this.goToNextStep(4);
    //     this.router.navigateByUrl(`/content/${this.UserId}`);
    //   }, 2000);
    // }

    // this.router.navigateByUrl(`/content/${this.UserId}`);
  // }
  
  // resetForm() {
  //   const initialValues = this.getInitialTierAndBilling();
  //   this.multiStepForm.patchValue({
  //     planDetails: initialValues
  //   }, { emitEvent: false });  // Prevent unnecessary form value changes
  //   this.upgradeDataLoaded.next(false);
  // }


  resetForm() {
    console.log('Form reset triggered');
    const initialValues = this.getInitialTierAndBilling();
    console.log('FormService.resetForm(): isGoogleAuth before reset:', this.multiStepForm.get('personalDetails.isGoogleAuth')?.value);
    this.multiStepForm.reset({
      personalDetails: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        isGoogleAuth: false
      },
      planDetails: initialValues,
      paymentDetails: {
        nameOnCard: '',
        ccNumber: '',
        expDate: '',
        cvv: '',
        zipCode: '',
        billingAddress: '',
        billingZip: ''
      }
    });
    console.log('FormService.resetForm(): isGoogleAuth after reset:', this.multiStepForm.get('personalDetails.isGoogleAuth')?.value);
    const personalDetails = this.multiStepForm.get('personalDetails');
    if (personalDetails) {
      // Instead of enabling, respect the current disabled state
      const passwordControl = personalDetails.get('password');
      const confirmPasswordControl = personalDetails.get('confirmPassword');
      
      if (passwordControl?.disabled) {
        passwordControl.reset('', {onlySelf: true});
      } else {
        passwordControl?.reset('');
      }
      
      if (confirmPasswordControl?.disabled) {
        confirmPasswordControl.reset('', {onlySelf: true});
      } else {
        confirmPasswordControl?.reset('');
      }
    }
    this.activeStepSubject.next(1);
    this.upgradeDataLoaded.next(false);
    this.formResetSubject.next(true);
    // this.isGoogleAuthEnabledSubject.next(false);
    this.setGoogleAuthEnabled(false);
    console.log('FormService: Form reset event emitted');
    console.log('Form reset');
  }

  setGoogleAuthEnabled(value: boolean) {
    console.log('Setting Google Auth Enabled:', value);
    this.isGoogleAuthEnabledSubject.next(value);
  }

}
    // this.multiStepForm.reset(this.getInitialTierAndBilling);
    // this.upgradeDataLoaded.next(false);

    // this.multiStepForm = this.fb.group({
    //   personalDetails: this.fb.group({
    //     name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/)]],
    //     email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    //     password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
    //     confirmPassword: ['', { validators: [Validators.required]}],
    //     isGoogleAuth: [false]
    //   }, { validator: passwordMatchValidator }),
    //   planDetails: this.fb.group({
    //     plan: [localStorage.getItem('tier') ?? 'Just Looking', [Validators.required]],
    //     billing: [localStorage.getItem('billing') ?? 'monthly', [Validators.required]],
    //     planCost: [0],
    //     totalCost: []
    //   }),
    //   paymentDetails: this.fb.group({
    //     nameOnCard: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z\s]{4,}$/)]],
    //     ccNumber: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19), Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
    //     expDate: ['', [Validators.required, Validators.minLength(5), Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)]],
    //     cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3), Validators.pattern(/^\d{3}$/)]],
    //     zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^\d{5}$/)]],
    //     billingAddress: ['', [Validators.required, Validators.minLength(15), Validators.pattern(/^[A-Za-z0-9\s,.-]{15,}$/)]],
    //     billingZip: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^\d{5}$/)]],
    //   }),
    // });
    // this.multiStepForm.reset();
    // localStorage.removeItem('formState');
    // localStorage.removeItem('activeStep');
 

  // submit() {
  //   const type: string = "subscription";
  //   const userInfo = this.multiStepForm.get('personalDetails')?.value;
  //   const planInfo = this.multiStepForm.get('planDetails')?.value;

  //    // Check if user is signed in
  //   const userId = localStorage.getItem('userId') || '';

  //   // Creating a new user/new payment for initial signUp of new user if not signed in else update user
  //   if (!userId) {
  //     const userData = {
  //       name: userInfo.name,
  //       password: userInfo.isGoogleAuth ? null : userInfo.password,
  //       isGoogleAuth: userInfo.isGoogleAuth,
  //       email: userInfo.email,
  //       tier: planInfo.plan,
  //       paymentFrequency: planInfo.billing,
  //       price: planInfo.totalCost,
  //       purchaseType: type,
  //       paymentType: type
  //     }
  //     this.user.signUp(userData).subscribe(() => {
  //     });
  //   }
  //   else {
  //     this.UserId = this.user.getUserId() ?? "";

  //     this.userId = this.UserId;

  //     this.user.getUser(this.userId).subscribe((user)=>{
  //       this.currentUser = user;
  //     });
  //     this.currentUser = {
  //       userId: this.userId,
  //       tier: planInfo.plan,
  //       paymentFrequency: planInfo.billing,
  //       price: planInfo.totalCost
  //     }
  //     this.user.updateUser(this.currentUser).subscribe(() => {
  //     });

  //     const planData = {
  //       tier: planInfo.plan,
  //       paymentFrequency: planInfo.billing,
  //       price: planInfo.totalCost,
  //       purchaseType: type,
  //     }
  //     this.payment.newPayment(planData).subscribe(() => {
  //     });
  //   }


  //   if (!localStorage.getItem('userId')) {
  //     this.goToNextStep(4);
  //     setTimeout(() => {
  //       this.activeStepSubject.next(1); this.router.navigate(['sign-in']);
  //     }, 4000);
  //     this.multiStepForm = this.fb.group({
  //   personalDetails: this.fb.group({
  //     name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/)]],
  //     email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
  //     password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
  //     confirmPassword: ['', { validators: [Validators.required]}]
  //   }, { validator: passwordMatchValidator 
  //   }),
  //   planDetails: this.fb.group({
  //     plan: [localStorage.getItem('tier') ?? 'Just Looking', [Validators.required]],
  //     billing: [localStorage.getItem('billing') ?? 'monthly', [Validators.required]],
  //     planCost: [0],
  //     totalCost: []
  //   }),
  //   paymentDetails: this.fb.group({
  //     nameOnCard: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z\s]{4,}$/)]],
  //     ccNumber: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19), Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
  //     expDate: ['', [Validators.required], Validators.minLength(5), Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)],
  //     cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3), Validators.pattern(/^\d{3}$/)]],
  //     zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^\d{5}$/)]],
  //     billingAddress: ['', [Validators.required, Validators.minLength(15), Validators.pattern(/^[A-Za-z0-9\s,.-]{15,}$/)]],
  //     billingZip: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern(/^\d{5}$/)]],
  //   }),
  // });
  //   } else {
  //     localStorage.removeItem('tier');
  //     localStorage.removeItem('billing');
  //     localStorage.setItem('tier', planInfo.plan);
  //     localStorage.setItem('billing', planInfo.billing);
  //     localStorage.removeItem('hasVisitedProfileBefore');
  //     console.log("removed from local storage");
  //     this.router.navigateByUrl(`/content/${this.UserId}`);
  //   }

  // }





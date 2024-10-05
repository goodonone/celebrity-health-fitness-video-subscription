import { Injectable, OnInit } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn, 
         Validator, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user';
import { PaymentService } from 'src/app/services/payment.service';
import { expirationDateValidator } from '../../expiry-date-validator';
import { AuthService } from 'src/app/services/auth.service';
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

  constructor(private fb: FormBuilder, private user: UserService, private router: Router, private payment: PaymentService, private authService: AuthService) {
    this.multiStepForm = this.createForm();
    // this.loadFormState();
  }

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');

    // Optionally remove confirmPassword after validation if you don't want to store it in the form
    const personalDetailsGroup = this.multiStepForm.get('personalDetails') as FormGroup;
    if (personalDetailsGroup && personalDetailsGroup.valid) {
      personalDetailsGroup.removeControl('confirmPassword');
    }
  }

  private createForm(): FormGroup {
    const { tier, billing } = this.getTierAndBilling();
  return this.fb.group({
    personalDetails: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: [{value: '', disabled: false}, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirmPassword: [{value: '', disabled: false}, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      isGoogleAuth: [false]
    }, { validator: passwordMatchValidator }),
    planDetails: this.fb.group({
      plan: [tier, [Validators.required]],
      billing: [billing, [Validators.required]],
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

public getTierAndBilling(user?: User): { tier: string, billing: string } {
  if (user) {
    return {
      tier: user.tier || 'Just Looking',
      billing: user.paymentFrequency || 'monthly'
    };
  }

  let tier = localStorage.getItem('tier');
  let billing = localStorage.getItem('billing');

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

  this.upgradeDataLoaded.next(true);
  // console.log("form service tier and billing", tier, billing);
  return {
    tier: tier || 'Just Looking',
    billing: billing || 'monthly'
  };
  
}
  
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

      // Manually validate the entire form group
      personalDetails.updateValueAndValidity();
    }
    // this.saveFormState();
    
    // Emit an event to notify that the form has been updated with Google data
    this.formUpdatedWithGoogleData.next(true);
  }

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
    console.log('Going to next step from:', number, 'Stack:', new Error().stack);
    console.log('Going to next step from:', number);
    this.activeStepSubject.next(number + 1);
  }

  // goBackToPreviousStep(number: number) {
  //   if (number > 1) {
  //     this.activeStepSubject.next(number - 1);
  //     // this.saveFormState();
  //   }
  //   // this.activeStepSubject.next(number - 1);
  // }

  goBackToPreviousStep(number: number) {
    console.log('Going back from step:', number, 'Stack:', new Error().stack);
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
    console.log('Form submitted');
    const type: string = "subscription";
    const userInfo = this.multiStepForm.get('personalDetails')?.value;
    const planInfo = this.multiStepForm.get('planDetails')?.value;
  
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

    if (!userId) {
      userId = this.user.getUserId();
    }
  
    // Creating a new user/new payment for initial signUp of new user if not signed in else update user
    if (!userId) {
      const userData = {
        name: userInfo.name,
        password: userInfo.isGoogleAuth ? null : userInfo.password,
        isGoogleAuth: userInfo.isGoogleAuth,
        email: userInfo.email,
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost,
        purchaseType: type,
        paymentType: type
      }
  
      if(userInfo.isGoogleAuth) {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const googleAuthUser = {
            userId: userData.userId, // Extract userId from localStorage
            tier: planInfo.plan,
            paymentFrequency: planInfo.billing,
            price: planInfo.totalCost
          };
          this.user.updateUser(googleAuthUser).subscribe(() => {
            this.handleNewUserSignup(true);
          });
        } 
      } else {
        this.user.signUp(userData).subscribe(() => {
          this.handleNewUserSignup(false);
        });
      }

    // Upgrading Plan for existing user
    } else {
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
  
      const planData = {
        tier: planInfo.plan,
        paymentFrequency: planInfo.billing,
        price: planInfo.totalCost,
        purchaseType: type,
      }
      this.payment.newPayment(planData).subscribe(() => {
      });
  
      this.handleExistingUserUpdate(planInfo);
    }
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
    this.goToNextStep(4); // Move to the final step (5)
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
            this.router.navigate(['sign-in']);
          }
        } else {
          console.error('No user data found in localStorage');
          this.router.navigate(['sign-in']);
        }
      } else {
        this.router.navigate(['sign-in']);
      }
      this.multiStepForm.reset();
      this.activeStepSubject.next(1);
    }, 3000);
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
    // this.goToNextStep(4);
    this.router.navigateByUrl(`/content/${this.UserId}`);
  }
  
  resetForm() {
    this.multiStepForm.reset();
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
    localStorage.removeItem('formState');
    localStorage.removeItem('activeStep');
  }


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

}



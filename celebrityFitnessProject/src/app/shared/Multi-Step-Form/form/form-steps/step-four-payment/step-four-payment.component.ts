import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { expirationDateValidator } from 'src/app/shared/expiry-date-validator';

@Component({
  selector: 'app-step-four-payment',
  templateUrl: './step-four-payment.component.html',
  styleUrls: ['./step-four-payment.component.css'],
})
export class StepFourPaymentComponent implements OnInit {
  stepForm!: FormGroup;
  @Input() formGroupName!: string;
  @Input() shipping!: boolean;
  sameAsBilling = true;
  isChecked = true;
  showShipping = false;
  zipText = true;
  private originalCCNumber: string = '';
  isCCNumberMasked: boolean = false;

  private billingAddressSubscription: any;
  private billingZipSubscription: any;
  private destroy$ = new Subject<void>();

  constructor(
    private rootFormGroup: FormGroupDirective,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.stepForm = this.rootFormGroup.control.get(
      this.formGroupName
    ) as FormGroup;

    // Initialize shipping fields as billing address fields since the toggle is checked by default
    this.updateShippingFields(true);

    // Subscribe to billing address and zip changes to update shipping fields automatically
    this.stepForm.get('billingAddress')?.valueChanges.subscribe(() => {
      if (this.isChecked) {
        this.updateShippingFields(true);
      }
    });

    this.stepForm.get('billingZip')?.valueChanges.subscribe(() => {
      if (this.isChecked) {
        this.updateShippingFields(true);
      }
    });

    // Validate expiration date
    // const expDateControl = this.stepForm.get('expDate');
    // if (expDateControl) {
    //   expDateControl.setValidators([
    //     Validators.required,
    //     Validators.pattern(/^\d{2}\/\d{2}$/),
    //   ]);
    //   expDateControl.setAsyncValidators(expirationDateValidator());
    //   expDateControl.updateValueAndValidity();
    // }

    // Format credit card number
    const ccNumber: number | any = document.getElementById('ccNumber');
    ccNumber.addEventListener(
      'input',
      () =>
        (ccNumber.value = formatCCNumber(ccNumber.value.replaceAll(' ', '')))
    );
    const formatCCNumber = (number: string) =>
      number.split('').reduce((seed, next, index) => {
        if (index !== 0 && !(index % 4)) seed += ' ';
        return seed + next;
      }, '');

    // Subscribe to billing address and zip changes to update shipping fields automatically
    this.billingAddressSubscription = this.stepForm.get('billingAddress')?.valueChanges.subscribe(() => {
        if (this.isChecked) {
          this.updateShippingFields(true);
        }
      });

    // For shipping address
    this.billingZipSubscription = this.stepForm.get('billingZip')?.valueChanges.subscribe(() => {
        if (this.isChecked) {
          this.updateShippingFields(true);
        }
      });

    // Subscribe to ccNumber changes
    this.stepForm.get('ccNumber')?.valueChanges.subscribe((value) => {
      if (!this.isCCNumberMasked) {
        this.originalCCNumber = value.replace(/\s/g, '');
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.billingAddressSubscription?.unsubscribe();
    this.billingZipSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleShipping() {
    this.showShipping = !this.showShipping;

    // Update form fields based on toggle state
    this.updateShippingFields(this.isChecked);
  }

  formatExpirationDate(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }

    input.value = value;
    const expDateControl = this.stepForm.get('expDate');
    if (expDateControl) {
      expDateControl.setValue(value);
      expDateControl.markAsTouched();
    }
  }

  updateShippingFields(isChecked: boolean) {
    if (isChecked) {
      const billingAddress = this.stepForm.get('billingAddress')?.value || '';
      const billingZip = this.stepForm.get('billingZip')?.value || '';

      // Copy billing address to shipping address fields only if billing fields are filled
      this.stepForm.patchValue({
        shippingAddress: billingAddress,
        shippingZip: billingZip,
      });

      // Disable the shipping address fields since they're the same as billing
      // this.stepForm.get('shippingAddress')?.disable();
      // this.stepForm.get('shippingZip')?.disable();
    } else {
      // Clear and enable the shipping address fields
      this.stepForm.patchValue({
        shippingAddress: '',
        shippingZip: '',
      });
      this.stepForm.get('shippingAddress')?.enable();
      this.stepForm.get('shippingZip')?.enable();
    }

    // Update the validity of the form fields
    this.stepForm.get('shippingAddress')?.updateValueAndValidity();
    this.stepForm.get('shippingZip')?.updateValueAndValidity();
  }

  // hideCreditCardNumber() {
  //   const ccNumberInput: HTMLInputElement | null = document.getElementById("ccNumber") as HTMLInputElement;
  //   const formCCNumber = this.stepForm.get('ccNumber')?.value;
  //   if (ccNumberInput && ccNumberInput.value) {
  //     const cleanCCNumber = ccNumberInput.value.replace(/\s+/g, '');
  //     const maskedCCNumber = cleanCCNumber.slice(0, -4).replace(/\d/g, "•") + cleanCCNumber.slice(-4);
  //     ccNumberInput.value = maskedCCNumber;
  //     this.isCCNumberMasked = true;
  //   }
  // }

  hideCreditCardNumber() {
    const ccNumberInput: HTMLInputElement | null = document.getElementById(
      'ccNumber'
    ) as HTMLInputElement;
    const formCCNumber = this.stepForm.get('ccNumber');

    if (
      ccNumberInput &&
      ccNumberInput.value &&
      formCCNumber &&
      !formCCNumber.invalid
    ) {
      const inputValue = ccNumberInput.value;

      // Check if the input contains any alphabetic characters
      if (/[a-zA-Z]/.test(inputValue)) {
        return; // Exit the function without masking if alphabets are present
      }

      const cleanCCNumber = inputValue.replace(/\s+/g, '');
      const maskedCCNumber =
        cleanCCNumber.slice(0, -4).replace(/\d/g, '•') +
        cleanCCNumber.slice(-4);
      ccNumberInput.value = maskedCCNumber;
      this.isCCNumberMasked = true;
    }
  }

  showCreditCardNumber() {
    const ccNumberInput: HTMLInputElement | null = document.getElementById(
      'ccNumber'
    ) as HTMLInputElement;
    if (ccNumberInput && this.originalCCNumber) {
      const formattedNumber = this.formatCCNumber(this.originalCCNumber);
      ccNumberInput.value = formattedNumber;
      this.stepForm
        .get('ccNumber')
        ?.setValue(formattedNumber, { emitEvent: false });
      this.isCCNumberMasked = false;
    }
  }

  formatCCNumber(number: string): string {
    return number.replace(/(.{4})/g, '$1 ').trim();
  }

  onCCNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formattedValue = this.formatCCNumber(value);
    this.stepForm
      .get('ccNumber')
      ?.setValue(formattedValue, { emitEvent: true });
    this.isCCNumberMasked = false;
    this.originalCCNumber = value;
  }

  // checkExpirationDate() {
  // const expDateControl = this.stepForm.get('expDate');
  //   if (expDateControl) {
  //     expDateControl.setValidators([
  //       Validators.required,
  //       Validators.pattern(/^\d{2}\/\d{2}$/),
  //     ]);
  //     expDateControl.setAsyncValidators(expirationDateValidator());
  //     expDateControl.updateValueAndValidity();
  //   }
  // }

  checkExpirationDate() {
    const expDateControl = this.stepForm.get('expDate');
    if (expDateControl) {
      expDateControl.setValidators([
        Validators.required,
        Validators.pattern(/^\d{2}\/\d{2}$/),
      ]);
      expDateControl.setAsyncValidators(expirationDateValidator());
      // Only update on blur, not on every keystroke
      if (expDateControl.touched || expDateControl.dirty) {
        expDateControl.updateValueAndValidity();
      }
    }
  }

  getInputStyle(controlName: string): { [key: string]: string } {
    const control = this.stepForm.get(controlName);
    let isInvalid = false;

    if (control) {
      const trimmedValue = typeof control.value === 'string' ? control.value.trim() : control.value;
      
      switch (controlName) {
        case 'nameOnCard':
        case 'billingAddress':
          isInvalid = (control.invalid && control.touched) || (!trimmedValue && control.touched);
          break;
        case 'ccNumber':
          isInvalid = (control.invalid && control.touched) || 
                      (control.value && !/^[0-9\s]{13,19}$/.test(control.value));
          break;
        case 'expDate':
          isInvalid = (control.invalid && control.touched) || 
                      control.hasError('expiredDate');
          break;
        case 'cvv':
          isInvalid = (control.invalid && control.touched) || 
                      (control.value && !/^[0-9]{3}$/.test(control.value));
          break;
        case 'zipCode':
        case 'billingZip':
        case 'shippingZip':
          isInvalid = (control.invalid && control.touched) || 
                      (control.value && !/^\d{5}$/.test(control.value));
          break;
        default:
          isInvalid = control.invalid && control.touched;
      }
    }

    return {
      'border-color': isInvalid ? 'red' : 'black',
      '--placeholder-color': isInvalid ? 'red' : 'black',
      'color': isInvalid ? 'red' : 'black'
    };
  }

  getErrorMessage(controlName: string): string {
    const control = this.stepForm.get(controlName);
    if (!control) return '';

    switch (controlName) {
      case 'nameOnCard':
        if (!control.value?.trim()) return 'Required';
        return 'Invalid';

      case 'ccNumber':
        if (!control.value) return 'Required';
        if (!/^[0-9\s]{13,19}$/.test(control.value)) return 'Invalid';
        return 'Invalid';

      case 'expDate':
        if (!control.value) return 'Required';
        if (control.hasError('expiredDate')) return 'Expired';
        return 'Invalid';

      case 'cvv':
        if (!control.value) return 'Required';
        if (!/^[0-9]{3}$/.test(control.value)) return 'Invalid';
        return 'Invalid';

      case 'zipCode':
      case 'billingZip':
      case 'shippingZip':
        if (!control.value) return 'Required';
        if (!/^\d{5}$/.test(control.value)) return 'Invalid';
        return 'Invalid';

      case 'billingAddress':
      case 'shippingAddress':
        if (!control.value?.trim()) return 'Required';
        return 'Invalid';

      default:
        return 'Invalid';
    }
  }

  onInputBlur(controlName: string) {
    const control = this.stepForm.get(controlName);
    if (!control) return;

    switch (controlName) {
      case 'nameOnCard':
      case 'billingAddress':
      case 'shippingAddress':
        if (typeof control.value === 'string') {
          const normalized = control.value.replace(/\s+/g, ' ').trim();
          if (normalized !== control.value) {
            control.setValue(normalized);
          }
        }
        break;

      case 'ccNumber':
        // Additional credit card validation/formatting if needed
        break;

      case 'expDate':
        this.checkExpirationDate();
        break;

      // Add any specific blur handling for other fields as needed
    }

    control.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  shouldShowError(controlName: string): boolean {
    const control = this.stepForm.get(controlName);
    if (!control) return false;

    switch (controlName) {
      case 'nameOnCard':
      case 'billingAddress':
      case 'shippingAddress':
        return (control.invalid && control.touched) || 
               (!control.value?.trim() && control.touched);
      
      case 'expDate':
        return (control.invalid && control.touched) || 
               control.hasError('expiredDate');
      
      default:
        return control.invalid && control.touched;
    }
  }

  // Add this method to your StepFourComponent class

getLabelStyle(controlName: string): { [key: string]: string } {
  const control = this.stepForm.get(controlName);
  let isInvalid = false;

  if (control) {
    switch (controlName) {
      case 'nameOnCard':
      case 'billingAddress':
      case 'shippingAddress':
        const trimmedValue = control.value?.trim() || '';
        isInvalid = (control.invalid && control.touched) || (!trimmedValue && control.touched);
        break;

      case 'ccNumber':
        isInvalid = (control.invalid && control.touched) || 
                    (control.value && !/^[0-9\s]{13,19}$/.test(control.value));
        break;

      case 'expDate':
        isInvalid = (control.invalid && control.touched) || 
                    control.hasError('expiredDate');
        break;

      case 'cvv':
        isInvalid = (control.invalid && control.touched) || 
                    (control.value && !/^[0-9]{3}$/.test(control.value));
        break;

      case 'zipCode':
      case 'billingZip':
      case 'shippingZip':
        isInvalid = (control.invalid && control.touched) || 
                    (control.value && !/^\d{5}$/.test(control.value));
        break;

      default:
        isInvalid = control.invalid && control.touched;
    }
  }

  return {
    'color': isInvalid ? 'red' : 'black'
  };
}

  
}

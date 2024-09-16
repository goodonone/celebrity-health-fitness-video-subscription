import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
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
  
  constructor(private rootFormGroup: FormGroupDirective, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.stepForm = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;

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

  const expDateControl = this.stepForm.get('expDate');
  if (expDateControl) {
    expDateControl.setValidators([
      Validators.required,
      Validators.pattern(/^\d{2}\/\d{2}$/)
    ]);
    expDateControl.setAsyncValidators(expirationDateValidator());
    expDateControl.updateValueAndValidity();
  }

    // Format credit card number
    const ccNumber: number | any = document.getElementById("ccNumber");
    ccNumber.addEventListener("input", () => ccNumber.value = formatCCNumber(ccNumber.value.replaceAll(" ", "")));;
    const formatCCNumber = (number: string) => number.split("").reduce((seed, next, index) => {
      if (index !== 0 && !(index % 4)) seed += " ";
      return seed + next;
    }, "");
  

  // Subscribe to billing address and zip changes to update shipping fields automatically
  this.billingAddressSubscription = this.stepForm.get('billingAddress')?.valueChanges.subscribe(() => {
    if (this.isChecked) {
      this.updateShippingFields(true);
    }
  });

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
      const ccNumberInput: HTMLInputElement | null = document.getElementById("ccNumber") as HTMLInputElement;
      const formCCNumber = this.stepForm.get('ccNumber');
      
      if (ccNumberInput && ccNumberInput.value && formCCNumber && !formCCNumber.invalid) {
        const inputValue = ccNumberInput.value;
        
        // Check if the input contains any alphabetic characters
        if (/[a-zA-Z]/.test(inputValue)) {
          return; // Exit the function without masking if alphabets are present
        }
        
        const cleanCCNumber = inputValue.replace(/\s+/g, '');
        const maskedCCNumber = cleanCCNumber.slice(0, -4).replace(/\d/g, "•") + cleanCCNumber.slice(-4);
        ccNumberInput.value = maskedCCNumber;
        this.isCCNumberMasked = true;
      }
    }
  
    showCreditCardNumber() {
      const ccNumberInput: HTMLInputElement | null = document.getElementById("ccNumber") as HTMLInputElement;
      if (ccNumberInput && this.originalCCNumber) {
        const formattedNumber = this.formatCCNumber(this.originalCCNumber);
        ccNumberInput.value = formattedNumber;
        this.stepForm.get('ccNumber')?.setValue(formattedNumber, { emitEvent: false });
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
      this.stepForm.get('ccNumber')?.setValue(formattedValue, { emitEvent: true });
      this.isCCNumberMasked = false;
      this.originalCCNumber = value;
    }

  }



  



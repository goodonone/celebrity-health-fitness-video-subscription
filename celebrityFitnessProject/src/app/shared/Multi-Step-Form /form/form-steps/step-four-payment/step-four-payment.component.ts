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

    // Format credit card number
    const ccNumber: number | any = document.getElementById("ccNumber");
    ccNumber.addEventListener("input", () => ccNumber.value = formatCCNumber(ccNumber.value.replaceAll(" ", "")));;
    const formatCCNumber = (number: string) => number.split("").reduce((seed, next, index) => {
      if (index !== 0 && !(index % 4)) seed += " ";
      return seed + next;
    }, "");

    
    // Add the custom validator to the expDate form control
  //   this.stepForm.get('expDate')?.setValidators([
  //   Validators.required, 
  //   Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/),
  //   expirationDateValidator()
  // ]);
  this.stepForm.get('expDate')?.setValidators([
    Validators.required, 
    Validators.pattern(/^\d{2}\/\d{2}$/),
    expirationDateValidator()
  ]);

  // Implement 00/00 format for date input
}
    toggleShipping() {
      this.showShipping = !this.showShipping;

      // Update form fields based on toggle state
      this.updateShippingFields(this.isChecked);
      
    }

    // formatExpirationDate(event: any) {
    //   let input = event.target.value.replace(/\D/g, '').substring(0, 4);
    //   let month = input.substring(0, 2);
    //   let year = input.substring(2);
  
    //   if (input.length > 2) {
    //     this.stepForm.get('expDate')?.setValue(`${month}/${year}`);
    //   } else if (input.length === 2) {
    //     this.stepForm.get('expDate')?.setValue(`${month}/`);
    //   } else {
    //     this.stepForm.get('expDate')?.setValue(input);
    //   }
    // }

    // formatExpirationDate(event: any) {
    //   const input = event.target;
    //   const trimmed = input.value.replace(/\s+/g, '');
    //   const numbers = trimmed.replace(/[^0-9]/g, '');
      
    //   if (numbers.length > 4) {
    //     input.value = numbers.slice(0, 4);
    //   }
  
    //   let formatted = '';
    //   if (numbers.length > 0) {
    //     formatted += numbers.slice(0, 2);
    //     if (numbers.length > 2) {
    //       formatted += '/' + numbers.slice(2);
    //     }
    //   }
  
    //   input.value = formatted;
    //   this.stepForm.get('expDate')?.setValue(formatted);
    // }
    // formatExpirationDate(event: any) {
    //   const input = event.target;
    //   let value = input.value.replace(/\D/g, '');
      
    //   if (value.length > 4) {
    //     value = value.slice(0, 4);
    //   }
  
    //   if (value.length > 2) {
    //     value = value.slice(0, 2) + '/' + value.slice(2);
    //   }
  
    //   input.value = value;
    //   this.stepForm.get('expDate')?.setValue(value);
    //   this.stepForm.get('expDate')?.updateValueAndValidity();
    // }

    // validateExpDate() {
    //   const expDateControl = this.stepForm.get('expDate');
    //   if (expDateControl?.value && expDateControl.value.length === 2) {
    //     expDateControl.setErrors({'invalidFormat': true});
    //   }
    // }

    // formatExpirationDate(event: any) {
    //   const input = event.target;
    //   let value = input.value.replace(/\D/g, '');
      
    //   if (value.length > 4) {
    //     value = value.slice(0, 4);
    //   }
  
    //   if (value.length > 2) {
    //     value = value.slice(0, 2) + '/' + value.slice(2);
    //   }
  
    //   input.value = value;
    //   this.stepForm.get('expDate')?.setValue(value);
    //   this.stepForm.get('expDate')?.updateValueAndValidity();
    // }
  
    // validateExpDate() {
    //   const expDateControl = this.stepForm.get('expDate');
    //   if (expDateControl?.value && expDateControl.value.length === 2) {
    //     expDateControl.setErrors({'invalidFormat': true});
    //   }
    // }

    formatExpirationDate(event: any) {
      const input = event.target;
      let value = input.value.replace(/\D/g, '');
      
      if (value.length > 4) {
        value = value.slice(0, 4);
      }
  
      if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
  
      input.value = value;
      this.stepForm.get('expDate')?.setValue(value);
      this.stepForm.get('expDate')?.updateValueAndValidity();
    }
  
    validateExpDate() {
      const expDateControl = this.stepForm.get('expDate');
      if (expDateControl?.value && expDateControl.value.length === 2) {
        expDateControl.setErrors({'invalid': true});
      }
    }

    // updateShippingFields(isChecked: boolean) {
    //   if (isChecked) {
    //     // Copy billing address to shipping address fields
    //     this.stepForm.patchValue({
    //       shippingAddress: this.stepForm.get('billingAddress')?.value,
    //       shippingZip: this.stepForm.get('billingZip')?.value,
    //     });
  
    //     // Disable the shipping address fields since they're the same as billing
    //     // this.stepForm.get('shippingAddress')?.disable();
    //     // this.stepForm.get('shippingZip')?.disable();
    //   } else {
    //     // Clear and enable the shipping address fields
    //     this.stepForm.patchValue({
    //       shippingAddress: '',
    //       shippingZip: '',
    //     });
    //     this.stepForm.get('shippingAddress')?.enable();
    //     this.stepForm.get('shippingZip')?.enable();
    //   }
  
    //   // Update the validity of the form fields
    //   this.stepForm.get('shippingAddress')?.updateValueAndValidity();
    //   this.stepForm.get('shippingZip')?.updateValueAndValidity();
    // }

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
  
    formatCCNumber(number: string): string {
      return number.split("").reduce((seed, next, index) => {
        if (index !== 0 && !(index % 4)) seed += " ";
        return seed + next;
      }, "");
    }


  }


  



import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective, Validators } from '@angular/forms';

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
  
  constructor(private rootFormGroup: FormGroupDirective) { }

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

  // Implement 00/00 format for date input
}
    toggleShipping() {
      this.showShipping = !this.showShipping;

      // Update form fields based on toggle state
      this.updateShippingFields(this.isChecked);
      
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


  



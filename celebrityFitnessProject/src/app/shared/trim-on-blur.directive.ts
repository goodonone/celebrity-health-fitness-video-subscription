// trim-on-blur.directive.ts
import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[trimOnBlur]'
})
export class TrimOnBlurDirective {
  constructor(private ngControl: NgControl, private elementRef: ElementRef) {}

  @HostListener('blur')
  // onBlur() {
  //   const control = this.ngControl.control;
  //   if (control && typeof control.value === 'string') {
  //     control.setValue(control.value.trim(), { emitEvent: false });
  //   }
  // }
  @HostListener('blur')
  onBlur() {
    if (!this.ngControl.control) return;
    
    const value = this.ngControl.control.value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Only update if the value actually changed
      if (trimmed !== value) {
        this.ngControl.control.setValue(trimmed);
        
        // Trigger validation
        this.ngControl.control.updateValueAndValidity();
        
        // Update the input element's value
        (this.elementRef.nativeElement as HTMLInputElement).value = trimmed;
      }
    }
  }
}
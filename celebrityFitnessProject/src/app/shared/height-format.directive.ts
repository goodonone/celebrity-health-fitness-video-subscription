import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appHeightFormat]'
})
export class HeightFormatDirective {
  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('blur')
  onBlur() {
    this.formatHeight(this.control.value);
  }

  private formatHeight(value: string) {
    if (!value) return;

    if (value.includes("'")) {
      // Already in feet and inches format, ensure it's correct
      const [feet, inches] = value.split("'");
      const cleanedInches = inches.replace('"', '');
      const formattedValue = `${parseInt(feet)}'${parseInt(cleanedInches)}"`;
      this.setFormattedValue(formattedValue);
    } else {
      // Decimal format, convert to feet and inches
      const totalInches = Math.round(parseFloat(value) * 12);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      const formattedValue = `${feet}'${inches}"`;
      this.setFormattedValue(formattedValue);
    }
  }

  private setFormattedValue(value: string) {
    this.control.control?.setValue(value, { emitEvent: false });
    this.el.nativeElement.value = value;
  }
}
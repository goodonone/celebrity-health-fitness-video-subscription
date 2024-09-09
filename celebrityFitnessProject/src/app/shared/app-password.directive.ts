import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appShowHidePassword]',
})
export class AppPasswordDirective {
  @Input() targetInputs: string[] = [];

  private isPasswordVisible: boolean = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('click') togglePassword() {
    this.isPasswordVisible = !this.isPasswordVisible;

    this.targetInputs.forEach((selector) => {
      const inputElement = document.querySelector(selector) as HTMLInputElement;
      if (inputElement) {
        this.renderer.setProperty(
          inputElement,
          'type',
          this.isPasswordVisible ? 'text' : 'password'
        );
      }
    });

    //   this.renderer.setProperty(
    //     this.el.nativeElement,
    //     'textContent',
    //     this.isPasswordVisible ? 'Hide Password' : 'Show Password'
    //   );
    // }

    // Change the icon class to show/hide the eye icon
    //  Toggle between 'fa-eye' and 'fa-eye-slash' classes for the icon
  //   if (this.isPasswordVisible) {
  //     this.renderer.removeClass(this.el.nativeElement, 'fa-eye');
  //     this.renderer.addClass(this.el.nativeElement, 'fa-eye-slash');
  //   } else {
  //     this.renderer.removeClass(this.el.nativeElement, 'fa-eye-slash');
  //     this.renderer.addClass(this.el.nativeElement, 'fa-eye');
  //   }
  }
}

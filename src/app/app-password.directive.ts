import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appPassword]'
})
export class AppPasswordDirective {
  private _shown = false;

  constructor(private el: ElementRef) {
    this.setup();
  }

  toggle(span: HTMLElement) {
    this._shown = !this._shown;
    if (this._shown) {
      this.el.nativeElement.setAttribute('type', 'text');
      span.innerHTML = 'hide password';
    } else {
      this.el.nativeElement.setAttribute('type', 'password');
      span.innerHTML = 'show password';
    }
  }
  setup() {
    const parent = this.el.nativeElement.parentNode;
    const span = document.createElement('span');
    span.setAttribute('id', "showHide");
    span.innerHTML = `show password`;
    span.addEventListener('click', (event) => {
      this.toggle(span);
    });
    parent.appendChild(span);
  }
}
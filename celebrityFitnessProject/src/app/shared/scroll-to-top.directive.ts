// import { Directive, HostListener, ElementRef, Renderer2 } from '@angular/core';

// @Directive({
//   selector: '[appScrollToTop]'
// })
// export class ScrollToTopDirective {
//   constructor(private el: ElementRef, private renderer: Renderer2) {
//     this.hideButton();
//   }

//   @HostListener('click')
//   onClick() {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }

//   // @HostListener('window:scroll', [])
//   // onWindowScroll() {
//   //   const scrollHeight = document.documentElement.scrollHeight;
//   //   const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
//   //   const clientHeight = document.documentElement.clientHeight;

//   //   if ((scrollHeight - scrollTop - clientHeight) < 200) {
//   //     this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
//   //   } else {
//   //     this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
//   //   }
//   // }

//   // @HostListener('window:scroll', [])
//   // onWindowScroll() {
//   //   const scrollHeight = document.documentElement.scrollHeight;
//   //   const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
//   //   const clientHeight = document.documentElement.clientHeight;

//   //   // Check if the page height is greater than 200vh
//   //   if (scrollHeight > clientHeight * 2) {
//   //     if ((scrollHeight - scrollTop - clientHeight) < 200) {
//   //       this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
//   //     } else {
//   //       this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
//   //     }
//   //   } else {
//   //     // If page height is not greater than 200vh, always hide the button
//   //     this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
//   //   }
//   // }

//   @HostListener('window:scroll', [])
//   onWindowScroll() {
//     const scrollHeight = document.documentElement.scrollHeight;
//     const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
//     const clientHeight = document.documentElement.clientHeight;

//     // Check if the page height is greater than 200vh
//     if (scrollHeight > clientHeight * 2) {
//       if ((scrollHeight - scrollTop - clientHeight) < 200) {
//         this.showButton();
//       } else {
//         this.hideButton();
//       }
//     } else {
//       // If page height is not greater than 200vh, always hide the button
//       this.hideButton();
//     }
//   }

//   private showButton() {
//     this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
//     this.renderer.setStyle(this.el.nativeElement, 'visibility', 'visible');
//     this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
//   }

//   private hideButton() {
//     this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
//     this.renderer.setStyle(this.el.nativeElement, 'visibility', 'hidden');
//     this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
//   }
// }

import { Directive, HostListener, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appScrollToTop]'
})
export class ScrollToTopDirective {
  private container: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    // Find the parent container
    this.container = this.el.nativeElement.closest('.actionButtonsContainer');
    if (!this.container) {
      console.warn('ScrollToTopDirective: .actionButtonsContainer not found');
    }
    // Initialize the container as hidden
    this.hideContainer();
  }

  @HostListener('click')
  onClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    // Check if the page height is greater than 200vh
    if (scrollHeight > clientHeight * 2) {
      if ((scrollHeight - scrollTop - clientHeight) < 200) {
        this.showContainer();
      } else {
        this.hideContainer();
      }
    } else {
      // If page height is not greater than 200vh, always hide the container
      this.hideContainer();
    }
  }

  private showContainer() {
    if (this.container) {
      this.renderer.setStyle(this.container, 'display', 'flex');
      this.renderer.setStyle(this.container, 'opacity', '1');
    }
  }

  private hideContainer() {
    if (this.container) {
      this.renderer.setStyle(this.container, 'display', 'none');
      this.renderer.setStyle(this.container, 'opacity', '0');
    }
  }
}
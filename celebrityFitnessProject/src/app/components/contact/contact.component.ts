import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, OnDestroy {

  name:string = "";
  email: string = "";
  message: string = "";
  contactForm!: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) { }
  ngOnInit(): void {
    document.body.style.backgroundColor = "black";

    this.initializeForm();
  }

  ngOnDestroy(): void {
    document.body.style.backgroundColor = "white";
  }

  private initializeForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(4), 
        Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/)
      ]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  // contactUs(){
  //   this.submitted = true;
  //   setTimeout(() => {
  //   this.toggle();
  //   }, 3000);
  //   var form = <HTMLFormElement>document.getElementById('contactForm');
  //   form.reset(); 
  // }

  contactUs(): void {
    if (this.contactForm.valid) {
      this.submitted = true;
      setTimeout(() => {
        this.toggle();
      }, 5000);
      this.contactForm.reset();
    } else {
      this.markFormGroupTouched(this.contactForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }


  toggle(){
    this.submitted = !this.submitted;
  }


  getErrorMessage(controlName: string): string {
    const control = this.contactForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Required';
    }

    switch (controlName) {
      case 'name':
        if (control.hasError('minlength')) {
          return 'Min 4 characters';
        }
        if (control.hasError('pattern')) {
          return 'Invalid name format';
        }
        break;

      case 'email':
        if (control.hasError('email') || control.hasError('pattern')) {
          return 'Invalid email format';
        }
        break;

      case 'message':
        if (control.hasError('minlength')) {
          return 'Min 10 characters';
        }
        break;
    }

    return 'Invalid input';
  }

  shouldShowError(controlName: string): boolean {
    const control = this.contactForm.get(controlName);
    return control ? (control.invalid && control.touched) : false;
  }

  getInputStyle(controlName: string): { [key: string]: string } {
    const control = this.contactForm.get(controlName);
    const isInvalid = control ? (control.invalid && control.touched) : false;
  
    return {
      'border-color': isInvalid ? 'red' : 'black',
      '--border-color': isInvalid ? 'red' : 'black',
      '--placeholder-color': isInvalid ? 'red' : 'black',
      '--text-color': isInvalid ? 'red' : 'black',
      'color': isInvalid ? 'red' : 'black'
    };
  }

  getLabelStyle(controlName: string): { [key: string]: string } {
    const control = this.contactForm.get(controlName);
    const isInvalid = control ? (control.invalid && control.touched) : false;

    return {
      'color': isInvalid ? 'red' : 'black'
    };
  }
}

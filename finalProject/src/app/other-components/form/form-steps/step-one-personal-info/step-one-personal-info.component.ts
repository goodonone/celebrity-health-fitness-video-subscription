import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective } from '@angular/forms';

@Component({
  selector: 'app-step-one-personal-info',
  templateUrl: './step-one-personal-info.component.html',
  styleUrls: ['./step-one-personal-info.component.css'],
})

export class StepOnePersonalInfoComponent implements OnInit {
  stepForm!: FormGroup;

  @Input() formGroupName!: string;
  passwordArray: string[] = [];
  confirmPasswordArray: string[] = [];
  passwordMissmatch = false;

  constructor(private inputFormGroup: FormGroupDirective, private fb: FormBuilder) { }


  ngOnInit(): void {
    this.stepForm = this.inputFormGroup.control.get(this.formGroupName) as FormGroup;
    const formVals = this.inputFormGroup.form.get('personalDetails')?.value;
  }

  passwordCheck() {
      const password = (document.getElementById("password") as HTMLInputElement).value;
      const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;
      if (password == confirmPassword) {
        this.stepForm.patchValue({
          password: confirmPassword
        })
      }
      else {
        this.passwordMissmatch = !this.passwordMissmatch;
      }
  }

// More specific password check

     //   setTimeout(() => {
    //     const password = (document.getElementById("password") as HTMLInputElement).value;
    //     const splitPassword = password.split("(?!^)");
    //     const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;
    //     const splitConfirmPassword = confirmPassword.split("(?!^)");
    //     for (var i = 0; i <= splitConfirmPassword.length; i++) {
    //       if (splitPassword[i] == splitConfirmPassword[i]) {
    //         i++;
    //       }
    //       else {
    //         this.passwordMissmatch = !this.passwordMissmatch;
    //         break;
    //       }
    //     }
    //   }, 6000);
    // }

}
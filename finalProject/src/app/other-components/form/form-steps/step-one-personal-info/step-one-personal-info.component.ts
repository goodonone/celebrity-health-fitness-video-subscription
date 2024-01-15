import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';

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

  constructor(private inputFormGroup: FormGroupDirective) { }


  ngOnInit(): void {
    this.stepForm = this.inputFormGroup.control.get(this.formGroupName) as FormGroup;

    
  }
  

//  typingTimer: string | number | NodeJS.Timeout | undefined;                //timer identifier
//   doneTypingInterval = 5000;  //time in ms, 5 seconds for example
//   $input = $('#myInput');
  
//   //on keyup, start the countdown
//   $input.on('keyup', function () {
//     clearTimeout(typingTimer);
//     typingTimer = setTimeout(doneTyping, doneTypingInterval);
//   });
  
//   //on keydown, clear the countdown 
//   $input.on('keydown', function () {
//     clearTimeout(typingTimer);
//   });
  
//   //user is "finished typing," do something
//   function doneTyping () {
//     //do something
//   }


  passwordCheck(){
    setTimeout(() => {
    const password = (document.getElementById("password") as HTMLInputElement).value;
    const splitPassword = password.split("(?!^)");
    const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;
    const splitConfirmPassword = confirmPassword.split("(?!^)");
    for(var i =0; i<=splitConfirmPassword.length; i++){
  if(splitPassword[i] == splitConfirmPassword[i])
  {
    i++;
  }
  else{
  this.passwordMissmatch = !this.passwordMissmatch;
  break;
  }
    }
    
}, 6000);
  
}


  
}




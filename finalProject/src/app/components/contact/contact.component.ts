import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {

  name:string = "";
  email: string = "";
  message: string = "";

  submitted = false;

  contactUs(){
    this.submitted = true;
    setTimeout(() => {
    this.toggle();
    }, 4000);
    var form = <HTMLFormElement>document.getElementById('contactForm');
    form.reset(); 
  }

  toggle(){
    this.submitted = !this.submitted;
  }

}

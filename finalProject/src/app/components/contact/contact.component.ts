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

  contactUs(){

    // set timer to reset the toggle or refresh page
  }


}

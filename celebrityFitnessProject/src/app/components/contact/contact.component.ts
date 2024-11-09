import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, OnDestroy {

  name:string = "";
  email: string = "";
  message: string = "";

  submitted = false;

  ngOnInit(): void {
    document.body.style.backgroundColor = "black";
  }

  ngOnDestroy(): void {
    document.body.style.backgroundColor = "white";
  }

  contactUs(){
    this.submitted = true;
    setTimeout(() => {
    this.toggle();
    }, 3000);
    var form = <HTMLFormElement>document.getElementById('contactForm');
    form.reset(); 
  }

  toggle(){
    this.submitted = !this.submitted;
  }

}

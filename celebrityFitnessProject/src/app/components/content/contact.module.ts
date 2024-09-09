import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactRoutingModule } from '../contact/contact-routing.module';
import { ContactComponent } from '../contact/contact.component';
import { MatCardModule } from '@angular/material/card'
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ContactComponent
  ],
  imports: [
    CommonModule,
    ContactRoutingModule,
    MatCardModule,
    FormsModule
  ]
})
export class ContactModule { }

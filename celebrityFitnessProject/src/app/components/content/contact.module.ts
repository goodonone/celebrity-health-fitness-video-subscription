import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactRoutingModule } from '../contact/contact-routing.module';
import { ContactComponent } from '../contact/contact.component';
import { MatCardModule } from '@angular/material/card'
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { MaterialModule } from 'src/app/material.module';


@NgModule({
  declarations: [
    ContactComponent
  ],
  imports: [
    CommonModule,
    ContactRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class ContactModule { }

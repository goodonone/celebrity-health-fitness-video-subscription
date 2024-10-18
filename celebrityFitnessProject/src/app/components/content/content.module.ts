import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContentRoutingModule } from './content-routing.module';
import { ContentComponent } from './content.component';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    ContentComponent,
  ],
  imports: [
    CommonModule,
    ContentRoutingModule,
    MaterialModule,
    SharedModule,
  ]
})
export class ContentModule { }

import { Component, Input, OnInit } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-step-five-confirm',
  templateUrl: './step-five-confirm.component.html',
  styleUrls: ['./step-five-confirm.component.css']
})
export class StepFiveConfimComponent implements OnInit {
loading = true;

@Input() checkout!: boolean;

ngOnInit() : void{
}
}
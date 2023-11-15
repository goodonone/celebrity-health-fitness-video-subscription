import { Dialog } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'finalProject';

  viewSearchBar: boolean = false;
  // constructor(public dialog: MatDialog) {}

  // openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
  //   this.dialog.open(Dialog,{
  //     width: '250px',
  //     enterAnimationDuration,
  //     exitAnimationDuration,
  //   });

  toggleTable(){
    if(this.viewSearchBar){
      this.viewSearchBar = false;
    }
    else{
      this.viewSearchBar = true;
    }
  }


  }






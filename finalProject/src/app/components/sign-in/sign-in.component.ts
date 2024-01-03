import { Component, Input, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
 selector: 'app-sign-in',
 templateUrl: './sign-in.component.html',
 styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit {

 email: string = '';
 password: string = '';

 errorMessage = false;

 constructor(private userService: UserService, private router: Router) { }

 ngOnInit(): void {
  if(localStorage.getItem('userId'))
 {
  this.router.navigateByUrl(`/signin`);
 } 
 }

 signin(){
   this.userService.login(this.email, this.password).subscribe((response:any) => {
    const userId = response.userId;
    localStorage.setItem('tier', response.tier);
    localStorage.setItem('token', response.token);

       this.router.navigateByUrl(`/content/${userId}`);

      // this.router.navigateByUrl(`/test`);

   }, error => {
       console.log('Error: ', error);
       this.errorMessage = true;
       this.router.navigateByUrl('/signin');
   });
 }


  




}
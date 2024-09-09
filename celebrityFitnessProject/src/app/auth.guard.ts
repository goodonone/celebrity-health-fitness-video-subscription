// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';


// @Injectable({
//  providedIn: 'root'
// })
// export class AuthGuard implements CanActivate {

//  constructor(private router: Router) { }


// canActivate(): boolean{
//   if(localStorage.getItem("userId")){
//     return true;
//   }
//   else{
//     this.router.navigateByUrl('/signin')
//     return false;
//   }

//  }

//  }

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './services/auth.service'; // Adjust the path to your AuthService

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if user is logged in
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      // Store the attempted URL for redirecting after login
      this.authService.setRedirectUrl(state.url);

      // Navigate to the login page
      this.router.navigate(['/sign-in']);
      return false;
    }
  }
}


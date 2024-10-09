import { NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterModule, Routes } from '@angular/router';
import { SignUpComponent } from './sign-up.component';
import { FormService } from 'src/app/shared/Multi-Step-Form/form/form.service';
import { filter } from 'rxjs';


const routes: Routes = [{ path: '', component: SignUpComponent}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SignupRoutingModule { 
  
// In your app's main module or routing module
constructor(private router: Router, private formService: FormService) {
  this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd)
  ).subscribe((event: NavigationEnd) => {
    if (event.urlAfterRedirects.includes('/signup')) {
      this.formService.resetForm();
    }
  });
}

}

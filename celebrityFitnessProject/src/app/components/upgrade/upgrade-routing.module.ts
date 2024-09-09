import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UpgradeComponent } from './upgrade.component';
import { AuthGuard } from 'src/app/auth.guard';

const routes: Routes = [{ path: '', component: UpgradeComponent, 
  canActivate: [AuthGuard] }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UpgradeRoutingModule { }

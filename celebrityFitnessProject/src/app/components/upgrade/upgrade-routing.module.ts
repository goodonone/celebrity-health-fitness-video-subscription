import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UpgradeComponent } from './upgrade.component';
import { AuthGuard } from 'src/app/auth.guard';
import { UserDataResolver } from './user-data.resolver';

// const routes: Routes = [{ path: '', component: UpgradeComponent, 
//   canActivate: [AuthGuard] }];

const routes: Routes = [
  { 
    path: '', 
    component: UpgradeComponent, 
    canActivate: [AuthGuard],
    resolve: { userData: UserDataResolver }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UpgradeRoutingModule { }

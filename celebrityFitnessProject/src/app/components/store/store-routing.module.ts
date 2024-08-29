import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreComponent } from './store.component';
import { AuthGuard } from 'src/app/auth.guard';

const routes: Routes = [{ path: '', component: StoreComponent, 
  children: [
  { path: 'product/:id', loadChildren: () => import('../product/product.module').then((m) => m.ProductModule),
    canActivate: [AuthGuard]
}]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreRoutingModule { }



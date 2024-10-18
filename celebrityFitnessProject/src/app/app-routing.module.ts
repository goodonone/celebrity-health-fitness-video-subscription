import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SearchComponent } from './components/search/search.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "search/?:query", component: NotFoundComponent, canActivate: [AuthGuard] },
  { path: "search", component: SearchComponent, canActivate: [AuthGuard] },
  {
    path: "about",
    loadChildren: () => import('./components/about/about.module').then((m) => m.AboutModule),
  },
  { 
    path: "contact", 
    loadChildren: () => import('./components/contact/contact.module').then((m) => m.ContactModule) 
  },
  {
    path: "sign-up", 
    loadChildren: () => import('./components/sign-up/signup.module').then((m) => m.SignupModule) 
  },
  { path: "checkout", 
    loadChildren: () => import('./components/checkout/checkout.module').then((m) => m.CheckoutModule),
    canActivate: [AuthGuard]
  },
  { 
    path: "content/:id", 
    loadChildren: () => import('./components/content/content.module').then((m) => m.ContentModule),
    canActivate: [AuthGuard],
  },
  { 
    path: "profile/:id", 
    loadChildren: () => import('./components/profile/profile.module').then((m) => m.ProfileModule),
    canActivate: [AuthGuard]
  },
  { 
    path: "login", 
    loadChildren: () => import('./components/sign-in/sign-in.module').then((m) => m.SignInModule)
  },
  { 
    path: "store", 
    loadChildren: () => import('./components/store/store.module').then((m) => m.StoreModule), 
    canActivate: [AuthGuard]
  },
  {
    path: "store/product/:id", 
    loadChildren: () => import('./components/product/product.module').then((m) => m.ProductModule),
    canActivate: [AuthGuard]
  },
  {
    path: "cart", 
    loadChildren: () => import('./components/cart/cart.module').then((m) => m.CartModule),
    canActivate: [AuthGuard]
  },
  {
    path: "upgrade/:id",
    loadChildren: () => import('./components/upgrade/upgrade.module').then((m) => m.UpgradeModule),
    canActivate: [AuthGuard]
  },
  {
    path: "change-plan/:id",
    loadChildren: () => import('./components/upgrade/upgrade.module').then((m) => m.UpgradeModule),
    canActivate: [AuthGuard]
  },
  {
    path: "reset-password", 
    loadChildren: () => import('./components/reset-password/reset-password.module').then(m => m.ResetPasswordModule)
  },
  {
    path: "reset-password/:token", 
    loadChildren: () => import('./components/reset-password/reset-password.module').then(m => m.ResetPasswordModule) },
  { 
    path: "**", component: NotFoundComponent 
  },
  {
    path: "error", component: NotFoundComponent
  }
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

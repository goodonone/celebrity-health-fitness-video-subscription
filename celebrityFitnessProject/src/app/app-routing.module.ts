import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { ContentComponent } from './components/content/content.component';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SearchComponent } from './components/search/search.component';
import { StoreComponent } from './components/store/store.component';
import { ProductComponent } from './components/product/product.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { UpgradeComponent } from './components/upgrade/upgrade.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "about", component: AboutComponent },
  { path: "contact", component: ContactComponent },
  { path: "content/:id", component: ContentComponent, canActivate: [AuthGuard]},
  { path: "profile/:id", component: ProfileComponent, canActivate: [AuthGuard]},
  { path: "signup", component: SignUpComponent },
  { path: "sign-in", component: SignInComponent },
  { path: "store/product/:id", component: ProductComponent, canActivate: [AuthGuard]},
  { path: "cart", component: CartComponent, canActivate: [AuthGuard]},
  { path: "checkout", component: CheckoutComponent, canActivate: [AuthGuard]},
  { path: "search", component: SearchComponent },
  { path: "upgrade", component: UpgradeComponent, canActivate: [AuthGuard]},
  { path: "store", component: StoreComponent, canActivate: [AuthGuard]},
  { path: "upgrade/:id", component: UpgradeComponent, canActivate: [AuthGuard]},
  { path: "change-plan/:id", component: UpgradeComponent, canActivate: [AuthGuard]},
  { path: "**", component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { ContentComponent } from './components/content/content.component';
import { CreateProfileComponent } from './components/create-profile/create-profile.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SearchComponent } from './components/search/search.component';
import { StoreComponent } from './components/store/store.component';
import { ProductComponent } from './components/product/product.component';
import { CartComponent } from './components/cart/cart.component';


const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "about", component: AboutComponent },
  { path: "contact", component: ContactComponent },
  { path: "content/:id", component: ContentComponent },
  { path: "create-profile", component: CreateProfileComponent },
  { path: "edit-profile/:id", component: EditProfileComponent },
  { path: "profile/:id", component: ProfileComponent },
  { path: "signup", component: SignUpComponent },
  { path: "signin", component: SignInComponent },
  // correctly implement search with the right syntax ?q or something
  { path: "search", component: SearchComponent},
  { path: "Store", component: StoreComponent},
  { path: "product/:id", component: ProductComponent},
  { path: "cart", component: CartComponent},
  { path: "**", component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

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
import { ContentStyledComponent } from './components/content-styled/content-styled.component';
import { UpgradeComponent } from './components/upgrade/upgrade.component';


const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "about", component: AboutComponent },
  { path: "contact", component: ContactComponent },
  // Remove id from content page
  { path: "content/:id", component: ContentComponent },
  { path: "create-profile", component: CreateProfileComponent },
  { path: "edit-profile/:id", component: EditProfileComponent },
  { path: "profile/:id", component: ProfileComponent },
  { path: "signup", component: SignUpComponent },
  { path: "signin", component: SignInComponent },
  // Disable search if not implemented
  { path: "search", component: SearchComponent },
  { path: "store", component: StoreComponent },
  { path: "test", component: ContentStyledComponent },
  { path: "upgrade", component: UpgradeComponent },
  { path: "**", component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

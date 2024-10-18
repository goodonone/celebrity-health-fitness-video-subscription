import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContentComponent } from './content.component';
import { AuthGuard } from 'src/app/auth.guard';
import { SearchComponent } from '../search/search.component';

// const routes: Routes = [{ path: '', component: ContentComponent}];

const routes: Routes = [
  {
    path: '',
    component: ContentComponent,
    children: [
      { path: 'search', component: SearchComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentRoutingModule { }

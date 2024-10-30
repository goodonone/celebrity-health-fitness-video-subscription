import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/home/home.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SearchComponent } from './components/search/search.component';
import { CarouselModule } from './components/home/carousel/carousel.module';
import { VideoPlayerModule } from './components/home/video-player/video-player.module';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MaterialModule } from './material.module';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from './shared/shared.module';
import { OAuthModule } from 'angular-oauth2-oidc';
import { CustomOAuthService } from './services/oauth.service';
import { AuthStateService } from './services/authstate.service';
import { AuthService } from './services/auth.service';
import { ImageUrlManagerService } from './services/imageurlmanager.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NotFoundComponent,
    SearchComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    CarouselModule,
    VideoPlayerModule,
    ReactiveFormsModule,
    MaterialModule,
    AppRoutingModule,
    FontAwesomeModule,
    SharedModule,
    OAuthModule.forRoot()
  ],
  providers: [{ provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher}, CustomOAuthService, AuthStateService, AuthService, ImageUrlManagerService,],
  bootstrap: [AppComponent]
})
export class AppModule { }


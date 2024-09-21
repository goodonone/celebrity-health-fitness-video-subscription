import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin,
  clientId: '1074496997874-99luq5p3fbtuk4g1m0jtbf70nh71n6u8.apps.googleusercontent.com',
  scope: 'openid profile email',
  responseType: 'token id_token',
  showDebugInformation: true,
  oidc: true,
};
  

@Injectable({
  providedIn: 'root'
})
export class CustomOAuthService {
  constructor(private oauthService: OAuthService) {
    this.configureOAuth();
  }

  private configureOAuth() {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

//   login() {
//     this.oauthService.initLoginFlow();
//   }

async loginWithPopup(): Promise<boolean> {
    try {
      await this.oauthService.loadDiscoveryDocument();
      await this.oauthService.initLoginFlowInPopup();
      return this.oauthService.hasValidAccessToken();
    } catch (error) {
      console.error('Error during popup login:', error);
      return false;
    }
  }


  loadDiscoveryDocumentAndTryLogin(): Promise<boolean> {
    return this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  logout() {
    this.oauthService.logOut();
  }

  get token() {
    return this.oauthService.getAccessToken();
  }

  get isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }
}

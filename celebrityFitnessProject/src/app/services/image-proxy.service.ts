// image-proxy.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ProxyImageResponse {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    contentType: string;
    storagePath: string;
    size: number;
    timeCreated: string;
  };
  error?: string;
}

export interface CheckCorsResponse {
  success: boolean;
  data?: {
    isImage: boolean;
    hasCors: boolean;
    contentType: string;
    corsHeaders: string;
  };
  message?: string;
  needsProxy?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ImageProxyService {
  private readonly API_URL = `${environment.apiUrl}/api/image`;
  
  // Known domains that typically have CORS issues
  private corsRestrictedDomains = [
    'preview.redd.it',
    'i.redd.it',
    'imgur.com',
    'i.imgur.com',
    'pinimg.com',
    'tumblr.com'
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Checks if a URL is likely to have CORS issues
   */
  private urlMayHaveCorsIssues(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.corsRestrictedDomains.some(domain => 
        urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Checks if a URL points to an image
   */
  private isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    try {
      const urlObj = new URL(url);
      return imageExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext) || 
        urlObj.pathname.toLowerCase().includes(ext + '?')
      );
    } catch {
      return false;
    }
  }

  /**
   * Checks if the URL needs proxy by performing a CORS check
   */
  checkIfUrlNeedsProxy(url: string): Observable<boolean> {
    // Quick check for common domains with CORS issues
    if (this.urlMayHaveCorsIssues(url)) {
      return of(true);
    }

    // If it's not obviously an image URL, we should proxy it
    if (!this.isImageUrl(url)) {
      return of(true);
    }

    // For everything else, check the server
    return this.http.post<CheckCorsResponse>(`${this.API_URL}/check-cors`, { url })
      .pipe(
        map(response => {
          if (!response.success) return true;
          if (!response.data?.isImage) return true;
          return !response.data.hasCors;
        }),
        catchError(() => of(true)) // Default to using proxy if check fails
      );
  }

 /**
   * Downloads an image via proxy and uploads to Firebase
   */
 proxyImageUrl(url: string): Observable<string> {
    // Convert Promise to Observable
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });

        return this.http.post<ProxyImageResponse>(
          `${this.API_URL}/proxy-image`, 
          { url }, 
          { headers }
        );
      }),
      map((response: ProxyImageResponse) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to proxy image');
        }
        return response.data.storagePath;
      }),
      catchError(error => {
        console.error('Error proxying image:', error);
        return throwError(() => new Error(
          error.error?.message || error.message || 'Failed to process image'
        ));
      })
    );
  }

  /**
   * Smart handler for any image URL - will check if proxy is needed and use it if necessary
   */
  handleImageUrl(url: string): Observable<string> {
    // Skip proxying for data URLs
    if (url.startsWith('data:image/')) {
      return of(url);
    }
    
    // Skip proxying for already processed Firebase URLs
    if (url.startsWith('profileImages/') || 
        url.includes('firebasestorage.googleapis.com') ||
        url.includes('/api/storage/')) {
      return of(url);
    }
    
    // For external URLs, check if we need to proxy
    return this.checkIfUrlNeedsProxy(url).pipe(
      switchMap(needsProxy => {
        if (needsProxy) {
          console.log('URL needs proxy, sending to server:', url);
          return this.proxyImageUrl(url);
        } else {
          console.log('URL does not need proxy, using directly:', url);
          return of(url);
        }
      })
    );
  }
}
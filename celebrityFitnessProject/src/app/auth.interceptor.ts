// import { Injectable } from '@angular/core';
// import {
//   HttpRequest,
//   HttpHandler,
//   HttpEvent,
//   HttpInterceptor,
//   HttpErrorResponse
// } from '@angular/common/http';
// import { 
//   Observable, 
//   from, 
//   throwError, 
//   switchMap, 
//   catchError, 
//   timeout, 
//   retryWhen, 
//   delayWhen, 
//   timer, 
//   take 
// } from 'rxjs';
// import { AuthService } from './services/auth.service';

// @Injectable()
// export class AuthInterceptor implements HttpInterceptor {
//   private readonly TIMEOUT_MS = 5000;
//   private readonly MAX_RETRIES = 3;
//   private readonly RETRY_DELAY_MS = 1000;

//   constructor(private authService: AuthService) {}

//   intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     // Skip auth for public endpoints
//     if (this.isPublicEndpoint(request.url)) {
//       return next.handle(request);
//     }

//     // Handle authenticated requests
//     return from(this.authService.waitForToken()).pipe(
//       // Add timeout to prevent hanging
//       timeout(this.TIMEOUT_MS),

//       // Add token to request
//       switchMap(token => {
//         if (token) {
//           request = this.addTokenToRequest(request, token);
//         }
//         return this.handleAuthenticatedRequest(request, next);
//       }),

//       // Retry logic for network errors
//       retryWhen(errors => 
//         errors.pipe(
//           delayWhen(() => timer(this.RETRY_DELAY_MS)),
//           take(this.MAX_RETRIES)
//         )
//       ),

//       // Handle all errors
//       catchError(error => this.handleError(error))
//     );
//   }

//   private handleAuthenticatedRequest(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     return next.handle(request).pipe(
//       catchError((error: HttpErrorResponse) => {
//         // Handle 401 Unauthorized
//         if (error.status === 401) {
//           return this.handle401Error(request, next);
//         }

//         // Handle other errors
//         return throwError(() => error);
//       })
//     );
//   }

//   private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     return from(this.authService.refreshToken()).pipe(
//       switchMap(() => this.authService.getToken()),
//       switchMap(newToken => {
//         if (newToken) {
//           const clonedRequest = this.addTokenToRequest(request, newToken);
//           return next.handle(clonedRequest);
//         }
        
//         // No new token received
//         this.authService.logout();
//         return throwError(() => new Error('Token refresh failed'));
//       }),
//       catchError(error => {
//         this.authService.logout();
//         return throwError(() => error);
//       })
//     );
//   }

//   private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
//     return request.clone({
//       setHeaders: { 
//         Authorization: `Bearer ${token}`,
//         'Cache-Control': 'no-cache',
//         'Pragma': 'no-cache'
//       }
//     });
//   }

//   private handleError(error: any): Observable<never> {
//     console.error('Auth interceptor error:', {
//       name: error.name,
//       message: error.message,
//       status: error instanceof HttpErrorResponse ? error.status : 'N/A'
//     });

//     if (error.name === 'TimeoutError') {
//       this.authService.logout();
//       return throwError(() => new Error('Request timed out'));
//     }

//     return throwError(() => error);
//   }

//   private isPublicEndpoint(url: string): boolean {
//     const publicEndpoints = [
//       '/api/users/login',
//       '/api/users/check-email',
//       '/api/users/reset-password',
//     ];
//     return publicEndpoints.some(endpoint => url.includes(endpoint));
//   }
// }
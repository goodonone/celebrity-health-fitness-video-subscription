// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Injectable } from '@angular/core';

// import { BehaviorSubject, map, Observable, tap } from 'rxjs';
// import { User } from '../models/user';


// @Injectable({
//   providedIn: 'root'
// })
// export class UserService {

//   baseURL: string = "http://localhost:3000/api/users"
//   tokenKey: string = "token";
//   tierKey: string = "tier";
//   userIdKey: string = "userId";

//   constructor(private http: HttpClient) { }

//   signUp(newUser: User) {
//     return this.http.post(`${this.baseURL}/`, newUser)
// }

// login(email: string, password: string){
//   let request = { email, password };

//   return this.http.post(`${this.baseURL}/login`, request)
//     .pipe(tap((response: any) => {
//       localStorage.setItem(this.tokenKey, response.token);
//       localStorage.setItem(this.userIdKey , response.userId);
//       localStorage.setItem(this.tierKey, response.tier);
//       localStorage.setItem('billing', response.paymentFrequency);
//     }));
// }

// isloggedIn() {
//   return !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey)
// }

// // Example method to fetch the currently authenticated user's ID
// getUserId() {
//   if (this.isloggedIn()) {
//     return localStorage.getItem(this.userIdKey) ?? "";
//   }
//   return "undefined";
// }


// logoutUser() {
//   localStorage.removeItem(this.tokenKey);
//   localStorage.removeItem('billing');
//   localStorage.removeItem(this.tierKey);
//   localStorage.removeItem(this.userIdKey);
//   localStorage.removeItem("cart");
// }

// checkEmail(email: string): Observable<{exists: boolean, message: string}> {
//   return this.http.post<{exists: boolean, message: string}>(`${this.baseURL}/check-email`, { email });
// }

// // getUserId() {
// //   if (this.isloggedIn()) {
// //     return localStorage.getItem(this.userIdKey) ?? "";
// //   }
// //   return "undefined";
// // }

// // updateUser(updatedUser: User): Observable<User> {
// //   let reqHeaders = {
// //     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
// //   }
// //     return this.http.put<User>(this.baseURL + "/" + updatedUser.userId, updatedUser, {headers: reqHeaders});
// //   }

// updateUser(updatedUser: User): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   };
//   // Use the /data/ endpoint for all updates
//   return this.http.put<User>(`${this.baseURL}/data/${updatedUser.userId}`, updatedUser, { headers: reqHeaders });
// }

//   checkPassword(userId: string, password: string): Observable<boolean> {
//     let reqHeaders = {
//       Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//     }
//     return this.http.post<boolean>(`${this.baseURL}/check-password/${userId}`, { password }, { headers: reqHeaders });
//   }

//   updatePassword(userId: string, newPassword: string): Observable<any> {
//     let reqHeaders = {
//       Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//     }
//     return this.http.put<any>(`${this.baseURL}/update-password/${userId}`, { newPassword }, { headers: reqHeaders });
//   }


// // updateUser2(updatedUser2: User): Observable<User> {
// //   let reqHeaders = {
// //     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
// //   }
// //     return this.http.put<User>(this.baseURL + "/data/" + updatedUser2.userId, updatedUser2, {headers: reqHeaders});
// //   }



// getUser(userId: string): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//   return this.http.get<User>(this.baseURL + "/" + userId, {headers: reqHeaders});
//   }
  
// deleteUser(userId: string) : Observable<any> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//   return this.http.delete<any>(this.baseURL + "/" + userId, {headers: reqHeaders});
// }

// }

// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable, of } from 'rxjs';
// import { switchMap, tap } from 'rxjs/operators';
// import { User } from '../models/user';
// import { AuthService } from './auth.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class UserService {
//   private readonly baseURL = 'http://localhost:3000/api/users';
//   private readonly tokenKey = 'token';
//   private readonly tierKey = 'tier';
//   private readonly userIdKey = 'userId';
//   private readonly billingKey = 'billing';

//   constructor(private http: HttpClient, private authService: AuthService) {}

//   signUp(newUser: User): Observable<any> {
//     return this.http.post(`${this.baseURL}/`, newUser);
//   }

//   // login(email: string, password: string): Observable<any> {
//   //   return this.http.post(`${this.baseURL}/login`, { email, password })
//   //     .pipe(
//   //       tap((response: any) => {
//   //         localStorage.setItem(this.tokenKey, response.token);
//   //         localStorage.setItem(this.userIdKey, response.userId);
//   //         localStorage.setItem(this.tierKey, response.tier);
//   //         localStorage.setItem(this.billingKey, response.paymentFrequency);
//   //       })
//   //     );
//   // }

//   login(email: string, password: string): Observable<any> {
//     return this.http.post(`${this.baseURL}/login`, { email, password })
//       .pipe(
//         tap((response: any) => {
//           if (response && response.token) {
//             this.authService.login(response.token);
//             localStorage.setItem(this.tokenKey, response.token);
//           localStorage.setItem(this.userIdKey, response.userId);
//           localStorage.setItem(this.tierKey, response.tier);
//           localStorage.setItem(this.billingKey, response.paymentFrequency);
//           }
//         })
//       );
//   }

//   // isloggedIn(): boolean {
//   //   return !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey);
//   // }

//   isloggedIn(): Observable<boolean> {
//     return this.authService.isAuthenticated();
//   }

//   // getUserId(): Observable<string> {
//   //   const userId = localStorage.getItem(this.userIdKey);
//   //   return of(userId || '');
//   // }

//   getUserId(): Observable<string> {
//     return this.authService.isAuthenticated().pipe(
//       switchMap(isAuthenticated => {
//         if (isAuthenticated) {
//           const userId = this.authService.getUserIdFromToken();
//           return of(userId || '');
//         }
//         return of('');
//       })
//     );
//   }

//   logoutUser(): void {
//     [this.tokenKey, this.billingKey, this.tierKey, this.userIdKey, 'cart'].forEach(key => 
//       localStorage.removeItem(key)
//     );
//   }

//   checkEmail(email: string): Observable<{exists: boolean, message: string}> {
//     return this.http.post<{exists: boolean, message: string}>(`${this.baseURL}/check-email`, { email });
//   }

//   updateUser(updatedUser: User): Observable<User> {
//     return this.http.put<User>(
//       `${this.baseURL}/data/${updatedUser.userId}`,
//       updatedUser,
//       { headers: this.getAuthHeaders() }
//     );
//   }

//   checkPassword(userId: string, password: string): Observable<boolean> {
//     return this.http.post<boolean>(
//       `${this.baseURL}/check-password/${userId}`,
//       { password },
//       { headers: this.getAuthHeaders() }
//     );
//   }

//   updatePassword(userId: string, newPassword: string): Observable<any> {
//     return this.http.put<any>(
//       `${this.baseURL}/update-password/${userId}`,
//       { newPassword },
//       { headers: this.getAuthHeaders() }
//     );
//   }

//   getUser(userId: string): Observable<User> {
//     return this.http.get<User>(
//       `${this.baseURL}/${userId}`,
//       { headers: this.getAuthHeaders() }
//     );
//   }
  
//   deleteUser(userId: string): Observable<any> {
//     return this.http.delete<any>(
//       `${this.baseURL}/${userId}`,
//       { headers: this.getAuthHeaders() }
//     );
//   }

//   private getAuthHeaders(): HttpHeaders {
//     return new HttpHeaders({
//       Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//     });
//   }
// }

// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable, tap } from 'rxjs';
// import { User } from '../models/user';
// import { AuthService } from './auth.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class UserService {
//   private readonly baseURL: string = "http://localhost:3000/api/users";
//   private readonly tierKey: string = "tier";
//   //   baseURL: string = "http://localhost:3000/api/users"
//   tokenKey: string = "token";
// //   tierKey: string = "tier";
//   userIdKey: string = "userId";

//   constructor(private http: HttpClient, private authService: AuthService) { }

//   signUp(newUser: User) {
//     return this.http.post(`${this.baseURL}/`, newUser);
//   }

//   login(email: string, password: string) {
//     let request = { email, password };

//     return this.http.post(`${this.baseURL}/login`, request)
//       .pipe(tap((response: any) => {
//         this.authService.login(response.token);
//         localStorage.setItem(this.tierKey, response.tier);
//         localStorage.setItem('billing', response.paymentFrequency);
//       }));
//   }

//   isloggedIn(): boolean {
//     return this.authService.isAuthenticated();
//   }

//   // getUserId(): string {
//   //   return this.authService.getUserIdFromToken() || "undefined";
//   // }

//   logoutUser() {
//     this.authService.logout();
//     localStorage.removeItem('billing');
//     localStorage.removeItem(this.tierKey);
//     localStorage.removeItem("cart");
//   }

//   checkEmail(email: string): Observable<{exists: boolean, message: string}> {
//     return this.http.post<{exists: boolean, message: string}>(`${this.baseURL}/check-email`, { email });
//   }

  
// getUserId() {
//   if (this.isloggedIn()) {
//     return localStorage.getItem(this.userIdKey) ?? "";
//   }
//   return "undefined";
// }

// // updateUser(updatedUser: User): Observable<User> {
// //   let reqHeaders = {
// //     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
// //   }
// //     return this.http.put<User>(this.baseURL + "/" + updatedUser.userId, updatedUser, {headers: reqHeaders});
// //   }

// updateUser(updatedUser: User): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   };
//   // Use the /data/ endpoint for all updates
//   return this.http.put<User>(`${this.baseURL}/data/${updatedUser.userId}`, updatedUser, { headers: reqHeaders });
// }

//   checkPassword(userId: string, password: string): Observable<boolean> {
//     let reqHeaders = {
//       Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//     }
//     return this.http.post<boolean>(`${this.baseURL}/check-password/${userId}`, { password }, { headers: reqHeaders });
//   }

//   updatePassword(userId: string, newPassword: string): Observable<any> {
//     let reqHeaders = {
//       Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//     }
//     return this.http.put<any>(`${this.baseURL}/update-password/${userId}`, { newPassword }, { headers: reqHeaders });
//   }


// // updateUser2(updatedUser2: User): Observable<User> {
// //   let reqHeaders = {
// //     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
// //   }
// //     return this.http.put<User>(this.baseURL + "/data/" + updatedUser2.userId, updatedUser2, {headers: reqHeaders});
// //   }



// getUser(userId: string): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//   return this.http.get<User>(this.baseURL + "/" + userId, {headers: reqHeaders});
//   }
  
// deleteUser(userId: string) : Observable<any> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//   return this.http.delete<any>(this.baseURL + "/" + userId, {headers: reqHeaders});
// }
// }



// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Injectable } from '@angular/core';

// import { BehaviorSubject, Observable, tap } from 'rxjs';
// import { User } from '../models/user';


// @Injectable({
//   providedIn: 'root'
// })
// export class UserService {

//   baseURL: string = "http://localhost:3000/api/users"
//   tokenKey: string = "token";
//   tierKey: string = "tier";
//   userIdKey: string = "userId";

//   constructor(private http: HttpClient) { }

//   signUp(newUser: User) {
//     return this.http.post(`${this.baseURL}/`, newUser)
// }

// login(email: string, password: string){
//   let request = { email, password };

//   return this.http.post(`${this.baseURL}/login`, request)
//     .pipe(tap((response: any) => {
//       localStorage.setItem(this.tokenKey, response.token);
//       localStorage.setItem(this.userIdKey , response.userId);
//       localStorage.setItem(this.tierKey, response.tier);
//       localStorage.setItem('billing', response.paymentFrequency);
//     }));
// }

// isloggedIn() {
//   return !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey)
// }

// logoutUser() {
//   localStorage.removeItem(this.tokenKey);
//   localStorage.removeItem('billing');
//   localStorage.removeItem(this.tierKey);
//   localStorage.removeItem(this.userIdKey);
//   localStorage.removeItem("cart");
// }

// checkEmail(email: string): Observable<{exists: boolean, message: string}> {
//   return this.http.post<{exists: boolean, message: string}>(`${this.baseURL}/check-email`, { email });
// }

// getUserId() {
//   if (this.isloggedIn()) {
//     return localStorage.getItem(this.userIdKey) ?? "";
//   }
//   return "undefined";
// }


// updateUser(updatedUser: User): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   };
//   // Use the /data/ endpoint for all updates
//   return this.http.put<User>(`${this.baseURL}/data/${updatedUser.userId}`, updatedUser, { headers: reqHeaders });
// }

//   checkPassword(userId: number, password: string): Observable<boolean> {
//     let reqHeaders = {
//       Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//     }
//     return this.http.post<boolean>(`${this.baseURL}/check-password/${userId}`, { password }, { headers: reqHeaders });
//   }

//   updatePassword(userId: number, newPassword: string): Observable<any> {
//     let reqHeaders = {
//       Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//     }
//     return this.http.put<any>(`${this.baseURL}/update-password/${userId}`, { newPassword }, { headers: reqHeaders });
//   }


// getUser(userId: number): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//   return this.http.get<User>(this.baseURL + "/" + userId, {headers: reqHeaders});
//   }
  
// deleteUser(userId: number) : Observable<any> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//   return this.http.delete<any>(this.baseURL + "/" + userId, {headers: reqHeaders});
// }

// }

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user';
import { AuthService } from './auth.service';



@Injectable({
  providedIn: 'root'
})
export class UserService {

  baseURL: string = "http://localhost:3000/api/users"
  tokenKey: string = "token";
  tierKey: string = "tier";
  userIdKey: string = "userId";

  constructor(private http: HttpClient, private authService: AuthService) { }

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isloggedIn());

  // Observable for components to subscribe to
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  checkEmailAvailability(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseURL}/check-email/${email}`);
  }

  signUp(newUser: User) {
    return this.http.post(`${this.baseURL}/`, newUser)
}

// login(email: string, password: string){
//   let request = { email, password };

//   return this.http.post(`${this.baseURL}/login`, request)
//     .pipe(tap((response: any) => {
//       localStorage.setItem(this.tokenKey, response.token);
//       localStorage.setItem(this.userIdKey , response.userId);
//       localStorage.setItem(this.tierKey, response.tier);
//       localStorage.setItem('billing', response.paymentFrequency);
//     }));
// }

login(email: string, password: string) {
  let request = { email, password };

  return this.http.post(`${this.baseURL}/login`, request)
    .pipe(tap((response: any) => {
      this.updateLoginStatus(true);
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userIdKey , response.userId);
      localStorage.setItem(this.tierKey, response.tier);
      localStorage.setItem('billing', response.paymentFrequency);

      // Update login state after successful login
      localStorage.setItem("isUserLoggedIn", "true");
    }));
}

  loginWithGoogle(token: string): Observable<any> {
    return this.http.post<any>(`${this.baseURL}/login-google`, { token }).pipe(
      tap((response: any) => {
        this.authService.login(response.token, false); // We use false here because we want to log in the user
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('tier', response.tier);
        localStorage.setItem('billing', response.billing);
      })
    );
  }

// isloggedIn() {
//   return !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey) && localStorage.getItem('isUserLoggedIn') === 'true';
// }

isloggedIn(): boolean {
  const isLoggedIn = !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey) && localStorage.getItem('isUserLoggedIn') === 'true' || !!localStorage.getItem('user');
  // console.log('UserService: isLoggedIn:', isLoggedIn);
  return isLoggedIn;
}

logoutUser() {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem('billing');
  localStorage.removeItem(this.tierKey);
  localStorage.removeItem(this.userIdKey);
  // localStorage.removeItem("cart");
  localStorage.removeItem("hasVisitedHomeBefore");
  localStorage.removeItem("hasVisitedProfileBefore");
  localStorage.removeItem("isUserLoggedIn");
  this.updateLoginStatus(false);
  localStorage.removeItem("token");
  localStorage.removeItem("googleAuthToken");
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
  this.authService.authStateSubject.next(false);
}

checkEmail(email: string): Observable<{exists: boolean, message: string}> {
  return this.http.post<{exists: boolean, message: string}>(`${this.baseURL}/check-email`, { email });
}

// getUserId() {
//   if (this.isloggedIn()) {
//     return localStorage.getItem(this.userIdKey) ?? "";
//   }
//   return "undefined";
// }

getUserId(): string {
  // console.log('UserService: getUserId called');
  const userId = localStorage.getItem(this.userIdKey) || localStorage.getItem('user');
  // console.log('UserService: userId from localStorage:', userId);
  
  if (userId) {
    if (userId.startsWith('{')) {
      // It's a JSON string, parse it
      try {
        const userObject = JSON.parse(userId);
        return userObject.userId || '';
      } catch (error) {
        // console.error('Error parsing user object:', error);
      }
    } else {
      // It's just the userId string
      return userId;
    }
  }
  
  // console.log('UserService: No userId found');
  return '';
}

// signUpWithGoogle(userData: any): Observable<User> {
//   return this.http.post<User>(`${this.baseURL}/signup-google`, userData);
// }

// updateUser(updatedUser: User): Observable<User> {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//     return this.http.put<User>(this.baseURL + "/" + updatedUser.userId, updatedUser, {headers: reqHeaders});
//   }

updateUser(updatedUser: User): Observable<User> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  };
  // Use the /data/ endpoint for all updates
  return this.http.put<User>(`${this.baseURL}/data/${updatedUser.userId}`, updatedUser, { headers: reqHeaders })
  .pipe(
    tap(response => {
      // Update the user in localStorage, preserving the imgUrl if it's not being updated
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedStoredUser = {
        ...storedUser,
        ...response,
        imgUrl: updatedUser.imgUrl || storedUser.imgUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedStoredUser));
    })
  );
}


  checkPassword(userId: string, password: string): Observable<boolean> {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.post<boolean>(`${this.baseURL}/check-password/${userId}`, { password }, { headers: reqHeaders });
  }

  updatePassword(userId: string, newPassword: string): Observable<any> {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.put<any>(`${this.baseURL}/update-password/${userId}`, { newPassword }, { headers: reqHeaders });
  }

getUser(userId: string): Observable<User> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  }
  return this.http.get<User>(this.baseURL + "/" + userId, {headers: reqHeaders});
  }
  
deleteUser(userId: string) : Observable<any> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  }
  return this.http.delete<any>(this.baseURL + "/" + userId, {headers: reqHeaders});
}

updateLoginStatus(status: boolean) {
  this.isLoggedInSubject.next(status);
}


}
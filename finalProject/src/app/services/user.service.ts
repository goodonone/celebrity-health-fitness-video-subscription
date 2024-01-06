import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { BehaviorSubject, Observable, tap } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  // isLoggedIn$ : new BehaviorSubject;

  baseURL: string = "http://localhost:3000/api/users"
  tokenKey: string = "token";
  tierKey: string = "tier";
  userIdKey: string = "userId";

  constructor(private http: HttpClient) { }

  signUp(newUser: User) {
    return this.http.post(`${this.baseURL}/`, newUser)
}

login(email: string, password: string){
  let request = { email, password };

  return this.http.post(`${this.baseURL}/login`, request)
    .pipe(tap((response: any) => {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userIdKey , response.userId);
      localStorage.setItem(this.tierKey, response.tier);
    }));
}

isloggedIn() {
  return !!localStorage.getItem(this.tokenKey) && !!localStorage.getItem(this.userIdKey)
}

logoutUser() {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem('billing');
  localStorage.removeItem(this.tierKey);
  localStorage.removeItem(this.userIdKey);
  localStorage.removeItem("cart");


}

getUserId() {
  if (this.isloggedIn()) {
    return localStorage.getItem(this.userIdKey) ?? "";

  }
  return "undefined";
}

updateUser(updatedUser: User): Observable<User> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  }
    return this.http.put<User>(this.baseURL + "/" + updatedUser.userId, updatedUser, {headers: reqHeaders});
  }

getUser(userId: string): Observable<User> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  }
  // console.log(this.baseURL + "/" + userId);
  return this.http.get<User>(this.baseURL + "/" + userId, {headers: reqHeaders});
  }
  
deleteUser(userId: string) : Observable<any> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  }
  return this.http.delete<any>(this.baseURL + "/" + userId, {headers: reqHeaders});
}

}


import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { Observable, tap } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  baseURL: string = "https://localhost:7025"
  

  constructor(private http: HttpClient) { }

  signUp(newUser: User) {
    return this.http.post(`${this.baseURL}/register`, newUser)
}

login(email: string, password: string) {
  let queryParams = new HttpParams();
  queryParams = queryParams.append('email', email);
  queryParams = queryParams.append('password', password);

  return this.http.get(`${this.baseURL}/login`,  { params: queryParams, responseType: 'text' })
    .pipe(tap((response: any) => {
      localStorage.setItem('myVideoToken', response);
    }));
}

loggedIn() {
  return !!localStorage.getItem('myVideoToken')
}

logoutUser() {
  localStorage.removeItem('myVideoToken')
}

updateUser(updatedUser: User) {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem('myVideoToken')}`
  }
    return this.http.put<User>(this.baseURL + "/" + updatedUser.email, updatedUser);
  }

getUser(email: string){
  console.log(this.baseURL + "/" + email);
  return this.http.get<User>(this.baseURL + "/" + email);
  }
  
deleteUser(email: string) : Observable<any> {
  let reqHeaders = {
    Authorization: `Bearer ${localStorage.getItem('myVideoToken')}`
  }
  return this.http.delete<any>(this.baseURL + "/" + email, {headers: reqHeaders});
}


}


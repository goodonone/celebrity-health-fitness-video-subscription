import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { Observable, tap } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  baseURL: string = "https://localhost:7025"
  // tokenKey: string = "myVideoToken";
  // the token to delete the user.

  constructor(private http: HttpClient) { }

  signUp(newUser: User){
    return this.http.post(`${this.baseURL}/register`, newUser)
}

login(email: string, password: string){
  let queryParams = new HttpParams();
  queryParams = queryParams.append('email', email);
  queryParams = queryParams.append('password', password);

  return this.http.get(`${this.baseURL}/login`,  { params: queryParams, responseType: 'text' })
    .pipe(tap((response: any) => {
      localStorage.setItem('myVideoToken', response);
    }));
}

// deleteUser(email: string) : Observable<any> 
// {
//   let reqHeaders = {
//     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
//   }
//   return this.http.delete<any>(this.baseURL + "/" + email, {headers: reqHeaders});
// }
//if we delete the profile we should delete the user to.

}


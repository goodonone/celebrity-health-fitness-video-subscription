import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Profile } from '../models/profile';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  baseURL: string = "https://localhost:7025";
  tokenKey: string = "myVideoToken";

  constructor(private http: HttpClient) { }

  getProfile(email: string): Observable<Profile> {
    return this.http.get<Profile>(this.baseURL + "/" + email);

  }

  createProfile(newProfile: Profile) {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  }
  return this.http.post(this.baseURL, newProfile, { headers: reqHeaders });
  }

  updateProfile(updatedProfile: Profile) {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.put<Profile>(this.baseURL, updatedProfile, { headers: reqHeaders});
  }

  deleteProfile(email: string) : Observable<any> 
  {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.delete<any>(this.baseURL + "/" + email, {headers: reqHeaders});
  }
}

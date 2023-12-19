import { Injectable } from '@angular/core';
import { Product } from '../models/product';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseURL : string = "http://localhost:3000/api/product";
  tokenKey : string = "MyVideoToken"
  constructor(private http: HttpClient) { }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseURL);
  };

  getProductById(productId: string): Observable<Product> {
    let reqHeaders = {
      Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    }
    return this.http.get<Product>(`${this.baseURL} /  ${productId}`, {headers: reqHeaders});
    };
}

import { Injectable } from '@angular/core';
import { Product } from '../models/product';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseURL : string = "http://localhost:3000/api/product";
  tokenKey : string = "token"

  private sampleProducts: Product[] = [
   
          {
            productId:1,productName:"Dumbbell",
            productPrice:20,
            productDescription:"for weight",
            productUrl:"https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:06:18.000Z”,“updatedAt”:“2023-12-19T11:06:18.000Z"
          },

          {
            productId:2,productName:"YogaMat",
            productPrice:30,
            productDescription:"for yoga",
            productUrl:"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:09:50.000Z”,“updatedAt”:“2023-12-19T11:09:50.000Z"
          },
          {
            productId:3,
            productName:"Barbell",
            productPrice:50,
            productDescription:"for weightlifting",
            productUrl:"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:19:38.000Z”,“updatedAt”:“2023-12-19T11:19:38.000Z"},
          {
            productId:4,
            productName:"Shirt",
            productPrice:60,
            productDescription:"for hiking",
            productUrl:"https://plus.unsplash.com/premium_photo-1663099276846-b2bc0e3dd2db?q=80&w=1865&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:20:43.000Z”,“updatedAt”:“2023-12-19T11:20:43.000Z"
          },
          {
            productId:5,
            productName:"Top for women",
            productPrice:45,
            productDescription:"for pilates",
            productUrl:"https://images.unsplash.com/photo-1518605360659-2aa9659ef66d?q=80&w=1733&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:23:06.000Z”,“updatedAt”:“2023-12-19T11:23:06.000Z"
          },
          {
            productId:6,
            productName:"Boxing gloves",
            productPrice:35,
            productDescription:"for adult boxing",
            productUrl:"https://images.unsplash.com/photo-1521800641212-77d98bb90d21?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZpdG5lc3MlMjBvdXRmaXR8ZW58MHx8MHx8fDA%3D”,“createdAt”:“2023-12-19T11:25:34.000Z”,“updatedAt”:“2023-12-19T11:25:34.000Z"
          },
          {
            productId:7,
            productName:"Small dumbbell",
            productPrice:15,
            productDescription:"for light weight",
            productUrl:"https://images.unsplash.com/photo-1518310790390-836058cb000b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:31:49.000Z”,“updatedAt”:“2023-12-19T11:31:49.000Z"
          },
          {
            productId:8,
            productName:"Leggings",
            productPrice:55,
            productDescription:"for jogging and yoga",
            productUrl:"https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:33:53.000Z”,“updatedAt”:“2023-12-19T11:33:53.000Z"
          },
          {
            productId:9,
            productName:"Battle rope",
            productPrice:70,
            productDescription:"for fitness traning",
            productUrl:"https://images.unsplash.com/photo-1514994444123-10094655bdb5?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:35:23.000Z”,“updatedAt”:“2023-12-19T11:35:23.000Z"
          },
          {
            productId:11,
            productName:"Bosu ball",
            productPrice:65,
            productDescription:"for balance traning",
            productUrl:"https://images.unsplash.com/photo-1581122584612-713f89daa8eb?q=80&w=1888&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:43:40.000Z”,“updatedAt”:“2023-12-19T11:43:40.000Z"
          } 
  ]

  

  constructor(private http: HttpClient) { }

  getAllProducts(): Observable<Product[]> {
    return of(this.sampleProducts);
    // return this.http.get<Product[]>(this.baseURL);
  };

  getProductById(productId: string): Observable<Product | null> {
    // let reqHeaders = {
    //   Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    // }
    // return this.http.get<Product>(`${this.baseURL} /  ${productId}`, {headers: reqHeaders});
    const id = parseInt(productId)
    const product = this.sampleProducts.find(p => p.productId === id)

    return of(product || null)
    };
}

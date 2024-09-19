// import { Injectable } from '@angular/core';
// import { Cart } from '../models/cart';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { Product } from '../models/product';
// import { CartItems } from '../models/cart-items';

// @Injectable({
//   providedIn: 'root'
// })
// export class CartService {
//   private cart: Cart = this.getCartFromLocalStorage();
//   private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject(this.cart);
//   constructor() { }

//   addToCart(product:Product):void{
//     let cartItem = this.cart.items.find(item => item.product.productId === product.productId);
//     if(cartItem) {
//       if(cartItem.quantity < 5)
//       cartItem.quantity++;
//     } else {
//     this.cart.items.push(new CartItems(product));
//   }
//   this.setCartToLocalStorage();
// };

//   removeFromCart(productId: number): void{
//     this.cart.items = this.cart.items.filter(items => items.product.productId !== productId);
//     this.setCartToLocalStorage();
//   }

//   changeQuantity(productId: number, quantity: number) {
//     let cartItem = this.cart.items.find(item => item.product.productId === productId);
//     if(!cartItem || cartItem.product.productPrice === undefined) return;
//     cartItem.quantity = quantity;
//     cartItem.price = quantity * cartItem.product.productPrice;
//     this.setCartToLocalStorage();
//   }

//    clearCart() {
//     this.cart = new Cart();
//     this.setCartToLocalStorage();
//    }

//    getCartObservable(): Observable <Cart>{
//     return this.cartSubject.asObservable();
//    }

//    private setCartToLocalStorage(): void{
//     this.cart.totalPrice = this.cart.items.reduce((prevSum, currentItem) => prevSum + currentItem.price!, 0)
//     this.cart.totalCount = this.cart.items.reduce((prevSum, currentItem) => prevSum + currentItem.quantity, 0)
//     const cartJson = JSON.stringify(this.cart);
//     localStorage.setItem('cart', cartJson)
//     this.cartSubject.next(this.cart)
//    }

//    private getCartFromLocalStorage():Cart{
//     const cartJson = localStorage.getItem('cart');
//     return cartJson? JSON.parse(cartJson): new Cart();
//    }

//    getCart(){}

//    updateCart(){}

//    saveCart(){}

// }


// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { map, tap } from 'rxjs/operators';
// import { Cart } from '../models/cart';
// import { Product } from '../models/product';
// import { CartItems } from '../models/cart-items';

// @Injectable({
//   providedIn: 'root'
// })
// export class CartService {
//   private apiUrl = 'http://localhost:3000/api/carts'; 
//   private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject<Cart>(new Cart());

//   constructor(private http: HttpClient) {
//     this.getCart().subscribe();
//   }

//   getCart(): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.get<Cart>(`${this.apiUrl}/cart/${userId}`).pipe(
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   addToCart(product: Product, quantity: number = 1): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.post<Cart>(`${this.apiUrl}/cart/${userId}/${product.productId}`, { quantity }).pipe(
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   removeFromCart(productId: string | number): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.delete<Cart>(`${this.apiUrl}/cart/${userId}/${productId}`).pipe(
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   updateQuantity(productId: string, quantity: number): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.put<Cart>(`${this.apiUrl}/cart/${userId}/${productId}`, { quantity }).pipe(
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }


//   clearCart(): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.delete<Cart>(`${this.apiUrl}/cart/${userId}`).pipe(
//       tap(() => this.cartSubject.next(new Cart()))
//     );
//   }

//   getCartObservable(): Observable<Cart> {
//     return this.cartSubject.asObservable();
//   }

//   getTotalPrice(): Observable<number> {
//     return this.cartSubject.pipe(
//       map(cart => cart.items.reduce((total, item) => total + (item.product.productPrice! * item.quantity), 0))
//     );
//   }

//   getTotalCount(): Observable<number> {
//     return this.cartSubject.pipe(
//       map(cart => cart.items.reduce((total, item) => total + item.quantity, 0))
//     );
//   }

//   private getCurrentUserId(): string {
//     // Implement this method to get the current user's ID from your authentication system
//     // For example, you might get it from a UserService or from localStorage
//     return 'current-user-id';
//   }
// }

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { map, switchMap, tap } from 'rxjs/operators';
// import { Cart } from '../models/cart';
// import { Product } from '../models/product';
// import { CartItems } from '../models/cart-items';
// import { UserService } from './user.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class CartService {
//   private apiUrl = 'http://localhost:3000/api/cart'; // Replace with your actual API URL
//   private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject<Cart>(new Cart());

//   constructor(private http: HttpClient, private userService: UserService) {

//     this.getCart().subscribe();
//   }

//   getCart(): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   // addToCart(product: Product, quantity: number = 1): Observable<Cart> {
//   //   const userId = this.getCurrentUserId();
//   //   return this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity }).pipe(
//   //     tap(cart => this.cartSubject.next(cart))
//   //   );
//   // }

//   // addToCart(product: Product, quantity: number = 1): Observable<Cart> {
//   //   const userId = this.getCurrentUserId();
//   //   return this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity }).pipe(
//   //     tap(cart => {
//   //       console.log('Cart after adding product:', cart);  // Log the updated cart
//   //       this.cartSubject.next(cart);  // Update the cart subject
//   //     })
//   //   );
//   // }

//   addToCart(product: Product, quantity: number = 1): Observable<Cart> {
//     return this.userService.getUserId().pipe(
//       switchMap(userId =>  // Use switchMap to switch from userId Observable to the HTTP Observable
//         this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity }).pipe(
//           tap(cart => {
//             console.log('Cart after adding product:', cart);  // Log the updated full cart
//             this.cartSubject.next(cart);  // Update the cart subject with the full cart
//           })
//         )
//       )
//     );
//   }

//   removeFromCart(productId: string | number): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.delete<Cart>(`${this.apiUrl}/${userId}/${productId}`).pipe(
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   updateQuantity(productId: string | number, quantity: number): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.put<Cart>(`${this.apiUrl}/${userId}/${productId}`, { quantity }).pipe(
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   clearCart(): Observable<Cart> {
//     const userId = this.getCurrentUserId();
//     return this.http.delete<Cart>(`${this.apiUrl}/${userId}`).pipe(
//       tap(() => this.cartSubject.next(new Cart()))
//     );
//   }

//   getCartObservable(): Observable<Cart> {
//     return this.cartSubject.asObservable();
//   }

//   getTotalPrice(): Observable<number> {
//     return this.cartSubject.pipe(
//       map(cart => cart.totalPrice)
//     );
//   }

//   // getTotalCount(): Observable<number> {
//   //   return this.cartSubject.pipe(
//   //     map(cart => cart.totalCount)
//   //   );
//   // }

//   getTotalCount(): Observable<number> {
//     return this.cartSubject.pipe(
//       map(cart => {
//         console.log('Current cart in getTotalCount:', cart);  // Debugging log
//         return cart.totalCount || 0;
//       })
//     );
//   }

//   private getCurrentUserId(): string {
//     return localStorage.getItem('userId') || '';
//   }

//    // You can also have methods to fetch and update the cart from an API
//    loadCart(): void {
//     this.userService.getUserId().subscribe((userId: any) => {
//       if (userId) {
//         this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
//           tap(cart => this.cartSubject.next(cart))
//         ).subscribe(
//           cart => console.log('Cart loaded successfully:', cart),
//           error => console.error('Error loading cart:', error)
//         );
//       }
//     });
//   }
// }

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { map, switchMap, tap } from 'rxjs/operators';
// import { Cart } from '../models/cart';
// import { Product } from '../models/product';
// import { UserService } from './user.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class CartService {
//   private readonly apiUrl = 'http://localhost:3000/api/cart';
//   private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject<Cart>(new Cart());

//   constructor(private http: HttpClient, private userService: UserService) {
//     this.loadCart();
//   }

//   getCart(): Observable<Cart> {
//     return this.userService.getUserId().pipe(
//       switchMap(userId => this.http.get<Cart>(`${this.apiUrl}/${userId}`)),
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   addToCart(product: Product, quantity: number = 1): Observable<Cart> {
//     return this.userService.getUserId().pipe(
//       switchMap(userId => 
//         this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity })
//       ),
//       tap(cart => {
//         console.log('Cart after adding product:', cart);
//         this.cartSubject.next(cart);
//       })
//     );
//   }

//   removeFromCart(productId: string | number): Observable<Cart> {
//     return this.userService.getUserId().pipe(
//       switchMap(userId => this.http.delete<Cart>(`${this.apiUrl}/${userId}/${productId}`)),
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   updateQuantity(productId: string | number, quantity: number): Observable<Cart> {
//     return this.userService.getUserId().pipe(
//       switchMap(userId => this.http.put<Cart>(`${this.apiUrl}/${userId}/${productId}`, { quantity })),
//       tap(cart => this.cartSubject.next(cart))
//     );
//   }

//   clearCart(): Observable<Cart> {
//     return this.userService.getUserId().pipe(
//       switchMap(userId => this.http.delete<Cart>(`${this.apiUrl}/${userId}`)),
//       tap(() => this.cartSubject.next(new Cart()))
//     );
//   }

//   getCartObservable(): Observable<Cart> {
//     return this.cartSubject.asObservable();
//   }

//   getTotalPrice(): Observable<number> {
//     return this.cartSubject.pipe(
//       map(cart => cart.totalPrice)
//     );
//   }

//   getTotalCount(): Observable<number> {
//     return this.cartSubject.pipe(
//       map(cart => {
//         console.log('Current cart in getTotalCount:', cart);
//         return cart.totalCount || 0;
//       })
//     );
//   }

//   private loadCart(): void {
//     this.userService.getUserId().pipe(
//       switchMap(userId => this.http.get<Cart>(`${this.apiUrl}/${userId}`)),
//       tap(cart => this.cartSubject.next(cart))
//     ).subscribe(
//       cart => console.log('Cart loaded successfully:', cart),
//       error => console.error('Error loading cart:', error)
//     );
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Cart } from '../models/cart';
import { Product } from '../models/product';
import { CartItems } from '../models/cart-items';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:3000/api/cart'; // Replace with your actual API URL
  private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject<Cart>(new Cart());

  constructor(private http: HttpClient) {
    
    this.getCart().subscribe();
  }

  getCart(): Observable<Cart> {
    const userId = this.getCurrentUserId();
    return this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // addToCart(product: Product, quantity: number = 1): Observable<Cart> {
  //   const userId = this.getCurrentUserId();
  //   return this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity }).pipe(
  //     tap(cart => this.cartSubject.next(cart))
  //   );
  // }

  // addToCart(product: Product, quantity: number = 1): Observable<Cart> {
  //   const userId = this.getCurrentUserId();
  //   return this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity }).pipe(
  //     tap(cart => {
  //       console.log('Cart after adding product:', cart);  // Log the updated cart
  //       this.cartSubject.next(cart);  // Update the cart subject
  //     })
  //   );
  // }

  addToCart(product: Product, quantity: number = 1): Observable<Cart> {
    const userId = this.getCurrentUserId();
    return this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity }).pipe(
      tap(cart => {
        console.log('Updated Cart after adding product:', cart);  // Log the updated full cart
        this.cartSubject.next(cart);  // Update the cart subject with the full cart
      })
    );
  }

  removeFromCart(productId: string | number): Observable<Cart> {
    const userId = this.getCurrentUserId();
    return this.http.delete<Cart>(`${this.apiUrl}/${userId}/${productId}`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  updateQuantity(productId: string | number, quantity: number): Observable<Cart> {
    const userId = this.getCurrentUserId();
    return this.http.put<Cart>(`${this.apiUrl}/${userId}/${productId}`, { quantity }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  clearCart(): Observable<Cart> {
    const userId = this.getCurrentUserId();
    return this.http.delete<Cart>(`${this.apiUrl}/${userId}`).pipe(
      tap(() => this.cartSubject.next(new Cart()))
    );
  }

  getCartObservable(): Observable<Cart> {
    return this.cartSubject.asObservable();
  }

  getTotalPrice(): Observable<number> {
    return this.cartSubject.pipe(
      map(cart => cart.totalPrice)
    );
  }

  getTotalCount(): Observable<number> {
    return this.cartSubject.pipe(
      map(cart => cart.totalCount)
    );
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || '';
  }

   // You can also have methods to fetch and update the cart from an API
   loadCart(): void {
    const userId = localStorage.getItem('userId'); // Get userId or another way to load the cart
    this.http.get<Cart>(`/api/cart/${userId}`).subscribe(
      (cart) => {
        this.cartSubject.next(cart);
      },
      (error) => {
        console.error('Error loading cart', error);
      }
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { Cart } from '../models/cart';
import { Product } from '../models/product';
import { AuthService } from './auth.service';
// import { CartItem } from '../models/cart-item';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:3000/api/cart'; // Replace with your actual API URL
  private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject<Cart>(new Cart());
  private cartChangedSubject = new BehaviorSubject<{ action: 'clear' | 'remove' | 'init', productId?: string }>({ action: 'init' });

  isLoggedIn: boolean = false;
  private isInitialized = false;
  

  constructor(private http: HttpClient, private authService: AuthService) {
    // if(this.authService.isAuthenticated()) { 
    //   console.log('Get cart is called');
    //   this.getCart().subscribe();
    // }
    this.initializeCart();
  }

  // private initializeCart(): void {
  //   if (this.authService.isAuthenticated() && !this.isInitialized) {
  //     this.isInitialized = true;
  //     this.loadCart();
  //   }
  // }
  private initializeCart(): void {
    if (this.authService.isAuthenticated() && !this.isInitialized) {
      this.isInitialized = true;
      // console.log('Initializing cart');
      this.loadCart();
    }
  }


  // getCart(): Observable<Cart> {
  //   // this.isLoggedIn = this.authService.isAuthenticated();
  //   // if (!this.isLoggedIn) {
  //   //   return of(new Cart());
  //   // }
  //   const userId = this.getCurrentUserId();
  //   return this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
  //     tap(cart => this.cartSubject.next(cart))
  //   );
  // }

  // loadCart(): void {
  //   const userId = this.getCurrentUserId();
  //   this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
  //     take(1)
  //   ).subscribe(
  //     (cart) => {
  //       if (cart.totalCount > 0) {
  //         // console.log('Get cart is called');
  //         this.cartSubject.next(cart);
  //       }
  //     },
  //     (error) => {
  //       console.error('Error loading cart', error);
  //     }
  //   );
  // }

  // loadCart(): void {
  //   if (!this.authService.isAuthenticated()) {
  //     console.log('User is not authenticated, not loading cart');
  //     return;
  //   }

  //   const userId = this.getCurrentUserId();
  //   if (!userId) {
  //     console.log('No user ID found, not loading cart');
  //     return;
  //   }

  //   this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
  //     take(1)
  //   ).subscribe(
  //     (cart) => {
  //       if (cart && cart.totalCount > 0) {
  //         console.log('Cart loaded successfully with items');
  //         this.cartSubject.next(cart);
  //       } else {
  //         console.log('Cart is empty or does not exist');
  //         // Optionally, you can set an empty cart here
  //         this.cartSubject.next(new Cart());
  //       }
  //     },
  //     (error) => {
  //       console.error('Error loading cart', error);
  //       // Optionally, you can set an empty cart here as well
  //       this.cartSubject.next(new Cart());
  //     }
  //   );
  // }

  // loadCart(): void {
  //   if (!this.authService.isAuthenticated()) {
  //     // console.log('User is not authenticated, not loading cart');
  //     return;
  //   }

  //   const userId = this.getCurrentUserId();
  //   if (!userId) {
  //     // console.log('No user ID found, not loading cart');
  //     return;
  //   }

  //   this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
  //     take(1),
  //     catchError((error: HttpErrorResponse) => {
  //       if (error.status === 404) {
  //         // console.log('Cart not found for user, initializing empty cart');
  //         return of(new Cart());
  //       }
  //       throw error;
  //     })
  //   ).subscribe(
  //     (cart) => {
  //       if (cart && cart.totalCount > 0) {
  //         // console.log('Cart loaded successfully with items');
  //         this.cartSubject.next(cart);
  //       } else {
  //         // console.log('Cart is empty');
  //         this.cartSubject.next(new Cart());
  //       }
  //     },
  //     (error) => {
  //       console.error('Error loading cart', error);
  //       this.cartSubject.next(new Cart());
  //     }
  //   );
  // }

  loadCart(): void {
    
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      return;
    }

    console.log('Loading cart for user:', userId); 

    this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.log('Received cart:');
          return of(new Cart());
        }
        throw error;
      })
    ).subscribe(
      (cart) => {
        if (cart && cart.totalCount > 0) {
          this.cartSubject.next(cart);
        } else {
          this.cartSubject.next(new Cart());
        }
      },
      (error) => {
        console.error('Error loading cart', error);
        this.cartSubject.next(new Cart());
      }
    );
  }

  getCart(): Observable<Cart> {
    return this.cartSubject.asObservable();
  }

  addToCart(product: Product, quantity: number = 1): Observable<Cart> {
    const userId = this.getCurrentUserId();
    return this.http.post<Cart>(`${this.apiUrl}/${userId}/${product.productId}`, { quantity }).pipe(
      tap(cart => {
        // console.log('Updated Cart after adding product:', cart);
        this.cartSubject.next(cart);
      })
    );
  }

  // removeFromCart(productId: string): Observable<Cart> {
  //   const userId = this.getCurrentUserId();
  //   return this.http.delete<Cart>(`${this.apiUrl}/${userId}/${productId}`).pipe(
  //     tap(cart => this.cartSubject.next(cart))
  //   );
  // }

  removeFromCart(productId: string): Observable<any> {
    const userId = this.getCurrentUserId();
    return this.http.delete(`${this.apiUrl}/${userId}/${productId}`, { responseType: 'text' }).pipe(
      tap(() => {
        const currentCart = this.cartSubject.getValue();
        const updatedCart = new Cart();
        Object.assign(updatedCart, currentCart);
        updatedCart.CartProducts = currentCart.CartProducts.filter(item => item.Product.productId !== productId);
        updatedCart.totalCount = updatedCart.calculatedTotalCount;
        updatedCart.totalPrice = updatedCart.calculatedTotalPrice;
        this.cartSubject.next(updatedCart);
        this.cartChangedSubject.next({ action: 'remove', productId });
      })
    );
  }

  // updateQuantity(productId: string, quantity: number): Observable<Cart> {
  //   const userId = this.getCurrentUserId();
  //   return this.http.put<Cart>(`${this.apiUrl}/${userId}/${productId}`, { quantity }).pipe(
  //     tap(cart => this.cartSubject.next(cart))
  //   );
  // }

  updateQuantity(productId: string, quantity: number): Observable<any> {
    const userId = this.getCurrentUserId();
    return this.http.put(`${this.apiUrl}/${userId}/${productId}`, { quantity }, { responseType: 'text' }).pipe(
      tap(() => {
        const currentCart = this.cartSubject.getValue();
        const updatedCart = new Cart();
        Object.assign(updatedCart, currentCart);
        const updatedProduct = updatedCart.CartProducts.find(item => item.Product.productId === productId);
        if (updatedProduct) {
          updatedProduct.quantity = quantity;
          updatedCart.totalCount = updatedCart.calculatedTotalCount;
          updatedCart.totalPrice = updatedCart.calculatedTotalPrice;
          this.cartSubject.next(updatedCart);
        }
      }),
      catchError((error) => {
        console.error('Error updating quantity:', error);
        return this.getCart(); // Refresh the cart from the server in case of an error
      })
    );
  }

  clearCart(): Observable<Cart> {
    const userId = this.getCurrentUserId();
    return this.http.delete<Cart>(`${this.apiUrl}/${userId}`).pipe(
      tap(() => {
        this.cartSubject.next(new Cart())
        this.cartChangedSubject.next({ action: 'clear' });
      })
    );
  }

  getCartObservable(): Observable<Cart> {
    // console.log('CartService: getCartObservable called');
    return this.cartSubject.asObservable();
  }

  getCartChangedObservable(): Observable<{ action: 'clear' | 'remove' | 'init', productId?: string }> {
    return this.cartChangedSubject.asObservable();
  }

  getTotalPrice(): Observable<number> {
    return this.cartSubject.pipe(
      map(cart => cart.totalPrice || cart.calculatedTotalPrice)
    );
  }

  getTotalCount(): Observable<number> {
    return this.cartSubject.pipe(
      map(cart => cart.totalCount || cart.calculatedTotalCount)
    );
  }

  // private getCurrentUserId(): string {
  //   return localStorage.getItem('userId') || '';
  // }

  private getCurrentUserId(): string {
    const userId = localStorage.getItem('userId');
  
    if (!userId) {
      const userObject = JSON.parse(localStorage.getItem('user') || '{}');
      return userObject.userId || '';
    }
  
    return userId || '';
  }

  // loadCart(): void {
  //   const userId = this.getCurrentUserId();
  //   this.http.get<Cart>(`${this.apiUrl}/${userId}`).subscribe(
  //     (cart) => {
  //       this.cartSubject.next(cart);
  //     },
  //     (error) => {
  //       console.error('Error loading cart', error);
  //     }
  //   );
  // }
}
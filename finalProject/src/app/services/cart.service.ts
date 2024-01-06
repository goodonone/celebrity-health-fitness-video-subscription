import { Injectable } from '@angular/core';
import { Cart } from '../models/cart';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product';
import { CartItems } from '../models/cart-items';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cart: Cart = this.getCartFromLocalStorage();
  private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject(this.cart);
  constructor() { }

  addToCart(product:Product):void{
    let cartItem = this.cart.items.find(item => item.product.productId === product.productId);
    if(cartItem)
      return;

    this.cart.items.push(new CartItems(product));
    this.setCartToLocalStorage();
  }

  removeFromCart(productId: number): void{
    this.cart.items = this.cart.items.filter(items => items.product.productId !== productId);
    this.setCartToLocalStorage();
  }

  changeQuantity(productId: number, quantity: number) {
    let cartItem = this.cart.items.find(item => item.product.productId === productId);
    if(!cartItem || cartItem.product.productPrice === undefined) return;

    cartItem.quantity = quantity;
    cartItem.price = quantity * cartItem.product.productPrice;
    this.setCartToLocalStorage();
  }

   clearCart() {
    this.cart = new Cart();
    this.setCartToLocalStorage();
   }

   getCartObservable(): Observable <Cart>{
    return this.cartSubject.asObservable();
   }

   private setCartToLocalStorage(): void{
    // if (!this.cart || !this.cart.items) {
    //   return;
    // }
    // this.cart.totalPrice = this.cart.items.reduce((prevSum, currentItem) => {
      // if(currentItem.price === undefined) {
      //   return prevSum;
      // }

      // return prevSum + currentItem.price;}, 0)
    this.cart.totalPrice = this.cart.items.reduce((prevSum, currentItem) => prevSum + currentItem.price!, 0)
    this.cart.totalCount = this.cart.items.reduce((prevSum, currentItem) => prevSum + currentItem.quantity, 0)
    const cartJson = JSON.stringify(this.cart);
    localStorage.setItem('cart', cartJson)
    this.cartSubject.next(this.cart)
   }

   private getCartFromLocalStorage():Cart{
    const cartJson = localStorage.getItem('cart');
    return cartJson? JSON.parse(cartJson): new Cart();
   }

   getCart(){}

   updateCart(){}

   saveCart(){} //probably the same as updatecart

}

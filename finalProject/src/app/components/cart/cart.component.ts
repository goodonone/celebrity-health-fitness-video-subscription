import { Component, OnInit } from '@angular/core';
import { Cart } from 'src/app/models/cart';
import { CartItems } from 'src/app/models/cart-items';
import { CartService } from 'src/app/services/cart.service';
import { PaymentService } from 'src/app/services/payment.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit{
  cart!: Cart;

  constructor(private cartService: CartService, private paymentService: PaymentService) {


  }
  ngOnInit(): void {
    this.cartService.getCartObservable().subscribe((cart) => {
      this.cart = cart;
    })
  }

  removeFromCart(cartItem:CartItems) {
    this.cartService.removeFromCart(cartItem.product.productId ?? 0);
  }
  
  changeQuantity(cartItem: CartItems,quantityInString:string) {
    const quantity = parseInt(quantityInString);
    this.cartService.changeQuantity(cartItem.product.productId ?? 0, quantity);

  }

  checkoutCart(){
    let UserId: string | null = localStorage.getItem("userId");
      const newPayment = {
        userId: parseInt(UserId!),
        tier: localStorage.getItem("tier") || "",
        price: this.cart.totalPrice || 0,
        paymentType: 'store purchase',
        
      }
    
    this.paymentService.newPaymentStore(newPayment).subscribe(()=>{

    });
    this.cartService.clearCart();
    localStorage.removeItem("cart");
  }

  cartItem(): boolean {
    const cartItem = localStorage.getItem("cart");
    return !!cartItem
  }
}
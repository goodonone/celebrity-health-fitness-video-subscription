import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Cart } from 'src/app/models/cart';
import { CartItems } from 'src/app/models/cart-items';
import { CartService } from 'src/app/services/cart.service';
import { PaymentService } from 'src/app/services/payment.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart!: Cart;
  tierTwoThree = true;
  userId?: number;
  tierOneCheckout = false;
  cartStatic = true;
  cartFlip = false;

  constructor(private cartService: CartService, private paymentService: PaymentService, private router: Router, private userService: UserService, private actRoute: ActivatedRoute) {


  }
  ngOnInit(): void {

    let UserId = localStorage.getItem('userId');
    this.userId = parseInt(UserId!);

    this.cartService.getCartObservable().subscribe((cart) => {
      this.cart = cart;
    })

    const tier = localStorage.getItem('tier')

    if (tier == "Just Looking") {
      this.checkTier();
    }

    // if(!this.cartFlip){
    //   this.toggleTier();
    // }

  }

  removeFromCart(cartItem: CartItems) {
    this.cartService.removeFromCart(cartItem.product.productId ?? 0);
  }

  changeQuantity(cartItem: CartItems, quantityInString: string) {
    const quantity = parseInt(quantityInString);
    this.cartService.changeQuantity(cartItem.product.productId ?? 0, quantity);

  }

  checkoutCart() {
    let UserId: string | null = localStorage.getItem("userId");
    const newPayment = {
      userId: parseInt(UserId!),
      tier: localStorage.getItem("tier") || "",
      price: this.cart.totalPrice || 0,
      paymentType: 'store purchase',
    }

    this.paymentService.newPaymentStore(newPayment).subscribe(() => {

    });
    this.cartService.clearCart();
    localStorage.removeItem("cart");
    this.cartStatic = !this.cartStatic;
  }

  cartItem(): boolean {
    const cartItem = localStorage.getItem("cart");
    return !!cartItem;
  }

  checkTier() {
    this.tierTwoThree = !this.tierTwoThree;
  }

}
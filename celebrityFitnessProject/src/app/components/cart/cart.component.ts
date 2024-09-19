// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Cart } from 'src/app/models/cart';
// import { CartItems } from 'src/app/models/cart-items';
// import { CartService } from 'src/app/services/cart.service';
// import { PaymentService } from 'src/app/services/payment.service';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-cart',
//   templateUrl: './cart.component.html',
//   styleUrls: ['./cart.component.css']
// })
// export class CartComponent implements OnInit {
//   cart!: Cart;
//   tierTwoThree = true;
//   userId: string | null = '';
//   tierOneCheckout = false;
//   cartStatic = true;
//   cartFlip = false;

//   constructor(private cartService: CartService, private paymentService: PaymentService, private router: Router, private userService: UserService, private actRoute: ActivatedRoute) {


//   }
//   ngOnInit(): void {

//     let UserId = localStorage.getItem('userId');
//     // this.userId = parseInt(UserId!);
//     this.userId = UserId;

//     this.cartService.getCartObservable().subscribe((cart) => {
//       this.cart = cart;
//     })

//     const tier = localStorage.getItem('tier')

//     if (tier == "Just Looking") {
//       this.checkTier();
//     }

//     // if(!this.cartFlip){
//     //   this.toggleTier();
//     // }

//   }

//   removeFromCart(cartItem: CartItems) {
//     this.cartService.removeFromCart(cartItem.product.productId ?? 0);
//   }

//   changeQuantity(cartItem: CartItems, quantityInString: string) {
//     const quantity = parseInt(quantityInString);
//     this.cartService.changeQuantity(cartItem.product.productId ?? 0, quantity);

//   }

//   checkoutCart() {
//     let UserId: string | null = localStorage.getItem("userId");
//     const newPayment = {
//       userId: UserId!,
//       tier: localStorage.getItem("tier") || "",
//       price: this.cart.totalPrice || 0,
//       paymentType: 'store purchase',
//     }

//     this.paymentService.newPaymentStore(newPayment).subscribe(() => {

//     });
//     this.cartService.clearCart();
//     localStorage.removeItem("cart");
//     this.cartStatic = !this.cartStatic;
//   }

//   cartItem(): boolean {
//     const cartItem = localStorage.getItem("cart");
//     return !!cartItem;
//   }

//   checkTier() {
//     this.tierTwoThree = !this.tierTwoThree;
//   }

// }

// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Observable } from 'rxjs';
// import { Cart } from 'src/app/models/cart';
// import { CartItems } from 'src/app/models/cart-items';
// import { CartService } from 'src/app/services/cart.service';
// import { PaymentService } from 'src/app/services/payment.service';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-cart',
//   templateUrl: './cart.component.html',
//   styleUrls: ['./cart.component.css']
// })
// export class CartComponent implements OnInit {
//   cart$!: Observable<Cart>;
//   tierTwoThree = true;
//   userId: string | null = '';
//   tierOneCheckout = false;
//   cartStatic = true;
//   cartFlip = false;

//   constructor(
//     private cartService: CartService,
//     private paymentService: PaymentService,
//     private router: Router,
//     private userService: UserService,
//     private actRoute: ActivatedRoute
//   ) {}

//   ngOnInit(): void {
//     this.userId = localStorage.getItem('userId');
//     this.cart$ = this.cartService.getCartObservable();

//     const tier = localStorage.getItem('tier');
//     if (tier === "Just Looking") {
//       this.checkTier();
//     }
//   }

//   removeFromCart(cartItem: CartItems) {
//     if (cartItem.product.productId !== undefined) {
//       this.cartService.removeFromCart(cartItem.product.productId).subscribe();
//     } else {
//       console.error('Product ID is undefined');
//     }
//   }

//   changeQuantity(cartItem: CartItems, quantityInString: string) {
//     const quantity = parseInt(quantityInString);
//     if (cartItem.product.productId !== undefined) {
//       this.cartService.updateQuantity(cartItem.product.productId, quantity).subscribe();
//     } else {
//       console.error('Product ID is undefined');
//     }
//   }

//   checkoutCart() {
//     this.cart$.subscribe(cart => {
//       const newPayment = {
//         userId: this.userId!,
//         tier: localStorage.getItem("tier") || "",
//         price: cart.totalPrice || 0,
//         paymentType: 'store purchase',
//       };

//       this.paymentService.newPaymentStore(newPayment).subscribe(() => {
//         this.cartService.clearCart().subscribe(() => {
//           localStorage.removeItem("cart");
//           this.cartStatic = !this.cartStatic;
//         });
//       });
//     });
//   }

//   cartItem(): boolean {
//     // This method might not be necessary anymore as we're using the database
//     // You might want to check if the cart has items instead
//     return this.cartService.getTotalCount().pipe(map(count => count > 0));
//   }

//   checkTier() {
//     this.tierTwoThree = !this.tierTwoThree;
//   }
// }

// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Observable } from 'rxjs';
// import { Cart } from 'src/app/models/cart';
// import { CartItems } from 'src/app/models/cart-items';
// import { CartService } from 'src/app/services/cart.service';
// import { PaymentService } from 'src/app/services/payment.service';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-cart',
//   templateUrl: './cart.component.html',
//   styleUrls: ['./cart.component.css']
// })
// export class CartComponent implements OnInit {
//   cart$: Observable<Cart>;
//   tierTwoThree = true;
//   userId: string | null = '';
//   tierOneCheckout = false;
//   cartStatic = true;
//   cartFlip = false;

//   constructor(
//     private cartService: CartService,
//     private paymentService: PaymentService,
//     private router: Router,
//     private userService: UserService,
//     private actRoute: ActivatedRoute
//   ) {}

//   ngOnInit(): void {
//     this.userId = localStorage.getItem('userId');
//     this.cart$ = this.cartService.getCartObservable();

//     const tier = localStorage.getItem('tier');
//     if (tier === "Just Looking") {
//       this.checkTier();
//     }
//   }

//   removeFromCart(cartItem: CartItems) {
//     if (cartItem.product.productId) {
//       this.cartService.removeFromCart(cartItem.product.productId).subscribe();
//     } else {
//       console.error('Product ID is undefined');
//     }
//   }

//   changeQuantity(cartItem: CartItems, quantityInString: string) {
//     const quantity = parseInt(quantityInString);
//     if (cartItem.product.productId) {
//       this.cartService.updateQuantity(cartItem.product.productId, quantity).subscribe();
//     } else {
//       console.error('Product ID is undefined');
//     }
//   }

//   checkoutCart() {
//     this.cart$.subscribe(cart => {
//       const newPayment = {
//         userId: this.userId!,
//         tier: localStorage.getItem("tier") || "",
//         price: cart.totalPrice || 0,
//         paymentType: 'store purchase',
//       };

//       this.paymentService.newPaymentStore(newPayment).subscribe(() => {
//         this.cartService.clearCart().subscribe(() => {
//           this.cartStatic = !this.cartStatic;
//         });
//       });
//     });
//   }

//   checkTier() {
//     this.tierTwoThree = !this.tierTwoThree;
//   }
// }

// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Observable } from 'rxjs';
// import { Cart } from 'src/app/models/cart';
// import { CartItems } from 'src/app/models/cart-items';
// import { CartService } from 'src/app/services/cart.service';
// import { PaymentService } from 'src/app/services/payment.service';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-cart',
//   templateUrl: './cart.component.html',
//   styleUrls: ['./cart.component.css']
// })
// export class CartComponent implements OnInit {
//   cart$: Observable<Cart>;
//   totalPrice$: Observable<number>;
//   tierTwoThree = true;
//   userId: string | null = '';
//   tierOneCheckout = false;
//   cartStatic = true;
//   cartFlip = false;

//   constructor(
//     private cartService: CartService,
//     private paymentService: PaymentService,
//     private router: Router,
//     private userService: UserService,
//     private actRoute: ActivatedRoute
//   ) {}

//   ngOnInit(): void {
//     this.userId = localStorage.getItem('userId');
//     this.cart$ = this.cartService.getCartObservable();
//     this.totalPrice$ = this.cartService.getTotalPrice();

//     const tier = localStorage.getItem('tier');
//     if (tier === "Just Looking") {
//       this.checkTier();
//     }
//   }

//   removeFromCart(cartItem: CartItems) {
//     if (cartItem.product.productId) {
//       this.cartService.removeFromCart(cartItem.product.productId).subscribe();
//     } else {
//       console.error('Product ID is undefined');
//     }
//   }

//   changeQuantity(cartItem: CartItems, quantityInString: string) {
//     const quantity = parseInt(quantityInString);
//     if (cartItem.product.productId) {
//       this.cartService.updateQuantity(cartItem.product.productId, quantity).subscribe();
//     } else {
//       console.error('Product ID is undefined');
//     }
//   }

//   checkoutCart() {
//     this.totalPrice$.subscribe(totalPrice => {
//       const newPayment = {
//         userId: this.userId!,
//         tier: localStorage.getItem("tier") || "",
//         price: totalPrice,
//         paymentType: 'store purchase',
//       };

//       this.paymentService.newPaymentStore(newPayment).subscribe(() => {
//         this.cartService.clearCart().subscribe(() => {
//           this.cartStatic = !this.cartStatic;
//         });
//       });
//     });
//   }

//   checkTier() {
//     this.tierTwoThree = !this.tierTwoThree;
//   }
// }

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Cart } from 'src/app/models/cart';
import { CartItems } from 'src/app/models/cart-items';
import { CartService } from 'src/app/services/cart.service';
import { PaymentService } from 'src/app/services/payment.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart$!: Observable<Cart>;
  tierTwoThree = true;
  userId: string | null = '';
  cartStatic = true;

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId');
    this.cart$ = this.cartService.getCartObservable();

    const tier = localStorage.getItem('tier');
    if (tier === "Just Looking") {
      this.checkTier();
    }
  }

  removeFromCart(cartItem: CartItems) {
    if (cartItem.product.productId) {
      this.cartService.removeFromCart(cartItem.product.productId).subscribe();
    }
  }

  changeQuantity(cartItem: CartItems, quantity: string) {
    if (cartItem.product.productId) {
      this.cartService.updateQuantity(cartItem.product.productId, parseInt(quantity)).subscribe();
    }
  }

  checkoutCart() {
    this.cart$.subscribe(cart => {
      const newPayment = {
        userId: this.userId!,
        tier: localStorage.getItem("tier") || "",
        price: cart.totalPrice,
        paymentType: 'store purchase',
      };

      this.paymentService.newPaymentStore(newPayment).subscribe(() => {
        this.cartService.clearCart().subscribe(() => {
          this.cartStatic = !this.cartStatic;
        });
      });
    });
  }

  checkTier() {
    this.tierTwoThree = !this.tierTwoThree;
  }
}
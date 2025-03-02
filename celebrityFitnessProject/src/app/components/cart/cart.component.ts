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

// import { Component, OnInit } from '@angular/core';
// import { map, Observable, tap } from 'rxjs';
// import { Cart } from 'src/app/models/cart';
// import { CartItem } from 'src/app/models/cart-items';
// // import { CartItem } from 'src/app/models/cart-item';
// import { Product } from 'src/app/models/product';
// import { CartService } from 'src/app/services/cart.service';
// import { PaymentService } from 'src/app/services/payment.service';

// @Component({
//   selector: 'app-cart',
//   templateUrl: './cart.component.html',
//   styleUrls: ['./cart.component.css']
// })
// export class CartComponent implements OnInit {
//   cart$!: Observable<Cart>;
//   tierTwoThree = true;
//   userId: string | null = '';
//   cartStatic = true;

//   constructor(
//     private cartService: CartService,
//     private paymentService: PaymentService
//   ) {}

  // ngOnInit(): void {
  //   this.userId = localStorage.getItem('userId');
  //   this.cart$ = this.cartService.getCartObservable().pipe(
  //     map(backendCart => {
  //       const cart = new Cart();
  //       Object.assign(cart, backendCart);
  //       cart.createdAt = new Date(backendCart.createdAt);
  //       cart.updatedAt = new Date(backendCart.updatedAt);
        
  //       cart.CartProducts = backendCart.CartProducts.map(cp => {
  //         const product: Product = {
  //           productId: cp.Product.productId,
  //           productName: cp.Product.productName,
  //           productPrice: Number(cp.Product.productPrice),
  //           productDescription: cp.Product.productDescription,
  //           productUrl: cp.Product.productUrl,
  //           createdAt: new Date(cp.Product.createdAt),
  //           updatedAt: new Date(cp.Product.updatedAt)
  //         };

  //         const cartItem: CartItem = {
  //           cartProductId: cp.cartProductId,
  //           cartId: cp.cartId,
  //           productId: cp.productId,
  //           quantity: cp.quantity,
  //           createdAt: new Date(cp.createdAt),
  //           updatedAt: new Date(cp.updatedAt),
  //           Product: product
  //         };

  //         return cartItem;
  //       });
        
  //       cart.totalCount = backendCart.totalCount || cart.calculatedTotalCount;
  //       cart.totalPrice = backendCart.totalPrice || cart.calculatedTotalPrice;
        
  //       return cart;
  //     })
  //   );

  //   const tier = localStorage.getItem('tier');
  //   if (tier === "Just Looking") {
  //     this.checkTier();
  //   }
  // }

  // removeFromCart(cartItem: CartItem) {
  //   if (cartItem.Product.productId) {
  //     this.cartService.removeFromCart(cartItem.Product.productId).subscribe();
  //   }
  // }



//   changeQuantity(cartItem: CartItem, event: Event) {
//     const target = event.target as HTMLSelectElement; // Cast event target
//     const newQuantity = parseInt(target.value);
  
//     if (cartItem.Product.productId && newQuantity > 0) {
//       this.cartService.updateQuantity(cartItem.Product.productId, newQuantity).subscribe({
//         next: () => {
//           cartItem.quantity = newQuantity; // Update the cartItem's quantity locally
//         },
//         error: (error) => {
//           console.error('Error updating quantity:', error);
//         }
//       });
//     }
//   }

//   checkoutCart() {
//     this.cart$.subscribe(cart => {
//       const newPayment = {
//         userId: this.userId!,
//         tier: localStorage.getItem("tier") || "",
//         price: cart.totalPrice,
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

// First, let's update the Cart model (you may need to adjust this in your actual Cart model file)

// Now, let's update the CartComponent
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { map, Observable, BehaviorSubject, catchError, Subscription } from 'rxjs';
import { Cart } from 'src/app/models/cart';
import { CartItem } from 'src/app/models/cart-items';
import { Product } from 'src/app/models/product';
import { AuthService } from 'src/app/services/auth.service';
import { CartService } from 'src/app/services/cart.service';
import { PaymentService } from 'src/app/services/payment.service';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  // @ViewChildren('productImage') productImages!: QueryList<ElementRef<HTMLElement>>;
  // @ViewChildren('productImage') productImages!: QueryList<ElementRef<HTMLDivElement>>;
  // @ViewChild('largeImagePreview') largeImagePreview!: ElementRef;
  private cartSubject = new BehaviorSubject<Cart>(new Cart());
  cart$: Observable<Cart> = this.cartSubject.asObservable();
  tierTwoThree = true;
  userId: string | null = '';
  cartStatic = true;
  private authSubscription!: Subscription;
  isLoggedIn: boolean = false;
  private subscription: Subscription = new Subscription();
  hoveredItem: CartItem | null = null;
  // hoveredItem: CartItem | null = null; // Track the hovered item
  hoveredItemPreview: HTMLElement | null = null; // Reference to the preview element
  hoveredItemIndex: number | null = null;
  private hoverTimeout: any = null; 
  isMinusClicked: boolean = false;
  isPlusClicked: boolean = false;
  minusClicked: boolean = false;
  plusClicked: boolean = false;
  hoveredButton: string | null = null;
  isIconHovered: boolean = false;

  faPlus = faPlus;
  faMinus = faMinus;

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // this.userId = localStorage.getItem('userId');
    // this.loadCart();

    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.userId = localStorage.getItem('userId');
      this.loadCart();
    } else {
      this.userId = null;
    }

    const tier = localStorage.getItem('tier');
    if (tier === "Just Looking") {
      this.checkTier();
    }
  }

// Adding this after view initialization to confirm image elements are properly accessed.
ngAfterViewInit() {
  // this.setupImagePreviews();
}

onMouseEnter(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const preview = target.querySelector('.largeImagePreview') as HTMLElement;
  
  // Clear any existing timeout to avoid multiple triggers
  if (this.hoverTimeout) {
    clearTimeout(this.hoverTimeout);
  }

  // Set the preview to hidden while we calculate its position
  preview.style.display = 'none';

  // Set a timeout for 150ms to show the preview
  this.hoverTimeout = setTimeout(() => {
    const targetRect = target.getBoundingClientRect(); // Get the position of the hovered image
    const scrollTop = window.scrollY || window.pageYOffset;
    const newTop = targetRect.top + scrollTop - 170; // Adjust the top position dynamically

    // Set the position before displaying it
    preview.style.top = `${newTop}px`;

    // Ensure the preview is displayed only after the position is set
    preview.style.display = 'block';

    // console.log('Preview top:', preview.style.top);
  }, 100); // Trigger after 150ms
}

onMouseLeave(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const preview = target.querySelector('.largeImagePreview') as HTMLElement;

  // Clear the timeout if mouse leaves before 150ms
  if (this.hoverTimeout) {
    clearTimeout(this.hoverTimeout);
  }

  // Hide the preview when the mouse leaves
  preview.style.display = 'none';
}

onMouseHover(button: string) {
  this.hoveredButton = button;
  this.isIconHovered = true;
  // Existing functionality for specific button actions
}


onMouseDown(button: string) {
  if (button === 'minus') {
    this.minusClicked = true;
  } else if (button === 'plus') {
    this.plusClicked = true;
  }
}

onMouseUp(button: string) {
  this.resetButtonState(button);
}

onMouseOff(button: string) {
  this.hoveredButton = null;
  this.isIconHovered = false;
  this.resetButtonState(button);
}

isButtonHovered(button: string): boolean {
  return this.hoveredButton === button;
}

increase(cartItem: CartItem): void {
  if (cartItem.quantity < 10) {
    this.updateQuantity(cartItem, cartItem.quantity + 1);
  }
}

decrease(cartItem: CartItem): void {
  if (cartItem.quantity > 1) {
    this.updateQuantity(cartItem, cartItem.quantity - 1);
  }
}

isDisabled(button: string, quantity: number): boolean {
  if (button === 'minus') {
    return quantity <= 1;
  } else if (button === 'plus') {
    return quantity >= 10;
  }
  return false;
}

private updateQuantity(cartItem: CartItem, newQuantity: number): void {
  if (cartItem.Product.productId && newQuantity >= 1 && newQuantity <= 10) {
    this.cartService.updateQuantity(cartItem.Product.productId, newQuantity).subscribe({
      next: () => {
        cartItem.quantity = newQuantity; // Update local state
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
      }
    });
  }
}

resetButtonState(button: string) {
  if (button === 'minus') {
    this.minusClicked = false;
  } else if (button === 'plus') {
    this.plusClicked = false;
  }
}


loadCart(): void {
  this.cartService.getCartObservable().pipe(
    map(backendCart => this.mapBackendCartToCart(backendCart)),
    catchError(error => {
      console.error('Error loading cart:', error);
      return [];
    })
  ).subscribe(cart => {
    // console.log('Mapped cart:', cart);
    this.cartSubject.next(cart);
  });
}

  private mapBackendCartToCart(backendCart: any): Cart {
    // console.log('Backend cart received:', backendCart);
    const cart = new Cart();
    cart.cartId = backendCart.cartId;
    cart.userId = backendCart.userId;
    cart.createdAt = new Date(backendCart.createdAt);
    cart.updatedAt = new Date(backendCart.updatedAt);
    cart.CartProducts = Array.isArray(backendCart.CartProducts) 
      ? backendCart.CartProducts.map((cp: any) => this.mapToCartItem(cp))
      : [];
    cart.totalCount = backendCart.totalCount;
    cart.totalPrice = backendCart.totalPrice;
    return cart;
  }

  private mapToCartItem(cp: any): CartItem {
    const product: Product = {
      productId: cp.Product.productId,
      productName: cp.Product.productName,
      productPrice: Number(cp.Product.productPrice),
      productDescription: cp.Product.productDescription,
      productUrl: cp.Product.productUrl,
      createdAt: new Date(cp.Product.createdAt),
      updatedAt: new Date(cp.Product.updatedAt),
      imageStyle: cp.Product.imageStyle
    };

    return {
      cartProductId: cp.cartProductId,
      cartId: cp.cartId,
      productId: cp.productId,
      quantity: cp.quantity,
      createdAt: new Date(cp.createdAt),
      updatedAt: new Date(cp.updatedAt),
      Product: product
    };
  }

  removeFromCart(cartItem: CartItem) {
    if (cartItem.Product.productId) {
      this.cartService.removeFromCart(cartItem.Product.productId).subscribe({
        next: () => {
          // console.log('Item removed successfully');
        },
        error: (error) => {
          console.error('Error removing item from cart:', error);
        }
      });
    }
  }
  changeQuantity(cartItem: CartItem, event: Event) {
    const target = event.target as HTMLSelectElement;
    const newQuantity = parseInt(target.value);
  
    if (cartItem.Product.productId && newQuantity > 0) {
      this.cartService.updateQuantity(cartItem.Product.productId, newQuantity).subscribe({
        next: () => {
          // console.log('Quantity updated successfully');
        },
        error: (error) => {
          console.error('Error updating quantity:', error);
        }
      });
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

  getFormattedTotal(totalPrice: number): { dollars: string, cents: string } {
    const [dollars, cents] = totalPrice.toFixed(2).split('.');
    return { dollars, cents };
  }
}
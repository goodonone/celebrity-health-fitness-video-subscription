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

// setupImagePreviews() {
//   this.productImages.forEach((imageEl: ElementRef<HTMLElement>) => {
//     const img = imageEl.nativeElement;
//     const preview = img.parentElement?.querySelector('.largeImagePreview') as HTMLElement;

//     if (preview) {
//       img.addEventListener('mouseenter', () => this.showPreview(img, preview));
//       img.addEventListener('mouseleave', () => this.hidePreview(preview));
//     }
//   });
// }

// showPreview(img: HTMLElement, preview: HTMLElement) {
//   const rect = img.getBoundingClientRect();
//   const cartContainer = document.querySelector('.cartContainer') as HTMLElement;
//   const cartRect = cartContainer.getBoundingClientRect();

//   preview.style.position = 'fixed';
//   preview.style.left = `${cartRect.left}px`;
//   preview.style.top = `${cartRect.top}px`;
//   preview.style.display = 'block';
//   preview.style.zIndex = '1000';
// }

// Method to handle mouse enter and show the preview

  // Method to handle mouse enter and show the preview
  // showPreview(index: number, cartItem: CartItem) {
  //   this.hoveredItem = cartItem;

  //   setTimeout(() => {
  //     if (this.productImages && this.largeImagePreview) {
  //       const imageElement = this.productImages.toArray()[index];
  //       if (imageElement) {
  //         const rect = imageElement.nativeElement.getBoundingClientRect();
  //         const previewElement = this.largeImagePreview.nativeElement;
  //         previewElement.style.display = 'block';
  //         previewElement.style.position = 'fixed';
  //         previewElement.style.left = `${rect.right}px`;
  //         previewElement.style.top = `${rect.top}px`;
  //       }
  //     }
  //   });
  // }

  // hidePreview() {
  //   this.hoveredItem = null;
  //   if (this.largeImagePreview) {
  //     this.largeImagePreview.nativeElement.style.display = 'none';
  //   }
  // }

  // showPreview(index: number): void {
  //   this.hoveredItemIndex = index;
  //   this.cart$.subscribe(cart => {
  //     if (cart && cart.items) {
  //       this.hoveredItem = cart.items[index];
  //     }
  //   });
  // }

  // hidePreview(): void {
  //   this.hoveredItemIndex = null;
  //   this.hoveredItem = null;
  // }

//   onMouseEnter(event: MouseEvent, cartItem: any) {
//     const target = event.target as HTMLElement;
//     const preview = target.querySelector('.largeImagePreview') as HTMLElement;
//     const scrollTop = window.scrollY || window.pageYOffset;
//     preview.style.top = `${target.getBoundingClientRect().top + scrollTop}px`; 
// }

// onMouseEnter(event: MouseEvent) {
//   const target = event.currentTarget as HTMLElement;
//   const preview = target.querySelector('.largeImagePreview') as HTMLElement;
//   const targetRect = target.getBoundingClientRect(); // Get the position of the hovered image

//   const scrollTop = window.scrollY || window.pageYOffset;
//   preview.style.top = `${targetRect.top + scrollTop}px - 350px`; // Set the top dynamically
//   preview.style.display = 'block';

//   console.log('Preview top:', preview.style.top);
// }
onMouseEnter(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const preview = target.querySelector('.largeImagePreview') as HTMLElement;
  const targetRect = target.getBoundingClientRect(); // Get the position of the hovered image

  const scrollTop = window.scrollY || window.pageYOffset;
  
  // Subtract 350 pixels from the calculated top position
  const newTop = targetRect.top + scrollTop - 170;

  // Apply the new top value
  preview.style.top = `${newTop}px`;
  preview.style.display = 'block';
  // preview.style.animation = 'fade-in 0.5s ease-in-out';

  // console.log('Preview top:', preview.style.top);
}

onMouseLeave(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const preview = target.querySelector('.largeImagePreview') as HTMLElement;
  preview.style.display = 'none';
}



 // Method to show the preview for the hovered item
//  showPreview(cartItem: CartItem) {
//   this.hoveredItem = cartItem;
//   // console.log('Hovered item:', cartItem);
// }

// // Method to hide the preview
// hidePreview() {
//   this.hoveredItem = null;
// }


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
      updatedAt: new Date(cp.Product.updatedAt)
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

  // removeFromCart(cartItem: CartItem) {
  //   if (cartItem.Product.productId) {
  //     this.cartService.removeFromCart(cartItem.Product.productId).subscribe({
  //       next: () => {
  //         // Update the cart by removing the item locally
  //         this.cart$ = this.cart$.pipe(
  //           map(cart => {
  //             // Recalculate items by removing the specified cart item
  //             const updatedItems = cart.CartProducts
  //               .map(cp => ({
  //                 cartProductId: cp.cartProductId,
  //                 cartId: cp.cartId,
  //                 productId: cp.productId,
  //                 quantity: cp.quantity,
  //                 createdAt: new Date(cp.createdAt), // Add createdAt
  //                 updatedAt: new Date(cp.updatedAt), // Add updatedAt
  //                 Product: {
  //                   productId: cp.Product.productId,
  //                   productName: cp.Product.productName,
  //                   productPrice: cp.Product.productPrice,
  //                   productDescription: cp.Product.productDescription,
  //                   productUrl: cp.Product.productUrl,
  //                   createdAt: new Date(cp.Product.createdAt),
  //                   updatedAt: new Date(cp.Product.updatedAt)
  //                 }
  //               }))
  //               .filter(item => item.Product.productId !== cartItem.Product.productId); // Remove the item
  
  //             // Recalculate total price and total count based on updated items
  //             const totalPrice = updatedItems.reduce(
  //               (total: number, item: CartItem) => total + item.Product.productPrice * item.quantity,
  //               0
  //             );
  //             const totalCount = updatedItems.reduce(
  //               (count: number, item: CartItem) => count + item.quantity,
  //               0
  //             );
  
  //             // Create a new cart object
  //             const updatedCart: Cart = {
  //               ...cart,
  //               items: updatedItems, // Update items
  //               totalPrice: totalPrice, // Set recalculated total price
  //               totalCount: totalCount, // Set recalculated total count
  //               calculatedTotalPrice: totalPrice, // Set recalculated total price for calculatedTotalPrice
  //               calculatedTotalCount: totalCount // Set recalculated total count for calculatedTotalCount
  //             };
  
  //             return updatedCart;
  //           })
  //         );
  //       },
  //       error: (error) => {
  //         console.error('Error removing item from cart:', error);
  //       }
  //     });
  //   }
  // }

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

  // changeQuantity(cartItem: CartItem, event: Event) {
  //   const target = event.target as HTMLSelectElement;
  //   const newQuantity = parseInt(target.value);
  
  //   if (cartItem.Product.productId && newQuantity > 0) {
  //     this.cartService.updateQuantity(cartItem.Product.productId, newQuantity).subscribe({
  //       next: () => {
  //         const currentCart = this.cartSubject.getValue();
  //         const updatedCart = new Cart();
  //         Object.assign(updatedCart, currentCart);
  //         const updatedItem = updatedCart.CartProducts.find(item => item.Product.productId === cartItem.Product.productId);
  //         if (updatedItem) {
  //           updatedItem.quantity = newQuantity;
  //           this.updateCartTotals(updatedCart);
  //           this.cartSubject.next(updatedCart);
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error updating quantity:', error);
  //       }
  //     });
  //   }
  // }

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

  // private updateCartTotals(cart: Cart): void {
  //   cart.totalCount = cart.calculatedTotalCount;
  //   cart.totalPrice = cart.calculatedTotalPrice;
  // }

  // checkoutCart() {
  //   const currentCart = this.cartSubject.getValue();
  //   const newPayment = {
  //     userId: this.userId!,
  //     tier: localStorage.getItem("tier") || "",
  //     price: currentCart.totalPrice,
  //     paymentType: 'store purchase',
  //   };

  //   this.paymentService.newPaymentStore(newPayment).subscribe(() => {
  //     this.cartService.clearCart().subscribe(() => {
  //       this.cartStatic = !this.cartStatic;
  //       this.cartSubject.next(new Cart()); // Reset the cart after checkout
  //     });
  //   });
  // }

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
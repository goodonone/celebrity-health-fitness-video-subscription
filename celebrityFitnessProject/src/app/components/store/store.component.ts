// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { Product } from 'src/app/models/product';
// import { ProductService } from 'src/app/services/product.service';
// import { CartService } from 'src/app/services/cart.service';
// import { CartItems } from 'src/app/models/cart-items';

// @Component({
//   selector: 'app-store',
//   templateUrl: './store.component.html',
//   styleUrls: ['./store.component.css']
// })
// export class StoreComponent implements OnInit {
//   productList: Product[] = [ ];
  
//   constructor(private productService: ProductService, private router: Router, private cartService: CartService ) {}

//   ngOnInit(): void {
//     this.productService.getAllProducts().subscribe(foundProducts => {
//       this.productList = foundProducts;
//     })

//     console.log('StoreComponent initialized');
//   }

//   addToCart(selectedProduct: Product){
//     this.cartService.addToCart(selectedProduct)
    
//   }

//   changeQuantity(cartItem: CartItems,quantityInString:string) {
//     const quantity = parseInt(quantityInString);
//     this.cartService.changeQuantity(cartItem.product.productId ?? 0, quantity);

//   }
// }


// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { Product } from 'src/app/models/product';
// import { ProductService } from 'src/app/services/product.service';
// import { CartService } from 'src/app/services/cart.service';
// import { CartItems } from 'src/app/models/cart-items';

// @Component({
//   selector: 'app-store',
//   templateUrl: './store.component.html',
//   styleUrls: ['./store.component.css']
// })
// export class StoreComponent implements OnInit {
//   productList: Product[] = [];
  
//   constructor( private productService: ProductService, private router: Router, private cartService: CartService) {}

//   ngOnInit(): void {
//     console.log('StoreComponent initialized');
//     this.loadProducts();
//   }

//   loadProducts(): void {
//     this.productService.getAllProducts().subscribe(
//       foundProducts => {
//         this.productList = foundProducts;
//         // console.log('Products loaded:', this.productList);
//       },
//       error => {
//         console.error('Error loading products:', error);
//       }
//     );
//   }

//   addToCart(selectedProduct: Product) {
//     this.cartService.addToCart(selectedProduct);
//     // console.log('Product added to cart:', selectedProduct);
//   }

//   changeQuantity(cartItem: CartItems, quantityInString: string) {
//     const quantity = parseInt(quantityInString);
//     this.cartService.changeQuantity(cartItem.product.productId ?? 0, quantity);
//     // console.log('Quantity changed for product:', cartItem.product.productId, 'New quantity:', quantity);
//   }
// }

// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { Observable } from 'rxjs';
// import { Product } from 'src/app/models/product';
// import { ProductService } from 'src/app/services/product.service';
// import { CartService } from 'src/app/services/cart.service';

// @Component({
//   selector: 'app-store',
//   templateUrl: './store.component.html',
//   styleUrls: ['./store.component.css']
// })
// export class StoreComponent implements OnInit {
//   productList$: Observable<Product[]>;
  
//   constructor(
//     private productService: ProductService, 
//     private router: Router, 
//     private cartService: CartService
//   ) {
//     this.productList$ = this.productService.getAllProducts();
//   }

//   ngOnInit(): void {
//     console.log('StoreComponent initialized');
//   }

//   addToCart(selectedProduct: Product) {
//     this.cartService.addToCart(selectedProduct).subscribe(
//       () => console.log('Product added to cart:', selectedProduct),
//       error => console.error('Error adding product to cart:', error)
//     );
//   }
// }

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from 'src/app/models/product';
import { ProductService } from 'src/app/services/product.service';
import { CartService } from 'src/app/services/cart.service';
import { CartItem } from 'src/app/models/cart-items';
import { ProductStatusService } from 'src/app/services/productstatus.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  productList$: Observable<Product[]>;
  error: string | null = null;
  cartItems: CartItem[] = [];
  maxReachedForProducts: { [productId: string]: boolean } = {};
  buttonTexts: { [productId: string]: string } = {};
  private cartSubscription?: Subscription;
  private cartChangedSubscription?: Subscription;
  
  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService,
    private productStatusService: ProductStatusService,
  ) {
    this.productList$ = this.productService.getAllProducts().pipe(
      catchError(error => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again later.';
        return of([]);
      })
    );
  }

  ngOnInit(): void {
  //   this.cartService.getCartObservable().subscribe(cart => {
  //     this.cartItems = cart.CartProducts;
  //     // this.updateAllButtonTexts();
  //     this.updateProductStatuses();
     
  //   });
  // }

  this.cartSubscription = this.cartService.getCartObservable().subscribe(cart => {
    this.cartItems = cart.CartProducts;
    this.updateProductStatuses();
  });

  this.cartChangedSubscription = this.cartService.getCartChangedObservable().subscribe(change => {
    if (change) {
      if (change.action === 'clear') {
        this.productStatusService.resetAllProductStatuses();
      } else if (change.action === 'remove' && change.productId) {
        this.productStatusService.resetProductStatus(change.productId);
      }
    }
  });
}

ngOnDestroy(): void {
  if (this.cartSubscription) {
    this.cartSubscription.unsubscribe();
  }
  if (this.cartChangedSubscription) {
    this.cartChangedSubscription.unsubscribe();
  }
}

  // addToCart(selectedProduct: Product) {
  //   this.cartService.addToCart(selectedProduct).subscribe(
  //     () => console.log('Product added to cart:', selectedProduct),
  //     error => console.error('Error adding product to cart:', error)
  //   );
  // }

  // addToCart(selectedProduct: Product) {
  //   const cartItem = this.cartItems.find(item => item.productId === selectedProduct.productId);
  //   if (cartItem && cartItem.quantity >= 10) {
  //     // Max quantity reached, don't add to cart
  //     this.maxReachedForProducts[selectedProduct.productId] = true;
  //     return;
  //   }

  //   this.cartService.addToCart(selectedProduct).subscribe(
  //     () => {
  //       console.log('Product added to cart:', selectedProduct);
  //       // Update the cart and check if max quantity is reached
  //       this.cartService.getCartObservable().subscribe(cart => {
  //         this.cartItems = cart.CartProducts;
  //         const updatedCartItem = this.cartItems.find(item => item.productId === selectedProduct.productId);
  //         if (updatedCartItem && updatedCartItem.quantity >= 10) {
  //           this.maxReachedForProducts[selectedProduct.productId] = true; // Set max quantity reached
  //         }
  //       });
  //     },
  //     error => console.error('Error adding product to cart:', error)
  //   );
  // }

  // getButtonText(product: Product): string {
  //   return this.maxReachedForProducts[product.productId] ? 'Limit Reached' : '+Cart';
  // }

  // addToCart(selectedProduct: Product) {
  //   const cartItem = this.cartItems.find(item => item.productId === selectedProduct.productId);
  //   if (cartItem && cartItem.quantity >= 10) {
  //     this.buttonTexts[selectedProduct.productId] = 'Limit Reached';
  //     this.maxReachedForProducts[selectedProduct.productId] = true;
  //     return; // Max quantity reached, don't add to cart
  //   }

  //   this.cartService.addToCart(selectedProduct).subscribe(
  //     () => {
  //       console.log('Product added to cart:', selectedProduct);
  //       this.cartService.getCartObservable().subscribe(cart => {
  //         this.cartItems = cart.CartProducts;
  //         this.updateAllButtonTexts();
  //         this.showQuantityTemporarily(selectedProduct.productId);
  //       });
  //     },
  //     error => console.error('Error adding product to cart:', error)
  //   );
  // }

  addToCart(selectedProduct: Product) {
    if (this.productStatusService.isLimitReached(selectedProduct.productId)) {
      return;
    }

    this.cartService.addToCart(selectedProduct).subscribe(
      () => {
        console.log('Product added to cart:', selectedProduct);
        this.updateProductStatuses();
        const updatedQuantity = this.cartItems.find(item => item.productId === selectedProduct.productId)?.quantity || 0;
        this.productStatusService.setTemporaryQuantity(selectedProduct.productId, updatedQuantity);
      },
      error => console.error('Error adding product to cart:', error)
    );
  }

  // updateAllButtonTexts() {
  //   this.cartItems.forEach(item => {
  //     if (item.quantity >= 10) {
  //       this.maxReachedForProducts[item.productId] = true;
  //     } else {
  //       this.maxReachedForProducts[item.productId] = false;
  //     }
  //     this.buttonTexts[item.productId] = '+Cart';
  //   });
  // }

  updateProductStatuses() {
    this.cartItems.forEach(item => {
      this.productStatusService.setLimitReached(item.productId, item.quantity >= 10);
    });
  }




  // showQuantityTemporarily(productId: string) {
  //   const cartItem = this.cartItems.find(item => item.productId === productId);
  //   if (cartItem) {
  //     if (cartItem.quantity >= 10) {
  //       this.buttonTexts[productId] = 'Limit Reached';
  //       this.maxReachedForProducts[productId] = true;
  //     } else {
  //       const originalText = this.buttonTexts[productId];
  //       this.buttonTexts[productId] = `+${cartItem.quantity}`;
  //       setTimeout(() => {
  //         if (!this.maxReachedForProducts[productId]) {
  //           this.buttonTexts[productId] = originalText;
  //         }
  //       }, 200);
  //     }
  //   }
  // }

  // getButtonText(product: Product): string {
  //   return this.buttonTexts[product.productId] || '+Cart';
  // }

  // getButtonText(product: Product): string {
  //   return this.buttonTexts[product.productId] || '+Cart';
  // }

  // isLimitReached(product: Product): boolean {
  //   return this.maxReachedForProducts[product.productId] || false;
  // }

  // onMouseEnter(product: Product): void {
  //   if (this.isLimitReached(product)) {
  //     this.buttonTexts[product.productId] = 'Limit Reached';
  //   }
  // }

  // onMouseLeave(product: Product): void {
  //     this.buttonTexts[product.productId] = '+Cart';
  // }

  getButtonText(product: Product): string {
    return this.productStatusService.getButtonText(product.productId);
  }

  isLimitReached(product: Product): boolean {
    return this.productStatusService.isLimitReached(product.productId);
  }

  onMouseEnter(product: Product): void {
    this.productStatusService.setHoverState(product.productId, true);
  }

  onMouseLeave(product: Product): void {
    this.productStatusService.setHoverState(product.productId, false);
  }

}


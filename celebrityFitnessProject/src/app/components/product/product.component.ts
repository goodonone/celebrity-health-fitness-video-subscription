// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Product } from 'src/app/models/product';
// import { CartService } from 'src/app/services/cart.service';
// import { ProductService } from 'src/app/services/product.service';
// @Component({
//   selector: 'app-product',
//   templateUrl: './product.component.html',
//   styleUrls: ['./product.component.css']
// })
// export class ProductComponent implements OnInit{
//   currentProduct: Product = new Product;
//   constructor(private actRoute: ActivatedRoute, private productService: ProductService, private cartService: CartService, private router: Router) {
//   }
//   ngOnInit() {
//     // const productId = this.actRoute.snapshot.paramMap.get("id") ?? "";
//     // this.productService.getProductById(productId).subscribe(product => {
//     //   if(product) {
//     //   this.currentProduct = product;
//     //   }
//     // });

//     console.log('ProductComponent initialized');

//     const productId = this.actRoute.snapshot.paramMap.get("id") ?? "";
//     this.productService.getProductById(productId).subscribe(
//       product => {
//         if (product) {
//           this.currentProduct = product;
//           // console.log('Product loaded:', this.currentProduct);
//         } else {
//           console.error('Product not found');
//           // Handle the case when the product is not found
//           // For example, redirect to the store or show an error message
//         }
//       },
//       error => {
//         console.error('Error loading product:', error);
//         // Handle the error case
//       }
//     );
//   }
//   addToCart(selectedProduct: Product) {
//     this.cartService.addToCart(this.currentProduct)
//   }

  
// }

// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Product } from 'src/app/models/product';
// import { CartService } from 'src/app/services/cart.service';
// import { ProductService } from 'src/app/services/product.service';

// @Component({
//   selector: 'app-product',
//   templateUrl: './product.component.html',
//   styleUrls: ['./product.component.css']
// })
// export class ProductComponent implements OnInit {
//   currentProduct: Product = new Product();

//   constructor(
//     private actRoute: ActivatedRoute,
//     private productService: ProductService,
//     private cartService: CartService,
//     private router: Router
//   ) {}

//   ngOnInit() {
//     console.log('ProductComponent initialized');
//     const productId = this.actRoute.snapshot.paramMap.get("id") ?? "";
//     this.productService.getProductById(productId).subscribe(
//       product => {
//         if (product) {
//           this.currentProduct = product;
//         } else {
//           this.router.navigate(['/store']); 
//         }
//       },
//       error => {
//         this.router.navigate(['/store']); 
//       }
//     );
//   }

//   addToCart(selectedProduct: Product) {
//     this.cartService.addToCart(this.currentProduct);
//     console.log('Product added to cart:', this.currentProduct);
//   }

//   getProductImageUrl(): string {
//     return this.currentProduct.productUrl ?? "";
//   }
// }

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from 'src/app/models/product';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ProductStatusService } from 'src/app/services/productstatus.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})

export class ProductComponent implements OnInit {
  currentProduct$: Observable<Product | null> = of(null);
  errorMessage: string = '';
  private cartChangedSubscription?: Subscription;
  private cartSubscription?: Subscription;
  isCartEmpty: boolean = true;
  viewCartButtonText: string = 'View Cart';
  // isLimitReached: boolean = false;
  
  constructor(
    private actRoute: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private productStatusService: ProductStatusService,
  ) {}

  ngOnInit() {
    console.log('ProductComponent initialized');
    const productId = this.actRoute.snapshot.paramMap.get("id");
    if (productId) {
      this.currentProduct$ = this.productService.getProductById(productId).pipe(
        tap(product => console.log('Product fetched:', product)),
        catchError(error => {
          console.error('Error fetching product:', error);
          this.errorMessage = 'Product not found or an error occurred.';
          this.router.navigate(['/store']);
          return of(null);
        })
      );
    } else {
      this.errorMessage = 'Invalid product ID.';
      this.router.navigate(['/store']);
    }

    this.cartChangedSubscription = this.cartService.getCartChangedObservable().subscribe(change => {
      if (change) {
        if (change.action === 'clear') {
          this.productStatusService.resetAllProductStatuses();
        } else if (change.action === 'remove' && change.productId) {
          this.productStatusService.resetProductStatus(change.productId);
        }
      }
    });

    // this.cartSubscription = this.cartService.getCartObservable().subscribe(cart => {
    //   this.isCartEmpty = cart.CartProducts.length === 0;
    // });

    this.cartSubscription = this.cartService.getCartObservable().subscribe(cart => {
      this.isCartEmpty = cart.CartProducts.length === 0;
      this.updateViewCartButtonText();
    });

    this.updateProductStatuses();
  }

  ngOnDestroy(): void {
    if (this.cartChangedSubscription) {
      this.cartChangedSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  // addToCart(product: Product) {
  //   if (this.productStatusService.isLimitReached(product.productId)) {
  //     console.log('Limit reached, cannot add to cart');
  //     return;
  //   }
  //   this.cartService.addToCart(product).subscribe(
  //     () => {
  //       console.log('Product added to cart:', product);
  //       this.updateProductStatus(product);
  //     },
  //     error => console.error('Error adding product to cart:', error)
  //   );
  // }

  addToCart(product: Product) {
    if (this.productStatusService.isLimitReached(product.productId)) {
      console.log('Limit reached, cannot add to cart');
      return;
    }
    this.cartService.addToCart(product).subscribe(
      () => {
        console.log('Product added to cart:', product);
        this.updateProductStatuses();
        this.cartService.getCartObservable().subscribe(cart => {
          const updatedQuantity = cart.CartProducts.find(item => item.productId === product.productId)?.quantity || 0;
          this.productStatusService.setTemporaryQuantity(product.productId, updatedQuantity);
        });
      },
      error => console.error('Error adding product to cart:', error)
    );
  }

  getProductImageUrl(product: Product | null): string {
    return product?.productUrl ?? "";
  }

  // updateProductStatus(product: Product) {
  //   this.cartService.getCartObservable().pipe(
  //     switchMap(cart => {
  //       const cartItem = cart.CartProducts.find(item => item.productId === product.productId);
  //       if (cartItem && cartItem.quantity >= 10) {
  //         this.productStatusService.setLimitReached(product.productId, true);
  //       }
  //       return of(null);
  //     })
  //   ).subscribe();
  // }

  // getButtonText(product: Product): string {
  //   return this.productStatusService.getButtonText(product.productId);
  // }

  isProductLimitReached(product: Product): boolean {
    return this.productStatusService.isLimitReached(product.productId);
  }

  updateProductStatuses() {
    this.cartService.getCartObservable().pipe(
      switchMap(cart => {
        cart.CartProducts.forEach(item => {
          this.productStatusService.setLimitReached(item.productId, item.quantity >= 10);
        });
        return of(null);
      })
    ).subscribe();
  }

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

  onViewCartMouseEnter(): void {
    if (this.isCartEmpty) {
      this.viewCartButtonText = 'Empty';
    }
  }

  onViewCartMouseLeave(): void {
    this.updateViewCartButtonText();
  }

  private updateViewCartButtonText(): void {
    this.viewCartButtonText = this.isCartEmpty ? 'View Cart' : 'View Cart';
  }

  // emptyCart(): void {
  //   this.cartService.clearCart().subscribe(() => {
  //     console.log('Cart emptied');
  //   });
  // }
  
}
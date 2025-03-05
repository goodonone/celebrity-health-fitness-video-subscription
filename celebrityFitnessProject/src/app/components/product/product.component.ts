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

import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from 'src/app/models/product';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ProductStatusService } from 'src/app/services/productstatus.service';
import { ProductPositionService } from 'src/app/services/product-position.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})

export class ProductComponent implements OnInit {
  currentProduct$: Observable<Product | null> = of(null);
  errorMessage: string = '';
  private cartChangedSubscription?: Subscription;
  private cartSubscription?: Subscription;
  isCartEmpty: boolean = true;
  viewCartButtonText: string = 'View Cart';
  addButtonHovered: boolean = false;
  hoverTimeout: any = null;
  hoverDelayTime: number = 100;
  leaveTimeout: any = null;
  backgroundPosition: string = '';
  isTabletOrMobile: boolean = false;
  // isLimitReached: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkDeviceType();
    this.cdr.detectChanges();
  }
  
  constructor(
    private actRoute: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private productStatusService: ProductStatusService,
    private productPositionService: ProductPositionService,
    private cdr: ChangeDetectorRef
  ) {
    window.addEventListener('touchstart', () => {
      // this.isTabletOrMobile = window.innerWidth <= 937;
      this.checkDeviceType();
      this.cdr.detectChanges();
    });
  }

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

    // window.addEventListener('touch', () => {
    //   // this.isTabletOrMobile = window.innerWidth <= 937;
    //   const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isTabletOrMobile = window.innerWidth <= 937;
    //   this.cdr.detectChanges();
    // });

    this.updateProductStatuses();
  }

  ngOnDestroy(): void {
    if (this.cartChangedSubscription) {
      this.cartChangedSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.leaveTimeout) {
      clearTimeout(this.leaveTimeout);
    }
  }

  private checkDeviceType(): void {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isTabletOrMobile = (isTouchDevice && window.innerWidth <= 937) || window.innerWidth <= 937;
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
    if (this.isProductLimitReached(product)) return;

    // if (this.hoverTimeout) {
    //   clearTimeout(this.hoverTimeout);
    //   this.hoverTimeout = null;
    // }
    // if (this.leaveTimeout) {
    //   clearTimeout(this.leaveTimeout);
    //   this.leaveTimeout = null;
    // }

    // this.hoverTimeout = setTimeout(() => {
    //   this.addButtonHovered = true;
      this.productStatusService.setHoverState(product.productId, true);
    //   this.cdr.detectChanges(); // Ensure UI updates
    // }, this.hoverDelayTime); 

   
  }

  onMouseLeave(product: Product): void {
    // if (this.isProductLimitReached(product)) return;

    // if (this.hoverTimeout) {
    //   clearTimeout(this.hoverTimeout);
    //   this.hoverTimeout = null;
    // }

    // this.leaveTimeout = setTimeout(() => {
    //   this.addButtonHovered = false;
      this.productStatusService.setHoverState(product.productId, false);
    //   this.cdr.detectChanges();
    // }, 100);
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


// getProductImageStyles(product: Product): any {
//   // Base styles that will be applied to all products
//   const baseStyles = {
//     'background-image': `url(${this.getProductImageUrl(product)})`,
//     'background-repeat': 'no-repeat',
//     'background-size': '100%'
//   };
  
//   // If no custom styling is defined, return defaults
//   if (!product.imageStyle) {
//     return {
//       ...baseStyles,
//       'background-position': 'center bottom'
//     };
//   }
  
//   // Add custom styling properties if they exist
//   return {
//     ...baseStyles,
//     'background-position': product.imageStyle.position || 'center bottom',
//     'background-size': product.imageStyle.size || '100%',
//     'background-repeat': product.imageStyle.repeat || 'no-repeat',
//     'background-blend-mode': product.imageStyle.blend || 'normal',
//     'opacity': product.imageStyle.opacity !== undefined ? product.imageStyle.opacity : 1
//   };
// }

// private positionMap: { [key: number]: string } = {
//   1: 'center center',
//   2: 'center bottom',
//   3: 'center center',
//   4: 'center center',
//   5: 'center center',
//   6: 'center center',
//   7: 'center bottom',
//   8: 'center center',
//   9: 'center center',
//   10: 'center bottom',
//   11: 'bottom center',
//   12: 'center center'
// };

// Method for the store component
// getProductBackgroundPosition(product: Product): string {
//   // Extract a digit from the product ID
//   const lastChar = String(product.productId).slice(-1);
//   const lastDigit = parseInt(lastChar, 10);
  
//   // Map to a value between 1-12
//   const index = (lastDigit % 12) + 1;
  
//   // Return the corresponding position
//   return this.positionMap[index] || 'center center';
// }

// Method for the product detail component
getProductImageStyles(product: Product): any {
  console.log('getProductImageStyles called with product:', product);

  if (!product || !product.productId) {
    return {
      'background-image': 'url(assets/Images/default-product-image.jpg)',
      'background-position': 'center center',
      'background-repeat': 'no-repeat',
      'background-size': '100%'
    };
  }

  // For debugging - log all positions
  // this.productPositionService.logAllPositions();
  
  // Get position from service
  
  // const backgroundPosition = this.productPositionService.getBackgroundPosition(product.productId);
  const backgroundPosition = this.isTabletOrMobile ? 'center center' : this.productPositionService.getBackgroundPosition(product.productId);
  const backgroundSize = this.isTabletOrMobile ? 'cover' : '100%';
  
  // Log for debugging
  // console.log(`Applied background position for product ${product.productId}: ${}`);
  
  return {
    'background-image': `url(${product.productUrl || 'assets/Images/default-product-image.jpg'})`,
    'background-position': backgroundPosition,
    'background-repeat': 'no-repeat',
    'background-size': backgroundSize
  };
}


  
}
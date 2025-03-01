import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Product } from 'src/app/models/product';
import { ProductService } from 'src/app/services/product.service';
import { CartService } from 'src/app/services/cart.service';
import { CartItem } from 'src/app/models/cart-items';
import { ProductStatusService } from 'src/app/services/productstatus.service';


@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {
  productList$: Observable<Product[]>;
  error: string | null = null;
  cartItems: CartItem[] = [];
  maxReachedForProducts: { [productId: string]: boolean } = {};
  buttonTexts: { [productId: string]: string } = {};
  private cartSubscription?: Subscription;
  private cartChangedSubscription?: Subscription;
  private productStatusSubscription?: Subscription;
  isLoading = true;
  loadingImages: { [productId: string]: boolean } = {}; // Track loading status per product
  initialLoad = true;
  // hoveredCardId: string | null = null;
  hoveredContainerId: string | null = null;
  hoverTimeout: any = null;
  leaveTimeout: any = null;
  isMobile: boolean = false;
  // isTablet: boolean = false;
  // _isForceTabletMode: boolean = false;
  // _naturalTabletDetection: boolean = false;
  hoverDelayTime: number = 100;
  
  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService,
    private productStatusService: ProductStatusService,
    private cdr: ChangeDetectorRef
  ) {
    this.productList$ = this.productService.getAllProducts().pipe(
      catchError(error => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again later.';
        return of([]);
      }),
    );

    // this.isMobile = window.innerWidth <= 937;
    // window.addEventListener('touchstart', () => {
    // this.isMobile = window.innerWidth <= 937;
    // this.cdr.detectChanges();
    // });

    // window.addEventListener('touchstart', () => {
    //   const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    //   this.isTablet = isTouchDevice && (window.innerWidth > 937 && window.innerWidth <= 1366);
    //   this.cdr.detectChanges();
    // });
  }

ngOnInit(): void {

const hasVisited = localStorage.getItem('imagesLoaded');
  if (!hasVisited) {
    // Trigger animations
    this.initialLoad = true;
    // Store the flag in localStorage
    localStorage.setItem('imagesLoaded', 'true');
  } else {
    // Skip animations
    this.initialLoad = false;
  }

this.cartSubscription = this.cartService.getCartObservable().subscribe(cart => {
  this.cartItems = cart.CartProducts;
  // If the cart is empty, reset all product statuses
  if (!cart.CartProducts || cart.CartProducts.length === 0) {
    console.log('Cart is empty in getCartObservable, resetting all product statuses');
    this.productStatusService.resetAllProductStatuses();
    this.cdr.detectChanges();
  } else {
    this.updateProductStatuses();
  }
});

// this.cartChangedSubscription = this.cartService.getCartChangedObservable().subscribe(change => {
//   if (change) {
//     if (change.action === 'clear') {
//       this.productStatusService.resetAllProductStatuses();
//     } else if (change.action === 'remove' && change.productId) {
//       this.productStatusService.resetProductStatus(change.productId);
//     }
//   }
// });

// Subscribe to cart actions (clear, remove)
this.cartChangedSubscription = this.cartService.getCartChangedObservable().subscribe(change => {
  console.log('Cart changed event received:', change);
  if (change) {
    if (change.action === 'clear') {
      console.log('Clear cart event detected, resetting all product statuses');
      this.productStatusService.resetAllProductStatuses();
      this.cdr.detectChanges();
    } else if (change.action === 'remove' && change.productId) {
      console.log(`Remove product event detected for: ${change.productId}`);
      this.productStatusService.resetProductStatus(change.productId);
      this.cdr.detectChanges();
    }
  }
});

// Subscribe to limit reached products changes
this.productStatusSubscription = this.productStatusService.getLimitReachedProducts().subscribe(limitReachedProducts => {
  console.log('Limit reached products updated:', Array.from(limitReachedProducts));
  
  // Update local cache
  this.maxReachedForProducts = {};
  limitReachedProducts.forEach(productId => {
    this.maxReachedForProducts[productId] = true;
  });
  
  this.cdr.detectChanges();
});

this.productList$ = this.productService.getAllProducts().pipe(
  catchError(error => {
    console.error('Error loading products:', error);
    this.error = 'Failed to load products. Please try again later.';
    return of([]);
  }),
  tap(productList => this.preloadProductImages(productList)), // Preload images after getting product list
  finalize(() => {
    // Make sure we're getting the latest cart data after loading products
    this.cartService.loadCart();
  })
);

// this.initDeviceDetection();

}

ngOnDestroy(): void {
  if (this.cartSubscription) {
    this.cartSubscription.unsubscribe();
  }
  if (this.cartChangedSubscription) {
    this.cartChangedSubscription.unsubscribe();
  }
  if (this.productStatusSubscription) {
    this.productStatusSubscription.unsubscribe();
  }
  if (this.hoverTimeout) {
    clearTimeout(this.hoverTimeout);
  }
  if (this.leaveTimeout) {
    clearTimeout(this.leaveTimeout);
  }
}

// initDeviceDetection(): void {
// // Initial device detection
// this.detectDeviceType();

// // Add event listeners for device detection
// // window.addEventListener('resize', () => {
// //   this.detectDeviceType();
// //   this.cdr.detectChanges();
// // });

// // window.addEventListener('touchstart', () => {
// //   this.detectDeviceType();
// //   this.cdr.detectChanges();
// // });
// }

// detectDeviceType(): void {
// const width = window.innerWidth;
// const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// this.isMobile = width <= 937;
// this.isTablet = isTouchDevice && (width > 937 && width <= 1366);
// }

// detectDeviceType(): void {
//   const width = window.innerWidth;
//   const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
//   this.isMobile = width <= 937;
//   this.isTablet = isTouchDevice && (width > 937 && width <= 1366);
  
//   console.log(`Device detection - Mobile: ${this.isMobile}, Tablet: ${this.isTablet}`);
// }

// get isTablet(): boolean {
//   return this._isForceTabletMode || this._naturalTabletDetection;
// }

// set isTablet(value: boolean) {
//   this._naturalTabletDetection = value;
// }

// isTouchDevice(): boolean {
//   const hasTouch = (
//     ('ontouchstart' in window) || 
//     (navigator.maxTouchPoints > 0) ||
//     (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
//   );
  
//   console.log(`Touch capability detected: ${hasTouch}, MaxTouchPoints: ${navigator.maxTouchPoints}`);
//   return hasTouch;
// }

// detectDeviceType(): void {
//   const width = window.innerWidth;
  
//   // Check for touch capability
//   const hasTouchScreen = (
//     'ontouchstart' in window || 
//     navigator.maxTouchPoints > 0
//   );
  
//   // Check if device is mobile (width <= 937px)
//   this.isMobile = width <= 937;
  
//   // Define tablet as:
//   // 1. Has touch screen
//   // 2. Width > 937px and Width <= 1366px
//   this.isTablet = hasTouchScreen && (width > 937 && width <= 1366);
  
//   console.log(`Device detection - Width: ${width}, Touch: ${hasTouchScreen}`);
//   console.log(`Result - Mobile: ${this.isMobile}, Tablet: ${this.isTablet}`);
// }

// detectDeviceType(): void {
//   const width = window.innerWidth;
  
//   // Check for touch capability
//   const hasTouchScreen = (
//     'ontouchstart' in window || 
//     navigator.maxTouchPoints > 0
//   );
  
//   // Check if device is mobile
//   this.isMobile = width <= 937;
  
//   // Update the natural tablet detection, but don't override force mode
//   this._naturalTabletDetection = hasTouchScreen && (width > 937 && width <= 1366);
  
//   console.log(`Device detection - Width: ${width}, Touch: ${hasTouchScreen}`);
//   console.log(`Natural tablet detection: ${this._naturalTabletDetection}`);
//   console.log(`Force tablet mode: ${this._isForceTabletMode}`);
//   console.log(`Result - Mobile: ${this.isMobile}, Tablet: ${this.isTablet}`);
// }

// detectDeviceType(): void {
//   const width = window.innerWidth;
  
//   // More reliable touch capability detection
//   const hasTouchScreen = (
//     ('ontouchstart' in window) || 
//     (navigator.maxTouchPoints > 0) ||
//     (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
//   );
  
//   // Check if device is mobile
//   this.isMobile = width <= 937;
  
//   // Only consider it a tablet if BOTH conditions are true:
//   // 1. Has touch screen
//   // 2. Width > 937px and Width <= 1366px
//   this._naturalTabletDetection = hasTouchScreen && (width > 937 && width <= 1366);
  
//   console.log(`Device detection - Width: ${width}`);
//   console.log(`Touch detection: ${hasTouchScreen}`);
//   console.log(`Natural tablet detection: ${this._naturalTabletDetection}`);
//   console.log(`Force tablet mode: ${this._isForceTabletMode}`);
//   console.log(`Result - Mobile: ${this.isMobile}, Tablet: ${this.isTablet}`);
// }

// Updated detectDeviceType method
// Improved detectDeviceType method
// detectDeviceType(): void {
//   const width = window.innerWidth;
//   const height = window.innerHeight;
  
//   // More robust touch detection - emphasizing real touch devices
//   const hasTouchScreen = (
//     // Check for touch events
//     ('ontouchstart' in window) ||
//     // Additional check for significant touch points (most desktops report 0 or 1)
//     (navigator.maxTouchPoints > 2)  
//     // // Media query for coarse pointer (touch) vs fine pointer (mouse)
//     // (window.matchMedia && window.matchMedia('(pointer: fine)').matches)
//   );
  
//   // Check if device is mobile
//   this.isMobile = width <= 937;
  
//   // Only set tablet mode when we're confident it's an actual tablet:
//   // 1. Must have significant touch capabilities
//   // 2. Either width OR height is between 937px and 1366px
//   this._naturalTabletDetection = hasTouchScreen && (
//     (width > 937 && width <= 1366) || 
//     (height > 937 && height <= 1366) ||
//     (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
//   );
  
//   console.log(`Device detection - Width: ${width}, Height: ${height}`);
//   console.log(`Touch capability - Events: ${'ontouchstart' in window}, MaxTouchPoints: ${navigator.maxTouchPoints}, CoarsePointer: ${window.matchMedia && window.matchMedia('(pointer: coarse)').matches}`);
//   console.log(`Touch detection result: ${hasTouchScreen}`);
//   console.log(`Natural tablet detection: ${this._naturalTabletDetection}`);
//   console.log(`Force tablet mode: ${this._isForceTabletMode}`);
//   console.log(`Result - Mobile: ${this.isMobile}, Tablet: ${this.isTablet}`);
// }

// Initialize device detection with proper event listeners
// initDeviceDetection(): void {
//   // Initial detection
//   this.detectDeviceType();
  
//   // Detect on resize for responsive layouts
//   window.addEventListener('resize', () => {
//     this.detectDeviceType();
//     this.cdr.detectChanges();
//   });
  
//   // More reliable touch device detection
//   const touchStartHandler = () => {
//     this.detectDeviceType();
//     this.cdr.detectChanges();
//     // Remove event listener after first touch to avoid repeated calls
//     window.removeEventListener('touchstart', touchStartHandler);
//   };
  
//   window.addEventListener('touchstart', touchStartHandler);
// }

// addToCart(selectedProduct: Product) {
// if (this.productStatusService.isLimitReached(selectedProduct.productId)) {
//   return;
// }

// this.cartService.addToCart(selectedProduct).subscribe(
//   () => {
//     console.log('Product added to cart:', selectedProduct);
//     this.updateProductStatuses();
//     const updatedQuantity = this.cartItems.find(item => item.productId === selectedProduct.productId)?.quantity || 0;
//     this.productStatusService.setTemporaryQuantity(selectedProduct.productId, updatedQuantity);
//   },
//   error => console.error('Error adding product to cart:', error)
// );
// }

addToCart(selectedProduct: Product) {
  if (this.productStatusService.isLimitReached(selectedProduct.productId)) {
    return;
  }

  this.cartService.addToCart(selectedProduct).subscribe(
    (updatedCart) => {
      console.log('Product added to cart:', selectedProduct);
      
      // Find the item in the updated cart to get its quantity
      const cartItem = updatedCart.CartProducts?.find(
        item => item.Product?.productId === selectedProduct.productId
      );
      
      if (cartItem) {
        console.log(`Setting quantity for ${selectedProduct.productId} to ${cartItem.quantity}`);
        this.productStatusService.setTemporaryQuantity(selectedProduct.productId, cartItem.quantity);
        
        // Update limit reached status if needed
        if (cartItem.quantity >= 10) {
          this.productStatusService.setLimitReached(selectedProduct.productId, true);
        }
      }
      
      this.cdr.detectChanges();
    },
    error => console.error('Error adding product to cart:', error)
  );
}

// addToCart(selectedProduct: Product) {
//   // Store tablet state before operation
//   const wasTablet = this.isTablet;
  
//   if (this.productStatusService.isLimitReached(selectedProduct.productId)) {
//     return;
//   }

//   this.cartService.addToCart(selectedProduct).subscribe(
//     () => {
//       console.log('Product added to cart:', selectedProduct);
//       this.updateProductStatuses();
//       const updatedQuantity = this.cartItems.find(item => item.productId === selectedProduct.productId)?.quantity || 0;
//       this.productStatusService.setTemporaryQuantity(selectedProduct.productId, updatedQuantity);
      
//       // Ensure tablet state is maintained
//       if (wasTablet && !this.isTablet) {
//         console.log('Restoring tablet state after cart operation');
//         this._naturalTabletDetection = wasTablet;
//         this.cdr.detectChanges();
//       }
//     },
//     error => console.error('Error adding product to cart:', error)
//   );
// }

// updateProductStatuses() {
// this.cartItems.forEach(item => {
//   this.productStatusService.setLimitReached(item.productId, item.quantity >= 10);
// });
// }

updateProductStatuses() {
  console.log('Updating product statuses based on cart items', this.cartItems);
  
  // First check if cart is empty, and if so, reset all product statuses
  if (!this.cartItems || this.cartItems.length === 0) {
    console.log('Cart is empty, resetting all product statuses');
    this.productStatusService.resetAllProductStatuses();
    return;
  }
  
  // Otherwise update based on current cart items
  this.cartItems.forEach(item => {
    if (item.Product && item.Product.productId) {
      console.log(`Setting quantity for ${item.Product.productId} to ${item.quantity}`);
      this.productStatusService.setProductQuantity(item.Product.productId, item.quantity);
    }
  });
  
  this.cdr.detectChanges();
}

preloadProductImages(products: Product[]): void {
  const imagePromises = products.map(product => this.preloadImage(product.productUrl, product.productId));
  
  // Check all promises
  Promise.all(imagePromises).then(() => {
    if(this.initialLoad) {
    this.isLoading = false;
    }
    else{
      setTimeout(() => {
        this.isLoading = false; 
      }, 400)
    }
  }).catch(error => {
    console.error('Error preloading images:', error);
    this.isLoading = false; // Consider loading complete even if some images fail
  });
}

preloadImage(imgUrl: string, productId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      this.loadingImages[productId] = true;
      resolve();
    };
    img.onerror = () => {
      console.error(`Error loading image for product ${productId}`);
      this.loadingImages[productId] = true;
      resolve(); // Resolve on error to avoid blocking
    };
    img.src = imgUrl;
  });
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

// // Called when mouse enters specifically a card's button container
// onButtonContainerHover(productId: string): void {
//   // if(this.isMobile) return;

//   // Clear any existing timeout to prevent race conditions

//     if (this.hoverTimeout) {
//       clearTimeout(this.hoverTimeout);
//       this.hoverTimeout = null;
//     }
//     if (this.leaveTimeout) {
//       clearTimeout(this.leaveTimeout);
//       this.leaveTimeout = null;
//     }
//   // setTimeout(() => {
//     this.hoveredContainerId = productId;
//   // }, 300)
  
// }

// // Called when mouse leaves specifically a card's button container
// onButtonContainerLeave(): void {
//   // if(this.isMobile) return;

//   // Use a small timeout to ensure mouse has truly left
//   this.leaveTimeout = setTimeout(() => {
//     this.hoveredContainerId = null;
//   }, 100); // Small delay to prevent flickering
// }

onButtonContainerHover(productId: string): void {
  if(this.isMobile) return;

  // Clear any existing timeouts to prevent race conditions
  if (this.hoverTimeout) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = null;
  }
  if (this.leaveTimeout) {
    clearTimeout(this.leaveTimeout);
    this.leaveTimeout = null;
  }
  
  // Set new timeout for the hover effect
  this.hoverTimeout = setTimeout(() => {
    this.hoveredContainerId = productId;
    this.cdr.detectChanges(); // Ensure UI updates
  }, this.hoverDelayTime);
}

// Called when mouse leaves specifically a card's button container
onButtonContainerLeave(): void {
  if(this.isMobile) return;

  // Clear hover timeout if it exists
  if (this.hoverTimeout) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = null;
  }

  // Use a small timeout to ensure mouse has truly left
  this.leaveTimeout = setTimeout(() => {
    this.hoveredContainerId = null;
    this.cdr.detectChanges(); // Ensure UI updates
  }, 100); // Small delay to prevent flickering
}

// Method to determine if a card should be dimmed
shouldDimCard(productId: string): boolean {
  // if (this.isTablet) return false;

  return this.hoveredContainerId !== null && this.hoveredContainerId !== productId;
}

isCardActive(productId: string): boolean {
  // if (this.isTablet) return false;

  return this.hoveredContainerId === productId;
}

// forceTabletMode(): void {
//   this.isTablet = true;
//   console.log("Manually forced tablet mode ON");
//   this.cdr.detectChanges();
// }

// forceTabletMode(force: boolean = true): void {
//   this._isForceTabletMode = force;
//   console.log(`Tablet mode ${force ? 'FORCED ON' : 'FORCED OFF'}`);
//   this.cdr.detectChanges();
// }

}


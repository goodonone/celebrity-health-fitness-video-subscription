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
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from 'src/app/models/product';
import { ProductService } from 'src/app/services/product.service';
import { CartService } from 'src/app/services/cart.service';
import { CartItem } from 'src/app/models/cart-items';

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
  
  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService
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
    this.cartService.getCartObservable().subscribe(cart => {
      this.cartItems = cart.CartProducts;
      this.updateAllButtonTexts();
      // this.cartItems.forEach(item => {
      //   if (item.quantity >= 10) {
      //     this.maxReachedForProducts[item.productId] = true;
      //   }
      //   this.buttonTexts[item.productId] = this.getButtonText(item.productId);
      // });
    });
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

  addToCart(selectedProduct: Product) {
    const cartItem = this.cartItems.find(item => item.productId === selectedProduct.productId);
    if (cartItem && cartItem.quantity >= 10) {
      return; // Max quantity reached, don't add to cart
    }

    this.cartService.addToCart(selectedProduct).subscribe(
      () => {
        console.log('Product added to cart:', selectedProduct);
        this.cartService.getCartObservable().subscribe(cart => {
          this.cartItems = cart.CartProducts;
          this.updateAllButtonTexts();
          this.showQuantityTemporarily(selectedProduct.productId);
        });
      },
      error => console.error('Error adding product to cart:', error)
    );
  }

  updateAllButtonTexts() {
    this.cartItems.forEach(item => {
      if (item.quantity >= 10) {
        this.maxReachedForProducts[item.productId] = true;
        this.buttonTexts[item.productId] = 'Limit Reached';
      } else {
        this.maxReachedForProducts[item.productId] = false;
        this.buttonTexts[item.productId] = '+Cart';
      }
    });
  }

  showQuantityTemporarily(productId: string) {
    const cartItem = this.cartItems.find(item => item.productId === productId);
    if (cartItem && !this.maxReachedForProducts[productId]) {
      const originalText = this.buttonTexts[productId];
      this.buttonTexts[productId] = `+${cartItem.quantity}`;
      setTimeout(() => {
        if (!this.maxReachedForProducts[productId]) {
          this.buttonTexts[productId] = originalText;
        }
      }, 200);
    }
  }

  getButtonText(product: Product): string {
    return this.buttonTexts[product.productId] || '+Cart';
  }


}


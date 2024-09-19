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

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  productList$: Observable<Product[]>;
  error: string | null = null;
  
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
    console.log('StoreComponent initialized');
  }

  addToCart(selectedProduct: Product) {
    this.cartService.addToCart(selectedProduct).subscribe(
      () => console.log('Product added to cart:', selectedProduct),
      error => console.error('Error adding product to cart:', error)
    );
  }


}
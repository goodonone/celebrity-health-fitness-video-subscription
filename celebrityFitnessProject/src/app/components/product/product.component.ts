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
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  currentProduct$: Observable<Product | null> = of(null);
  errorMessage: string = '';

  constructor(
    private actRoute: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
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
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product).subscribe(
      () => console.log('Product added to cart:', product),
      error => console.error('Error adding product to cart:', error)
    );
  }

  getProductImageUrl(product: Product | null): string {
    return product?.productUrl ?? "";
  }
}
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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from 'src/app/models/product';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  currentProduct: Product = new Product();

  constructor(
    private actRoute: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('ProductComponent initialized');
    const productId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.productService.getProductById(productId).subscribe(
      product => {
        if (product) {
          this.currentProduct = product;
        } else {
          this.router.navigate(['/store']); 
        }
      },
      error => {
        this.router.navigate(['/store']); 
      }
    );
  }

  addToCart(selectedProduct: Product) {
    this.cartService.addToCart(this.currentProduct);
    console.log('Product added to cart:', this.currentProduct);
  }

  getProductImageUrl(): string {
    return this.currentProduct.productUrl ?? "";
  }
}
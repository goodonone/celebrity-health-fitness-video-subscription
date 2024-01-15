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
export class ProductComponent implements OnInit{
  currentProduct: Product = new Product;
  constructor(private actRoute: ActivatedRoute, private productService: ProductService, private cartService: CartService, private router: Router) {
  }
  ngOnInit() {
    const productId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.productService.getProductById(productId).subscribe(product => {
      if(product) {
      this.currentProduct = product;
      }
    });
  }
  addToCart(selectedProduct: Product) {
    this.cartService.addToCart(this.currentProduct)
  }

  
}

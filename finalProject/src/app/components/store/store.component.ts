import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from 'src/app/models/product';
import { ProductService } from 'src/app/services/product.service';
import { CartService } from 'src/app/services/cart.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  productList: Product[] = [ ];
  


  constructor(private productService: ProductService, private router: Router, private cartService: CartService ) {}

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe(foundProducts => {
      console.log(foundProducts);
      this.productList = foundProducts;
    })
    
  }

  addToCart(selectedProduct: Product){
    this.cartService.addToCart(selectedProduct)
  }


}

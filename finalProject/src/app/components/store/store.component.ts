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
  productList: Product[] = [
    {
    productName: "Dumb Bell",
    productPrice: 10 ,
    productDescription: "Heavy",
    productUrl: "https://assets.gqindia.com/photos/5e39141c3e854900087734af/16:9/w_1920,c_limit/The%20only%20dumbbell%20exercises%20you'll%20ever%20need.jpg",
    },
    {
      productName: "Dumb Bell 2",
      productPrice: 10 ,
      productDescription: "Heavy",
      productUrl: "https://assets.gqindia.com/photos/5e39141c3e854900087734af/16:9/w_1920,c_limit/The%20only%20dumbbell%20exercises%20you'll%20ever%20need.jpg",
      },
      {
        productName: "Dumb Bell 3",
        productPrice: 10 ,
        productDescription: "Heavy",
        productUrl: "https://assets.gqindia.com/photos/5e39141c3e854900087734af/16:9/w_1920,c_limit/The%20only%20dumbbell%20exercises%20you'll%20ever%20need.jpg",
        },
  ];


  constructor(private productService: ProductService, private router: Router, private cartService: CartService ) {}

  ngOnInit(): void {
    // this.productService.getAllProducts().subscribe(foundProducts => {
    //   console.log(foundProducts);
    //   this.productList = foundProducts;
    // })
    this.productList;
  }

  // addToCart(){
  //   this.cartService.addToCart(this.product)
  // }


}

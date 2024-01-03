import { Product } from "./product";

export class CartItems {
    constructor(public product:Product) {}
    quantity: number = 1 ;
    price?: number = this.product.productPrice;
}

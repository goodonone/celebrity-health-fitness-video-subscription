// import { Product } from "./product";

// export class CartItems {
//     constructor(public product:Product) {}
//     quantity: number = 1 ;
//     price?: number = this.product.productPrice;
// }

import { Product } from "./product";

export class CartItems {
    cartProductId: string;
    cartId: string;
    product: Product;
    quantity: number;
    price?: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(product: Product) {
        this.cartProductId = ''; // This will be set by the backend
        this.cartId = ''; // This will be set by the backend
        this.product = product;
        this.quantity = 1;
        this.price = product.productPrice;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
// import { CartItems } from "./cart-items";

// export class Cart {
//     items: CartItems[] = [];
//     totalPrice?: number = 0;
//     totalCount: number = 0;
//     userId?: number;

// }

// import { Product } from "./product";

// export class Cart {
//     cartId!: string;
//     userId!: string;
//     items: CartItems[];
//     createdAt!: Date;
//     updatedAt!: Date;
  
//     constructor() {
//       this.items = [];
//     }
//   }
  
//   export class CartItems {
//     cartProductId!: string;
//     cartId!: string;
//     product!: Product;
//     quantity!: number;
//     createdAt!: Date;
//     updatedAt!: Date;
//   }


import { CartItems } from './cart-items';

export class Cart {
  cartId: string;
  userId: string;
  items: CartItems[];
  createdAt: Date;
  updatedAt: Date;

  constructor() {
    this.cartId = '';
    this.userId = '';
    this.items = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  get totalPrice(): number {
    return this.items.reduce((total, item) => total + (item.quantity * item.product.productPrice!), 0);
  }

  get totalCount(): number {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }
}
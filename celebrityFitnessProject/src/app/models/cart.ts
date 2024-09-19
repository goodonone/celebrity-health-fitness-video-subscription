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


// import { CartItems } from './cart-items';

// export class Cart {
//   cartId: string;
//   userId: string;
//   items: CartItems[];
//   createdAt: Date;
//   updatedAt: Date;

//   constructor() {
//     this.cartId = '';
//     this.userId = '';
//     this.items = [];
//     this.createdAt = new Date();
//     this.updatedAt = new Date();
//   }

//   get totalPrice(): number {
//     return this.items.reduce((total, item) => total + (item.quantity * item.product.productPrice!), 0);
//   }

//   get totalCount(): number {
//     return this.items.reduce((count, item) => count + item.quantity, 0);
//   }
// }

// import { CartItems } from './cart-items';

// export class Cart {
//   cartId: string = '';
//   userId: string = '';
//   items: CartItems[] = [];
//   createdAt: Date = new Date();
//   updatedAt: Date = new Date();

//   get totalPrice(): number {
//     return this.items.reduce((total, item) => total + (item.quantity * item.product.productPrice), 0);
//   }

//   get totalCount(): number {
//     return this.items.reduce((count, item) => count + item.quantity, 0);
//   }
// }

// export interface CartItems {
//   product: {
//     productId: string;
//     productName: string;
//     productPrice: number;
//     productUrl: string;
//   };
//   quantity: number;
// }

// import { CartItems } from './cart-items';

// export class Cart {
//   cartId: string = '';
//   userId: string = '';
//   createdAt: Date = new Date();
//   updatedAt: Date = new Date();
//   CartProducts: CartItems[] = [];

//   // These properties will be populated from the backend response
//   totalCount: number = 0;
//   totalPrice: number = 0;

//   // Getter for items to maintain compatibility with existing code
//   get items(): CartItems[] {
//     return this.CartProducts;
//   }

//   // Calculated properties (can be used for client-side recalculation if needed)
//   get calculatedTotalCount(): number {
//     return this.CartProducts.reduce((sum, item) => sum + item.quantity, 0);
//   }

//   get calculatedTotalPrice(): number {
//     return this.CartProducts.reduce((sum, item) => sum + (item.quantity * item.product.productPrice), 0);
//   }
// }

// export class Cart {
//     cartId: string = '';
//     userId: string = '';
//     createdAt: Date = new Date();
//     updatedAt: Date = new Date();
//     CartProducts: CartItems[] = [];
//     totalCount: number = 0;
//     totalPrice: number = 0;
  
//     // You can keep these getter methods if you want to calculate these values client-side
//     get calculatedTotalCount(): number {
//       return this.CartProducts.reduce((sum, item) => sum + item.quantity, 0);
//     }
  
//     get calculatedTotalPrice(): number {
//       return this.CartProducts.reduce((sum, item) => sum + (item.quantity * item.Product.productPrice), 0);
//     }
//   }
  
//   export interface CartItems {
//     cartProductId: string;
//     cartId: string;
//     productId: string;
//     quantity: number;
//     createdAt: Date;
//     updatedAt: Date;
//     Product: Product;
//   }
  
//   export interface Product {
//     [x: string]: string;
//     productId: string;
//     productName: string;
//     productPrice: number;
//     productDescription: string;
//     productUrl: string;
//     createdAt: Date;
//     updatedAt: Date;
//   }

// cart.model.ts
// import { CartItem } from "./cart-items";

// export class Cart {
//     cartId: string = '';
//     userId: string = '';
//     createdAt: Date = new Date();
//     updatedAt: Date = new Date();
//     CartProducts: CartItem[] = [];
//     totalCount: number = 0;
//     totalPrice: number = 0;
  
//     get calculatedTotalCount(): number {
//       return this.CartProducts.reduce((sum, item) => sum + item.quantity, 0);
//     }
  
//     get calculatedTotalPrice(): number {
//       return this.CartProducts.reduce((sum, item) => sum + (item.quantity * item.Product.productPrice), 0);
//     }
// }

// // cart-item.model.ts
// import { Product } from "./product";

// // export interface CartItem {
// //     cartProductId: string;
// //     cartId: string;
// //     productId: string;
// //     quantity: number;
// //     createdAt: Date;
// //     updatedAt: Date;
// //     Product: Product;
// // }

// // // product.model.ts
// // export interface Product {
// //     [key: string]: string | number | Date;
// //     productId: string;
// //     productName: string;
// //     productPrice: number;
// //     productDescription: string;
// //     productUrl: string;
// //     createdAt: Date;
// //     updatedAt: Date;
// // }

// import { CartItem } from './cart-item.model';

// export class Cart {
//     cartId: string = '';
//     userId: string = '';
//     createdAt: Date = new Date();
//     updatedAt: Date = new Date();
//     CartProducts: CartItem[] = [];
//     totalCount: number = 0;
//     totalPrice: number = 0;
  
//     get items(): CartItem[] {
//         return this.CartProducts;
//     }

//     get calculatedTotalCount(): number {
//       return this.CartProducts.reduce((sum, item) => sum + item.quantity, 0);
//     }
  
//     get calculatedTotalPrice(): number {
//       return this.CartProducts.reduce((sum, item) => sum + (item.quantity * item.Product.productPrice), 0);
//     }
// }

import { CartItem } from './cart-items'

export class Cart {
    cartId: string = '';
    userId: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    CartProducts: CartItem[] = [];
    totalCount: number = 0;
    totalPrice: number = 0;

    
  
    get items(): CartItem[] {
        return this.CartProducts;
    }

    get calculatedTotalCount(): number {
      return this.CartProducts.reduce((sum, item) => sum + item.quantity, 0);
    }
  
    get calculatedTotalPrice(): number {
      return this.CartProducts.reduce((sum, item) => sum + (item.quantity * item.Product.productPrice), 0);
    }
}
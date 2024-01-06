import { CartItems } from "./cart-items";

export class Cart {
    items: CartItems[] = [];
    totalPrice?: number = 0;
    totalCount: number = 0;
    userId?: number;

}


export class Product {
    productId?: number;
    paymentId?: number;
    productName?: string;
    productPrice?: number;
    productDescription?: string;
    productUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(
        productId?: number,
        paymentId?: number,
        productName?: string,
        productPrice?: number,
        productDescription?: string,
        productUrl?: string,
        createdAt?: Date,
        updatedAt?: Date,

    ) 
    {
        this.productId = productId;
        this.paymentId = paymentId;
        this.productName = productName;
        this.productPrice = productPrice;
        this.productDescription = productDescription;
        this.productUrl = productUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    };
}

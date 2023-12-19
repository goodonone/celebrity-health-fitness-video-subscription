export class Product {
    productId?: number;
    paymentId?: number;
    name?: string;
    description?: string;
    imgUrl?: string;
    price?: number;

    constructor(
        productId?: number,
        paymentId?: number,
        name?: string,
        description?: string,
        imgUrl?: string,
        price?: number,

    ) 
    {
        this.productId = productId;
        this.paymentId = paymentId;
        this.name = name;
        this.description = description;
        this.imgUrl = imgUrl;
        this.price = price;
    };
}

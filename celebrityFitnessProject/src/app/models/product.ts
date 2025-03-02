// export class Product {
//     productId!: string;
//     paymentId!: string;
//     productName!: string;
//     productPrice!: number;
//     productDescription!: string;
//     productUrl!: string;
//     createdAt!: Date;
//     updatedAt!: Date;

//     constructor(
//         productId: string,
//         paymentId: string,
//         productName: string,
//         productPrice: number,
//         productDescription: string,
//         productUrl: string,
//         createdAt: Date,
//         updatedAt: Date,
//     ) 
//     {
//         this.productId = productId;
//         this.paymentId = paymentId;
//         this.productName = productName;
//         this.productPrice = productPrice;
//         this.productDescription = productDescription;
//         this.productUrl = productUrl;
//         this.createdAt = createdAt;
//         this.updatedAt = updatedAt;
//     };
// }

export interface ImageStyle {
    position?: string;
    size?: string;
    repeat?: string;
    blend?: string;
    opacity?: number;
  }

export interface Product {
    [key: string]: string | number | Date | ImageStyle;
    productId: string;
    productName: string;
    productPrice: number;
    productDescription: string;
    productUrl: string;
    createdAt: Date;
    updatedAt: Date;
    imageStyle: ImageStyle;
}


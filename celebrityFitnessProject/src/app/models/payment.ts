export class Payment {
    paymentId?: string;
    userId?: string;
    tier?: string;
    price?: number;
    paymentFrequency?: string;
    billingAddress?: string;
    billingZip?: string;
    shippingAddress?: string;
    shippingZip?: string;
    createdAt?: Date;
    purchaseType?: string;
    updatedAt?: Date;


constructor(
        paymentId?: string,
        userId?: string,
        tier?: string,
        price?: number,
        paymentFrequency?: string,
        billingAddress?: string,
        billingZip?: string,
        shippingAddress?: string,
        shippingZip?: string,
        createdAt?: Date,
        purchaseType?: string,
        updatedAt?: Date,
)
    {
        this.paymentId = paymentId;
        this.userId = userId;
        this.tier = tier;
        this.price = price;
        this.paymentFrequency = paymentFrequency;
        this.createdAt = createdAt;
        this.purchaseType =  purchaseType,
        this.billingAddress = billingAddress,
        this.billingZip = billingZip,
        this.shippingAddress = shippingAddress,
        this.shippingZip = shippingZip
        this.updatedAt = updatedAt;
    }
}
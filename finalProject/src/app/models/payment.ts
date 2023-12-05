export class Payment {
    paymentId?: number;
    userId?: number;
    tier?: string;
    membershipDate?: Date;
    updatedAt?: Date;


constructor(
        paymentId?: number,
        userId?: number,
        tier?: string,
        membershipDate?: Date,
        updatedAt?: Date,
)
    {
        this.paymentId = paymentId;
        this.userId = userId;
        this.tier = tier;
        this.membershipDate = membershipDate;
        this.updatedAt = updatedAt;

    }
}
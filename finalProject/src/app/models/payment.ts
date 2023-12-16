export class Payment {
    paymentId?: number;
    userId?: number;
    tier?: string;
    paymentStatus?: string;
    membershipStatus?: string;
    paymentFrequency?: string;
    membershipDate?: Date;
    updatedAt?: Date;


constructor(
        paymentId?: number,
        userId?: number,
        tier?: string,
        paymentStatus?: string,
        membershipStatus?: string,
        paymentFrequency?: string,
        membershipDate?: Date,
        updatedAt?: Date,
)
    {
        this.paymentId = paymentId;
        this.userId = userId;
        this.tier = tier;
        this.paymentStatus = paymentStatus;
        this.membershipStatus = membershipStatus;
        this.paymentFrequency = paymentFrequency;
        this.membershipDate = membershipDate;
        this.updatedAt = updatedAt;

    }
}
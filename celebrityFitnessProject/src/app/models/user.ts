export class User {
    userId?: string;
    email?: string;
    password?: string;
    name?: string;
    weight?: string;
    height?: string;
    gender?: string;
    goals?: string; 
    tier?: string;
    paymentFrequency?: string;
    price?: number;
    dateOfBirth?: Date;
    imgUrl?: string | null;
    isGoogleAuth?: boolean;
    profilePictureSettings?: {
        zoom: number;
        x: number;
        y: number;
    } | null;
    createdAt?: Date;
    updatedAt?: Date;


constructor(
        userId?: string, 
        email?: string, 
        password?: string, 
        name?: string, 
        weight?: string, 
        height?: string, 
        gender?: string, 
        goals?: string, 
        tier?: string, 
        paymentFrequency?: string,
        price?: number,
        dateOfBirth?: Date,
        imgUrl?: string,
        isGoogleAuth?: boolean,
        profilePictureSettings?: {
            zoom: number;
            x: number;
            y: number;
        } | null,
        createdAt?: Date,
        updatedAt?: Date,
        )
    {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.name = name;
        this.weight = weight;
        this.height = height;
        this.gender = gender;
        this.goals = goals;
        this.tier = tier;
        this.paymentFrequency = paymentFrequency;
        this.price = price;
        this.dateOfBirth = dateOfBirth;
        this.imgUrl = imgUrl;
        this.isGoogleAuth = isGoogleAuth;
        this.profilePictureSettings = profilePictureSettings;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
}


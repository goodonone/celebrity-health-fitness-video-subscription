export class User {
    userId?: number;
    email?: string;
    password?: string;
    name?: string;
    weight?: string;
    height?: string;
    gender?: string;
    goals?: string; 
    tier?: string;
    dateOfBirth?: Date;


constructor(
        userId?: number, 
        email?: string, 
        password?: string, 
        name?: string, 
        weight?: string, 
        height?: string, 
        gender?: string, 
        goals?: string, 
        tier?: string, 
        dateOfBirth?: Date,
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
        this.dateOfBirth = dateOfBirth;
    }
    
}


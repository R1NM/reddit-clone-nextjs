import { NextFunction, Request, Response } from "express";
import User from "../entity/User";

export default async (_: Request,res:Response, next:NextFunction) => {
    try {
        //Authenticate User
        const user: User | undefined = res.locals.user;
        
        if(!user) throw new Error("Unauthenticated")
        
        return next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({error: "Authentication Failed"})
        
    }

}
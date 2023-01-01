import { NextFunction, Request, Response } from "express";
import  jwt from "jsonwebtoken";
import User from "../entity/User";

export default async (req: Request,res:Response, next:NextFunction) => {
    try {
        //Verify User
        const token = req.cookies.token;
        // console.log('token:',token);

        if(!token) return next()
        
        const {username}: any = jwt.verify(token,process.env.JWT_SECRET)
        // console.log('username:',username);
        
        const user = await User.findOneBy({username});
        // console.log('user:',user);
        
        //save user info to res.lacals.users
        res.locals.user = user;
        // console.log('res.locals.user',res.locals.user);
        
        return next();

    } catch (error) {
        console.error(error);
        return res.status(400).json({error: "User Verification Failed"})
        
    }

}
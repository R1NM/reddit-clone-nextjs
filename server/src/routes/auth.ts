import { isEmpty, validate } from "class-validator";
import { Request, Response, Router } from "express";
import User from "../entity/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from  "cookie";
import userMiddleware from '../middleware/user';
import authMiddleware from '../middleware/auth';

const mapError = (errors: Object[])=>{
    return errors.reduce((prev:any,err:any)=>{
        prev[err.property] = Object.entries(err.constraints)[0][1]
        return prev
    },{})
}

//API
const register = async (req: Request,res:Response)=>{
    const {email,username,password} = req.body;
    
    try {
        let errors: any = {}

        //check if email or username is already used
        const emailUser= await User.findOneBy({email});
        const usernameUser = await User.findOneBy({username});

        //emit error
        if(emailUser) errors.email ="This email address already exists"
        if(usernameUser) errors.username ="This user name already exists"

        //send error
        if(Object.keys(errors).length >0){
            return res.status(400).json(errors)
        }

        //new User
        const user = new User();
        user.email=email;
        user.username=username;
        user.password=password;

        //validator
        errors = await validate(user);

        if(errors.length>0) return res.status(400).json(mapError(errors))

        //save new User to DB
        await user.save()
        
        //send user info to front
        return res.json(user)
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({error})
        
    }
    
}

const login = async (req: Request,res:Response) => {
    const {username,password} = req.body;
    try {
        let errors: any ={};
        
        //isempty
        if(isEmpty(username)) errors.username = "User name must be entered"
        if(isEmpty(password)) errors.password = "Password must be entered"
    
        //send error
        if(Object.keys(errors).length >0){
            return res.status(400).json(errors)
        }
    
        //find user
        const user = await User.findOneBy({username});
    
        //wrong user
        if(!user) return res.status(404).json({username: "Wrong user name"})
    
        //compare password
        const passwordMatches = await bcrypt.compare(password,user.password);
    
        //wrong password
        if(!passwordMatches) return res.status(401).json({password: "Wrong password"})
        
        //issue token
        const token = jwt.sign({username},process.env.JWT_SECRET)
    
        //save cookie
        res.set("Set-Cookie",cookie.serialize("token",token,{
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/"
        }))

        return res.json({user,token})
    } catch (error) {
        console.error(error);
        return res.status(500).json(error)
        
    }
    
}

const me = async (_: Request,res:Response) => {
    return res.json(res.locals.user)
}

//Route
const router=Router()
router.post('/register',register)
router.post('/login',login)
router.get('/me',userMiddleware,authMiddleware,me)


export default router;
import { isEmpty, validate } from "class-validator";
import { Request, Response, Router } from "express";
import userMiddleware from '../middleware/user';
import authMiddleware from '../middleware/auth';
import Sub from "../entity/Sub";
import { AppDataSource } from "../data-source"
import User from "../entity/User";
import Post from "../entity/Post";


//API
const createSub=async (req: Request,res:Response, next) => {
    const {name,title,description} = req.body

    try {
        let errors: any={}
        if(isEmpty(name)) errors.name = "Sub Name is required"
        if(isEmpty(title)) errors.title = "Title is required"

        //check if name or title is already used
        const sub = await AppDataSource.getRepository(Sub)
            .createQueryBuilder("sub")
            .where("lower(sub.name) = :name",{name: name.toLowerCase()})
            .getOne()
        
        if(sub) errors.name = "The sub already exists"

        //emit error
        if(Object.keys(errors).length >0){
            throw errors;
        }



    } catch (error) {
        console.error(error);
        return res.status(500).json("Somthing went wrong")
    }

    try {
        //get user info
        const user: User = res.locals.user;
        
        //new Sub
        const sub = new Sub();
        sub.name = name;
        sub.title = title;
        sub.description=description;
        sub.user = user;

        //save new Sub to DB
        await sub.save()

        //send sub info to front
        return res.json(sub);

    } catch (error) {
        console.error(error);
        return res.status(500).json("Somthing went wrong")
        
    }
}

const topSubs =async (_: Request, res: Response) => {
    try {
        const imageUrlExp= `COALESCE('${process.env.APP_URL}/images/'||s."imageUrn",
        'https://www.gravatar.com/avatar?d=mp&f=y'
        )`;

        const subs = await AppDataSource
        .createQueryBuilder()
        .select(`s.title, s.name, ${imageUrlExp} as "imageUrl", count(p.id) as "postCount"`)
        .from(Sub,"s")
        .leftJoin(Post,"p",`s.name= p."subName"`)
        .groupBy('s.title, s.name, "imageUrl"')
        .orderBy(`"postCount"`,"DESC")
        .limit(5)
        .execute();

        return res.json(subs);

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"})
        
    }
}

//Route
const router=Router()
router.post('/',userMiddleware,authMiddleware,createSub)
router.get("/sub/topSubs",topSubs)

export default router;

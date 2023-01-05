import { isEmpty, validate } from "class-validator";
import { NextFunction, Request, Response, Router } from "express";
import userMiddleware from '../middleware/user';
import authMiddleware from '../middleware/auth';
import Sub from "../entity/Sub";
import { AppDataSource } from "../data-source"
import User from "../entity/User";
import Post from "../entity/Post";
import multer, { FileFilterCallback } from "multer";
import { makeId } from "../utils/helpers";
import path from "path";
import { unlinkSync } from "fs";



//API
const createSub=async (req: Request,res:Response) => {
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

const getSub = async (req: Request, res:Response) => {
    const name = req.params.name;
    
    
    try {
        const sub = await Sub.findOneByOrFail({name});
        return res.json(sub);
    } catch (error) {
        return res.status(404).json({error:"Sub not found"})
    }
}

const ownSub =async (req: Request, res:Response, next: NextFunction) => {
    const user : User = res.locals.user;
    try {
        const sub = await Sub.findOneOrFail({where: {name:req.params.name}})

        if(sub.username !== user.username){
            return res.status(403).json({error: "Not sub owner"})
        }

        res.locals.sub = sub;
        return next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"})
    }
}

const upload = multer({
    storage: multer.diskStorage({
        destination: "public/images",
        filename: (_,file,callback) =>{
            const name = makeId(10);
            callback(null,name+path.extname(file.originalname));
        },
    }),
    fileFilter: (_,file: any, callback: FileFilterCallback) =>{
        if(file.mimetype == "image/jpeg" || file.mimetype=="image/png"){
            callback(null,true);
        } else{
            callback(new Error("Not an image"))
        }
    }
})

const uploadSubImage =async (req: Request, res:Response) => {
    const sub : Sub = res.locals.sub;
    try {
        const type = req.body.type;

        //delete file when type is not defined
        if(type !=="image" && type !=="banner"){
            if(!req.file?.path){
                return res.status(400).json({error:"Unvalid file"})
            }
            unlinkSync(req.file.path);
            return res.status(400).json({error: "Wrong upload type"})
        }

        //If there's aleady an image, then delete old image and change urn on sub
        let oldImageUrn : string = "";
        if(type==="image"){
            oldImageUrn = sub.imageUrn || ""
            sub.imageUrn = req.file?.filename || "";
        } else if(type==="banner"){
            oldImageUrn = sub.bannerUrn || ""
            sub.bannerUrn = req.file?.filename || "";
        }

        //save Sub
        await sub.save();

        //delete old image
        if(oldImageUrn !==""){
            const fullFileName = path.resolve(
                process.cwd(), "public", "images", oldImageUrn
            );
            unlinkSync(fullFileName)
        }
        
        return res.json(sub);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"})
    }
}

//Route
const router=Router()
router.post('/',userMiddleware,authMiddleware,createSub)
router.get("/sub/topSubs",topSubs)
router.get("/:name",userMiddleware, getSub)
router.post("/:name/upload",userMiddleware,authMiddleware,ownSub,upload.single("file"),uploadSubImage)
export default router;

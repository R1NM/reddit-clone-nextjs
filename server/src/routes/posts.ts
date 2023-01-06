import { NextFunction, Request, Response, Router } from "express";
import userMiddleware from '../middleware/user';
import authMiddleware from '../middleware/auth';
import Sub from "../entity/Sub";
import Post from "../entity/Post";

//API
const createPost = async (req: Request, res: Response) => {
    const {title, body, sub} = req.body;

    //if title is empty
    if(title.trim()===""){
        return res.status(400).json({title: "Title cannot be empty"})
    }

    const user = res.locals.user;

    try {
        const subRecord = await Sub.findOneByOrFail({name: sub});

        const post = new Post();
        post.title=title;
        post.body=body;
        post.user=user;
        post.sub=subRecord;

        await post.save();

        return res.json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"})
    }
}

//Route
const router = Router()
router.post("/",userMiddleware,authMiddleware,createPost)

export default router;
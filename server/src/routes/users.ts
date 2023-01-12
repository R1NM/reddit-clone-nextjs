import { NextFunction, Request, Response, Router } from "express";
import userMiddleware from '../middleware/user';
import authMiddleware from '../middleware/auth';
import User from "../entity/User";
import Post from "../entity/Post";
import Comment from "../entity/Comment";

//API
const getUserData =async (req: Request, res: Response) => {
    try {
        //get user info
        const user = await User.findOneOrFail({
            where:{username: req.params.username},
            select:["username","createdAt"],
        })

        //post that user posted
        const posts = await Post.find({
            where: {username: user.username},
            relations:["comments","votes","sub"],
        })

        //comment that user made
        const comments = await Comment.find({
            where:{username:user.username},
            relations:["post"]
        });

        //set user vote
        if(res.locals.user){
            const {user} = res.locals;
            posts.forEach((p)=>p.setUserVote(user));
            comments.forEach((c)=>c.setUserVote(user));
        }

        let userData : any[] = [];

        //convert post & comment to JSON and add to userData
        posts.forEach((p)=>userData.push({type: "Post",...p.toJSON()}))
        comments.forEach((c)=>userData.push({type: "Comment",...c.toJSON()}))

        //sort by date
        userData.sort((a,b)=>{
            if(b.createdAt>a.createdAt) return 1;
            if(b.createdAt<a.createdAt) return -1;
            return 0;
        })
    
        return res.json({user,userData});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"})
        
    }
}

//Route
const router = Router()
router.get("/:username",userMiddleware,getUserData)


export default router;
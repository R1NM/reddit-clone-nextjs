import { NextFunction, Request, Response, Router } from "express";
import userMiddleware from '../middleware/user';
import authMiddleware from '../middleware/auth';
import Post from "../entity/Post";
import Comment from "../entity/Comment";
import User from "../entity/User";
import Vote from "../entity/Vote";

//API
const vote =async (req:Request,res:Response) => {
    const {identifier,slug,commentIdentifier,value} = req.body;

    //value check
    if(![-1,0,1].includes(value)) return res.status(400).json({value:"Only -1, 0, 1 value is possible"})

    try {
        const user:User = res.locals.user;
        let post: Post | undefined = await Post.findOneByOrFail({identifier,slug});
        let vote: Vote | undefined;
        let comment: Comment | undefined;

        //find vote on DB
        if(commentIdentifier){//comment vote
            comment= await Comment.findOneByOrFail({identifier:commentIdentifier});
            vote = await Vote.findOneBy({username:user.username,commentId: comment.id});
        } else{ //post vote
            vote = await Vote.findOneBy({username:user.username,postId: post.id});
        }

        //Vote not found
        if(!vote && value===0) return res.status(404).json({error:"Vote not found"})
        else if(!vote){ //create new vote
            vote = new Vote();
            vote.user=user;
            vote.value=value;

            if(comment) vote.comment = comment; //comment vote
            else vote.post = post; //post vote

            await vote.save()
        }else if(value===0){ //reset vote
            await vote.remove();
        }else if(vote.value!==value){//update vote
            vote.value=value;
            await vote.save();
        } 

        //find post 
        post = await Post.findOneOrFail({
            where:{identifier, slug},
            relations : ["comments","comments.votes","sub","votes"]
        }
        )

        //set vote info to post
        post.setUserVote(user);
        post.comments.forEach((c)=>c.setUserVote(user))

        return res.json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error:"Something went wrong"})
    }
}

//Route
const router = Router()
router.post("/",userMiddleware,authMiddleware,vote)


export default router;
import { NextFunction, Request, Response, Router } from "express";
import userMiddleware from '../middleware/user';
import authMiddleware from '../middleware/auth';
import Sub from "../entity/Sub";
import Post from "../entity/Post";
import Comment from "../entity/Comment";

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

const getPosts =async (req: Request, res: Response) => {
    const currentPage: number = (req.query.page || 0 ) as number;
    const perPage: number = (req.query.count || 8) as number;

    try {
        const posts = await Post.find({
            order:{createdAt:"DESC"},
            relations: ["sub","votes","comments"],
            skip: currentPage*perPage,
            take: perPage,
        })

        if(res.locals.user){
            posts.forEach((p)=> p.setUserVote(res.locals.user));
        }

        return res.json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error:"Something went wrong"})
    }
}


const getPost=async (req: Request, res: Response) => {
    const {identifier,slug}=req.params;
    try {
        const post = await Post.findOneOrFail({
            where: {
                identifier,slug
            },
            relations: ["sub","votes"]
        })

        if(res.locals.user){
            post.setUserVote(res.locals.user);
        }

        return res.send(post);
    } catch (error) {
        console.error(error);
        return res.status(404).json({error:"Post not found"})
        
    }
}

const createPostComment = async (req: Request, res: Response) => {
    const {identifier,slug} = req.params;
    const body = req.body.body;

    try {
        const post = await Post.findOneByOrFail({identifier,slug})
        const comment = new Comment()
        comment.body=body;
        comment.user = res.locals.user;
        comment.post=post;

        if(res.locals.user){
            post.setUserVote(res.locals.user);
        }

        await comment.save();

        return res.json(comment)

    } catch (error) {
        console.error(error);
        return res.status(404).json({error:"Post not found"})
    }
}

const getPostComment =async (req: Request, res: Response) => {
    const {identifier,slug} = req.params;
    try {
        const post =await Post.findOneByOrFail({identifier,slug})
        const comments = await Comment.find({
            where: {postId: post.id},
            order: {createdAt:"DESC"},
            relations: ["votes"]
        })

    if(res.locals.user){
        comments.forEach((c)=>c.setUserVote(res.locals.user))
    }
    return res.json(comments);

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Something went wrong"})
    }
}

//Route
const router = Router()
router.post("/",userMiddleware,authMiddleware,createPost)
router.get("/",userMiddleware,getPosts);
router.get("/:identifier/:slug",userMiddleware,getPost)
router.post("/:identifier/:slug/comments",userMiddleware,createPostComment)
router.get("/:identifier/:slug/comments",userMiddleware,getPostComment)


export default router;
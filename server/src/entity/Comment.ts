import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import BaseEntity from './Entity';
import User from "./User";
import Post from "./Post";
import { Exclude, Expose } from "class-transformer";
import Vote from "./Vote";
import { makeId } from "../utils/helpers";

@Entity('comments')
export default class Comment extends BaseEntity{
    protected userVote: number;

    ////////////Colomns////////////
    @Index()
    @Column()
    identifier: string;

    @Column()
    body: string;

    @Column()
    username: string;

    @Column()
    postId: number;

    //////////////////////////////
    
    //////////Relations///////////
    @ManyToOne(()=>User)
    @JoinColumn({name:"username",referencedColumnName:"username"})
    user: User;

    @ManyToOne(()=>Post, (post)=>post.comments,{nullable:false})
    post: Post;

    @Exclude()
    @OneToMany(()=>Vote, (vote)=>vote.comment)
    votes:Vote[];

    //////////////////////////////
    
    ///////////Methods////////////
    setUserVote(user:User){
        const idx = this.votes?.findIndex((v)=>v.username===user.username);
        this.userVote=idx>-1?this.votes[idx].value:0;
    }

    @Expose()
    get voteScore():number{
        const initialValue=0;
        return this.votes?.reduce((previousValue,currentObject)=>
            previousValue+(currentObject.value||0), initialValue
        );
    }

    @BeforeInsert()
    makeId(){
        this.identifier=makeId(8);
    }
    //////////////////////////////
}
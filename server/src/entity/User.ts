import { Exclude } from "class-transformer";
import { IsEmail, Length } from "class-validator"
import { Entity, Column, Index, OneToMany, BeforeInsert } from "typeorm"
import BaseEntity from './Entity'
import bcrypt from 'bcryptjs'
import Post from './Post'
import Vote from "./Vote";

@Entity('users')
export default class User extends BaseEntity{

    ////////////Colomns////////////
    @Index()
    @IsEmail(undefined,{message: 'Wrong email address'})
    @Length(1,255,{message: 'Email Address is required'})
    @Column({unique:true})
    email : string;

    @Index()
    @Length(3,32,{message:'User name must be longer than 2 letters'})
    @Column({unique:true})
    username: string;

    @Exclude()
    @Column()
    @Length(6,255,{message:'Password must be longer than 5 letters'})
    password: string;
    //////////////////////////////

    //////////Relations///////////
    @OneToMany(()=> Post, (post)=>post.user)
    posts: Post[]

    @OneToMany(()=> Vote, (vote)=>vote.user)
    votes: Vote[]
    //////////////////////////////

    ///////////Methods////////////
    @BeforeInsert()
    async hashPassword(){
        this.password=await bcrypt.hash(this.password, 6)
    }
    //////////////////////////////

}

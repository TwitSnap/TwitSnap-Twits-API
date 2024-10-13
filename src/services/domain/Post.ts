import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

export interface OverViewPost {
    message:string,
    tags:string[],
    created_by:string,
    post_id:string,
    created_at:string,
    ammount: number;
}

export interface OverViewPosts{
    posts:OverViewPost[]
}

export interface comment{
    message: string;
    post_id: string;
    commenter_token: string;
    comment_id: string;
    created_at: string
}

export interface Post{
    message:string,
    tags:string[],
    created_by:string,
    post_id:string,
    created_at:string,
    comments: comment[]
}
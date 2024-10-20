import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

export interface OverViewPost {
    message: string,
    tags: string[],
    created_by: string,
    post_id: string,
    created_at: string,
    is_retweet: boolean,
    is_comment: boolean,
    origin_post: string;
    comment_ammount: number;
    like_ammount: number,
    retweet_ammount: number,
    username_creator:string | null,
    photo_creator:string | null
}

export interface Like{
    post_id: string,
    likee_user_id: string,
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
    is_retweet: boolean,
    is_comment: boolean,
    origin_post: string;
    comment_ammount: number;
    like_ammount: number;
    retweet_ammount: number,
}
import  request  from "supertest";
import app from "../src/app";

export const obtainPostsFromUserExecutedBy = async (user_id: string, executed_by: string) => {
    return await request(app).get("/v1/twit/posts/user").query({user_id: user_id,offset:0, limit:10}).set({user_id:executed_by}).send();
}

export const obatinPostFromId = async(post_id: string, executed_by: string) => {
    return await request(app).get("/v1/twit/post").query({id:post_id}).set({user_id:executed_by}).send();
}


export  const likeOrUnlikeAPost = async(post_id:string, executed_by: string) => {
    return await request(app).post("/v1/twit/like").query({post_id: post_id}).set({user_id:executed_by}).send();
}

export  const retwit = async (post_id:string, executed_by: string) => {
    return await request(app).post("/v1/twit/retwit").query({post_id: post_id}).set({user_id:executed_by}).send();
}

export const commentPost = async(post_id: string, executed_by:string, message:string) => {
    return await request(app).post("/v1/twit/comment").set({user_id:executed_by}).send({  "body": message,
    "post_id": post_id,
    "tags": [
      "string"
    ]});
}

export const  deletePost = async (post_id: string ,executed_by: string) => {
    return await request(app).delete("/v1/twit/post").query({post_id:post_id}).set({user_id:executed_by}).send();
}

export const addfavorite = async (post_id:string, executed_by:string) => {
    return await request(app).post("/v1/twit/favorite").query({post_id:post_id}).set({user_id:executed_by}).send();
}

export  const getFavorites = async (target_id: string, executed_by:string) => {
    return await request(app).get("/v1/twit/favorite").query({user:target_id,offset:0, limit:10}).set({user_id:executed_by}).send();
}

export  const getFeed = async (executed_by:string) => {
    return await request(app).get("/v1/twit/feed").query({offset:0, limit:10}).set({user_id:executed_by}).send();
}

export const patchTwit = async(message: string, tags: string[], executed_by:string, post_id:string) => {
    return await request(app).patch("/v1/twit/post").set({user_id:executed_by}).send({body:message,"tags":tags, post_id:post_id});
}

export const accoutRecomendation = async(executed_by:string) => { 
    return await request(app).get("/v1/twit/user/recommendation").set({user_id:executed_by}).query({offset:0, limit:10}).send();
}

export const getTrendingTopics = async (executed_by:string) => {
    return await request(app).get("/v1/twit/trending").set({user_id:executed_by}).query({offset:0, limit:10}).send();
}
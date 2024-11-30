import "reflect-metadata";
import { container } from 'tsyringe';
import { JWT_SECRET } from './../src/utils/config';

import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios, { AxiosRequestConfig } from 'axios';
import { json } from 'express';
import * as neo4j from "neo4j-driver";
import { AuraDatabaseConnectorStrategy } from "../src/db/connectors/AuraDatabaseConnectorStrategy";
import { DatabaseConnectorStrategy } from "../src/db/connectors/DatabaseConnectorStrategy";

jest.mock("axios");
const mAxios = axios as jest.MockedFunction<typeof axios>;
const URI = 'neo4j+s://5cc615e7.databases.neo4j.io';
const USER = "neo4j";
const PASSWORD = "8OAPUxxVWs3_QOB8pIZmTf9qDW4bLM5vKBR8zRWGXm8";
const newAuraDriver = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));
let deleteRecord = (id:string) =>{

}
beforeAll(async  () => {
    //connection = new DataSource(getDatabaseConfig());
    //connection = await connection.initialize();
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

describe('User Interacions', () => {

    afterEach( async () =>{
        
    })

    beforeEach( async () => {
        
    })

    it('should create record created by id 1 and with the same message', async () => {
       

        await request(app).post("/v1/twit").set({user_id:"1"}).send({body:"Un nuevo mensaje","tags":["string"],"is_private":true});
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status == 200).toBe(true);
        let post = lista_posts.body.posts[0];
        expect(post.created_by == "1").toBe(true);
        expect(post.message == "Un nuevo mensaje").toBe(true);
    });

    it("it should return nothing if getter isnt a follower" , async()=>{
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"3"}]}})
        mAxios.get.mockResolvedValueOnce({data:{users:[{uid:10}]}})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","2");
        let posts: any[] = lista_posts.body.posts;
        expect(posts.length === 0).toBe(true);
      
    });

    it("if user likes, like ammount should go up", async () =>{
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        console.log(lista_posts.body)
        let post = lista_posts.body.posts[0];
        let like_reponse = await likeOrUnlikeAPost(post.post_id,"1");
        expect(like_reponse.status == 204).toBe(true);
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let second_posts = await obtainPostsFromUserExecutedBy("1","1");
        console.log(second_posts.body)
        post = second_posts.body.posts[0];
        expect(post.like_ammount == 1).toBe(true);
    })

    it("Should reduce by one if already liked ", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let like_reponse = await likeOrUnlikeAPost(post.post_id,"1");
        expect(like_reponse.status == 204).toBe(true);
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        post = lista_posts.body.posts[0];
        expect(post.like_ammount == 0).toBe(true);
    })

    it("Shouldnt allow for retwit from poster", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let retwit_reponse = await retwit(String(post.post_id),"1");
        expect(retwit_reponse.status == 409).toBe(true);
    })

    it("Should add another post to the list if he comments", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let mensaje = "Un mensaje copado";
        let comment_reponse = await commentPost(post.post_id,"1",mensaje);
        
        expect(comment_reponse.status == 204).toBe(true);
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        .mockResolvedValueOnce({data:[]});
        lista_posts = await obtainPostsFromUserExecutedBy("1","1");    
        let posts :any[] = lista_posts.body.posts;
        expect(posts.length == 2);
        let comment = posts[0];
        expect(comment.message == mensaje).toBe(true)
        expect(comment.is_comment == true).toBe(true);
        expect(comment.origin_post == lista_posts.body.posts[1].post_id).toBe(true);

    })

    it ("Should'nt be able to delete if not creator", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        .mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let posts = lista_posts.body.posts;
        let post = posts[0];
        let delete_response = await deletePost(post.post_id,"2");
        expect(delete_response.status === 409).toBe(true);
    })

    it ("Another user not follower shouldnt be able to see private post", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:3}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","2");
        let posts: any[] = lista_posts.body.posts;
       
        let post = posts[0];
        expect(posts.length == 0).toBe(true);
        expect(post == undefined).toBe(true);
    })

    it("Should delete comment, ammount of comments from origin lowers", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        .mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let posts: any[] = lista_posts.body.posts;
        let post = posts[0];
        expect(posts[1].comment_ammount == 1).toBe(true);
        let delete_response = await deletePost(post.post_id,"1");
        expect(delete_response.status == 204).toBe(true);
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        posts = lista_posts.body.posts;
        expect(posts.length == 1).toBe(true);
        post = posts[0];
        expect(post.comment_ammount == 0).toBe(true);
    })

    it ("Should add to favorites to user 2", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let posts: any[] = lista_posts.body.posts;
        let post = posts[0];
        console.log(post);
        let response = await addfavorite(post.post_id,"2");
        expect(response.status == 204).toBe(true);
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"1"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let favorite_posts = await getFavorites("2","2");
        expect(favorite_posts.status == 200).toBe(true);
        console.log(favorite_posts.body);
        let favorite = favorite_posts.body[0];
        expect(favorite != undefined).toBe(true)
        expect(favorite.created_by == "1").toBe(true)
    })

    it ("The post of user 1 should appear in the feed of user 2 if they are followrs", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"1"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let feed_response = await getFeed("2");
        expect(feed_response.status === 200).toBe(true);
        let posts = feed_response.body.posts;
        console.log(posts);
        expect(posts[0].created_by == "1").toBe(true);
    })

    it ("The post of user 1 shouldnt appear in the feed of user 2 if they are not followrs", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"4"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let feed_response = await getFeed("2");
        expect(feed_response.status === 200).toBe(true);
        let posts: any[] = feed_response.body.posts;
        console.log(posts);
        expect(posts[0] == undefined).toBe(true);
        expect(posts.length === 0).toBe(true);
    })



})
afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    //await newAuraDriver.executeQuery('MATCH (n)\
    //DETACH DELETE n');

})

const obtainPostsFromUserExecutedBy = async (user_id: string, executed_by: string) => {
    return await request(app).get("/v1/twit/posts/user").query({user_id: user_id,offset:0, limit:10}).set({user_id:executed_by}).send();
}


const likeOrUnlikeAPost = async(post_id:string, executed_by: string) => {
    return await request(app).post("/v1/twit/like").query({post_id: post_id}).set({user_id:executed_by}).send();
}

const retwit = async (post_id:string, executed_by: string) => {
    return await request(app).post("/v1/twit/retwit").query({post_id: post_id}).set({user_id:executed_by}).send();
}

const commentPost = async(post_id: string, executed_by:string, message:string) => {
    return await request(app).post("/v1/twit/comment").set({user_id:executed_by}).send({  "body": message,
    "post_id": post_id,
    "tags": [
      "string"
    ]});
}

const  deletePost = async (post_id: string ,executed_by: string) => {
    return await request(app).delete("/v1/twit/post").query({post_id:post_id}).set({user_id:executed_by}).send();
}

const addfavorite = async (post_id:string, executed_by:string) => {
    return await request(app).post("/v1/twit/favorite").query({post_id:post_id}).set({user_id:executed_by}).send();
}

const getFavorites = async (target_id: string, executed_by:string) => {
    return await request(app).get("/v1/twit/favorite").query({user:target_id,offset:0, limit:10}).set({user_id:executed_by}).send();
}

const getFeed = async (executed_by:string) => {
    return await request(app).get("/v1/twit/feed").query({offset:0, limit:10}).set({user_id:executed_by}).send();
}
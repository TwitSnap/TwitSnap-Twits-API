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

})

describe('User Interacions', () => {

    afterEach( async () =>{
        
    })

    it('should create record created by id 1 and with the same message', async () => {
        mAxios.get.mockResolvedValue({data:{following:[{uid:1}]}});
        await request(app).post("/v1/twit").set({user_id:"1"}).send({body:"Un nuevo mensaje","tags":["string"],"is_private":true});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status == 204);
        let post = lista_posts.body.posts[0];
        expect(post.created_by == "1");
        expect(post.message == "Un nuevo mensaje");
    });

    it("it should return nothing if getter isnt a follower" , async()=>{
        mAxios.get.mockResolvedValue({data:{following:[{uid:3}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","2");
        let posts: any[] = lista_posts.body.posts;
        expect(posts.length === 0);
      
    });

    it("if user likes, like ammount should go up", async () =>{
        mAxios.get.mockResolvedValue({data:{following:[{uid:1}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let like_reponse = await likeOrUnlikeAPost(post.post_id,"1");
        expect(like_reponse.status == 200);
        lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        post = lista_posts.body.posts[0];
        expect(post.like_ammount == 1);
    })

    it("Should reduce by one if already liked ", async () => {
        mAxios.get.mockResolvedValue({data:{following:[{uid:1}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let like_reponse = await likeOrUnlikeAPost(post.post_id,"1");
        expect(like_reponse.status == 200);
        lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        post = lista_posts.body.posts[0];
        expect(post.like_ammount == 0);
    })

    it("Shouldnt allow for retwit from poster", async () => {
        mAxios.get.mockResolvedValue({data:{following:[{uid:1}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let retwit_reponse = await retwit(String(post.post_id),"1");
        expect(retwit_reponse.status == 409);
    })

    it("Should add another post to the list if he comments", async () => {
        mAxios.get.mockResolvedValue({data:{following:[{uid:1}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let mensaje = "Un mensaje copado";
        let comment_reponse = await commentPost(post.post_id,"1",mensaje);
        
        expect(comment_reponse.status == 200);
        
        lista_posts = await obtainPostsFromUserExecutedBy("1","1");    
        let posts :any[] = lista_posts.body.posts;
        expect(posts.length == 2);
        let comment = posts[1];
        expect(comment.message == mensaje)
        expect(comment.is_comment == true);
        expect(comment.origin_post == lista_posts.body.posts[0]);

    })

    it ("Should'nt be able to delete if not creator", async () => {
        mAxios.get.mockResolvedValue({data:{following:[{uid:1}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let posts = lista_posts.body.posts;
        let post = posts[0];
        let delete_response = await deletePost(post.post_id,"2");
        expect(delete_response.status == 409);
    })

    it ("Another user not follower shouldnt be a", async () => {
        mAxios.get.mockResolvedValue({data:{following:[{uid:3}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","2");
        let posts: any[] = lista_posts.body.posts;
       
        let post = posts[0];
        console.log(post);
        expect(posts.length == 0);
        expect(post == undefined);
    })

    it("Should delete comment, ammount of comments from origin lowers", async () => {
        mAxios.get.mockResolvedValue({data:{following:[{uid:1}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let posts: any[] = lista_posts.body.posts;
        let post = posts[1];
        expect(posts[0].comment_ammount == 1);
        let delete_response = await deletePost(post.post_id,"1");
        expect(delete_response.status == 204);
        lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        posts = lista_posts.body.posts;
        expect(posts.length == 1);
        post = posts[0];
        expect(post.comment_ammount == 0);
    })

})
afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

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
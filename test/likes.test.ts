import "reflect-metadata";

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios from 'axios';
import * as neo4j from "neo4j-driver";
import { likeOrUnlikeAPost, obtainPostsFromUserExecutedBy } from "./request_module";
import { AURA_TEST_URI, AURA_TEST_USER, AURA_TEST_PASSWORD } from "../src/utils/config";

jest.mock("axios");
const mAxios = axios as jest.MockedFunction<typeof axios>;
const URI = AURA_TEST_URI;
const USER = AURA_TEST_USER;
const PASSWORD = AURA_TEST_PASSWORD;
const newAuraDriver = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));

beforeAll(async  () => {
    //connection = new DataSource(getDatabaseConfig());
    //connection = await connection.initialize();
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

describe('Like a twit', () => {



    it('should create record created by id 1 and with the same message', async () => {
        await request(app).post("/v1/twit").set({user_id:"1"}).send({body:"Un nuevo mensaje","tags":["string"],"is_private":true});
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post.created_by).toBe("1");
        expect(post.message).toBe("Un nuevo mensaje");
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


})

afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

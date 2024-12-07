import "reflect-metadata";

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios from 'axios';
import * as neo4j from "neo4j-driver";
import { obtainPostsFromUserExecutedBy, retwit } from "./request_module";
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

describe('Retwit tests', () => {


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

    it("Shouldnt allow for retwit from poster user 1", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let retwit_reponse = await retwit(String(post.post_id),"1");
        expect(retwit_reponse.status == 409).toBe(true);
    })

    it ("If user 2 retweets, it should appear in its profile ", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let retwit_reponse = await retwit(String(post.post_id),"2");
        expect(retwit_reponse.status).toBe(204);
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"1"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        lista_posts = await obtainPostsFromUserExecutedBy("2","2");
        let retwit_post = lista_posts.body.posts[0];
        expect(retwit_post.created_by).toBe("1")
        expect(retwit_post.origin_post).toBe(post.post_id);
    })

    it ("As user 3 doesnt follow user 1, it shouldnt see the retwit from user 2", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"4"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}})
        let lista_posts = await obtainPostsFromUserExecutedBy("2","3");
        let post: any[] = lista_posts.body.posts;
        expect(post.length).toBe(0);
    })

    it("if user 2 retweets same post, it should delete it from its profile", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let retwit_reponse = await retwit(String(post.post_id),"2");
        expect(retwit_reponse.status).toBe(204);
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"1"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}})
        lista_posts = await obtainPostsFromUserExecutedBy("2","2");
        let retwit_post: any[] = lista_posts.body.posts;
        expect(retwit_post.length).toBe(0);
    })





})
afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

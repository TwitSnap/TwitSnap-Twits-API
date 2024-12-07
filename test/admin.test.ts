import { AURA_TEST_USER, AURA_TEST_PASSWORD, AURA_TEST_URI } from './../src/utils/config';
import { OverViewPostAdmin } from './../src/services/domain/PostAdmin';
import "reflect-metadata";
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios from 'axios';
import * as neo4j from "neo4j-driver";
import { blockPost, getFeed, getPostAdmin, obtainAdminPosts, obtainPostsFromUserExecutedBy } from "./request_module";

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


describe('Administrator checks', () => {

    it('should create record created by id 1 and with the same message', async () => {
        await request(app).post("/v1/twit").set({user_id:"1"}).send({body:"Un nuevo mensaje","tags":["string"],"is_private":true});
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post.created_by).toBe("1");
        expect(post.message).toBe("Un nuevo mensaje");
    });
    
    it('Admin correctly getting the post', async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];

        expect(post.created_by).toBe("1");
        expect(post.message).toBe("Un nuevo mensaje");

        let admin_response = await getPostAdmin(post.post_id);
        expect(admin_response.status).toBe(200);
        let adm_post: OverViewPostAdmin = admin_response.body[0]
        expect(adm_post.post_id).toBe(post.post_id)
        expect(adm_post.is_blocked).toBe(false)
        expect(adm_post.comment_ammount).toBe(0)

    });

    it ('Should correctly block that post', async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).
        mockResolvedValueOnce({data:{users:[{uid:10}]}}).
        mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        let block_response = await blockPost(post.post_id,"1");
        expect(block_response.status).toBe(204);
    })

    it ("shouldnt appear in the user feed of user 1" , async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).
        mockResolvedValueOnce({data:{users:[{uid:10}]}});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        expect(post).toBe(undefined);
    })

    it ("shouldnt appear in the feed of user 2", async ()=>{
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"1"}]}}).
        mockResolvedValueOnce({data:{users:[{uid:10}]}});
        let feed_response = await getFeed("2");
        let post = feed_response.body.posts[0];
        expect(post).toBe(undefined);
    })

    it ("should appear for the admins", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}});
        let response = await obtainAdminPosts();
        expect(response.status).toBe(200);
        let post = response.body.posts[0];
        expect(post.message).toBe("Un nuevo mensaje")
        expect(post.is_blocked).toBe(true);
    })

    it ("should be unblocked if post to block againg", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}});
        let response = await obtainAdminPosts();
        let post = response.body.posts[0];
        let block_response = await blockPost(post.post_id,"1");
        expect(block_response.status).toBe(204);
    })

    it ("should reappear on the feed of user 1", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).
        mockResolvedValueOnce({data:{users:[{uid:10}]}}).
        mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        let post = lista_posts.body.posts[0];
        expect(post != undefined).toBe(true)
        expect(post.message).toBe("Un nuevo mensaje");
    })

    it ("should reappear in the feed of user 2 the blocked twit", async ()=>{
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"1"}]}}).
        mockResolvedValueOnce({data:{users:[{uid:10}]}}).
        mockResolvedValueOnce({data:[]});
        let feed_response = await getFeed("2");
        let post = feed_response.body.posts[0];
        expect(post != undefined).toBe(true);
        expect(post.message).toBe("Un nuevo mensaje");
    })

   

})

beforeAll(async  () => {
    //connection = new DataSource(getDatabaseConfig());
    //connection = await connection.initialize();
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})



import { OverViewPost } from './../src/services/domain/Post';
import "reflect-metadata";

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios from 'axios';
import * as neo4j from "neo4j-driver";
import { obatinPostFromId, obtainPostsFromUserExecutedBy } from "./request_module";
import { AURA_TEST_URI, AURA_TEST_USER, AURA_TEST_PASSWORD } from '../src/utils/config';

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

describe('Post tests', () => {


    it('should create record created by id 1 and with the same message', async () => {
        mAxios.get.mockResolvedValueOnce({data:{username:"claudio"}}).mockResolvedValueOnce({data:{users:[{username:"hola",device_token:["asd","hola","None"]},{username:"chau",device_token:["untoken","otrotoken"]}]}})
        await request(app).post("/v1/twit").set({user_id:"1"}).send({body:"Un nuevo mensaje @hola @chau","tags":["string"],"is_private":true});
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post.created_by).toBe("1");
        expect(post.message).toBe("Un nuevo mensaje @hola @chau");
    });

    it("it should return nothing if getter isnt a follower" , async()=>{
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"3"}]}})
        mAxios.get.mockResolvedValueOnce({data:{users:[{uid:10}]}})
        let lista_posts = await obtainPostsFromUserExecutedBy("1","2");
        let posts: any[] = lista_posts.body.posts;
        expect(posts.length === 0).toBe(true);
      
    });

    it ("The post is retrieved succesfully", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status).toBe(200);
        let post:OverViewPost = lista_posts.body.posts[0];
        mAxios.get.mockResolvedValueOnce({data:[]});
        let get_post = await obatinPostFromId(String(post.post_id,),"1");
        post = get_post.body;
        expect(post.message).toBe("Un nuevo mensaje @hola @chau")
        expect(post.tags[0]).toBe("string")
        expect(post.is_retweet).toBe(false);
    })


})

afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

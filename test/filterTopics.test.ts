import "reflect-metadata";

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios from 'axios';
import * as neo4j from "neo4j-driver";
import { getPostFilteredByTag, getTrendingTopics, obtainPostsFromUserExecutedBy } from "./request_module";
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

describe('Trending topics filter', () => {



    it('should create record created by id 1 and with the same message', async () => {
        await request(app).post("/v1/twit").set({user_id:"1"}).send({body:"Un nuevo mensaje","tags":["string"],"is_private":true});
        await request(app).post("/v1/twit").set({user_id:"2"}).send({body:"VIDEOJUEGOS","tags":["videojuegos"],"is_private":true});
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post.created_by).toBe("1");
        expect(post.message).toBe("Un nuevo mensaje");
    });

    it ("should only appear string and videojuegos as trending topics" , async () => {
            mAxios.get.mockResolvedValueOnce({data:{users:[{uid:10}]}})
            let trending_response = await getTrendingTopics("1");
            let lista:  [string,Number][] = trending_response.body
            expect(trending_response.status).toBe(200);
            expect(lista.sort()).toEqual([['string',1],['videojuegos',1]].sort())
    })

    it ("should return post with VIDEOJUEGOS as body if 1 follows 2", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"2"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await getPostFilteredByTag("1","videojuegos");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post.created_by).toBe("2");
        expect(post.message).toBe("VIDEOJUEGOS");
    })

    it ("should return nothig if 1 doesnt follow 2", async() => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"4"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}});
        let lista_posts = await getPostFilteredByTag("1","videojuegos");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post == undefined).toBe(true);
    })

    it ("should return post with [un nuevo mensaje] as body if 1 follows 2", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"1"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]})
        let lista_posts = await getPostFilteredByTag("1","string");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post.created_by).toBe("1");
        expect(post.message).toBe("Un nuevo mensaje");
    })




})

afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

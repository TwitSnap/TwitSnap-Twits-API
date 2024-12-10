import "reflect-metadata";

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios from 'axios';
import * as neo4j from "neo4j-driver";
import { getPostFilteredByTag, getTrendingTopics, obtainPostsFromUserExecutedBy, searchTwits } from "./request_module";
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

describe('Search tests', () => {



    it('should create record created by id 1 and with the same message', async () => {
        await request(app).post("/v1/twit").set({user_id:"2"}).send({body:"Me gusta videojuegos #tagen","tags":["entretenimiento"],"is_private":false});
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"2"},{uid:"3"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("2","2");
        expect(lista_posts.status ).toBe(200);
        let post = lista_posts.body.posts[0];
        expect(post.created_by).toBe("2");
        expect(post.message).toBe("Me gusta videojuegos #tagen");
    });

    it ("should return nothing if not searched tag" , async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}});
        let response = await searchTwits("#asd", "1");
        let post = response.body.posts;
        expect(post).toEqual([])
    })

    it ("should return post" , async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let response = await searchTwits("#tagen", "1");
        console.log(response.body);
        let post = response.body.posts[0];
        console.log(post)
        expect(post != undefined).toBe(true)
        expect(post.message).toBe("Me gusta videojuegos #tagen")

    })

    it ("should return post if partial search", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let response = await searchTwits("Me gusta videojuego", "1");
        console.log(response.body);
        let post = response.body.posts[0];
        console.log(post)
        expect(post != undefined).toBe(true)
        expect(post.message).toBe("Me gusta videojuegos #tagen")
    })

    it ("should return post if partial search", async () => {
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:1}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let response = await searchTwits("sta video", "1");
        console.log(response.body);
        let post = response.body.posts[0];
        console.log(post)
        expect(post != undefined).toBe(true)
        expect(post.message).toBe("Me gusta videojuegos #tagen")
        await newAuraDriver.executeQuery('MATCH (n)\
        DETACH DELETE n');
    })




})

afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

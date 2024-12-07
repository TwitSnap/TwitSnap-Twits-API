import "reflect-metadata";

import request from 'supertest';
import { describe, it, expect, jest } from '@jest/globals';
import app from "../src/app"
import axios from 'axios';
import * as neo4j from "neo4j-driver";
import { obatinPostFromId, obtainPostsFromUserExecutedBy } from "./request_module";

jest.mock("axios");
const mAxios = axios as jest.MockedFunction<typeof axios>;
const URI = 'neo4j+s://5cc615e7.databases.neo4j.io';
const USER = "neo4j";
const PASSWORD = "8OAPUxxVWs3_QOB8pIZmTf9qDW4bLM5vKBR8zRWGXm8";
const newAuraDriver = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));

describe('Errors', () => {

    it ("should return 404 if post doesnt exits", async () => {
        mAxios.get.mockResolvedValueOnce({data:[]});
        let response = await  obatinPostFromId("5","1");
        expect(response.status).toBe(404);
    })

    it ("should return error if missing a post id for geting a post ", async () => {
        let response = await request(app).get("/v1/twit/post").set({user_id:"user"}).send();
        expect(response.status).toBe(400);
    })

    it ("should return error if no user authorized if found", async ()=> {
        let response = await request(app).get("/v1/twit/post").query({id:"5"}).send();
        expect(response.status ).toBe(500)
    })
    it ("should return bad reqeust if string is too long", async () => {
        let response = await request(app).post("/v1/twit").set({user_id:"1"}).send({body:'x'.repeat(500),"tags":["string"],"is_private":true});
        expect(response.status ).toBe(400);
    })

    it ("should return 500 if error in external service" , async () => {
        await request(app).post("/v1/twit").set({user_id:"1"}).send({body:"Un nuevo mensaje","tags":["string"],"is_private":true});
        mAxios.get.mockRejectedValue({status:404});
        let lista_posts = await obtainPostsFromUserExecutedBy("1","1");
        expect(lista_posts.status).toBe(500);
    })

   

})


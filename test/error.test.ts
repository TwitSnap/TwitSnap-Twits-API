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

   

})


const obatinPostFromId = async(post_id: string, executed_by: string) => {
    return await request(app).get("/v1/twit/post").query({id:post_id}).set({user_id:executed_by}).send();
}

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
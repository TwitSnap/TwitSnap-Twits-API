import { OverViewPost } from './../src/services/domain/Post';
import { editTwit } from './../src/services/domain/Twit';
import "reflect-metadata";
import { container } from 'tsyringe';
import { JWT_SECRET } from '../src/utils/config';

import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios, { AxiosRequestConfig } from 'axios';
import { json } from 'express';
import * as neo4j from "neo4j-driver";
import { AuraDatabaseConnectorStrategy } from "../src/db/connectors/AuraDatabaseConnectorStrategy";
import { DatabaseConnectorStrategy } from "../src/db/connectors/DatabaseConnectorStrategy";
import { accoutRecomendation, obatinPostFromId, obtainPostsFromUserExecutedBy, patchTwit } from "./request_module";

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

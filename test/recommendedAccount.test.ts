import { OverViewPost } from './../src/services/domain/Post';
import { editTwit } from '../src/services/domain/Twit';
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
import { accoutRecomendation, commentPost, likeOrUnlikeAPost, obtainPostsFromUserExecutedBy, patchTwit } from "./request_module";

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

describe('Trending accounts test', () => {


    it('Should user 1 like entretenimiento and user 2  posted about it and user 3 liked that post and user 4 commented it, it should appear in recommentedAccounts', async () => {
        await request(app).post("/v1/twit").set({user_id:"2"}).send({body:"Me gusta videojuegos","tags":["entretenimiento"],"is_private":true});
        mAxios.get.mockResolvedValueOnce({data:{following:[{uid:"2"},{uid:"3"}]}}).mockResolvedValueOnce({data:{users:[{uid:10}]}}).mockResolvedValueOnce({data:[]});
        let lista_posts = await obtainPostsFromUserExecutedBy("2","2");
        let post: OverViewPost = lista_posts.body.posts[0];
        await likeOrUnlikeAPost(post.post_id,"3");
        await commentPost(post.post_id,"4","un mensaje");
        expect(true).toBe(true)
    });

    it ("Then when checking trending topics, they should appear", async () =>{
        mAxios.get.mockResolvedValueOnce({data:[]})
        .mockResolvedValueOnce({data:{interests:[]}})
        .mockResolvedValueOnce({data:{users:[{uid:10}]}})
        .mockResolvedValueOnce({data:{interests:["entretenimiento"]}})
        .mockResolvedValueOnce({data:[]})
        .mockResolvedValueOnce({data:[]})
        .mockResolvedValueOnce({data:[]});
        let response = await accoutRecomendation("1");
        let users: {id:string}[] = response.body;
        console.log(users);
        let ids = users.map(user => {
            return user.id
        })
        console.log(ids);
        expect(ids.sort()).toEqual(["2","3","4"].sort())

    })




})

afterAll( async () => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});
    await newAuraDriver.executeQuery('MATCH (n)\
    DETACH DELETE n');

})

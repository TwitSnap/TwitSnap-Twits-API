import { JWT_SECRET } from './../src/utils/config';

import { databaseConnector } from './../src/utils/container/container';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll,jest } from '@jest/globals';
import app from "../src/app"
import axios, { AxiosRequestConfig } from 'axios';
import { json } from 'express';

jest.mock("axios");
const mAxios = axios as jest.MockedFunction<typeof axios>;
let connection: DataSource;
let deleteRecord = (id:string) =>{

}
beforeAll(async  () => {
    await databaseConnector.initializeConnection();
    //connection = new DataSource(getDatabaseConfig());
    //connection = await connection.initialize();

})

describe('UserController', () => {

    afterEach( async () =>{
        
    })

    it('should create record', async () => {

        expect(true);
    });

    it("should return a token" , async()=>{
        
      
    });

    it("should return 204 for access granted", async () =>{
      
    })

})
afterAll( (done) => {
    //connection.destroy().then(e =>{
    //    console.log("Desconexion de la BDD");
    //});

    done();

})

const register_user = (id: string, password: string) =>{
    return request(app)
    .post("/v1/auth/register")
    .send({id:id,password:password})
}

const obtain_token = (email:string, password:"unapassword") =>{
    return request(app)
    .post("/v1/auth/login")
    .send({email:"unEmail",password:"unapassword"});
}


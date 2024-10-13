import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

export class Twit {

    private readonly message: string;

    private readonly tags: string[];

    private readonly token: string;



    constructor(message: string, tags:string[], token:string) {
        this.message = message;
        this.tags = tags;
        this.token = token;
    }

    public getMessage = () => {
        return this.message
    }

    public getTags = () => {
        return this.tags
    }

    public getToken = () =>{
        return this.token;
    }



}
import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

export class Twit {

    private readonly message: string;

    private readonly tags: string[];

    private readonly token: string;

    private readonly is_private: boolean;

    constructor(message: string, tags:string[], token:string, is_private: boolean) {
        this.message = message;
        this.tags = tags;
        this.token = token;
        this.is_private = is_private;

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

    public getIsPrivate = () => {
        return this.is_private;
    }

}

export interface editTwit{
    message: string;

    tags: string[];

    token: string;

    is_private: boolean;

    post_id:string;
}
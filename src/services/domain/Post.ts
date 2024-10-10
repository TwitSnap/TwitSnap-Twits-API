import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

export class Post {

    private readonly message: string;

    private readonly tags: string[];

    private readonly token: string;

    private readonly post_id: string;

    private readonly time: string;

    constructor(message: string, tags: string[], token: string,post_id: string, time: string) {
        this.message = message;
        this.tags = tags;
        this.token = token;
        this.post_id = post_id;
        this.time = time;
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
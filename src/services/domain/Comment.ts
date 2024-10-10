
export class Comment {

    private readonly message: string;

    private readonly post_id: string;

    private readonly commenter_token: string;

    constructor(message: string, postId:string, token:string) {
        this.message = message;
        this.post_id = postId;
        this.commenter_token = token;
    }

    public getMessage = () => {
        return this.message
    }

    public getPostId = () => {
        return this.post_id
    }

    public getToken = () =>{
        return this.commenter_token;
    }


}
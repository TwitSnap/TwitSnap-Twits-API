
export class CommentQuery {

    private readonly message: string;

    private readonly post_id: string;

    private readonly commenter_token: string;

    private readonly comment_id: string;

    private readonly tags: string[]
    constructor(message: string, postId:string, token:string, tags: string[]) {
        this.message = message;
        this.post_id = postId;
        this.commenter_token = token;
        this.tags = tags;
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

    public getCommentId = () => {
        return this.comment_id
    }

    public getTags = () =>{
        return this.tags;
    }


}
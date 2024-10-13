
export class CommentQuery {

    private readonly message: string;

    private readonly post_id: string;

    private readonly commenter_token: string;

    private readonly comment_id: string;

    constructor(message: string, postId:string, token:string, comment_id: string = "") {
        this.message = message;
        this.post_id = postId;
        this.commenter_token = token;
        this.comment_id = comment_id;
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


}
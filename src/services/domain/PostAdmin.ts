export interface OverViewPostAdmin {
    message: string,
    tags: string[],
    created_by: string,
    post_id: string,
    created_at: string,
    is_retweet: boolean,
    is_comment: boolean,
    origin_post: string;
    comment_ammount: number;
    like_ammount: number,
    retweet_ammount: number,
    username_creator:string | null,
    photo_creator:string | null,
    is_private: boolean,
    liked: boolean,
    favourite:boolean,
    deleted: boolean,
    is_blocked: boolean
}
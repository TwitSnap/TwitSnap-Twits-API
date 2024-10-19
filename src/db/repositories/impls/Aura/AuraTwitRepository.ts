import { comment, OverViewPost, OverViewPosts, Post } from './../../../../services/domain/Post';
import { BadRequestError } from './../../../../api/errors/BadRequestError';
import { CommentQuery } from './../../../../services/domain/Comment';
import { EagerResult, Record } from "neo4j-driver";
import { Twit } from "../../../../services/domain/Twit";
import { StandardDatabaseError } from "../../../errors/StandardDatabaseError";
import { TwitRepository } from "../../interfaces/TwitRepository";
import { AuraRepository } from "./AuraRepository";
import { AlreadyLikedError } from '../../../errors/AlreadyLikeError';
import { AlreadyRetwitedError } from '../../../errors/AlreadyRetwitedError';



export class AuraTwitRepository extends AuraRepository implements TwitRepository{
    constructor(){
        super()
    }
        /**
     * @inheritDoc
     */
        getById = async (id: string): Promise<Post | null> => {
            const ans = await this.auraRepository.executeQuery('\
            MATCH (p:Post {id:$id})\
            OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
            OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
            OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
            WITH p, like, reply, retweet,\
                CASE WHEN p.is_retweet = true THEN p.origin_post ELSE null END AS originalId\
                \
            OPTIONAL MATCH (d:Post {id: originalId})\
            WITH p, d, like, reply, retweet\
            WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
            like, reply, retweet\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
            OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
            RETURN postData.id AS post_id,\
                    postData.message AS message,\
                    postData.created_by AS created_by,\
                    postData.tags AS tags,\
                    postData.created_at AS created_at,\
                    p.is_comment AS is_comment,\
                    p.is_retweet AS is_retweet,\
                    p.origin_post AS origin_post,\
                    COUNT(DISTINCT originalReply) AS ammount_comments,\
                    COUNT(DISTINCT originalRetweet) AS ammount_retwits,\
                    COUNT(DISTINCT originalLike) AS ammount_likes\
                    ORDER BY postData.created_at DESC\
            ',{id:id})
            const record = ans.records.at(0);
            // ACORDARSE POSTDATA es la data del original (si existe) y p es del tweet recien creado
            if (!record){
                throw new BadRequestError("");
            }
            const post: Post = {
                message:record.get("message"),
                tags:record.get("tags"),
                created_by:record.get("created_by"),
                post_id:record.get("post_id"),
                created_at:new Date(record.get("created_at")).toISOString(),
                comments: await this.getComments(record.get("post_id")),
                is_comment: record.get("is_comment"),
                is_retweet: record.get("is_retweet"),
                like_ammount: Number(record.get("ammount_likes")),
                origin_post: record.get("origin_post"),
                comment_ammount: Number(record.get("ammount_comments")),
                retweet_ammount: Number(record.get("ammount_retwits")),
            }
            return post
        };
    
        /**
         * @inheritDoc
         */
        save = async (twit: Twit): Promise<EagerResult> => {
            return await this.auraRepository.executeQuery(
                'CREATE (p:Post {id:randomUUID(),\
                                created_by:$token,\
                                tags:$tags,\
                                message:$message, \
                                created_at: localdatetime(),\
                                is_comment: $is_comment,\
                                is_retweet: $is_retweet,\
                                origin_post: $origin_post\
                })',
                {token:twit.getToken(),
                    message:twit.getMessage(),
                    tags:twit.getTags(),
                    is_comment:false,
                    is_retweet:false,
                    origin_post:null
                }

            )
        };

        comment_post = async (comment: CommentQuery): Promise<EagerResult> =>{
            return await this.auraRepository.executeQuery(
                'CREATE (c:Post {id:randomUUID(),\
                                created_by:$token,\
                                tags:$tags,\
                                message:$message, \
                                created_at: localdatetime(),\
                                is_comment: $is_comment,\
                                is_retweet: $is_retweet,\
                                origin_post: $origin_post\
                })\
                WITH c\
                MATCH (p:Post {id:$post_id})\
                CREATE (p)-[:COMMENTED_BY]->(c)\
                ',
                {token:comment.getToken(),
                message:comment.getMessage(),
                origin_post:comment.getPostId(),
                tags:comment.getTags(),
                is_comment:true,
                is_retweet:false,
                post_id:comment.getPostId(),
                }
            )
        }
    
        getAllByUserId = async (id:string): Promise< OverViewPosts |null> =>{
            const result= await this.auraRepository.executeQuery('\
            MATCH (p:Post {created_by:$id})\
            OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
            OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
            OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
            WITH p, like, reply, retweet,\
                CASE WHEN p.is_retweet = true THEN p.origin_post ELSE null END AS originalId\
                \
            OPTIONAL MATCH (d:Post {id: originalId})\
            WITH p, d, like, reply, retweet\
            WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
            like, reply, retweet\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
            OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
            RETURN p.id AS post_id,\
                    postData.message AS message,\
                    postData.created_by AS created_by,\
                    postData.tags AS tags,\
                    postData.created_at AS created_at,\
                    p.is_comment AS is_comment,\
                    p.is_retweet AS is_retweet,\
                    p.origin_post AS origin_post,\
                    COUNT(DISTINCT originalReply) AS ammount_comments,\
                    COUNT(DISTINCT originalRetweet) AS ammount_retwits,\
                    COUNT(DISTINCT originalLike) AS ammount_likes\
                    ORDER BY postData.created_at DESC\
            ',
            {id:id})
            const posts = {posts:await this.formatPosts(result)};

            return posts;
        }

        likeTwit = async (post_id: string, user_id:string):  Promise<void> => {
            const liked_already = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH p\
                MATCH (targetPost: Post)\
                WHERE targetPost.id = \
                CASE WHEN p.is_retweet = true Then p.origin_post Else p.id END\
                WITH targetPost\
                MATCH (tagetPost) - [:LIKED_BY]->(c: Like {liked_by:$user_id})\
                RETURN c',{post_id:post_id,user_id:user_id});
            if (liked_already.records.length > 0){
                throw new AlreadyLikedError("The user already like this post");
            }
            const like = await this.auraRepository.executeQuery('\
                CREATE (l:Like {id:randomUUID(),\
                                liked_by:$user_id,\
                                liked_at: localdatetime()})\
                WITH l\
                MATCH (p:Post {id:$post_id})\
                WITH l, CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS ID\
                MATCH (targetPost: Post {id:ID})\
                CREATE (targetPost)-[:LIKED_BY]->(l)\
                '
            ,{user_id:user_id,post_id:post_id})
            console.log(like.summary)
            return
        }

        retwit = async (post_id: string, user_id: string): Promise<void> => {
            const reposted_already = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id}) -[:RETWEETED_BY]-> (c:Post {created_by:$user_id})\
                RETURN c',{post_id:post_id,user_id:user_id});
            if (reposted_already.records.length > 0){
                throw new AlreadyRetwitedError("User already retweeted this post");
            }
            const original_post = await this.getById(post_id);
            if (original_post?.created_by === user_id){
                throw new AlreadyRetwitedError("User Created This Tweet")
            } 
            var origin_post;
            var redirect_post
            if (original_post?.is_retweet){
                const own_post = await this.auraRepository.executeQuery('\
                    MATCH (p:Post {created_by:$user_id,id:$post_id})\
                    RETURN p',{post_id:original_post.origin_post,user_id:user_id});
                if (own_post.records.length > 0){
                    throw new AlreadyLikedError("User cant retweet Own post");
                }    
                origin_post = original_post.origin_post;
                redirect_post = original_post.origin_post;
            }
            else{
                origin_post = post_id;
                redirect_post = post_id;
            }
            await this.auraRepository.executeQuery('\
                CREATE (c:Post {id:randomUUID(),\
                                created_by:$token,\
                                tags:$tags,\
                                message:$message, \
                                created_at: localdatetime(),\
                                is_comment: $is_comment,\
                                is_retweet: $is_retweet,\
                                origin_post: $origin_post\
                })\
                WITH c\
                MATCH (p:Post {id:$post_id})\
                CREATE (p)-[:RETWEETED_BY]->(c)\
                '
            ,{token:user_id,tags:original_post?.tags,message:original_post?.message,
                is_comment:false,
                is_retweet:true,
                origin_post:origin_post,
                post_id:redirect_post
            })
            }

        private formatPosts = async (result: EagerResult) => {
            const records = result.records;
            let posts = []
            for (let record of records){
                const arr: string[] = record.get("tags")
                const obj: OverViewPost = {message:record.get("message"),
                            tags:arr,
                            created_by:record.get("created_by"),
                            post_id:record.get("post_id"),
                            created_at:new Date(record.get("created_at")).toISOString(),
                            comment_ammount: Number(record.get("ammount_comments")),
                            is_comment: record.get("is_comment"),
                            is_retweet: record.get("is_retweet"),
                            origin_post: record.get("origin_post"),
                            like_ammount: Number(record.get("ammount_likes")),
                            retweet_ammount: Number(record.get("ammount_retwits")),
                        };
                posts.push(obj)
            }
            return posts;   
        }

        private getAmmountOfComments = async (post_id: string) => {
            const result = await this.auraRepository.executeQuery('\
                            MATCH (p:Post {id:$post_id}) -[:COMMENTED_BY*] -> (c:Post)\
                            RETURN COUNT(c) as ammount\
            ',{post_id})
            const record = result.records.at(0)

            if (record){
                return Number(record.get("ammount"))
            }
            return 0;
        }

        private getComments = async (post_id:string) => {
            const query = await this.auraRepository.executeQuery('\
                            MATCH (p:Post {id:$post_id}) -[:COMMENTED_BY]->(c:Post)\
                            OPTIONAL MATCH (c)-[:COMMENTED_BY*]->(reply:Post)\
                            OPTIONAL MATCH (c)-[:RETWEETED_BY]->(retweet: Post)\
                            OPTIONAL MATCH (c)-[:LIKED_BY]->(like:Like)\
                            RETURN c.id as post_id,c.message as message,c.created_by as created_by,\
                                    c.tags as tags, c.created_at as created_at,\
                                    c.is_comment as is_comment, c.is_retweet as is_retweet, c.origin_post as origin_post,\
                                    COUNT(reply) as ammount_comments, COUNT(retweet) as ammount_retwits, COUNT(like) as ammount_likes\
                            ORDER BY c.created_at DESC\
                            ',{post_id})
            let coms = this.formatPosts(query)
            return coms
        }
}
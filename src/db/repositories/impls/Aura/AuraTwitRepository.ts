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
             RETURN p.id as post_id,p.message as message,p.created_by as created_by,\
                    p.tags as tags, p.created_at as created_at,\
                    p.is_comment as is_comment, p.is_retweet as is_retweet, p.origin_post as origin_post,\
                    COUNT(DISTINCT like) as ammount_likes, COUNT(DISTINCT retweet) as ammount_retweets, COUNT(DISTINCT reply) as ammount_comments\
            ',{id:id})
            const record = ans.records.at(0);
            if (!record){
                throw new BadRequestError("");
            }
            const post: Post = {
                message:record.get("message"),
                tags:record.get("tags"),
                created_by:record.get("created_by"),
                post_id:record.get("post_id"),
                created_at:new Date(record.get("created_at")).toISOString(),
                comments: await this.getComments(id),
                is_comment: record.get("is_comment"),
                is_retweet: record.get("is_retweet"),
                like_ammount: Number(record.get("ammount_likes")),
                origin_post: record.get("origin_post"),
                comment_ammount: Number(record.get("ammount_comments")),
                retweet_ammount: Number(record.get("ammount_retweets")),
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
            RETURN p.id as post_id,p.message as message,p.created_by as created_by,\
                    p.tags as tags, p.created_at as created_at,\
                    p.is_comment as is_comment, p.is_retweet as is_retweet, p.origin_post as origin_post,\
                    COUNT(DISTINCT reply) as ammount_comments, COUNT(DISTINCT retweet) as ammount_retwits, COUNT(DISTINCT like) as ammount_likes\
            ORDER BY p.created_at DESC\
            ',
            {id:id})
            const posts = {posts:await this.formatPosts(result)};

            return posts;
        }

        likeTwit = async (post_id: string, user_id:string):  Promise<void> => {
            const liked_already = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id}) -[:LIKED_BY]-> (c:Like {liked_by:$user_id})\
                RETURN c',{post_id:post_id,user_id:user_id});
            if (liked_already.records.length > 0){
                throw new AlreadyLikedError("The user already like this post");
            }
            await this.auraRepository.executeQuery('\
                CREATE (l:Like {id:randomUUID(),\
                                liked_by:$user_id,\
                                liked_at: localdatetime()})\
                WITH l\
                MATCH (p:Post {id:$post_id})\
                CREATE (p)-[:LIKED_BY]->(l)\
                '

            ,{user_id:user_id,post_id:post_id})
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
                origin_post:post_id,
                post_id:post_id
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
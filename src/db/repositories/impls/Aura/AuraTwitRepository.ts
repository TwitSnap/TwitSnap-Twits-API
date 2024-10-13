import { comment, OverViewPost, OverViewPosts, Post } from './../../../../services/domain/Post';
import { BadRequestError } from './../../../../api/errors/BadRequestError';
import { CommentQuery } from './../../../../services/domain/Comment';
import { EagerResult, Record } from "neo4j-driver";
import { Twit } from "../../../../services/domain/Twit";
import { StandardDatabaseError } from "../../../errors/StandardDatabaseError";
import { TwitRepository } from "../../interfaces/TwitRepository";
import { AuraRepository } from "./AuraRepository";



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
            RETURN p.id as post_id,p.message as message,p.created_by as created_by, p.tags as tags, p.created_at as created_at\
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
                comments: await this.getComments(id)
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
                                created_at: localdatetime()\
                })',
                {token:twit.getToken(),message:twit.getMessage(),tags:twit.getTags()}

            )
        };

        comment_post = async (comment: CommentQuery): Promise<EagerResult> =>{
            return await this.auraRepository.executeQuery(
                'CREATE (c:Comment{id:randomUUID(),\
                                    created_by:$token,\
                                    message: $message,\
                                    created_at: localdatetime()\
                })\
                WITH c\
                MATCH (p:Post {id:$post_id})\
                CREATE (p)-[:COMMENTED_BY]->(c)\
                ',
                {token:comment.getToken(),
                message:comment.getMessage(),
                post_id:comment.getPostId()
                }
            )
        }
    
        getAllByUserId = async (id:string): Promise< OverViewPosts |null> =>{
            const result= await this.auraRepository.executeQuery('\
            MATCH (p:Post {created_by:$id})\
            RETURN p.id as post_id,p.message as message,p.created_by as created_by, p.tags as tags, p.created_at as created_at\
            ',
            {id:id})
            const posts = {posts:await this.formatPosts(result)};

            return posts;
        }

        private formatPosts = async (result: EagerResult) => {
            const records = result.records;
            let posts = []
            for (let record of records){
                const obj: OverViewPost = {message:record.get("message"),
                            tags:record.get("tags"),
                            created_by:record.get("created_by"),
                            post_id:record.get("post_id"),
                            created_at:new Date(record.get("created_at")).toISOString(),
                            ammount: await this.getAmmountOfComments(record.get("post_id"))};
                posts.push(obj)
            }
            return posts;   
        }

        private getAmmountOfComments = async (post_id: string) => {
            const ammount = await this.auraRepository.executeQuery('\
                            MATCH (p:Post {id:$post_id}) -[:COMMENTED_BY] -> (c:Comment)\
                            RETURN COUNT(c) as ammount\
            ',{post_id})
            return ammount.records.at(0)?.get("ammount");
        }

        private getComments = async (post_id:string) => {
            let comments = []
            const query = await this.auraRepository.executeQuery('\
                            MATCH (p:Post {id:$post_id}) -[:COMMENTED_BY]->(c:Comment)\
                            RETURN c.created_at as created_at, c.id as id, c.message as message, c.created_by as created_by\
            ',{post_id})
            for (let record of query.records){
                const obj: comment = {
                    message: record.get("message"),
                    post_id: post_id,
                    commenter_token: record.get("created_by"),
                    comment_id: record.get("id"),
                    created_at: new Date(record.get("created_at")).toISOString()
                }
                comments.push(obj)
            }
            return comments
        }
}
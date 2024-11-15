import { TwitNotFoundError } from './../../../errors/TwitNotFoundError';
import { Pagination } from './../../../../services/domain/Pagination';
import { OverViewPost, OverViewPosts } from './../../../../services/domain/Post';
import { TwitAdminRepository } from "../../interfaces/TwitAdminRepository";
import { AuraRepository } from "./AuraRepository";
import { EagerResult } from 'neo4j-driver';
import { logger } from '../../../../utils/container/container';

export class AuraTwitAdminRepository extends AuraRepository implements TwitAdminRepository{
    constructor(){
        super()
    }

    public getPost = async (post_id: string): Promise<OverViewPost[]> => {
        const ans = await this.auraRepository.executeQuery('\
        MATCH (p:Post {id:$id})\
        WHERE NOT p.deleted\
        OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
        OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
        OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
        WITH p, like, reply, retweet,\
            CASE WHEN p.is_retweet = true THEN p.origin_post ELSE null END AS originalId\
            \
        OPTIONAL MATCH (d:Post {id: originalId})\
        WHERE NOT d.deleted\
        WITH p, d, like, reply, retweet\
        WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
        like, reply, retweet\
        OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
        OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
        OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
        WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply\
        ORDER BY p.created_at DESC\
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
                COUNT(DISTINCT originalLike) AS ammount_likes,\
                postData.is_private as is_private,\
                null as userLikedPost,\
                null as FavedPost,\
                postData.deleted as deleted\
        ',{id:post_id})
        if (ans.records.length == 0){
            throw new TwitNotFoundError("No se encontro el twit pedido");
        }
        return this.formatPosts(ans);
    }

    public getAllPosts = async (pagination: Pagination, filter_by_id: boolean, user: string) : Promise<OverViewPost[]> => {
        const result= await this.auraRepository.executeQuery('\
        MATCH (p:Post)\
        WHERE NOT p.deleted AND (($filterById AND p.created_by = $optional_user) OR NOT $filterById)\
        OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
        OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
        OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
        WITH p, like, reply, retweet,\
            CASE WHEN p.is_retweet = true THEN p.origin_post ELSE null END AS originalId\
            \
        OPTIONAL MATCH (d:Post {id: originalId})\
        WHERE NOT d.deleted\
        WITH p, d, like, reply, retweet\
        WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
        like, reply, retweet\
        OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
        OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
        OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
        WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply\
        ORDER BY p.created_at DESC\
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
                COUNT(DISTINCT originalLike) AS ammount_likes,\
                postData.is_private as is_private,\
                null as userLikedPost,\
                null as FavedPost,\
                postData.is_blocked as is_blocked,\
                postData.deleted as deleted\
        SKIP toInteger($offset)\
        LIMIT toInteger($limit)\
        ',
        {offset:pagination.offset,limit:pagination.limit, filterById:filter_by_id, optional_user: user})
        return this.formatPosts(result);
    }

    public blockPost = async (post_id: string): Promise<void> => {
        const blocked_already = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH p\
                MATCH (targetPost: Post)\
                WHERE targetPost.id = \
                CASE WHEN p.is_retweet = true Then p.origin_post Else p.id END\
                RETURN targetPost, targetPost.is_blocked as is_blocked',{post_id:post_id});
            if (blocked_already.records.length == 0){
                throw new TwitNotFoundError("No se encontro el twit que se queria borrar");
            }
            if (blocked_already.records.at(0)?.get("is_blocked")){
                logger.logInfo("Attempting to Unblock twit: "+ post_id)
                await this.auraRepository.executeQuery('\
                    MATCH (p:Post {id:$post_id})\
                    WITH p\
                    MATCH (targetPost: Post)\
                    WHERE targetPost.id = \
                    CASE WHEN p.is_retweet = true Then p.origin_post Else p.id END\
                    WITH targetPost\
                    SET targetPost.is_blocked = false\
                    ',{post_id:post_id});
                return
            }
            const like = await this.auraRepository.executeQuery('\
            MATCH (p:Post {id:$post_id})\
            WITH p\
            MATCH (targetPost: Post)\
            WHERE targetPost.id = \
            CASE WHEN p.is_retweet = true Then p.origin_post Else p.id END\
            WITH targetPost\
            SET targetPost.is_blocked = true\
                '
            ,{post_id:post_id})
            console.log(like.summary)
            return
        return
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
                        username_creator:null,
                        photo_creator:null,
                        is_private: record.get("is_private"),
                        liked: record.get("userLikedPost"),
                        favourite: record.get("FavedPost"),
                        deleted: record.get("deleted")

                    };
            posts.push(obj)
        }
        return posts;   
    }
    
}
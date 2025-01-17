import { registerUserDoc } from './../../../../utils/swagger/docs/UserControllerDocs';
import { comment, OverViewPost, OverViewPosts, Post } from './../../../../services/domain/Post';
import { BadRequestError } from './../../../../api/errors/BadRequestError';
import { CommentQuery } from './../../../../services/domain/Comment';
import { EagerResult, Record } from "neo4j-driver";
import { editTwit, Twit } from "../../../../services/domain/Twit";
import { StandardDatabaseError } from "../../../errors/StandardDatabaseError";
import { TwitRepository } from "../../interfaces/TwitRepository";
import { AuraRepository } from "./AuraRepository";
import { AlreadyLikedError } from '../../../errors/AlreadyLikeError';
import { AlreadyRetwitedError } from '../../../errors/AlreadyRetwitedError';
import { Pagination } from '../../../../services/domain/Pagination';
import { Stats } from '../../../../services/domain/Stats';
import { InvalidTwitError } from '../../../errors/InvalidTwitError';
import { AlreadyFavoritedError } from '../../../errors/AlreadyFavoritedError';
import { logger } from '../../../../utils/container/container';
import { TwitNotFoundError } from '../../../errors/TwitNotFoundError';



export class AuraTwitRepository extends AuraRepository implements TwitRepository{
    constructor(){
        super()
    }
        /**
     * @inheritDoc
     */
        getById = async (id: string, user_id: string): Promise<OverViewPost | null> => {
            const ans = await this.auraRepository.executeQuery('\
            MATCH (p:Post {id:$id})\
            WHERE NOT p.deleted AND NOT p.is_blocked\
            OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
            OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
            OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
            WITH p, like, reply, retweet,\
                CASE WHEN p.is_retweet = true THEN p.origin_post ELSE null END AS originalId\
                \
            OPTIONAL MATCH (d:Post {id: originalId})\
            WHERE NOT d.deleted AND NOT d.is_blocked\
            WITH p, d, like, reply, retweet\
            WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
            like, reply, retweet\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user})\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user})\
            OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                WHERE NOT originalReply.is_blocked AND NOT originalReply.deleted\
            OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user})\
            WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
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
                    userLikedPost as userLikedPost,\
                    userFavedPost as FavedPost,\
                    postData.deleted as deleted,\
                    userRetweeted as userRetweeted,\
                    postData.is_blocked as is_blocked\
            ',{id:id, user:user_id})
            const record = ans.records.at(0);
            // ACORDARSE POSTDATA es la data del original (si existe) y p es del tweet recien creado
            if (!record){
                throw new TwitNotFoundError("No se encontro el twit pedido");
            }
            const post: OverViewPost = {
                message:record.get("message"),
                tags:record.get("tags"),
                created_by:record.get("created_by"),
                post_id:record.get("post_id"),
                created_at:new Date(record.get("created_at")).toISOString(),
                is_comment: record.get("is_comment"),
                is_retweet: record.get("is_retweet"),
                like_ammount: Number(record.get("ammount_likes")),
                origin_post: record.get("origin_post"),
                comment_ammount: Number(record.get("ammount_comments")),
                retweet_ammount: Number(record.get("ammount_retwits")),
                username_creator:null,
                photo_creator:null,
                is_private: record.get("is_private"),
                liked: record.get("userLikedPost"),
                favourite: record.get("FavedPost"),
                deleted: record.get("deleted"),
                retweeted: record.get("userRetweeted"),
                is_blocked: record.get("is_blocked")
            }
            return post
        };
    
        /**
         * @inheritDoc
         */
        save = async (twit: Twit, hashtags: string[]): Promise<OverViewPost[]> => {
            let post = await this.auraRepository.executeQuery(
                'CREATE (p:Post {id:randomUUID(),\
                                created_by:$token,\
                                tags:$tags,\
                                message:$message, \
                                created_at: localdatetime(),\
                                is_comment: $is_comment,\
                                is_retweet: $is_retweet,\
                                origin_post: $origin_post,\
                                is_private: $is_private,\
                                deleted: $deleted,\
                                is_blocked: $is_blocked,\
                                hashtags: $hashtags\
                })\
                RETURN p.id AS post_id,\
                    p.message AS message,\
                    p.created_by AS created_by,\
                    p.tags AS tags,\
                    p.created_at AS created_at,\
                    p.is_comment AS is_comment,\
                    p.is_retweet AS is_retweet,\
                    p.origin_post AS origin_post,\
                    0 AS ammount_comments,\
                    0 AS ammount_retwits,\
                    0 AS ammount_likes,\
                    p.is_private as is_private,\
                    false as userLikedPost,\
                    false as FavedPost,\
                    p.deleted as deleted,\
                    false as userRetweeted,\
                    p.is_blocked as is_blocked,\
                    p.hashtags as hashtags\
                ',
                {token:twit.getToken(),
                    message:twit.getMessage(),
                    tags:twit.getTags(),
                    is_comment:false,
                    is_retweet:false,
                    origin_post:null,
                    is_private: twit.getIsPrivate(),
                    deleted:false,
                    is_blocked: false,
                    hashtags: hashtags,
                })
            return this.formatPosts(post)

            
        };

        comment_post = async (comment: CommentQuery, hashtags: string[]): Promise<OverViewPost[]> =>{
            let comm = await this.auraRepository.executeQuery(
                'MATCH (p:Post {id:$post_id})\
                WITH CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS ID\
                MATCH (targetPost: Post {id:ID})\
                CREATE (c:Post {id:randomUUID(),\
                                created_by:$token,\
                                tags:targetPost.tags,\
                                message:$message, \
                                created_at: localdatetime(),\
                                is_comment: $is_comment,\
                                is_retweet: $is_retweet,\
                                origin_post: $origin_post,\
                                is_private: targetPost.is_private,\
                                deleted: $deleted,\
                                is_blocked: $is_blocked,\
                                hashtags: $hashtags\
                })\
                WITH c, targetPost\
                CREATE (targetPost)-[:COMMENTED_BY]->(c)\
                RETURN c.id AS post_id,\
                    c.message AS message,\
                    c.created_by AS created_by,\
                    c.tags AS tags,\
                    c.created_at AS created_at,\
                    c.is_comment AS is_comment,\
                    c.is_retweet AS is_retweet,\
                    c.origin_post AS origin_post,\
                    0 AS ammount_comments,\
                    0 AS ammount_retwits,\
                    0 AS ammount_likes,\
                    c.is_private as is_private,\
                    false as userLikedPost,\
                    false as FavedPost,\
                    c.deleted as deleted,\
                    false as userRetweeted,\
                    c.is_blocked as is_blocked\
                ',
                {token:comment.getToken(),
                message:comment.getMessage(),
                origin_post:comment.getPostId(),
                tags:comment.getTags(),
                is_comment:true,
                is_retweet:false,
                post_id:comment.getPostId(),
                is_private:false,
                deleted:false,
                is_blocked: false,
                hashtags:hashtags
                }
            )
            return this.formatPosts(comm);
        }
    
        getAllByUserId = async (id:string, pagination:Pagination, is_prohibited:boolean, user_id:string, following: Array<string>, banned_ids: string[]): Promise< OverViewPosts> =>{
            const result= await this.auraRepository.executeQuery('\
            MATCH (p:Post {created_by:$id})\
            WHERE NOT p.created_by  in $banned_users AND NOT p.is_blocked AND NOT p.deleted AND (NOT p.is_private or p.created_by = $user or p.created_by in $idList)\
            OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
            OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
            OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
            WITH p, like, reply, retweet,\
                CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS originalId\
                \
            OPTIONAL MATCH (d:Post {id: originalId})\
            WITH p, d, like, reply, retweet\
            WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
            like, reply, retweet\
            WHERE NOT postData.created_by in $banned_users AND NOT postData.is_blocked AND NOT postData.deleted AND (NOT postData.is_private or postData.created_by = $user or postData.created_by in $idList)\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                WHERE NOT originalLike.liked_by  IN $banned_users\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user})\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                WHERE NOT originalRetweet.created_by  IN $banned_users\
            OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                WHERE NOT originalReply.created_by  IN $banned_users AND NOT originalReply.is_blocked AND NOT originalReply.deleted\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user})\
            OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user})\
            WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
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
                    userLikedPost as userLikedPost,\
                    userFavedPost as FavedPost,\
                    postData.deleted as deleted,\
                    userRetweeted as userRetweeted,\
                    postData.is_blocked as is_blocked\
            SKIP toInteger($offset)\
            LIMIT toInteger($limit)\
            ',
            {id:id,offset:pagination.offset,limit:pagination.limit, is_prohibited:is_prohibited, user:user_id, idList: following, banned_users: banned_ids})
            const posts = {posts:await this.formatPosts(result)};

            return posts;
        }

        delete = async (post_id: string, user_id: string) : Promise<void> => {
            const post = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                RETURN p.created_by as created_by, p.is_retweet as is_retweet\
                ', {user_id: user_id, post_id:post_id})
            if (post.records.length === 0){
                throw new TwitNotFoundError("No se encontro el twit pedido")
            }
            if (post.records.at(0)?.get("created_by") != user_id){
                throw new InvalidTwitError("El usuario no es el creador del twit");
            }
            if (post.records.at(0)?.get("is_retweet") == true){
                console.log("Lo que se quiere borrar es un retweet");
                await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH p, CASE WHEN p.is_retweet = true THEN p.origin_post ELSE NULL END AS originalId\
                OPTIONAL MATCH (original: Post {id:originalId}) -[link: `RETWEETED_BY`]-> (p)\
                DELETE link,p\
                RETURN original\
                ', {user_id: user_id, post_id:post_id, delete:"deleted"})
                return

            }
            await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                SET p.deleted = true\
                WITH p\
                MATCH (p) -[:COMMENTED_BY]-> (d: Post)\
                SET d.origin_post = $delete\
                RETURN p\
                ', {user_id: user_id, post_id:post_id, delete:"deleted"})
            await this.auraRepository.executeQuery('\
            MATCH (p:Post {id:$post_id})\
            SET p.deleted = true\
            WITH p\
            MATCH (p) -[link:RETWEETED_BY]-> (d: Post)\
            DELETE link,d\
            RETURN p\
            ', {user_id: user_id, post_id:post_id, delete:"deleted"})

        }

        patch = async (twit: editTwit, hashtags:string[]):Promise<void> => {
            const post_from_user = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id, created_by: $user_id})\
                return p\
            ',{post_id:twit.post_id, user_id:twit.token});
            if (post_from_user.records.length == 0){
                throw new InvalidTwitError("No existe el post o el usuario no creo dicho post");
            }
            const result  = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id, created_by: $user_id})\
                SET p.message= $new_message, p.tags= $new_tags, p.hashtags=$hashtags\
                return p\
            ',{new_message:twit.message,new_tags:twit.tags, post_id:twit.post_id,user_id:twit.token, hashtags: hashtags});
        }

        likeTwit = async (post_id: string, user_id:string):  Promise<void> => {
            const liked_already = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH p\
                MATCH (targetPost: Post)\
                WHERE targetPost.id = \
                CASE WHEN p.is_retweet = true Then p.origin_post Else p.id END\
                WITH targetPost\
                MATCH (targetPost) - [:LIKED_BY]->(c: Like {liked_by:$user_id})\
                RETURN c',{post_id:post_id,user_id:user_id});
            if (liked_already.records.length > 0){
                logger.logInfo("Attempting to remove like from: "+ post_id)
                await this.auraRepository.executeQuery('\
                    MATCH (p:Post {id:$post_id})\
                    WITH p\
                    MATCH (targetPost: Post)\
                    WHERE targetPost.id = \
                    CASE WHEN p.is_retweet = true Then p.origin_post Else p.id END\
                    WITH targetPost\
                    MATCH (targetPost) - [l :LIKED_BY]->(c: Like {liked_by:$user_id})\
                    DELETE l,c\
                    ',{post_id:post_id,user_id:user_id});
                return
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
            return
        }

        retwit = async (post_id: string, user_id: string): Promise<void> => {
            const reposted_already = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH p\
                MATCH (targetPost: Post)\
                WHERE targetPost.id =\
                    CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END\
                WITH targetPost\
                MATCH (targetPost)-[:RETWEETED_BY]-> (c:Post {created_by:$user_id, deleted:FALSE})\
                RETURN c, c.is_retweet as is_retweet, c.id as post_id',{post_id:post_id,user_id:user_id});
            if (reposted_already.records.length > 0){
                logger.logInfo("Deleting Retweet");
                await this.delete(reposted_already.records.at(0)?.get("post_id"), user_id);
                return;
            }
            const original_post = await this.getById(post_id,user_id);
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
                    throw new AlreadyRetwitedError("User cant retweet Own post");
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
                                origin_post: $origin_post,\
                                is_private: $is_private,\
                                deleted: $deleted,\
                                is_blocked: $blocked\
                })\
                WITH c\
                MATCH (p:Post {id:$post_id})\
                CREATE (p)-[:RETWEETED_BY]->(c)\
                '
            ,{token:user_id,tags:original_post?.tags,message:original_post?.message,
                is_comment:false,
                is_retweet:true,
                origin_post:origin_post,
                post_id:redirect_post,
                is_private: original_post?.is_private,
                deleted:original_post?.deleted,
                blocked: original_post?.is_blocked
            })
        }

        saveFavorite = async (user_id: string, post_id: string): Promise<void> =>{
            const already_favored = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH p\
                MATCH (targetPost: Post)\
                WHERE targetPost.id =\
                CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END\
                WITH targetPost\
                MATCH (f: Favorite {post_id: targetPost.id, favored_by: $user_id})\
                RETURN f\
            ', {post_id: post_id, user_id: user_id});
            if (already_favored.records.length > 0){
                logger.logInfo("Attempting to remove favorite post: " + post_id)
                await this.auraRepository.executeQuery('\
                    MATCH (p:Post {id:$post_id})\
                    WITH p\
                    MATCH (targetPost: Post)\
                    WHERE targetPost.id =\
                    CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END\
                    WITH targetPost\
                    MATCH (f: Favorite {post_id: targetPost.id, favored_by: $user_id})\
                    DELETE f\
                ', {post_id: post_id, user_id: user_id});
                return
            }
            const favored = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH p\
                MATCH (targetPost: Post)\
                WHERE targetPost.id =\
                CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END\
                WITH targetPost\
                CREATE (f: Favorite {post_id:targetPost.id,\
                                    favored_by: $user_id,\
                                    favored_at: localdatetime()\
                })\
                RETURN f\
            ', {post_id: post_id, user_id: user_id});
            return
        }

        getFavoritesFrom = async (target_id: string, pagination: Pagination, user_id: string,following: Array<string>, banned_ids: string[]): Promise<OverViewPost[]> => {
            const result= await this.auraRepository.executeQuery('\
                MATCH (f: Favorite {favored_by: $target_id})\
                MATCH (p:Post {id:f.post_id})\
                WHERE  NOT p.created_by IN $banned_users AND NOT p.is_blocked AND NOT p.deleted AND (NOT p.is_private or p.created_by IN $idList or p.created_by = $user_id)\
                OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
                OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
                OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
                WITH f,p, like, reply, retweet,\
                    CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS originalId\
                    \
                OPTIONAL MATCH (d:Post {id: originalId})\
                WITH p,f, d, like, reply, retweet\
                WITH p,f,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
                like, reply, retweet\
                WHERE  NOT postData.created_by IN $banned_users AND NOT postData.is_blocked AND NOT postData.deleted AND (NOT postData.is_private or postData.created_by = $user_id or postData.created_by in $idList)\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                    WHERE NOT originalLike.liked_by  IN $banned_users\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                    WHERE NOT originalRetweet  IN $banned_users\
                OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                    WHERE  NOT originalReply.created_by IN $banned_users AND NOT originalReply.is_blocked AND NOT originalReply.deleted\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user_id})\
                OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user_id})\
                WITH p,f,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                    CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                    CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                    CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
                ORDER BY f.favored_at DESC\
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
                        userLikedPost as userLikedPost,\
                        userFavedPost as FavedPost,\
                        postData.deleted as deleted,\
                        userRetweeted as userRetweeted,\
                        postData.is_blocked as is_blocked\
                SKIP toInteger($offset)\
                LIMIT toInteger($limit)\
                ',
                {offset:pagination.offset,limit:pagination.limit, target_id:target_id, user_id:user_id,idList:following, banned_users:banned_ids})
                return this.formatPosts(result)
        }

        getStatsFromPeriod = async (user_id: string, period: string, banned_ids: string[]) : Promise<Stats> =>{
            const result = await this.auraRepository.executeQuery('\
                MATCH (p:Post {created_by: $userId, is_retweet: false})\
                WHERE NOT p.deleted AND NOT p.is_blocked\
                OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
                    WHERE NOT like.liked_by  IN $banned_users AND date(like.liked_at) >= date($period)\
                OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
                    WHERE NOT reply.created_by  IN $banned_users AND date(reply.created_at) >= date($period) AND NOT reply.deleted AND NOT reply.is_blocked\
                OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
                    WHERE NOT retweet.created_by  IN $banned_users AND date(retweet.created_at) >= date($period)\
                RETURN COUNT(DISTINCT like) as ammount_likes,\
                        COUNT(DISTINCT retweet) as ammount_retweets,\
                        COUNT(DISTINCT reply) as ammount_comments\
                ',{userId:user_id,period:period, banned_users:banned_ids})
            const record = result.records.at(0);
            const stats: Stats = {
                likes: Number(record?.get("ammount_likes")),
                comments: Number(record?.get("ammount_comments")),
                shares: Number(record?.get("ammount_retweets"))
            }
            return stats;
        }

        public getCommentsFrom = async (post_id: string, pagination:Pagination,user_id:string, banned_ids: string[]): Promise<OverViewPost[]> => {
            return this.getComments(post_id,pagination,user_id, banned_ids);
        }

        public getFeedFor = async (user_id: string, pagination: Pagination, following: Array<string>, banned_ids: string[]): Promise<OverViewPosts> =>{
            const result= await this.auraRepository.executeQuery('\
                MATCH (p:Post {is_comment:false})\
                WHERE NOT p.created_by  IN $banned_users AND NOT p.is_blocked AND NOT p.deleted AND p.created_by <> $user_id\
                        AND (NOT p.is_private or p.created_by IN $idList) \
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
                WHERE  NOT postData.created_by IN $banned_users AND NOT postData.is_blocked AND NOT postData.deleted AND postData.created_by <> $user_id AND (NOT postData.is_private or postData.created_by IN $idList)\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                    WHERE  NOT originalLike.liked_by IN $banned_users\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                    WHERE NOT originalRetweet.created_by  IN $banned_users\
                OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                    WHERE NOT originalReply.created_by  IN $banned_users AND NOT originalReply.is_blocked AND NOT originalReply.deleted\
                OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user_id})\
                WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                    CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                    CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                    CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
                ORDER BY p.created_at DESC\
                RETURN DISTINCT p.id AS post_id,\
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
                        userLikedPost as userLikedPost,\
                        userFavedPost as FavedPost,\
                        postData.deleted as deleted,\
                        userRetweeted as userRetweeted,\
                        postData.is_blocked as is_blocked\
                SKIP toInteger($offset)\
                LIMIT toInteger($limit)\
                ',
                {user_id:user_id,offset:pagination.offset,limit:pagination.limit,idList:following, banned_users:banned_ids})
                const posts = {posts:await this.formatPosts(result)};
                return posts;
        }

        public getAccountsFor = async (user_interests: string[], banned_ids: string[], user_id:string): Promise<string[]> => {
            let activity = new Map<string, Number>()
            const posts = await this.auraRepository.executeQuery('\
            MATCH (p:Post {is_retweet:false, is_blocked:false, deleted:false,is_comment:false})\
            WHERE p.created_by <> $user_id AND NOT p.created_by  IN $banned_users AND ANY(tag IN p.tags WHERE tag IN $interests) \
            RETURN p.created_by as user, COUNT(p) as ammount_posts\
            ',{interests:user_interests, banned_users: banned_ids, user_id});
            for (let record of posts.records){
                let actividad_de_usuario = activity.get(record.get("user"));
                if (actividad_de_usuario){
                    activity.set(record.get("user"),Number(actividad_de_usuario) + Number(record.get("ammount_posts")));
                }
                else{
                    activity.set(record.get("user"),Number(record.get("ammount_posts")));
                }
            }
            const retweets = await this.auraRepository.executeQuery('\
            MATCH (p:Post {is_retweet:true, is_blocked:false, deleted:false,is_comment:false})\
                WHERE p.created_by <> $user_id AND NOT p.created_by  IN $banned_users\
            WITH p\
            MATCH (original: Post)-[:RETWEETED_BY]-> (p)\
            OPTIONAL MATCH (firstPost:Post) -[:COMMENTED_BY*]->  (original)\
            WHERE NOT (firstPost)<-[:COMMENTED_BY]-()\
            WITH p, \
                original, \
                CASE \
                    WHEN firstPost IS NOT NULL THEN firstPost \
                    ELSE original \
                    END AS targetPost\
            WHERE ANY(tag IN original.tags WHERE tag IN $interests) \
            RETURN p.created_by as user, COUNT(p) as ammount_retweets\
            ',{interests:user_interests, banned_users: banned_ids, user_id});
            for (let record of retweets.records){
                let actividad_de_usuario = activity.get(record.get("user"));
                if (actividad_de_usuario){
                    activity.set(record.get("user"),Number(actividad_de_usuario) + Number(record.get("ammount_retweets")));
                }
                else{
                    activity.set(record.get("user"),Number(record.get("ammount_retweets")));
                }
            }

            const comments = await this.auraRepository.executeQuery('\
            MATCH (p: Post {is_retweet:false, is_blocked:false, deleted:false,is_comment:true})\
                WHERE p.created_by <> $user_id AND NOT p.created_by  IN $banned_users\
            OPTIONAL MATCH (firstPost:Post) -[:COMMENTED_BY*]->  (p)\
            WHERE NOT (firstPost)<-[:COMMENTED_BY]-()\
            WITH p,firstPost\
            WHERE ANY(tag IN firstPost.tags WHERE tag IN $interests)\
            RETURN p.created_by as user, COUNT(p) as ammount_comments\
            ', {interests:user_interests, banned_users:banned_ids, user_id})
            for (let record of comments.records){
                let actividad_de_usuario = activity.get(record.get("user"));
                if (actividad_de_usuario){
                    activity.set(record.get("user"),Number(actividad_de_usuario) + Number(record.get("ammount_comments")));
                }
                else{
                    activity.set(record.get("user"),Number(record.get("ammount_comments")));
                }
            }

            const likes = await this.auraRepository.executeQuery('\
            MATCH  (like: Like)\
                WHERE like.liked_by <> $user_id AND NOT like.liked_by  IN $banned_users\
            WITH like\
            MATCH (p:Post {deleted:false, is_blocked:false})-[:LIKED_BY]->(like)\
            WITH p,like\
            OPTIONAL MATCH (firstPost:Post) -[:COMMENTED_BY*]->  (p)\
            WHERE NOT (firstPost)<-[:COMMENTED_BY]-()\
            WITH p,like, CASE WHEN firstPost IS NOT NULL THEN firstPost ELSE p END as targetPost\
            WHERE ANY(tag IN targetPost.tags WHERE tag IN $interests)\
            RETURN like.liked_by as user, COUNT(like) as ammount_likes\
            ',{interests:user_interests, banned_users:banned_ids, user_id})
            for (let record of likes.records){
                let actividad_de_usuario = activity.get(record.get("user"));
                if (actividad_de_usuario){
                    activity.set(record.get("user"),Number(actividad_de_usuario) + Number(record.get("ammount_likes")));
                }
                else{
                    activity.set(record.get("user"),Number(record.get("ammount_likes")));
                }
            }
            let sorted = Array.from(activity.entries()) // Convert Map to an array of entries
                .sort((a, b) => Number(b[1]) - Number(a[1]) )  // Sort by the value (ascending order)
                .map(([key]) => key);         // Extract the keys
                return sorted;
        }

        public getTrendingTopics = async (user_id: string, lista_baneados: string[]) : Promise<[string,Number][]> => {
            const posts = await this.auraRepository.executeQuery('\
            MATCH (p:Post {is_retweet:false, is_blocked:false, deleted:false,is_comment:false})\
            WHERE NOT p.created_by  IN $banned_users\
            UNWIND p.tags AS tag\
            RETURN tag, COUNT(tag) AS count\
            ORDER BY count DESC\
            ', {banned_users:lista_baneados})
            let activity = new Map<string, Number>();
            for (let record of posts.records){
                let actividad_de_usuario = activity.get(record.get("tag"));
                if (actividad_de_usuario){
                    activity.set(record.get("tag"),Number(actividad_de_usuario) + Number(record.get("count")));
                }
                else{
                    activity.set(record.get("tag"),Number(record.get("count")));
                }
            }
            const retweets = await this.auraRepository.executeQuery('\
            MATCH (p:Post {is_retweet:true, is_blocked:false, deleted:false,is_comment:false})\
                WHERE NOT p.created_by  IN $banned_users\
            WITH p\
            MATCH (original: Post)-[:RETWEETED_BY]-> (p)\
            OPTIONAL MATCH (firstPost:Post) -[:COMMENTED_BY*]->  (original)\
            WHERE NOT (firstPost)<-[:COMMENTED_BY]-()\
            WITH p, \
                original, \
                CASE \
                    WHEN firstPost IS NOT NULL THEN firstPost \
                    ELSE original \
                    END AS targetPost\
            UNWIND targetPost.tags as tags \
            RETURN tags, COUNT(tags) AS tag_count\
            ',{banned_users:lista_baneados});
            for (let record of retweets.records){
                let actividad_de_usuario = activity.get(record.get("tags"));
                if (actividad_de_usuario){
                    activity.set(record.get("tags"),Number(actividad_de_usuario) + Number(record.get("tag_count")));
                }
                else{
                    activity.set(record.get("tags"),Number(record.get("tag_count")));
                }
            }

            const comments = await this.auraRepository.executeQuery('\
            MATCH (p: Post {is_retweet:false, is_blocked:false, deleted:false,is_comment:true})\
                WHERE NOT p.created_by  IN $banned_users\
            OPTIONAL MATCH (firstPost:Post) -[:COMMENTED_BY*]->  (p)\
            WHERE NOT (firstPost)<-[:COMMENTED_BY]-()\
            WITH p, \
            CASE \
              WHEN firstPost IS NOT NULL THEN firstPost \
              ELSE p \
            END AS targetPost\
            UNWIND targetPost.tags as tags\
            RETURN tags, COUNT(tags) as tag_count\
            ', { banned_users:lista_baneados, user_id})
            for (let record of comments.records){
                let actividad_de_usuario = activity.get(record.get("tags"));
                if (actividad_de_usuario){
                    activity.set(record.get("tags"),Number(actividad_de_usuario) + Number(record.get("tag_count")));
                }
                else{
                    activity.set(record.get("tags"),Number(record.get("tag_count")));
                }
            }
            let sorted = Array.from(activity.entries()) // Convert Map to an array of entries
            .sort((a, b) => Number(b[1]) - Number(a[1]) )  // Sort by the value (ascending order)
            return sorted;
        }

        public getTopicsFilteredByTag = async (user_id: string,  banned_ids: string[], pagination: Pagination, filter: string, following: Array<string>): Promise<OverViewPosts> => {
            const result= await this.auraRepository.executeQuery('\
            MATCH (p:Post {is_comment:false})\
            WHERE $filter IN p.tags AND NOT p.created_by  IN $banned_users AND NOT p.is_blocked AND NOT p.deleted\
                    AND (NOT p.is_private or p.created_by IN $idList) \
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
            WHERE $filter IN p.tags AND NOT postData.created_by IN $banned_users AND NOT postData.is_blocked AND NOT postData.deleted AND (NOT postData.is_private or postData.created_by IN $idList)\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                WHERE  NOT originalLike.liked_by IN $banned_users\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user_id})\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                WHERE NOT originalRetweet.created_by  IN $banned_users\
            OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                WHERE NOT originalReply.created_by  IN $banned_users AND NOT originalReply.is_blocked AND NOT originalReply.deleted\
            OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user_id})\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user_id})\
            WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
            ORDER BY p.created_at DESC\
            RETURN DISTINCT p.id AS post_id,\
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
                    userLikedPost as userLikedPost,\
                    userFavedPost as FavedPost,\
                    postData.deleted as deleted,\
                    userRetweeted as userRetweeted,\
                    postData.is_blocked as is_blocked\
            SKIP toInteger($offset)\
            LIMIT toInteger($limit)\
            ',
            {user_id:user_id,offset:pagination.offset,limit:pagination.limit,idList:following, banned_users:banned_ids, filter:filter})
            const posts = {posts:await this.formatPosts(result)};
            return posts;
        }

        public serachByTotalHashtag = async (user_id: string,  banned_ids: string[], pagination: Pagination, pattern: string, following: Array<string>): Promise<OverViewPosts>=>{
            const result= await this.auraRepository.executeQuery('\
            MATCH (p:Post)\
                WHERE NOT p.created_by  IN $banned_users AND NOT p.is_blocked AND NOT p.deleted \
                        AND (NOT p.is_private or p.created_by IN $idList or p.created_by = $user_id) AND $pattern IN p.hashtags \
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
                WHERE  $pattern IN postData.hashtags AND NOT postData.created_by IN $banned_users AND NOT postData.is_blocked \
                    AND NOT postData.deleted AND (NOT postData.is_private or postData.created_by IN $idList or postData.created_by = $user_id)\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                    WHERE  NOT originalLike.liked_by IN $banned_users\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                    WHERE NOT originalRetweet.created_by  IN $banned_users\
                OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                    WHERE NOT originalReply.created_by  IN $banned_users AND NOT originalReply.is_blocked AND NOT originalReply.deleted\
                OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user_id})\
                WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                    CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                    CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                    CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
                ORDER BY p.created_at DESC\
                RETURN DISTINCT p.id AS post_id,\
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
                        userLikedPost as userLikedPost,\
                        userFavedPost as FavedPost,\
                        postData.deleted as deleted,\
                        userRetweeted as userRetweeted,\
                        postData.is_blocked as is_blocked\
                SKIP toInteger($offset)\
                LIMIT toInteger($limit)\
                ',
                {user_id:user_id,offset:pagination.offset,limit:pagination.limit,idList:following, banned_users:banned_ids, pattern: pattern})
                const posts = {posts:await this.formatPosts(result)};
                return posts;
        }

        public searchByPartialString = async (user_id: string,  banned_ids: string[], pagination: Pagination, search: string, following: Array<string>):Promise<OverViewPosts>=>{
            const result= await this.auraRepository.executeQuery('\
            MATCH (p:Post)\
                WHERE NOT p.created_by  IN $banned_users AND NOT p.is_blocked AND NOT p.deleted \
                        AND (NOT p.is_private or p.created_by IN $idList or p.created_by = $user_id) AND p.message CONTAINS $search \
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
                WHERE  postData.message CONTAINS $search AND NOT postData.created_by IN $banned_users AND NOT postData.is_blocked \
                    AND NOT postData.deleted AND (NOT postData.is_private or postData.created_by IN $idList or postData.created_by = $user_id)\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                    WHERE  NOT originalLike.liked_by IN $banned_users\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                    WHERE NOT originalRetweet.created_by  IN $banned_users\
                OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                    WHERE NOT originalReply.created_by  IN $banned_users AND NOT originalReply.is_blocked AND NOT originalReply.deleted\
                OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user_id})\
                WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                    CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                    CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                    CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
                ORDER BY p.created_at DESC\
                RETURN DISTINCT p.id AS post_id,\
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
                        userLikedPost as userLikedPost,\
                        userFavedPost as FavedPost,\
                        postData.deleted as deleted,\
                        userRetweeted as userRetweeted,\
                        postData.is_blocked as is_blocked\
                SKIP toInteger($offset)\
                LIMIT toInteger($limit)\
                ',
                {user_id:user_id,offset:pagination.offset,limit:pagination.limit,idList:following, banned_users:banned_ids, search: search})
                const posts = {posts:await this.formatPosts(result)};
                return posts;
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
                            deleted: record.get("deleted"),
                            retweeted: record.get("userRetweeted"),
                            is_blocked: record.get("is_blocked")

                        };
                posts.push(obj)
            }
            return posts;   
        }


        private getComments = async (post_id:string, pagination: Pagination, user_id: string, banned_ids: string[]) => {
            const query = await this.auraRepository.executeQuery('\
                            MATCH (p:Post {id:$post_id})\
                            WITH p, CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS originalId\
                            MATCH (d:Post {id:originalId}) -[:COMMENTED_BY]->(c:Post)\
                            WHERE NOT c.created_by  IN $banned_users AND NOT c.is_blocked AND NOT c.deleted\
                            OPTIONAL MATCH (c)-[:COMMENTED_BY*]->(reply:Post)\
                                WHERE  NOT reply.created_by IN $banned_users AND NOT reply.is_blocked AND NOT reply.deleted\
                            OPTIONAL MATCH (c)-[:RETWEETED_BY]->(retweet: Post)\
                                WHERE NOT retweet.created_by  IN $banned_users\
                            OPTIONAL MATCH (c)-[:LIKED_BY]->(like:Like)\
                                WHERE NOT like.liked_by  IN $banned_users\
                            OPTIONAL MATCH (c)-[:LIKED_BY]->(userLiked:Like {liked_by: $user})\
                            OPTIONAL MATCH (f: Favorite {post_id: c.id, favored_by: $user})\
                            OPTIONAL MATCH (c)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user})\
                            WITH p, reply, retweet, like,c,\
                                CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                                CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                                CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
                            ORDER BY c.created_at DESC\
                            RETURN c.is_private as is_private, c.id as post_id,c.message as message,c.created_by as created_by,\
                                    c.tags as tags, c.created_at as created_at,\
                                    c.is_comment as is_comment, c.is_retweet as is_retweet, c.origin_post as origin_post,\
                                    COUNT(DISTINCT reply) as ammount_comments, COUNT(DISTINCT retweet) as ammount_retwits, COUNT(DISTINCT like) as ammount_likes,userLikedPost as userLikedPost,\
                                    userFavedPost as FavedPost, c.deleted as deleted, userRetweeted as userRetweeted, c.is_blocked as is_blocked\
                            SKIP toInteger($offset)\
                            LIMIT toInteger($limit)\
                            ',{post_id,offset:pagination.offset,limit:pagination.limit, user:user_id, banned_users:banned_ids})
                            
            let coms = this.formatPosts(query)
            return coms
        }
}

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
            OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user})\
            WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
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
                    userLikedPost as userLikedPost,\
                    userFavedPost as FavedPost,\
                    postData.deleted as deleted,\
                    userRetweeted as userRetweeted\
            ',{id:id, user:user_id})
            const record = ans.records.at(0);
            // ACORDARSE POSTDATA es la data del original (si existe) y p es del tweet recien creado
            if (!record){
                throw new TwitNotFoundError("");
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
                retweeted: record.get("userRetweeted")
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
                                origin_post: $origin_post,\
                                is_private: $is_private,\
                                deleted: $deleted,\
                                is_blocked: $is_blocked\
                })',
                {token:twit.getToken(),
                    message:twit.getMessage(),
                    tags:twit.getTags(),
                    is_comment:false,
                    is_retweet:false,
                    origin_post:null,
                    is_private: twit.getIsPrivate(),
                    deleted:false,
                    is_blocked: false
                }

            )
        };

        comment_post = async (comment: CommentQuery): Promise<EagerResult> =>{
            return await this.auraRepository.executeQuery(
                'MATCH (p:Post {id:$post_id})\
                WITH CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS ID\
                MATCH (targetPost: Post {id:ID})\
                CREATE (c:Post {id:randomUUID(),\
                                created_by:$token,\
                                tags:$tags,\
                                message:$message, \
                                created_at: localdatetime(),\
                                is_comment: $is_comment,\
                                is_retweet: $is_retweet,\
                                origin_post: $origin_post,\
                                is_private: targetPost.is_private,\
                                deleted: $deleted,\
                                is_blocked: $is_blocked\
                })\
                WITH c, targetPost\
                CREATE (targetPost)-[:COMMENTED_BY]->(c)\
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
                is_blocked: false
                }
            )
        }
    
        getAllByUserId = async (id:string, pagination:Pagination, is_prohibited:boolean, user_id:string, following: Array<string>): Promise< OverViewPosts> =>{
            const result= await this.auraRepository.executeQuery('\
            MATCH (p:Post {created_by:$id})\
            WHERE NOT p.is_blocked AND NOT p.deleted AND (NOT p.is_private or p.created_by = $user or p.created_by in $idList)\
            OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
            OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
            OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
            WITH p, like, reply, retweet,\
                CASE WHEN p.is_retweet = true THEN p.origin_post ELSE null END AS originalId\
                \
            OPTIONAL MATCH (d:Post {id: originalId})\
            WHERE NOT d.is_blocked AND NOT d.deleted AND (NOT p.is_private or p.created_by = $user or p.created_by in $idList)\
            WITH p, d, like, reply, retweet\
            WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
            like, reply, retweet\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
            OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user})\
            OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
            OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
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
                    userRetweeted as userRetweeted\
            SKIP toInteger($offset)\
            LIMIT toInteger($limit)\
            ',
            {id:id,offset:pagination.offset,limit:pagination.limit, is_prohibited:is_prohibited, user:user_id, idList: following})
            const posts = {posts:await this.formatPosts(result)};

            return posts;
        }

        delete = async (post_id: string, user_id: string) : Promise<void> => {
            const post = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS ID\
                MATCH (targetPost: Post {id:ID})\
                RETURN targetPost.created_by as created_by\
                ', {user_id: user_id, post_id:post_id})
            if (post.records.length === 0){
                throw new TwitNotFoundError("No se encontro el twit pedido")
            }
            if (post.records.at(0)?.get("created_by") != user_id){
                throw new InvalidTwitError("El usuario no es el creador del twit");
            }
            await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id})\
                WITH CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS ID\
                MATCH (targetPost: Post {id:ID})\
                SET targetPost.deleted = true\
                WITH targetPost\
                MATCH (targetPost) -[:COMMENTED_BY]-> (d: Post)\
                SET d.origin_post = $delete\
                RETURN targetPost\
                ', {user_id: user_id, post_id:post_id, delete:"deleted"})
        }

        patch = async (twit: editTwit):Promise<void> => {
            const post_from_user = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id, created_by: $user_id})\
                return p\
            ',{post_id:twit.post_id, user_id:twit.token});
            if (post_from_user.records.length == 0){
                throw new InvalidTwitError("No existe el post o el usuario no creo dicho post");
            }
            const result  = await this.auraRepository.executeQuery('\
                MATCH (p:Post {id:$post_id, created_by: $user_id})\
                SET p.message= $new_message, p.tags= $new_tags\
                return p\
            ',{new_message:twit.message,new_tags:twit.tags, post_id:twit.post_id,user_id:twit.token});
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
            console.log(like.summary)
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
                MATCH (targetPost)-[:RETWEETED_BY]-> (c:Post {created_by:$user_id})\
                RETURN c',{post_id:post_id,user_id:user_id});
            if (reposted_already.records.length > 0){
                throw new AlreadyRetwitedError("User already retweeted this post");
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
                                origin_post: $origin_post,\
                                is_private: $is_private,\
                                deleted: $deleted\
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
                deleted:original_post?.deleted
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

        getFavoritesFrom = async (target_id: string, pagination: Pagination, user_id: string,following: Array<string>): Promise<OverViewPost[]> => {
            const result= await this.auraRepository.executeQuery('\
                MATCH (f: Favorite {favored_by: $target_id})\
                MATCH (p:Post {id:f.post_id})\
                WHERE NOT p.is_blocked AND NOT p.deleted AND (NOT p.is_private or p.created_by IN $idList or p.created_by = $user_id)\
                OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
                OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
                OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
                WITH f,p, like, reply, retweet,\
                    CASE WHEN p.is_retweet = true THEN p.origin_post ELSE p.id END AS originalId\
                    \
                OPTIONAL MATCH (d:Post {id: originalId})\
                WHERE NOT d.is_blocked AND NOT d.deleted AND (NOT p.is_private or p.created_by IN $idList or p.created_by = $user_id)\
                WITH p,f, d, like, reply, retweet\
                WITH p,f,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
                like, reply, retweet\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
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
                        userRetweeted as userRetweeted\
                SKIP toInteger($offset)\
                LIMIT toInteger($limit)\
                ',
                {offset:pagination.offset,limit:pagination.limit, target_id:target_id, user_id:user_id,idList:following})
                return this.formatPosts(result)
        }

        getStatsFromPeriod = async (user_id: string, period: string) : Promise<Stats> =>{
            const result = await this.auraRepository.executeQuery('\
                MATCH (p:Post {created_by: $userId})\
                WHERE NOT p.deleted AND NOT p.is_blocked\
                OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
                    WHERE date(like.liked_at) >= date($period)\
                OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
                    WHERE date(reply.created_at) >= date($period)\
                OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
                    WHERE date(retweet.created_at) >= date($period)\
                RETURN COUNT(DISTINCT like) as ammount_likes,\
                        COUNT(DISTINCT retweet) as ammount_retweets,\
                        COUNT(DISTINCT reply) as ammount_comments\
                ',{userId:user_id,period:period})
            const record = result.records.at(0);
            const stats: Stats = {
                likes: Number(record?.get("ammount_likes")),
                comments: Number(record?.get("ammount_comments")),
                shares: Number(record?.get("ammount_retweets"))
            }
            return stats;
        }

        public getCommentsFrom = async (post_id: string, pagination:Pagination,user_id:string): Promise<OverViewPost[]> => {
            return this.getComments(post_id,pagination,user_id);
        }

        public getFeedFor = async (user_id: string, pagination: Pagination, following: Array<string>): Promise<OverViewPosts> =>{
            const result= await this.auraRepository.executeQuery('\
                MATCH (p:Post {is_comment:false})\
                WHERE NOT p.is_blocked AND NOT p.deleted AND p.created_by <> $user_id AND p.created_at > localdatetime() - duration("P7D")\
                        AND (NOT p.is_private or p.created_by IN $idList) \
                OPTIONAL MATCH (p)-[:LIKED_BY]->(like:Like)\
                OPTIONAL MATCH (p)-[:COMMENTED_BY*]->(reply:Post)\
                OPTIONAL MATCH (p)-[:RETWEETED_BY]->(retweet: Post)\
                WITH p, like, reply, retweet,\
                    CASE WHEN p.is_retweet = true THEN p.origin_post ELSE null END AS originalId\
                    \
                OPTIONAL MATCH (d:Post {id: originalId})\
                WHERE NOT d.is_blocked AND NOT d.deleted AND p.created_by <> $user_id AND (NOT p.is_private or p.created_by IN $idList)\
                WITH p, d, like, reply, retweet\
                WITH p,CASE WHEN p.is_retweet = true THEN d ELSE p END AS postData,\
                like, reply, retweet\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(originalLike:Like)\
                OPTIONAL MATCH (postData)-[:LIKED_BY]->(userLiked:Like {liked_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(originalRetweet:Post)\
                OPTIONAL MATCH (postData)-[:COMMENTED_BY*]->(originalReply:Post)\
                OPTIONAL MATCH (f: Favorite {post_id: postData.id, favored_by: $user_id})\
                OPTIONAL MATCH (postData)-[:RETWEETED_BY]->(retweeted: Post {created_by: $user_id})\
                WITH p,postData,like,reply,retweet,originalLike,originalRetweet,originalReply,\
                    CASE WHEN userLiked IS NOT NULL THEN true ELSE false END AS userLikedPost,\
                    CASE WHEN f IS NOT NULL THEN true ELSE false END as userFavedPost,\
                    CASE WHEN retweeted IS NOT NULL THEN true ELSE false END as userRetweeted\
                RETURN DISTINCT postData.id AS post_id,\
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
                        userRetweeted as userRetweeted\
                ORDER BY created_at DESC\
                SKIP toInteger($offset)\
                LIMIT toInteger($limit)\
                ',
                {user_id:user_id,offset:pagination.offset,limit:pagination.limit,idList:following})
                console.log(result.records)
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
                            retweeted: record.get("userRetweeted")

                        };
                posts.push(obj)
            }
            return posts;   
        }


        private getComments = async (post_id:string, pagination: Pagination, user_id: string) => {
            const query = await this.auraRepository.executeQuery('\
                            MATCH (p:Post {id:$post_id}) -[:COMMENTED_BY]->(c:Post)\
                            WHERE NOT c.is_blocked AND NOT c.deleted\
                            OPTIONAL MATCH (c)-[:COMMENTED_BY*]->(reply:Post)\
                            OPTIONAL MATCH (c)-[:RETWEETED_BY]->(retweet: Post)\
                            OPTIONAL MATCH (c)-[:LIKED_BY]->(like:Like)\
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
                                    userFavedPost as FavedPost, c.deleted as deleted, userRetweeted as userRetweeted\
                            SKIP toInteger($offset)\
                            LIMIT toInteger($limit)\
                            ',{post_id,offset:pagination.offset,limit:pagination.limit, user:user_id})
                            
            let coms = this.formatPosts(query)
            return coms
        }
}

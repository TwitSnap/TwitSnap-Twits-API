import { logger, twitController } from './../../../utils/container/container';
import { Twit } from './../../domain/Twit';
import { inject, injectable } from "tsyringe";
import { TwitRepository } from "../../../db/repositories/interfaces/TwitRepository";
import { CommentQuery } from '../../domain/Comment';
import { Pagination } from '../../domain/Pagination';
import { OverViewPost, OverViewPosts } from '../../domain/Post';
import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import { ExternalServiceInternalError } from '../errors/ExternalServiceInternalError';
import { InvalidCredentialsError } from '../errors/InvalidCredentialsError';
import { ExternalServiceConnectionError } from '../errors/ExternalServiceConnectionError';
import { HttpRequester } from '../../../api/external/HttpRequester';
import { USERS_MS_URI } from '../../../utils/config';
import { UserIdMissingError } from '../../../api/errors/UserIdMissingError';

@injectable()
export class TwitService {
    private twitRepository: TwitRepository;
    private httpRequester: HttpRequester;

    constructor(@inject("TwitRepository")twitRepository: TwitRepository,httpRequester: HttpRequester){
        this.twitRepository = twitRepository;
        this.httpRequester = httpRequester;
    }

    public post = async (twit: Twit) => {
        return await this.twitRepository.save(twit);
    }

    public comment = async (comment: CommentQuery) => {
        return await this.twitRepository.comment_post(comment);
    }

    public getPost = async(id: string) => {
        const post = await this.twitRepository.getById(id);
        if (post){
            const user = await this.getRequestForUser(USERS_MS_URI+ "/api/v1/users/",post.created_by);
            if (user){
                post.photo_creator = user.data.photo;
                post.username_creator = user.data.username;
            }

        }
       
        return post;
    }

    public getAllPostsFrom = async(id: string,pagination:Pagination, op_id:string) => {
        let followers_of_op: Array<any> = await this.getAllFollowingOf(op_id);
        let is_prohibited = true;
        followers_of_op.forEach(element => {
            if (element.uid === id){
                is_prohibited = false;
            }
        });
        if (id === op_id){
            is_prohibited = false;
        }
        logger.logInfo("El usuario " + op_id + "Puede o no ver twits: " + is_prohibited)
        let overview = await this.twitRepository.getAllByUserId(id,pagination,is_prohibited);
        let posts = overview?.posts
        await this.getUsersFromPosts(posts);

        
        
        return {posts:posts};

    }

    public likeTwit = async (post_id: string, user_id: string) => {
        return await this.twitRepository.likeTwit(post_id, user_id);
    }

    public retwit = async (post_id: string, user_id: string) => {
        return await this.twitRepository.retwit(post_id, user_id);
    }

    public getCommentsFromPost = async (post_id: string, pagination: Pagination) => {
        let comments = await this.twitRepository.getCommentsFrom(post_id,pagination);
        await this.getUsersFromPosts(comments);
        return comments;
    }

    public getStatsFromPeriod = async (userId: string, period: string) => {
        const per = "P"+period
        const stats = await this.twitRepository.getStatsFromPeriod(userId, per);
        return stats;
    }

    public getFeedFor = async (user_id: string, pagination: Pagination) => {
        //TODO: Agregar un Field que me permita saber los followers y sacar post de ellos primero
        // Si el feed esta vacio busco los mas importantes del dia
        const following: Array<any> = await this.getAllFollowingOf(user_id);
        const list_following = following.map(user => {
            return user.uid;
        })
        logger.logDebug("Los usuarios que sigue " + user_id + "son" + list_following)
        const feed = await this.twitRepository.getFeedFor(user_id, pagination,list_following);
        let posts = feed?.posts
        
        if (posts.length < pagination.limit){
            pagination.offset = 0;
            const importance = await this.twitRepository.getFeedByImportance(user_id,pagination,list_following);
            importance.posts.forEach(post => {
                posts.push(post);
            })
        }
        posts.length = Math.min(pagination.limit,posts.length);
        await this.getUsersFromPosts(posts);
        return {posts:posts};
    }
       /**
     * Handles errors related to the external HTTP request.
     * @param {any} e - The error object from the failed request.
     * @throws {InvalidCredentialsError} If the request returned a 404 status, indicating invalid credentials.
     * @throws {ExternalServiceInternalError} If the request returned any other status, indicating an internal error in the external service.
     * @throws {ExternalServiceConnectionError} If there was a connection issue with the external service.
     */

       private handleRequestError = (e: any): void => {
        if(e.response){
            switch (e.response.status) {
                case HttpStatusCode.NotFound:
                    throw new InvalidCredentialsError("User Id not found.");
                default:
                    throw new ExternalServiceInternalError("An external service has had an internal error.");
            }
        } else if(e.request){
            throw new ExternalServiceInternalError("Timeout while waiting for an external service.");
        } else {
            throw new ExternalServiceConnectionError("Error while connecting to an external service.")
        }
    }


    private getUsersFromPosts = async (posts:OverViewPost[]) => {
        let users = new Map<string, {username:string,photo:string}>();
        const url = USERS_MS_URI + "/api/v1/users/"
        for await (let [idx, post] of posts.entries()){
            try{
                const request = await this.getRequestForUser(url,post.created_by)
                if (request){
                    posts[idx].photo_creator = request.data.photo;
                    posts[idx].username_creator = request.data.username
                    users.set(post.created_by,{username:request.data.username,photo:request.data.photo})
                }
            }
            catch(e){
                if (e instanceof InvalidCredentialsError) {
                    posts[idx].username_creator = "DELETED";
                    continue;
                   } else {
                     throw e; // let others bubble up
                   }
            }

           
        }
           /*
        await Promise.all(posts.map(async (file) => {
            const contents = await this.getRequestForUser(url,file.created_by)
            if (contents){
                file.photo_creator = contents.data.photo;
                file.username_creator = contents.data.username
            }

            console.log(contents)
          }));
          */
        return users;
    }

    private getRequestForUser = async (url:string,id: string) => {
        url = url+id;
        logger.logInfo("Trying to get info from user: "+ url)
        const request = await axios.get(url,{ headers: { user_id:id}}).catch(e => {
            logger.logDebugFromEntity(`Attempt HTTP request
                ID: ${new Date().toISOString()}
                URL: ${url}
                Status: ${e.response?.status}
                Result: FAILED`
            , this.constructor);
            this.handleRequestError(e)
        });
        logger.logDebugFromEntity(`Attempt HTTP request
            ID: ${new Date().toISOString()}
            URL: ${url}
            Status: ${request?.status}
            Result: SUCCESS`
        , this.constructor);
        return request
    }

    private getAllFollowingOf = async (id:string) => {
        const url = USERS_MS_URI + "/api/v1/users/" + id + "/following"
        const request = await axios.get(url, {headers: {user_id:id}}).catch(e => {
            logger.logDebugFromEntity(`Attempt HTTP request
                ID: ${new Date().toISOString()}
                URL: ${url}
                Status: ${e.response?.status}
                Result: FAILED`
            , this.constructor);
            this.handleRequestError(e)
        });
        logger.logDebugFromEntity(`Attempt HTTP request
            ID: ${new Date().toISOString()}
            URL: ${url}
            Status: ${request?.status}
            Result: SUCCESS`
        , this.constructor);
        if (request){
            return request.data.following;
        }
        return [];
    }
}
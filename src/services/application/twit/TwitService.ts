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
        return await this.twitRepository.getById(id);
    }

    public getAllPostsFrom = async(id: string,pagination:Pagination) => {
        
        let overview = await this.twitRepository.getAllByUserId(id,pagination);
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
        for (let [idx, post] of posts.entries()){
            logger.logInfo("Trying to get info from user: "+ post.created_by)
            const request = await axios.get(url+post.created_by).catch(e => {
                logger.logDebugFromEntity(`Attempt HTTP request
                    ID: ${new Date().toISOString()}
                    URL: ${url+post.created_by}
                    Status: ${e.response?.status}
                    Result: FAILED`
                , this.constructor);
                this.handleRequestError(e)
            });
            logger.logDebugFromEntity(`Attempt HTTP request
                ID: ${new Date().toISOString()}
                URL: ${url+post.created_by}
                Status: ${request?.status}
                Result: SUCCESS`
            , this.constructor);
            if (request){
                posts[idx].photo_creator = request.data.photo;
                posts[idx].username_creator = request.data.username
                users.set(post.created_by,{username:request.data.username,photo:request.data.photo})
            }
        }
        return users;
    }
}
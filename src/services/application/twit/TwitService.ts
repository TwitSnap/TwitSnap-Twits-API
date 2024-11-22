import { UserNamePhoto } from './../../domain/UserNamePhoto';
import { logger, twitController } from './../../../utils/container/container';
import { editTwit, Twit } from './../../domain/Twit';
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
import { log } from 'winston';
import { MessageTooLongError } from '../errors/MessageTooLongError';

@injectable()
export class TwitService {
    private twitRepository: TwitRepository;
    private httpRequester: HttpRequester;

    constructor(@inject("TwitRepository")twitRepository: TwitRepository,httpRequester: HttpRequester){
        this.twitRepository = twitRepository;
        this.httpRequester = httpRequester;
    }

    public post = async (twit: Twit) => {
        if (twit.getMessage().length > 280){
            throw new MessageTooLongError("El post tiene un mensaje muy largo");
        }
        return await this.twitRepository.save(twit);
    }

    public comment = async (comment: CommentQuery) => {
        return await this.twitRepository.comment_post(comment);
    }

    public getPost = async(id: string, user_id: string) => {
        const post = await this.twitRepository.getById(id, user_id);
        if (post){
            const user = await this.getRequestForUser(USERS_MS_URI+ "/api/v1/users/",post.created_by);
            if (user){
                post.photo_creator = user.data.photo;
                post.username_creator = user.data.username;
            }
            if (post.deleted){
                post.photo_creator = "https://firebasestorage.googleapis.com/v0/b/twitsnap-82671.appspot.com/o/default_avatar.jpeg?alt=media&token=659cbdba-c47d-47af-83b8-c7da642d739f";
                post.username_creator = "DELETED";
                post.message = "Post Deleted"
            }

        }
       
        return post;
    }

    public getAllPostsFrom = async(id: string,pagination:Pagination, op_id:string) => {
        let lista_de_amigos_seguidos: string[] = []
        let followers_of_op: Array<any> = await this.getAllFollowingOf(op_id);
        let lista_following = this.getFollowingList(followers_of_op);
        let is_prohibited = true;
        lista_following.forEach(element => {
            if (element === id){
                is_prohibited = false;
            }
        });
        if (id === op_id){
            is_prohibited = false;
        }
        logger.logInfo("El usuario " + op_id + "Puede o no ver twits: " + is_prohibited)
        console.log(lista_following);
        let overview = await this.twitRepository.getAllByUserId(id,pagination,is_prohibited,op_id,lista_following);
        let posts = overview?.posts
        await this.getUsersFromPosts(posts);

        
        
        return {posts:posts};

    }

    public editTwit = async (twit:editTwit) => {
        if (twit.message.length > 280){
            throw new MessageTooLongError("El mensaje es muy largo");
        }
        await this.twitRepository.patch(twit);
        return
    }

    public likeTwit = async (post_id: string, user_id: string) => {
        return await this.twitRepository.likeTwit(post_id, user_id);
    }

    public retwit = async (post_id: string, user_id: string) => {
        return await this.twitRepository.retwit(post_id, user_id);
    }

    public saveFavorite = async (user_id:string, post_id: string) => {
        await this.twitRepository.saveFavorite(user_id, post_id);
        return 
    }

    public getCommentsFromPost = async (post_id: string, pagination: Pagination, user_id: string) => {
        let comments = await this.twitRepository.getCommentsFrom(post_id,pagination, user_id);
        await this.getUsersFromPosts(comments);
        return comments;
    }

    public getFavorites = async (user_id:string, target_id: string, pagination: Pagination) => {
        // TODO: AGREGAR UNA REQUEST A USUARIOS PARA VER LOS SETTINGS DE PRIVACIDAD
        const following: Array<any> = await this.getAllFollowingOf(user_id);
        const lista_followers = this.getFollowingList(following);
        let posts = await this.twitRepository.getFavoritesFrom(target_id, pagination,user_id, lista_followers)
        await this.getUsersFromPosts(posts);
        return posts
    }

    public getStatsFromPeriod = async (userId: string, period: string) => {
        const stats = await this.twitRepository.getStatsFromPeriod(userId, period);
        return stats;
    }

    public getFeedFor = async (user_id: string, pagination: Pagination) => {
        const following: Array<any> = await this.getAllFollowingOf(user_id);
        const lista_followers = this.getFollowingList(following);
        console.log(lista_followers);
        const feed = await this.twitRepository.getFeedFor(user_id, pagination,lista_followers);
        let posts = feed?.posts
        console.log(posts)
        logger.logInfo("La cantidad de twits obtenidos es: "+ posts.length);
        await this.getUsersFromPosts(posts);
        return {posts:posts};
    }

    public deleteTwit = async (user_id: string, post_id: string) => {
        await this.twitRepository.delete(post_id,user_id)
    }


    public getRecommendedAccountsFor = async (user_id: string, pagination: Pagination) => {
        const all_countries_locations =await this.getCountries();
        const user_info = await this.getRequestForUser(USERS_MS_URI + "/api/v1/users/",user_id);
        if (user_info){
            console.log(user_info.data);
            const user_interests = user_info.data.interests;
            console.log(user_interests);
            const users_with_similar_interactions = await this.twitRepository.getAccountsFor(user_interests);
            let users = await (await this.getUserData(users_with_similar_interactions)).slice(pagination.offset);
            if (users.length > pagination.limit){
                users.length = pagination.limit;
            }
            return users;
            
        }
        return;
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

    private getUserData = async (ids: string[]) => {
        let users = [];
        const url = USERS_MS_URI + "/api/v1/users/"
        for await (let id of ids){
            try{
                const request = await this.getRequestForUser(url,id);
                if (request){
                    let user: UserNamePhoto = {
                        username: request.data.username,
                        photo: request.data.photo,
                        id: id,
                    }
                    users.push(user)
                }
            }
            catch(e){
                if (e instanceof InvalidCredentialsError) {
                    let user: UserNamePhoto = {
                        username: "DELETED",
                        photo: "https://firebasestorage.googleapis.com/v0/b/twitsnap-82671.appspot.com/o/default_avatar.jpeg?alt=media&token=659cbdba-c47d-47af-83b8-c7da642d739f",
                        id: id
                    }
                    users.push(user);
                    } else {
                     throw e; // let others bubble up
                    }
            }
        }
        return users;
    }


    private getUsersFromPosts = async (posts:OverViewPost[]) => {
        let users = new Map<string, {username:string,photo:string}>();
        const url = USERS_MS_URI + "/api/v1/users/"
        const usuarios = await Promise.all(posts.map(async (file) => {
            try{
                const request = await this.getRequestForUser(url,file.created_by)
                if (request){
                    file.photo_creator = request.data.photo;
                    file.username_creator = request.data.username
                }
                if (file.deleted){
                    file.photo_creator = "https://firebasestorage.googleapis.com/v0/b/twitsnap-82671.appspot.com/o/default_avatar.jpeg?alt=media&token=659cbdba-c47d-47af-83b8-c7da642d739f";
                    file.username_creator = "DELETED";
                    file.message = "Post Deleted"
                }
            }
            catch(e){
                if (e instanceof InvalidCredentialsError) {
                    file.username_creator = "DELETED";
                    file.photo_creator = "https://firebasestorage.googleapis.com/v0/b/twitsnap-82671.appspot.com/o/default_avatar.jpeg?alt=media&token=659cbdba-c47d-47af-83b8-c7da642d739f";
                    return file;
                   } else {
                     throw e; // let others bubble up
                   }
            }

            return file;
          }));
        return usuarios;
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

    private getFollowingList = (lista: any[]): string[] => {
        let lista_amigos: string[] = [];
        lista.forEach(element => {
            lista_amigos.push(element.uid);
        })
        return lista_amigos;
    }

    private getCountries = async () => {
        const request = await axios.get("http://api.geonames.org/countryInfoJSON", {params: {username:"juanhosz"}}).catch(e => {
            logger.logDebugFromEntity(`Attempt HTTP request
                ID: ${new Date().toISOString()}
                URL: ${"http://api.geonames.org/countryInfoJSON"}
                Status: ${e.response?.status}
                Result: FAILED`
            , this.constructor);
            this.handleRequestError(e)
        });
        if (request){
            return request.data;
        }
        return {geonames: []}
    }
}
import { getPostFilteredByTag } from './../../../../test/request_module';
import { Pagination } from './../../domain/Pagination';
import { UserNamePhoto } from '../../domain/UserNamePhoto';
import { logger, twitController } from '../../../utils/container/container';
import { editTwit, Twit } from '../../domain/Twit';
import { inject, injectable } from "tsyringe";
import { TwitRepository } from "../../../db/repositories/interfaces/TwitRepository";
import { CommentQuery } from '../../domain/Comment';
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
import { Utils } from './utils/utils';

@injectable()
export class TwitService {
    private twitRepository: TwitRepository;
    private httpRequester: HttpRequester;
    private utils: Utils

    constructor(@inject("TwitRepository")twitRepository: TwitRepository,httpRequester: HttpRequester){
        this.twitRepository = twitRepository;
        this.httpRequester = httpRequester;
        this.utils = new Utils();
    }

    public post = async (twit: Twit) => {
        if (twit.getMessage().length > 280){
            throw new MessageTooLongError("El post tiene un mensaje muy largo");
        }
        let hashtags = this.utils.extractHashtags(twit.getMessage());
        console.log(hashtags)
        let post =  (await this.twitRepository.save(twit,hashtags))[0];
        let original_poster = await this.utils.getRequestForUser(USERS_MS_URI+ "/api/v1/users/",twit.getToken());
        
        if (!original_poster){
            return post
        }
        logger.logInfo("El usuaro que posteo es: " + original_poster.data.username);
        await this.utils.sendMentionNotifications(post.message,original_poster.data.username);
        return post;
    }

    public comment = async (comment: CommentQuery) => {
        let hashtags = this.utils.extractHashtags(comment.getMessage());
        let comm = await this.twitRepository.comment_post(comment,hashtags);
        let original_poster = await this.utils.getRequestForUser(USERS_MS_URI+ "/api/v1/users/",comment.getToken());
        if (! original_poster){
            return comm
        }
        await this.utils.sendMentionNotifications(comm[0].message,original_poster.data.username)
        return comm;
    }

    public getPost = async(id: string, user_id: string) => {
        const post = await this.twitRepository.getById(id, user_id);
        if (post){
            const user = await this.utils.getRequestForUser(USERS_MS_URI+ "/api/v1/users/",post.created_by);
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
        let followers_of_op: Array<any> = await this.utils.getAllFollowingOf(op_id);
        let lista_following = this.utils.getFollowingList(followers_of_op);
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
        let lista_baneados: string[] = await this.utils.getBannedUsers();
        let overview = await this.twitRepository.getAllByUserId(id,pagination,is_prohibited,op_id,lista_following, lista_baneados);
        let posts = overview?.posts
        await this.utils.getUsersFromPosts(posts);

        
        
        return {posts:posts};

    }

    public editTwit = async (twit:editTwit) => {
        if (twit.message.length > 280){
            throw new MessageTooLongError("El mensaje es muy largo");
        }
        let hashtags = this.utils.extractHashtags(twit.message);
        await this.twitRepository.patch(twit,hashtags);
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
        let lista_baneados = await this.utils.getBannedUsers();
        let comments = await this.twitRepository.getCommentsFrom(post_id,pagination, user_id, lista_baneados);
        await this.utils.getUsersFromPosts(comments);
        return comments;
    }

    public getFavorites = async (user_id:string, target_id: string, pagination: Pagination) => {
        // TODO: AGREGAR UNA REQUEST A USUARIOS PARA VER LOS SETTINGS DE PRIVACIDAD
        const following: Array<any> = await this.utils.getAllFollowingOf(user_id);
        const lista_followers = this.utils.getFollowingList(following);
        let lista_baneados = await this.utils.getBannedUsers();
        let posts = await this.twitRepository.getFavoritesFrom(target_id, pagination,user_id, lista_followers, lista_baneados);
        await this.utils.getUsersFromPosts(posts);
        return posts
    }

    public getStatsFromPeriod = async (userId: string, period: string) => {
        let lista_baneados = await this.utils.getBannedUsers();
        const stats = await this.twitRepository.getStatsFromPeriod(userId, period, lista_baneados);
        return stats;
    }

    public getFeedFor = async (user_id: string, pagination: Pagination) => {
        const following: Array<any> = await this.utils.getAllFollowingOf(user_id);
        const lista_followers = this.utils.getFollowingList(following);
        console.log(lista_followers);
        let lista_baneados = await this.utils.getBannedUsers();
        const feed = await this.twitRepository.getFeedFor(user_id, pagination,lista_followers, lista_baneados);
        let posts = feed?.posts
        console.log(posts)
        logger.logInfo("La cantidad de twits obtenidos es: "+ posts.length);
        await this.utils.getUsersFromPosts(posts);
        return {posts:posts};
    }

    public deleteTwit = async (user_id: string, post_id: string) => {
        await this.twitRepository.delete(post_id,user_id)
    }


    public getRecommendedAccounts = async (user_id: string, pagination: Pagination) => {
        const all_countries_locations =await this.utils.getCountries();
        const user_info = await this.utils.getRequestForUser(USERS_MS_URI + "/api/v1/users/",user_id);
        let lista_baneados = await this.utils.getBannedUsers();
        if (user_info){
            let user_interests: string[] = user_info.data.interests;
            if (user_interests.length == 0){
                let possible_interests = await axios.get(USERS_MS_URI+ "/api/v1/interests/");
                user_interests = possible_interests.data.interests;
            }
            console.log(user_interests);
            const users_with_similar_interactions = await this.twitRepository.getAccountsFor(user_interests, lista_baneados,user_id);
            let users = await (await this.utils.getUserData(users_with_similar_interactions)).slice(pagination.offset);
            if (users.length > pagination.limit){
                users.length = pagination.limit;
            }
            return users;
            
        }
        return;
    }

    public trendingTopics = async(user_id:string, pagination: Pagination) => {
        let lista_baneados = await this.utils.getBannedUsers();
        const activity = await this.twitRepository.getTrendingTopics(user_id, lista_baneados);
        let acti = activity.slice(Number(pagination.offset),Number(pagination.offset)+Number(pagination.limit));
        return acti;
    }

    public filteredByTopic = async (user_id: string, tag_filter:string, pagination: Pagination) => {
        const following: Array<any> = await this.utils.getAllFollowingOf(user_id);
        const lista_followers = this.utils.getFollowingList(following);
        let lista_baneados = await this.utils.getBannedUsers();
        const feed = await this.twitRepository.getTopicsFilteredByTag(user_id, lista_baneados,pagination, tag_filter,lista_followers);
        let posts = feed?.posts
        
        
        await this.utils.getUsersFromPosts(posts);
        logger.logInfo("La cantidad de twits obtenidos es: "+ posts.length);
        return {posts:posts};
    }

    public searchTwits = async (user_id: string,search: string,pagination: Pagination) => {
        const following: Array<any> = await this.utils.getAllFollowingOf(user_id);
        const lista_followers = this.utils.getFollowingList(following);
        let lista_baneados = await this.utils.getBannedUsers();
        if (this.utils.isOnlyHashtag(search)){
            logger.logInfo("Se busca con hashtag Total")
            
            let searching = await this.twitRepository.serachByTotalHashtag(user_id,lista_baneados,pagination,search,lista_followers);

            let posts = searching?.posts
            await this.utils.getUsersFromPosts(posts);
            return {posts:posts}

        }

        else{
            logger.logInfo("Busqueda total o parcial del search string");
            let searching = await this.twitRepository.searchByPartialString(user_id,lista_baneados,pagination,search,lista_followers);
            let posts = searching?.posts
            await this.utils.getUsersFromPosts(posts);
            return {posts:posts}

        }
    }
}
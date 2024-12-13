import { SERVICE_KEY } from './../../../utils/config';
import { OverViewPostAdmin } from './../../domain/PostAdmin';
import axios, { HttpStatusCode } from "axios";
import { injectable, inject } from "tsyringe";
import { HttpRequester } from "../../../api/external/HttpRequester";
import { TwitAdminRepository } from "../../../db/repositories/interfaces/TwitAdminRepository";
import { TwitRepository } from "../../../db/repositories/interfaces/TwitRepository";
import { USERS_MS_URI } from "../../../utils/config";
import { logger } from "../../../utils/container/container";
import { Pagination } from "../../domain/Pagination";
import { OverViewPost } from "../../domain/Post";
import { UserNamePhoto } from "../../domain/UserNamePhoto";
import { ExternalServiceConnectionError } from "../errors/ExternalServiceConnectionError";
import { ExternalServiceInternalError } from "../errors/ExternalServiceInternalError";
import { InvalidCredentialsError } from "../errors/InvalidCredentialsError";

@injectable()
export class TwitAdminService {

    private twitRepository: TwitAdminRepository;
    private httpRequester: HttpRequester;

    constructor(@inject("TwitAdminRepository")twitAdminRepository: TwitAdminRepository,httpRequester: HttpRequester){
        this.twitRepository = twitAdminRepository;
        this.httpRequester = httpRequester;
    }

    public getPost = async (post_id: string) => {
        return await this.twitRepository.getPost(post_id);
    }

    public getAllPosts = async (pagination: Pagination, filter_by_id: boolean,optional_user: string) => {
        let posts = await this.twitRepository.getAllPosts(pagination, filter_by_id, optional_user)
        let ammount_posts = await this.twitRepository.getAmmountPosts(filter_by_id,optional_user);
        return {total_posts: Number(ammount_posts), posts: await this.getUsersFromPosts(posts)};
    }

    public blockPost = async (post_id: string) => {
        return await this.twitRepository.blockPost(post_id);
    }


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

    private getRequestForUser = async (url:string,id: string) => {
        url = url+id;
        logger.logInfo("Trying to get info from user: "+ url)
        const request = await axios.get(url,{ headers: { api_key: SERVICE_KEY,user_id:id}}).catch(e => {
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

    private getUsersFromPosts = async (posts:OverViewPostAdmin[]) => {
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

    
}
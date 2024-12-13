import axios, { HttpStatusCode } from "axios";
import { NOTIF_MS_URI, SERVICE_KEY, USERS_MS_URI } from "../../../../utils/config";
import { logger } from "../../../../utils/container/container";
import { OverViewPost } from "../../../domain/Post";
import { UserNamePhoto } from "../../../domain/UserNamePhoto";
import { ExternalServiceConnectionError } from "../../errors/ExternalServiceConnectionError";
import { ExternalServiceInternalError } from "../../errors/ExternalServiceInternalError";
import { InvalidCredentialsError } from "../../errors/InvalidCredentialsError";

export class Utils {
           /**
     * Handles errors related to the external HTTP request.
     * @param {any} e - The error object from the failed request.
     * @throws {InvalidCredentialsError} If the request returned a 404 status, indicating invalid credentials.
     * @throws {ExternalServiceInternalError} If the request returned any other status, indicating an internal error in the external service.
     * @throws {ExternalServiceConnectionError} If there was a connection issue with the external service.
     */

           public handleRequestError = (e: any): void => {
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
    
        public getUserData = async (ids: string[]) => {
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
    
    
        public getUsersFromPosts = async (posts:OverViewPost[]) => {
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
    
        public getRequestForUser = async (url:string,id: string) => {
            url = url+id;
            logger.logInfo("Trying to get info from user: "+ url)
            const request = await axios.get(url,{ headers: { user_id:id, api_key: SERVICE_KEY}}).catch(e => {
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
    
        public getAllFollowingOf = async (id:string) => {
            const url = USERS_MS_URI + "/api/v1/users/" + id + "/following"
            const request = await axios.get(url, {headers: {user_id:id, api_key: SERVICE_KEY}}).catch(e => {
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
    
        public getFollowingList = (lista: any[]): string[] => {
            let lista_amigos: string[] = [];
            lista.forEach(element => {
                lista_amigos.push(element.uid);
            })
            return lista_amigos;
        }
    
        public getCountries = async () => {
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
    
        public getBannedUsers = async () => {
            const request = await axios.get(USERS_MS_URI+"/api/v1/admin/users", {headers: {api_key: SERVICE_KEY},params: {is_banned:true,offset:0,limit:1000}}).catch( e => {
                logger.logDebugFromEntity(`Attempt HTTP request
                ID: ${new Date().toISOString()}
                URL: ${"http://api.geonames.org/countryInfoJSON"}
                Status: ${e.response?.status}
                Result: FAILED`
            , this.constructor);
            this.handleRequestError(e)
            })
            if (request){
                let array : any[] = request.data.users;
                if (!array){
                    return []
                }
                let lista_baneados: string[] = array.map( user => {
                    return user.uid;
                })
                return lista_baneados
            }
            return []
        }

        public getNonBannedUsers = async () => {
            const request = await axios.get(USERS_MS_URI+"/api/v1/admin/users", {headers: {api_key: SERVICE_KEY},params: {is_banned:false,offset:0,limit:1000}}).catch( e => {
                logger.logDebugFromEntity(`Attempt HTTP request
                ID: ${new Date().toISOString()}
                URL: ${"http://api.geonames.org/countryInfoJSON"}
                Status: ${e.response?.status}
                Result: FAILED`
            , this.constructor);
            this.handleRequestError(e)
            })
            if (request){
                let array : any[] = request.data.users;
                if (!array){
                    return []
                }
                return array
            }
            return []
        }

        public sendMentionNotifications = async (message:string, executor:string) => {
            let usernames = this.extractMentions(message);
            if (usernames.length == 0){
                return;
            }
            let users = await this.getNonBannedUsers();
            let token_users = users.filter( (user) => {
                return usernames.includes(user.username)
            })
            let tokens = token_users.map(user => {
                return user.device_token
            }).flat().filter(token => {
                if (token == 'None'){
                    return false
                }
                return true
            });
            if (tokens.length == 0){
                logger.logInfo("No se notifica a ningun usuario")
                return;
            }
            let body = `Hola! El usuario ${executor} te menciono en un twit!`;
                await axios({
                    method: 'post',
                    url: NOTIF_MS_URI+"/v1/eventNotification",
                    headers: {api_key: SERVICE_KEY},
                    data: 
                        {
                            "type": "push",
                            "params": {
                                "title": "Fuiste mencionado en un twit",
                                "body": body
                            },
                            "notifications": {
                                "type": "push",
                                "destinations": tokens
                            }
                        }
                  }).catch(e=>{
                    this.handleRequestError(e);
                  });
                return
        }

        public extractMentions = (input: string): string[] => {
            const mentionPattern = /@\w+/g;
            let matching = input.match(mentionPattern);
            if (!matching) return []
            let clean_user_names = matching.map(name => {
                return name.slice(1);
            })
            return clean_user_names;
        }

        public isOnlyHashtag = (input: string): boolean => {
            const regex = /^#\w+$/g;
            return regex.test(input);
          }

          public extractHashtags(input: string): string[] {
            const mentionPattern = /#\w+/g;
            return input.match(mentionPattern) || [];
        }
          
}
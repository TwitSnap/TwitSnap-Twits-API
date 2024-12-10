import { Pagination } from './../../services/domain/Pagination';
import { BadRequestError } from './../errors/BadRequestError';
import { NextFunction, Response } from 'express';
import { Request } from 'express';
import { injectable } from "tsyringe";
import { TwitService } from '../../services/application/twit/TwitService';
import { CommentQuery } from '../../services/domain/Comment';
import { editTwit, Twit } from '../../services/domain/Twit';
import { Controller } from "./Controller";
import { HttpResponseSender } from "./HttpResponseSender";
import { logger } from '../../utils/container/container';
import { Pagination } from '../../services/domain/Pagination';
import { UserIdMissingError } from '../errors/UserIdMissingError';
import { TwitAdminService } from '../../services/application/twit/TwitAdminService';


@injectable()
export class TwitAdminController extends Controller{
    private twitService: TwitAdminService;
    constructor(httpResponseSender: HttpResponseSender, twitAdminService: TwitAdminService){
        super(httpResponseSender)
        this.twitService = twitAdminService;
    }

    public getPost = async (req: Request, res: Response, next: NextFunction) => {

        try{
            logger.logDebug("Se recibe una request para obtener un post particular");
            const post_id = this.getQueryFieldOrBadRequestError<string>(req, "post_id");
            logger.logInfo("Se intenta obtener el post con id: " + post_id);
            const posts = await this.twitService.getPost(post_id);
            console.log("El post obtenido es: ");
            console.log(posts);
            return this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }

    }

    public getPosts = async (req: Request, res: Response, next: NextFunction) => {

        try{
            logger.logInfo("Se recibe una request para obtener todos los posts");
            const pagination = this.getPagination(req);
            const optional_user = req.query["user_id"];
            let filter_by_id = false;
            let possible_user = "";
            if (optional_user){
                
                filter_by_id = true;
                possible_user = String(optional_user);
                logger.logInfo("La request para obtener los posts de: " + possible_user);
            }
            
            const posts = await this.twitService.getAllPosts(pagination,filter_by_id,possible_user);
            console.log("los post obtenidos son: ");
            console.log(posts);
            return this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }

    }

    public blockTwit = async (req: Request, res: Response, next: NextFunction) =>  {
        try{
            const post_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            logger.logInfo("Se recibe una request para borrar el post: " + post_id);
            await this.twitService.blockPost(post_id);
            return this.okNoContentResponse(res);
        }
        catch (e){
            next(e)
        }
    }

    public healthCheck =async (req: Request, res: Response, next: NextFunction) =>  {
        try{
            logger.logInfo("Se recibe una request para obtener todos los posts");
            const pagination: Pagination = {
                offset:0,
                limit:1,
            };
            const optional_user = undefined;
            let filter_by_id = false;
            let possible_user = "";
            if (optional_user){
                
                filter_by_id = true;
                possible_user = String(optional_user);
            }
            
            const posts = await this.twitService.getAllPosts(pagination,filter_by_id,possible_user);
            return this.okNoContentResponse(res);
        }
        catch(e){
            next(e)
        }
    }
    private getPagination = (req: Request) => {
        const offset = this.getQueryFieldOrBadRequestError<number>(req,"offset");
        const limit = this.getQueryFieldOrBadRequestError<number>(req,"limit");
        const pag: Pagination = {
            offset:offset,
            limit:limit,
        }
        return pag;
    }

}
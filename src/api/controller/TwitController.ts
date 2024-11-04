import { BadRequestError } from './../errors/BadRequestError';
import { NextFunction, Response } from 'express';
import { Request } from 'express';
import { injectable } from "tsyringe";
import { TwitService } from '../../services/application/twit/TwitService';
import { CommentQuery } from '../../services/domain/Comment';
import { Twit } from '../../services/domain/Twit';
import { Controller } from "./Controller";
import { HttpResponseSender } from "./HttpResponseSender";
import axios from 'axios';
import { AUTH_MS_URI, CLIENT_SECRET } from '../../utils/config';
import { logger } from '../../utils/container/container';
import { Pagination } from '../../services/domain/Pagination';
import { UserIdMissingError } from '../errors/UserIdMissingError';


@injectable()
export class TwitController extends Controller{
    private twitService: TwitService;
    constructor(httpResponseSender: HttpResponseSender, twitService: TwitService){
        super(httpResponseSender)
        this.twitService = twitService;
    }

    public postTwit = async (req: Request, res: Response,next: NextFunction) => {


        try{
            const user_id  = await this.obtainIdFromToken(req);
            const t_tags = this.getFieldOrBadRequestError<string[]>(req,"tags")
            const t_body = this.getFieldOrBadRequestError<string>(req,"body")
            var is_private;
            if (req.body.is_private){
                is_private = this.getFieldOrBadRequestError<boolean>(req,"is_private");
            }
            else{
                is_private = false;
            }
            const body = new Twit(t_body,t_tags,user_id,is_private);
            
            const {records,summary} =  await this.twitService.post(body);
            logger.logInfo("Posted Twit from user: " + user_id)
            console.log(summary);
            this.okNoContentResponse(res);
            return;
        }
        catch(e){
            next(e)
        }

    }

    public retwit = async (req: Request, res: Response,next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            logger.logInfo("User: " + user_id + "Attempting to retwit")
            const retwit_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            logger.logInfo("Attemptin to retwit post: "+ retwit_id)
            await this.twitService.retwit(retwit_id,user_id);
            return this.okNoContentResponse(res);
        }catch(e){
            next(e)
        }
    }

    public like = async (req: Request, res: Response,next: NextFunction) => {
        logger.logInfo("Liking a Post")
        try{
            const user_id = await this.obtainIdFromToken(req);
            logger.logInfo("User: " + user_id + "Attempting to like")
            const twit_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            logger.logInfo("Attempting to like: " + twit_id)
            await this.twitService.likeTwit(twit_id,user_id);
            return this.okNoContentResponse(res);
        }
        catch(e){
            next(e)
        }
    }

    public comment = async (req: Request, res: Response,next: NextFunction) => {
        logger.logInfo("Commenting a post")
        try{
            const user_id = await this.obtainIdFromToken(req);
            logger.logInfo("Comment Posted by user: " + user_id)
            const c_body = this.getFieldOrBadRequestError<string>(req,"body");
            const c_post_id = this.getFieldOrBadRequestError<string>(req,"post_id");
            const c_tags = this.getFieldOrBadRequestError<string[]>(req,"tags");
            //const body = new CommentQuery(req.body.body,req.body.post_id,user_id)
            const body = new CommentQuery(c_body,c_post_id,user_id,c_tags);
            const {records,summary} = await this.twitService.comment(body);
            console.log(summary)
            this.okNoContentResponse(res)
            return
        }catch(e){
            next(e)
        }


    }

    public getPost = async (req: Request, res: Response,next: NextFunction) => {
        try{
        
            if (! req.query.id){
                throw new BadRequestError("");
            }
            const id = this.getQueryFieldOrBadRequestError<string>(req,"id");
            //const id = req.query.id as string;
            logger.logInfo("Getting info of post: " + id);
            const post = await this.twitService.getPost(id);
            console.log(post);
            this.okResponse(res,post);
        }
        catch(e){
            next(e)
        }

    }

    public getAllPostsFromUser = async (req: Request, res: Response,next: NextFunction) => {
        
        try{
            const op_id = await this.obtainIdFromToken(req);
            const id = this.getQueryFieldOrBadRequestError<string>(req,"user_id");
            //const id = req.query.user_id as string;
            const pagination = this.getPagination(req);
            logger.logInfo("Trying to retrieve all post from user: "+ id)
            const posts = await this.twitService.getAllPostsFrom(id,pagination,op_id);
            console.log(posts);
            this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }

    }

    public editPost = async (req: Request, res: Response,next: NextFunction) =>{
        try{

        }
        catch(e){
            next(e)
        }
    }

    public getCommentsFromPost = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const post_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            const pagination = this.getPagination(req);
            const comments = await this.twitService.getCommentsFromPost(post_id,pagination);
            console.log(comments);
            return this.okResponse(res,comments);
        }
        catch(e){
            next(e)
        }
    }

    public deletePost = async (req:Request, res:Response, next: NextFunction) => {
        try{
            const userId = this.getQueryFieldOrBadRequestError<string>(req,"user_id");
            const post_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
        }
        catch(e){
            next(e);
        }
    }

    public getStats = async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const userId = await this.obtainIdFromToken(req);
            const period = this.getQueryFieldOrBadRequestError<string>(req,"period");
            logger.logInfo("Se intenta buscar los stats del usuario " + userId)
            const result = await this.twitService.getStatsFromPeriod(userId, period);
            logger.logInfo(JSON.stringify(result));
            return this.okResponse(res,result);
        }
        catch(e){
            next(e);
        }
    }

    public getFeed = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            const pagination = this.getPagination(req);
            logger.logInfo("Se intenta Buscar el feed del usuario: " + user_id)
            const result = await this.twitService.getFeedFor(user_id,pagination);
            logger.logInfo(JSON.stringify(result));
            return this.okResponse(res,result);
        }
        catch(e){
            next(e)
        }
    }

    private obtainIdFromToken = async (req:Request) => {
        logger.logInfo("Request header is " + JSON.stringify(req.headers));
        const userId = req.headers.user_id as string;
        
        if (! userId){
            throw new UserIdMissingError("userid Empty");
        }
        logger.logInfo("Received User ID: " + userId +" From GateWay");
        return userId;
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
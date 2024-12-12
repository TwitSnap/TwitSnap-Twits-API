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


@injectable()
export class TwitController extends Controller{
    private twitService: TwitService;
    constructor(httpResponseSender: HttpResponseSender, twitService: TwitService){
        super(httpResponseSender)
        this.twitService = twitService;
    }

    public postTwit = async (req: Request, res: Response, next: NextFunction) => {

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
            
            const post =  await this.twitService.post(body);
            logger.logInfo("Posted Twit from user: " + user_id)
            console.log(post);
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
            const com = await this.twitService.comment(body);
            console.log(com)
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
            const user_id = await this.obtainIdFromToken(req)
            const id = this.getQueryFieldOrBadRequestError<string>(req,"id");
            //const id = req.query.id as string;
            logger.logInfo("Getting info of post: " + id);
            const post = await this.twitService.getPost(id,user_id);
            console.log(post);
            this.okResponse(res,post);
        }
        catch(e){
            next(e)
        }

    }

    public saveFavorite = async (req: Request, res: Response,next: NextFunction) => {
        try{
            const op_id = await this.obtainIdFromToken(req);
            const post_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            await this.twitService.saveFavorite(op_id, post_id);
            return this.okNoContentResponse(res);
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
            logger.logInfo("Se recibio una peticion de editar post")
            const user_id = await this.obtainIdFromToken(req);
            const c_body = this.getFieldOrBadRequestError<string>(req,"body");
            const c_post_id = this.getFieldOrBadRequestError<string>(req,"post_id");
            const c_tags = this.getFieldOrBadRequestError<string[]>(req,"tags");
            logger.logInfo("Requested: " + user_id)
            logger.logInfo("Post a editar: " + c_post_id)
            const twit: editTwit = {
                message: c_body,
                token: user_id,
                post_id:c_post_id,
                is_private:false,
                tags:c_tags,
            };
            await this.twitService.editTwit(twit);
            return this.okNoContentResponse(res);
            
        }
        catch(e){
            next(e)
        }
    }

    public getCommentsFromPost = async (req: Request, res: Response, next: NextFunction) => {
        try{
            logger.logInfo("Se recibio una peticion de obtener comentarios de un post")
            const user_id = await this.obtainIdFromToken(req);
            const post_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            const pagination = this.getPagination(req);
            const comments = await this.twitService.getCommentsFromPost(post_id,pagination,user_id);
            console.log(comments);
            return this.okResponse(res,comments);
        }
        catch(e){
            next(e)
        }
    }

    public getFavorites = async (req: Request, res: Response, next: NextFunction) => {
        try{
            logger.logInfo("Se recibio peticion de obtener los favoritos de un usuario")
            const user_id = await this.obtainIdFromToken(req);
            const target_id = this.getQueryFieldOrBadRequestError<string>(req,"user");
            const pagination = this.getPagination(req);
            const posts = await this.twitService.getFavorites(user_id,target_id,pagination);
            return this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }
    }

    public deletePost = async (req:Request, res:Response, next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            const post_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            await this.twitService.deleteTwit(user_id, post_id);
            return this.okNoContentResponse(res)
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
            return this.okResponse(res,result);
        }
        catch(e){
            next(e)
        }
    }

    public getRecommendedAccounts = async  (req: Request, res: Response, next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            const pagination = this.getPagination(req);
            logger.logInfo("Se busca  "+ user_id);
            const accounts = await this.twitService.getRecommendedAccounts(user_id,pagination);
            return this.okResponse(res,accounts);
        }
        catch(e){
            next(e);
        }
    }

    public trendingTopics = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            logger.logInfo("Tryning to get trending topics for: " + user_id);
            const pagination = this.getPagination(req)
            let topics_activity = await this.twitService.trendingTopics(user_id, pagination);
            return this.okResponse(res,topics_activity);
        }
        catch(e){
            next(e)
        }
    }

    public getFilteredPosts = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            logger.logInfo("Tryning to get trending filtered_posts for: " + user_id);
            const tag_filter = this.getQueryFieldOrBadRequestError<string>(req,"tag");
            const pagination = this.getPagination(req);
            let posts = await this.twitService.filteredByTopic(user_id,tag_filter, pagination);
            return this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }
    }

    public searchTwits = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            logger.logInfo("Trying to get twits for:" + user_id);
            const search = this.getQueryFieldOrBadRequestError<string>(req,"search");
            logger.logInfo("Trying to get twits for:" + user_id + "with search: " + search);
            const pagination = this.getPagination(req);
            let posts = await this.twitService.searchTwits(user_id,search,pagination);
            return this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }
    }


    private obtainIdFromToken = async (req:Request) => {
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
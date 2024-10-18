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
            logger.logInfo("Posted Twit from user: " + user_id)
            const t_tags = this.getFieldOrBadRequestError<string[]>(req,"tags")
            const t_body = this.getFieldOrBadRequestError<string>(req,"body")
            const body = new Twit(t_body,t_tags,user_id);
            const {records,summary} =  await this.twitService.post(body);
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
            const retwit_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            await this.twitService.retwit(retwit_id,user_id);
            return this.okNoContentResponse(res);
        }catch(e){
            next(e)
        }
    }

    public like = async (req: Request, res: Response,next: NextFunction) => {
        try{
            const user_id = await this.obtainIdFromToken(req);
            const twit_id = this.getQueryFieldOrBadRequestError<string>(req,"post_id");
            await this.twitService.likeTwit(twit_id,user_id);
            return this.okNoContentResponse(res);
        }
        catch(e){
            next(e)
        }
    }

    public comment = async (req: Request, res: Response,next: NextFunction) => {

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
            const id = this.getQueryFieldOrBadRequestError<string>(req,"user_id");
            //const id = req.query.user_id as string;
            logger.logInfo("Trying to retrieve all post from user: "+ id)
            const posts = await this.twitService.getAllPostsFrom(id);
            console.log(posts);
            this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }

    }

    public editPost = async (req: Request, res: Response,next: NextFunction) =>{

    }

    private obtainIdFromToken = async (req:Request) => {
        const header = req.header("Authorization") || "";
        const token = header.split(" ")[1];
        const response =  await axios.post(AUTH_MS_URI+"/v1/auth/decrypt",{
            token:token
        });
        return response.data.user_id;
    }

}
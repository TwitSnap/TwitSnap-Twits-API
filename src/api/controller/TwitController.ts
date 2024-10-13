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
import { AUTH_MS_URI } from '../../utils/config';
import { logger } from '../../utils/container/container';


@injectable()
export class TwitController extends Controller{
    private twitService: TwitService;
    constructor(httpResponseSender: HttpResponseSender, twitService: TwitService){
        super(httpResponseSender)
        this.twitService = twitService;
    }

    public postTwit = async (req: Request, res: Response,next: NextFunction) => {

        const user_id  = await this.obtainIdFromToken(req);
        logger.logInfo("Posted Twit from user: " + user_id)
        try{
            console.log(req.body.tags);
            const body = new Twit(req.body.body,req.body.tags,user_id);
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

    }

    public like = async (req: Request, res: Response,next: NextFunction) => {

    }

    public comment = async (req: Request, res: Response,next: NextFunction) => {
        const user_id = await this.obtainIdFromToken(req);
        logger.logInfo("Comment Posted by user: " + user_id)
        try{
            const body = new CommentQuery(req.body.body,req.body.post_id,user_id)
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
            const id = req.query.id as string;
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
            if (!req.query.id){
                throw new BadRequestError("");
            }
            const id = req.query.user_id as string;
            logger.logInfo("Trying to retrieve all post from user: "+ id)
            const posts = await this.twitService.getAllPostsFrom(id);
            console.log(posts);
            this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }

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
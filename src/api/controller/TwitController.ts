import { BadRequestError } from './../errors/BadRequestError';
import { NextFunction, Response } from 'express';
import { Request } from 'express';
import { injectable } from "tsyringe";
import { TwitService } from '../../services/application/twit/TwitService';
import { CommentQuery } from '../../services/domain/Comment';
import { Twit } from '../../services/domain/Twit';
import { Controller } from "./Controller";
import { HttpResponseSender } from "./HttpResponseSender";


@injectable()
export class TwitController extends Controller{
    private twitService: TwitService;
    constructor(httpResponseSender: HttpResponseSender, twitService: TwitService){
        super(httpResponseSender)
        this.twitService = twitService;
    }

    public postTwit = async (req: Request, res: Response,next: NextFunction) => {
        try{
            console.log(req.body.tags);
            const body = new Twit(req.body.body,req.body.tags,req.body.token);
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
        try{
            const body = new CommentQuery(req.body.body,req.body.post_id,req.body.token)
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
            const id = req.query.id as string;
            const posts = await this.twitService.getAllPostsFrom(id);
            console.log(posts);
            this.okResponse(res,posts);
        }
        catch(e){
            next(e)
        }

    }

}
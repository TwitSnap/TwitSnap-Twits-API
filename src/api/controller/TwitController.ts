import { Response } from 'express';
import { Request } from 'express';
import { injectable } from "tsyringe";
import { TwitService } from '../../services/application/twit/TwitService';
import { Comment } from '../../services/domain/Comment';
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

    public postTwit = async (req: Request, res: Response) => {
        const body = new Twit(req.body.body,req.body.tags,req.body.token);
        const {records,summary} =  await this.twitService.post(body);
        console.log(summary);
        this.okNoContentResponse(res);
        return;
    }

    public retwit = async (req: Request, res: Response) => {

    }

    public like = async (req: Request, res: Response) => {

    }

    public comment = async (req: Request, res: Response) => {
        const body = new Comment(req.body.body,req.body.post_id,req.body.token)
        const {records,summary} = await this.twitService.comment(body);
        console.log(summary)
        this.okNoContentResponse(res)
        return

    }

    public getPost = async (req: Request, res: Response) => {
        console.log(req.query.id);
    }

}
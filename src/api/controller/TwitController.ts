import { Response } from 'express';
import { Request } from 'express';
import { injectable } from "tsyringe";
import { Controller } from "./Controller";
import { HttpResponseSender } from "./HttpResponseSender";


@injectable()
export class TwitController extends Controller{
    constructor(httpResponseSender: HttpResponseSender){
        super(httpResponseSender)
    }

    public post_twit = async (req: Request, res: Response) => {

    }

    public retwit = async (req: Request, res: Response) => {

    }

    public like = async (req: Request, res: Response) => {

    }

    public comment = async (req: Request, res: Response) => {

    }

}
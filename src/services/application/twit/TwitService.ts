import { twitController } from './../../../utils/container/container';
import { Twit } from './../../domain/Twit';
import { inject, injectable } from "tsyringe";
import { TwitRepository } from "../../../db/repositories/interfaces/TwitRepository";
import { Comment } from '../../domain/Comment';

@injectable()
export class TwitService {
    private twitRepository: TwitRepository;

    constructor(@inject("TwitRepository")twitRepository: TwitRepository){
        this.twitRepository = twitRepository;
    }

    public post = async (twit: Twit) =>{
        return await this.twitRepository.save(twit);
    }

    public comment = async (comment: Comment) =>{
        return await this.twitRepository.comment_post(comment);
    }

    public getPost = async(id:string) =>{
        return await this.twitRepository.getById(id);
    }
}
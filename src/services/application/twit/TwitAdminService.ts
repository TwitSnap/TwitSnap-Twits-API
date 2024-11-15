import { injectable, inject } from "tsyringe";
import { HttpRequester } from "../../../api/external/HttpRequester";
import { TwitAdminRepository } from "../../../db/repositories/interfaces/TwitAdminRepository";
import { TwitRepository } from "../../../db/repositories/interfaces/TwitRepository";
import { Pagination } from "../../domain/Pagination";

@injectable()
export class TwitAdminService {

    private twitRepository: TwitAdminRepository;
    private httpRequester: HttpRequester;

    constructor(@inject("TwitAdminRepository")twitAdminRepository: TwitAdminRepository,httpRequester: HttpRequester){
        this.twitRepository = twitAdminRepository;
        this.httpRequester = httpRequester;
    }

    public getPost = async (post_id: string) => {
        return await this.twitRepository.getPost(post_id);
    }

    public getAllPosts = async (pagination: Pagination, filter_by_id: boolean,optional_user: string) => {
        return await this.twitRepository.getAllPosts(pagination, filter_by_id, optional_user)
    }

    public blockPost = async (post_id: string) => {
        return await this.twitRepository.blockPost(post_id);
    }
}
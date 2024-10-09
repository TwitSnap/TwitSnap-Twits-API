import { inject, injectable } from "tsyringe";
import { TwitRepository } from "../../../db/repositories/interfaces/TwitRepository";

@injectable()
class TwitService {
    twitRepository: TwitRepository;

    constructor(@inject("UserRepository") twitRepository: TwitRepository){
        this.twitRepository = twitRepository;
    }
}
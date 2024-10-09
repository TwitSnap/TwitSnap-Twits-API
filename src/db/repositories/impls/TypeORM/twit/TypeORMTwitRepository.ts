import { TwitRepository } from "../../../interfaces/TwitRepository";
import { TypeORMRepository } from "../TypeORMRepository";
import { Twit } from "../../../../../services/domain/Twit";
import { StandardDatabaseError } from "../../../../errors/StandardDatabaseError";

export class TypeORMTwitRepository extends TypeORMRepository<Twit> implements TwitRepository {
    constructor() {
        super(Twit);
    }

    /**
     * @inheritDoc
     */
    getById = async (id: string): Promise<Twit | null> => {
        try {
            return await this.typeOrmRepository.createQueryBuilder("Twit")
            .where("Twit.id = :id", { id })
            .getOne();
        } catch (error: any) {
            throw new StandardDatabaseError(error.message);
        }
    };

    /**
     * @inheritDoc
     */
    save = async (Twit: Twit): Promise<Twit> => {
        try {
            return await this.typeOrmRepository.save(Twit);
        } catch (error: any) {
            throw new StandardDatabaseError(error.message);
        }
    };
}

import { AuraDataSource } from '../../../connectors/dataSource';
import * as neo4j from "neo4j-driver";

export abstract class AuraRepository {
    protected auraRepository: neo4j.Driver;

    /**
     * Creates an instance of the `TypeORMRepository` class.
     *
     * @param entity - The target entity class or entity name for which the repository is created.
     *
     * Initializes the `typeOrmRepository` with the repository for the specified entity.
     */
    protected constructor() {
        this.auraRepository = AuraDataSource;
    }
}
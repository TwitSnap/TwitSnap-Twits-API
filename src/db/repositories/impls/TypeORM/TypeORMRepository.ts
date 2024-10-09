import {EntityTarget, ObjectLiteral, Repository} from "typeorm";
import {databaseConnector} from "../../../../utils/container/container";

/**
 * Abstract class for TypeORM-based repositories.
 *
 * This class provides a base implementation for repositories using TypeORM. It manages
 * a TypeORM repository instance for a given entity type.
 *
 * @template T - The type of the entity managed by this repository, extending `ObjectLiteral`.
 */
export abstract class TypeORMRepository<T extends ObjectLiteral> {
    protected typeOrmRepository: Repository<T>;

    /**
     * Creates an instance of the `TypeORMRepository` class.
     *
     * @param entity - The target entity class or entity name for which the repository is created.
     *
     * Initializes the `typeOrmRepository` with the repository for the specified entity.
     */
    protected constructor(entity: EntityTarget<T>) {
        this.typeOrmRepository = databaseConnector.getDataSource().getRepository(entity);
    }
}
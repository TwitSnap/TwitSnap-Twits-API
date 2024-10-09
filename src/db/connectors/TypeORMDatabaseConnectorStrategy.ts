import {DatabaseConnectorStrategy} from "./DatabaseConnectorStrategy";
import {DataSource} from "typeorm";
import {AppDataSource} from "./dataSource";

/**
 * Concrete implementation of the `DatabaseConnectorStrategy` interface for TypeORM.
 *
 * This class provides methods for initializing the TypeORM connection and retrieving
 * the data source instance. It uses a `readonly` instance of `DataSource` to manage
 * the database connection.
 */
export class TypeORMDatabaseConnectorStrategy implements DatabaseConnectorStrategy<DataSource, DataSource> {
    private readonly _instance: DataSource;

    constructor() {
        this._instance = AppDataSource;
    }

    /**
     *  @inheritDoc
     */
    public initializeConnection = async (): Promise<DataSource> => {
        return this.instance.initialize();
    };


    /**
     *  @inheritDoc
     */
    public getDataSource = (): DataSource => {
        return this.instance;
    };

    /**
     *  @inheritDoc
     */
    public shutdownConnection = (): Promise<void> => {
        return this.instance.destroy();
    };

        /**
     * Gets the `DataSource` instance.
     *
     * This method returns the `readonly` `_instance` of `DataSource`.
     *
     * @returns {DataSource} The `readonly` `DataSource` instance.
     */
    private get instance(): DataSource {
        return this._instance;
    }
}

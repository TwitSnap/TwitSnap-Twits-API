import { DataSource } from "typeorm";
import { DatabaseConnectorStrategy } from "./DatabaseConnectorStrategy";
import { AppDataSource } from "./dataSource";

export class AuraDatabaseConnectorStrategy implements DatabaseConnectorStrategy<DataSource, DataSource> {
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
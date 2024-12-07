import { inject, injectable } from 'tsyringe';
import { DatabaseConnectorStrategy } from "./DatabaseConnectorStrategy";
import * as neo4j from "neo4j-driver";
import { logger } from '../../utils/container/container';

@injectable()
export class AuraDatabaseConnectorStrategy implements DatabaseConnectorStrategy<neo4j.Driver, neo4j.Driver> {
    private readonly _instance: neo4j.Driver;

    constructor(@inject("AuraDriver") AuraDataSource: neo4j.Driver) {
        this._instance = AuraDataSource;
    }

    /**
     *  @inheritDoc
     */
    public initializeConnection = async (): Promise<neo4j.Driver> => {
        console.log("Se inicializa con aura db");
        console.log("Y los datos de la conexion son: ");
        logger.logDebug(String(await (await this._instance.getServerInfo()).address));
        return this.instance;
    };


    /**
     *  @inheritDoc
     */
    public getDataSource = (): neo4j.Driver => {
        return this._instance;
    };

    /**
     *  @inheritDoc
     */
    public shutdownConnection = (): Promise<void> => {
        return this.instance.close();
    };

        /**
     * Gets the `DataSource` instance.
     *
     * This method returns the `readonly` `_instance` of `DataSource`.
     *
     * @returns {DataSource} The `readonly` `DataSource` instance.
     */
    private get instance(): neo4j.Driver {
        return this._instance;
    }
}
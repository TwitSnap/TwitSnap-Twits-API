import {DatabaseConnectorStrategy} from "./DatabaseConnectorStrategy";
import {inject, injectable} from "tsyringe";
import {logger} from "../../utils/container/container";

/**
 * A generic class that manages database connections using a specified strategy.
 *
 * This class uses a `DatabaseConnectorStrategy` to handle the database connection logic.
 * It provides methods to initialize the connection and retrieve the data source.
 *
 * @template T - Type of the database connection instance.
 * @template Y - Type of the data source.
 */
@injectable()
export class DatabaseConnector<T, Y> {
    private _strategy: DatabaseConnectorStrategy<T, Y>

    constructor(@inject("DatabaseConnectorStrategy") strategy: DatabaseConnectorStrategy<T, Y>) {
        this._strategy = strategy;
    }

    /**
     * Initializes the database connection.
     *
     * This method calls the `initializeConnection` method of the strategy and logs the result.
     * It also handles and logs any errors that occur during the connection process.
     *
     * @returns {Promise<void>} A promise that resolves when the database connection is successfully initialized.
     * @throws {Error} Throws an error if the connection fails.
     */
    public initializeConnection = async (): Promise<void> => {
        return await this._strategy.initializeConnection().then(() => {
            logger.logInfo("Database connected");
        } ).catch((error) => {
            logger.logError(`Failed to connect to database: ${error}. Exiting...`);
            process.exit(1);
        });
    }

    /**
     * Retrieves the data source instance.
     *
     * This method returns the data source managed by the strategy.
     *
     * @returns {Y} The data source instance.
     */
    public getDataSource = (): Y => {
        return this._strategy.getDataSource();
    }

    /**
     * Shuts down the database connection.
     *
     * This method calls the `shutdownConnection` method of the strategy and logs the result.
     * It also handles and logs any errors that occur during the shutdown process.
     *
     * @returns {Promise<void>} A promise that resolves when the database connection is successfully closed.
     * @throws {Error} Throws an error if the shutdown fails.
     */
    public shutdownConnection = async (): Promise<void> => {
        return await this._strategy.shutdownConnection().then(() => {
            logger.logInfo("Database connection closed");
        }).catch((error) => {
            logger.logError(`Failed to close database connection: ${error}`);
            throw error;
        });
    }
}
import {DataSource, DataSourceOptions} from "typeorm";
import {DB_NAME, DB_HOST, DB_LOGGING, DB_PASSWORD, DB_PORT, DB_SYNCHRONIZE, DB_TYPE, DB_USERNAME} from "../../utils/config";
import {Twit} from "../../services/domain/Twit";

/**
 * The data source for TypeORM, configured with the database connection settings.
 */
export const AppDataSource = new DataSource(getDatabaseConfig());

/**
 * Retrieves the database configuration for TypeORM.
 *
 * Converts environment variables into a configuration object for the database connection.
 * EnvVars should be checked before using this function.
 *
 * @returns {DataSourceOptions} The configuration object for TypeORM.
 */
export function getDatabaseConfig(): DataSourceOptions {
    const dbType = DB_TYPE as "postgres"; //TODO: Esta linea hace ruido.
    const dbPort = parseInt(DB_PORT as string);
    const dbSynchronize = DB_SYNCHRONIZE === "true";
    const dbLogging = DB_LOGGING === "true";

    return {
        type: dbType,
        host: DB_HOST,
        port: dbPort,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME,
        synchronize: dbSynchronize,
        logging: dbLogging,
        entities: [Twit],
        ssl:true
    };
}
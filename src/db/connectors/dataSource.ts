import {DataSource, DataSourceOptions} from "typeorm";
import {DB_NAME, DB_HOST, DB_LOGGING, DB_PASSWORD, DB_PORT, DB_SYNCHRONIZE, DB_TYPE, DB_USERNAME} from "../../utils/config";
import {Twit} from "../../services/domain/Twit";
import * as neo4j from "neo4j-driver";
/**
 * The data source for TypeORM, configured with the database connection settings.
 */
export const AppDataSource = new DataSource(getDatabaseConfig());


export let AuraDataSource: neo4j.Driver;
if (process.env.NODE_ENV === "test"){
    console.log("Son pruebas");
    const URI = 'neo4j+s://5cc615e7.databases.neo4j.io';
    const USER = "neo4j";
    const PASSWORD = "8OAPUxxVWs3_QOB8pIZmTf9qDW4bLM5vKBR8zRWGXm8";
    const newAuraDriver = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));
    AuraDataSource = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));
}
else{
    const URI = 'neo4j+s://6c984834.databases.neo4j.io'
    const USER = 'neo4j'
    const PASSWORD = 'W-cBcC_cILMwOnGYW3GN1cVjZ7WaHziBURguYziakFU';
    console.log("No son pruebas");
    AuraDataSource = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));

}
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
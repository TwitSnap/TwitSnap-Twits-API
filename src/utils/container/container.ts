import { AuraTwitRepository } from './../../db/repositories/impls/Aura/AuraTwitRepository';

import { container } from "tsyringe";
import "reflect-metadata";
import {DatabaseConnector} from "../../db/connectors/DatabaseConnector";
import {Logger} from "../logger/Logger";
import {LoggingStrategy} from "../logger/LoggingStrategy";
import {WinstonLoggerStrategy} from "../logger/WinstonLoggerStrategy";
import {TypeORMDatabaseConnectorStrategy} from "../../db/connectors/TypeORMDatabaseConnectorStrategy";
import {DatabaseConnectorStrategy} from "../../db/connectors/DatabaseConnectorStrategy";
import {DataSource} from "typeorm";
import {LOGGING, LOG_DEBUG, LOG_ERROR, LOG_INFO} from "../config";
import { TwitRepository } from "../../db/repositories/interfaces/TwitRepository";
import { TwitController } from "../../api/controller/TwitController";
import { HttpRequester } from '../../api/external/HttpRequester';

// ? Register all dependencies

container.register<LoggingStrategy>("LoggingStrategy", { useClass: WinstonLoggerStrategy});
container.register<boolean>("logging", {useValue: (LOGGING === "true") });
container.register<boolean>("logDebug", {useValue: (LOG_DEBUG === "true") });
container.register<boolean>("logError", {useValue: (LOG_ERROR === "true") });
container.register<boolean>("logInfo", {useValue: (LOG_INFO === "true") });

container.register<DatabaseConnectorStrategy<DataSource, DataSource>>("DatabaseConnectorStrategy", TypeORMDatabaseConnectorStrategy);
container.register<TwitRepository>("TwitRepository", AuraTwitRepository);
container.register<HttpRequester>("HttpRequester",HttpRequester);
// ? Get instances
export const logger = container.resolve(Logger);
export const databaseConnector = container.resolve(DatabaseConnector<DataSource, DataSource>);
export const twitController = container.resolve(TwitController);
export const userService = null;
export const sessionService = null;
export const federateAuthController = null;
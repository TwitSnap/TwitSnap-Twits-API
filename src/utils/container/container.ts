import { AuraDatabaseConnectorStrategy } from './../../db/connectors/AuraDatabaseConnectorStrategy';
import "reflect-metadata";
import { TwitAdminRepository } from './../../db/repositories/interfaces/TwitAdminRepository';
import { TwitAdminController } from './../../api/controller/TwitAdminController';
import { AuraTwitRepository } from './../../db/repositories/impls/Aura/AuraTwitRepository';
import * as neo4j from "neo4j-driver";
import { container } from "tsyringe";

import {DatabaseConnector} from "../../db/connectors/DatabaseConnector";
import {Logger} from "../logger/Logger";
import {LoggingStrategy} from "../logger/LoggingStrategy";
import {WinstonLoggerStrategy} from "../logger/WinstonLoggerStrategy";
import {DatabaseConnectorStrategy} from "../../db/connectors/DatabaseConnectorStrategy";
import {DataSource} from "typeorm";
import {LOGGING, LOG_DEBUG, LOG_ERROR, LOG_INFO} from "../config";
import { TwitRepository } from "../../db/repositories/interfaces/TwitRepository";
import { TwitController } from "../../api/controller/TwitController";
import { HttpRequester } from '../../api/external/HttpRequester';
import { AuraTwitAdminRepository } from '../../db/repositories/impls/Aura/AuraTwitAdminRepository';
import { AuraDataSource } from "../../db/connectors/dataSource";

// ? Register all dependencies

container.register<LoggingStrategy>("LoggingStrategy", { useClass: WinstonLoggerStrategy});
container.register<boolean>("logging", {useValue: (LOGGING === "true") });
container.register<boolean>("logDebug", {useValue: (LOG_DEBUG === "true") });
container.register<boolean>("logError", {useValue: (LOG_ERROR === "true") });
container.register<boolean>("logInfo", {useValue: (LOG_INFO === "true") });


container.register<TwitRepository>("TwitRepository", AuraTwitRepository);
container.register<TwitAdminRepository>("TwitAdminRepository", AuraTwitAdminRepository);
container.register<HttpRequester>("HttpRequester",HttpRequester);
container.register<neo4j.Driver>("AuraDriver", {useValue: AuraDataSource});
container.register<DatabaseConnectorStrategy<neo4j.Driver, neo4j.Driver>>("DatabaseConnectorStrategy", AuraDatabaseConnectorStrategy);

// ? Get instances
export const logger = container.resolve(Logger);
export const twitController = container.resolve(TwitController);
export const twitAdminController = container.resolve(TwitAdminController);
export const databaseConnector = container.resolve(DatabaseConnector<neo4j.Driver, neo4j.Driver>);
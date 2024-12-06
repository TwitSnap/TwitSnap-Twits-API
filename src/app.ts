import { AuraDatabaseConnectorStrategy } from './db/connectors/AuraDatabaseConnectorStrategy';
import { DatabaseConnectorStrategy } from './db/connectors/DatabaseConnectorStrategy';
import "reflect-metadata";
import { AuraDataSource } from './db/connectors/dataSource';
import express from "express";
import router from "./api/routes/routes";
import cors from 'cors';
import {errorMiddleware} from "./api/errors/handling/ErrorHandler";
import {logger} from "./utils/container/container";
import {PORT} from "./utils/config";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from './utils/swagger/docs/swaggerDocs.json';
import { container, inject, injectable } from "tsyringe";
import * as neo4j from "neo4j-driver";

const app = express();
let server;
app.use(cors());
app.use(express.json());
app.use(router)
app.use(errorMiddleware);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const databaseConnector: AuraDatabaseConnectorStrategy = container.resolve("DatabaseConnectorStrategy");
databaseConnector.initializeConnection()
databaseConnector.initializeConnection().then(() => {
    server = app.listen(PORT, () => {
        logger.logInfo(`Server is running on port ${PORT}`);
    });
}).catch(() => {
    logger.logError("Error in connectin to Aura Database")
});



export default app;
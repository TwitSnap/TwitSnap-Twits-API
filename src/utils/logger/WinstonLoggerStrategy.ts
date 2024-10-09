import {LoggingStrategy} from "./LoggingStrategy";
import winston, {Logger} from "winston";
import {LOG_ROUTE} from "../config";

/**
 * Winston-based implementation of the LoggingStrategy interface.
 * Uses Winston to log messages to a file.
 */
export class WinstonLoggerStrategy implements LoggingStrategy {
    private _logger: Logger;

    constructor() {
        this._logger = winston.createLogger(
            { level: 'debug', format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [ new winston.transports.File({ filename: LOG_ROUTE })],
        });
    }

    /**
     * Logs an informational message using Winston.
     *
     * @param message - The informational message to log.
     */
    public logInfo = (message: string): void => {
        this._logger.info(message);
    }

    /**
     * Logs an error message using Winston.
     *
     * @param message - The error message to log.
     */
    public logError = (message: string): void => {
        this._logger.error(message);
    }

    /**
     * Logs a debug message using Winston.
     *
     * @param message - The debug message to log.
     */
    public logDebug = (message: string): void => {
        this._logger.debug(message);
    }
}
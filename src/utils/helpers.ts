import { StatusCodes } from "http-status-codes";
import { MissingEnvVarError } from "../services/application/errors/MissingEnvVarError";
import {InvalidCredentialsError} from "../services/application/errors/InvalidCredentialsError";
import {BadRequestError} from "../api/errors/BadRequestError";
import {StandardDatabaseError} from "../db/errors/StandardDatabaseError"
import {InvalidRegisterCredentialsError} from "../services/application/errors/InvalidRegisterCredentialsError";
import {ExternalServiceConnectionError} from "../services/application/errors/ExternalServiceConnectionError";
import {InvalidExternalServiceResponseError} from "../services/application/errors/InvalidExternalServiceResponseError";
import {ExternalServiceInternalError} from "../services/application/errors/ExternalServiceInternalError";

/**
 * A utility class for various helper functions.
 */
export class Helpers {
    private static _errorStatusCodeMap: Map<Function, StatusCodes> = new Map<Function, StatusCodes>();

    /**
     * Validates a list of environment variables.
     * Throws an error for each missing environment variable.
     *
     * @param envVarsList - An array of environment variable names to validate.
     */
    public static validateEnvVarsList = (envVarsList: string[]): void => {
        envVarsList.forEach((envVar) => {
            Helpers.validateEnvVar(envVar);
        });
    }

    /**
     * Validates a single environment variable.
     * Throws an error if the environment variable is missing.
     *
     * @param envVar - The name of the environment variable to validate.
     */
    public static validateEnvVar = (envVar: string): void => {
        if (!process.env[envVar]) throw new MissingEnvVarError(`Environment variable ${envVar} is missing`);
    }

    /**
     * Maps an error to its corresponding HTTP status code.
     * If no mapping is found, returns 500 Internal Server Error.
     *
     * @param error - The error to map to an HTTP status code.
     * @returns The HTTP status code corresponding to the error.
     */
    public static mapErrorToStatusCode = (error: Error): StatusCodes => {
        if (Helpers._errorStatusCodeMap.size === 0) Helpers.initializeErrorStatusCodeMap();
        return Helpers.getErrorStatusCode(error);
    }

    /**
     * Retrieves the HTTP status code for a given error.
     *
     * @param error - The error to get the status code for.
     * @returns The HTTP status code corresponding to the error.
     */
    private static getErrorStatusCode = (error: Error): StatusCodes => {
        let errorStatusCode = Helpers._errorStatusCodeMap.get(error.constructor);
        if (errorStatusCode === undefined) errorStatusCode = StatusCodes.INTERNAL_SERVER_ERROR;

        return errorStatusCode;
    }

    /**
     * Initializes the map of error types to HTTP status codes.
     */
    private static initializeErrorStatusCodeMap = (): void => {
        Helpers._errorStatusCodeMap.set(MissingEnvVarError, StatusCodes.INTERNAL_SERVER_ERROR);
        Helpers._errorStatusCodeMap.set(StandardDatabaseError, StatusCodes.INTERNAL_SERVER_ERROR);
        Helpers._errorStatusCodeMap.set(InvalidCredentialsError, StatusCodes.UNAUTHORIZED);
        Helpers._errorStatusCodeMap.set(InvalidRegisterCredentialsError, StatusCodes.CONFLICT);
        Helpers._errorStatusCodeMap.set(BadRequestError, StatusCodes.BAD_REQUEST);
        Helpers._errorStatusCodeMap.set(ExternalServiceConnectionError, StatusCodes.INTERNAL_SERVER_ERROR);
        Helpers._errorStatusCodeMap.set(InvalidExternalServiceResponseError, StatusCodes.INTERNAL_SERVER_ERROR);
        Helpers._errorStatusCodeMap.set(ExternalServiceInternalError, StatusCodes.INTERNAL_SERVER_ERROR)
    }
}

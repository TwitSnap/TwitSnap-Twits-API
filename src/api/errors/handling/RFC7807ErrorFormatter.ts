import {ErrorFormatter} from "./ErrorFormatter";
import {StatusCodes} from "http-status-codes";
import {Helpers} from "../../../utils/helpers";

const STANDARD_INTERNAL_SERVER_ERROR_MESSAGE = "An internal server error occurred.";

/**
 * Implements the `ErrorFormatter` interface to format errors according to RFC 7807.
 *
 * This formatter provides a standard structure for error responses, including
 * a type, title, and status code. The formatted error is returned as a JSON string.
 */
export class RFC7807ErrorFormatter implements ErrorFormatter {
    /**
     * Formats the provided error into a JSON string representation according to RFC 7807.
     *
     * @param error - The error to be formatted.
     * @returns A JSON string that represents the formatted error.
     */
    public formatError = (error: Error): string => {
        const statusCode = this.getStatusCode(error);
        const title = this.getTitle(error, statusCode);
        const type = this.getType(error);

        return JSON.stringify({
            type: type,
            title: title,
            status: statusCode,
        });
    }

    /**
     * Retrieves the HTTP status code corresponding to the provided error.
     *
     * @param error - The error for which to determine the status code.
     * @returns The HTTP status code associated with the error.
     */
    private getStatusCode = (error: Error): StatusCodes => {
        return Helpers.mapErrorToStatusCode(error);
    }

    /**
     * Retrieves the title for the error based on its status code.
     *
     * @param error - The error for which to determine the title.
     * @param statusCode - The HTTP status code of the error.
     * @returns The title for the error.
     */
    private getTitle = (error: Error, statusCode: StatusCodes): string => {
        return statusCode == StatusCodes.INTERNAL_SERVER_ERROR ? STANDARD_INTERNAL_SERVER_ERROR_MESSAGE : error.message;
    }

    /**
     * Retrieves the type for the error. By default, this is set to "about:blank".
     *
     * @param _error - The error for which to determine the type.
     * @returns The type of the error.
     */
    private getType = (_error: Error): string => {
        return "about:blank";
    }
}
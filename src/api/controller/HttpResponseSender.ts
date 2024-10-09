import {Response} from "express";
import {StatusCodes} from "http-status-codes";

/**
 * Utility class for sending HTTP responses with various status codes.
 *
 * This class provides methods to set the response body and status code and sends the response
 * using the Express `Response` object.
 */
export class HttpResponseSender {
    /**
     * Sets the provided object as the response body and sends the response with status code 200.
     * @param res - The Response object to send.
     * @param object - The object to set as the response body.
     * @throws {Error} If the provided object cannot be converted to the standard body media type.
     */
    public okResponse = <T>(res: Response, object: T): void => {
        this.setUpAndSendResponse(res, object, StatusCodes.OK);
    }

    /**
     * Sends the response with status code 204 and no response body.
     * @param res - The Response object to send.
     */
    public okNoContentResponse = (res: Response): void => {
        this.setUpAndSendResponse(res, null, StatusCodes.NO_CONTENT);
    }

    /**
     * Sets the provided object as the response body and sends the response with status code 201.
     * @param res - The Response object to send.
     * @param object - The object to set as the response body.
     * @throws {Error} If the provided object cannot be converted to the standard body media type.
     */
    public createdResponse = <T>(res: Response, object: T): void => {
        this.setUpAndSendResponse(res, object, StatusCodes.CREATED);
    }

    /**
     * Sets the provided bytes as the response body and sends the response with the given status code.
     *
     * @param res - The Express `Response` object to send.
     * @param bytes - The bytes to send as the response body.
     * @param statusCode - The status code to send with the response.
     * @throws {Error} If the provided object cannot be converted to the standard body media type.
     */
    public responseWithBytes = (res: Response, bytes: string, statusCode: StatusCodes): void => {
        this.setUpAndSendResponseAsBytes(res, bytes, statusCode);
    }

    /**
     * Sets the provided object as the response body and sends the response with the given status code.
     * @param res - The Response object to send.
     * @param object - The object to set as the response body.
     * @param statusCode - The status code to send with the response.
     * @throws {Error} If the provided object cannot be converted to the standard body media type.
     */
    private setUpAndSendResponse = <T>(res: Response, object: T, statusCode: StatusCodes): void => {
        res.status(statusCode);
        res.json(object);
    }

    /**
     * Sets the provided bytes as the response body and sends the response with the given status code.
     * @param res - The Response object to send.
     * @param bytes - The bytes to send as the response body.
     * @param statusCode - The status code to send with the response.
     * @throws {Error} If the provided object cannot be converted to the standard body media type.
     */
    private setUpAndSendResponseAsBytes = (res: Response, bytes: string, statusCode: StatusCodes): void => {
        res.status(statusCode);
        res.send(bytes);
    }
}
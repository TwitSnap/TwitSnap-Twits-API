import {Response} from "express";
import {HttpResponseSender} from "./HttpResponseSender";
import {BadRequestError} from "../errors/BadRequestError";

/**
 * Abstract base class for controllers that handle HTTP responses.
 *
 * This class provides methods for sending standard HTTP responses with different status codes.
 * It uses an instance of `HttpResponseSender` to format and send responses.
 */
export abstract class Controller {
    private _responseSender: HttpResponseSender;

    protected constructor(responseSender: HttpResponseSender){
        this._responseSender = responseSender;
    }

    /**
     * Sets the provided object as the response body and sends the response with status code 200.
     * @param res - The Response object to send.
     * @param object - The object to set as the response body.
     * @throws {Error} If the provided object cannot be converted to the standard body media type.
     */
    protected okResponse = <T>(res: Response, object: T): void => {
        this._responseSender.okResponse(res, object);
    }

    /**
     * Sends the response with status code 204 and no response body.
     * @param res - The Response object to send.
     */
    protected okNoContentResponse = (res: Response): void => {
        this._responseSender.okNoContentResponse(res);
    }

    /**
     * Sets the provided object as the response body and sends the response with status code 201.
     * @param res - The Response object to send.
     * @param object - The object to set as the response body.
     * @throws {Error} If the provided object cannot be converted to the standard body media type.
     */
    protected createdResponse = <T>(res: Response, object: T): void => {
        this._responseSender.createdResponse(res, object);
    }

    protected getFieldOrBadRequestError = <T>(req: any, field: string): T => {
        if(!req.body[field]) throw new BadRequestError(`${field} is required`);
        return req.body[field];
    }
}
import {Controller} from "./Controller";
import {HttpResponseSender} from "./HttpResponseSender";
import {NextFunction, Request, Response} from "express";
import {UserService} from "../../services/application/user/UserService";
import {SessionService} from "../../services/application/session/SessionService";
import {injectable} from "tsyringe";

@injectable()
export class UserController extends Controller {
    private userService: UserService;
    private sessionService: SessionService;

    constructor(userService: UserService, sessionService: SessionService, httpResponseSender: HttpResponseSender) {
        super(httpResponseSender);
        this.userService = userService;
        this.sessionService = sessionService;
    }

    public register = async (req: Request, res: Response, next: NextFunction) => {
        /*
            #swagger.parameters = registerUserDoc
        */

        try {
            this.getFieldOrBadRequestError(req, 'id');
            this.getFieldOrBadRequestError(req, 'password');

            await this.userService.register(req.body.id, req.body.password);
            return this.createdResponse(res, {message: 'User created successfully'});
        } catch (error) {
            next(error);
        }
    }

    public logIn = async (req: Request, res: Response, next: NextFunction) => {
        /*
            #swagger.parameters = loginDoc.parameters
            #swagger.responses = loginDoc.responses
        */

        try {
            this.getFieldOrBadRequestError(req, 'email');
            this.getFieldOrBadRequestError(req, 'password');

            const token = await this.sessionService.logIn(req.body.email, req.body.password);
            return this.okResponse(res, {token: token});
        } catch (error) {
            next(error);
        }
    }

    public authenticate = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            return this.okNoContentResponse(res);
        } catch (error) {
            next(error);
        }
    }
}
export class ExternalServiceInternalError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ExternalServiceInternalError.prototype);
    }
}
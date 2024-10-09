export class InvalidExternalServiceResponseError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidExternalServiceResponseError.prototype);
    }
}
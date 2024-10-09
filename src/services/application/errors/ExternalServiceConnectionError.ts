export class ExternalServiceConnectionError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ExternalServiceConnectionError.prototype);
    }
}
export class InvalidCredentialsError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}
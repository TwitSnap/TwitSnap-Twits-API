export class InvalidRegisterCredentialsError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidRegisterCredentialsError.prototype);
    }
}
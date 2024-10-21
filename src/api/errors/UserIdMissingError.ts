
export class UserIdMissingError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UserIdMissingError.prototype);
    }
}
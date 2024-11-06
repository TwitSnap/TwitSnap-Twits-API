export class InvalidTwitError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidTwitError.prototype);
    }
}
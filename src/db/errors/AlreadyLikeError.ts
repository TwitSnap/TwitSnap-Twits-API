export class AlreadyLikedError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, AlreadyLikedError.prototype);
    }
}
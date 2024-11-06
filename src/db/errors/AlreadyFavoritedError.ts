
export class AlreadyFavoritedError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, AlreadyFavoritedError.prototype);
    }
}
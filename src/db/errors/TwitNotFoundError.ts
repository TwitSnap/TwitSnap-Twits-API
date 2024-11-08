


export class TwitNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, TwitNotFoundError.prototype);
    }
}
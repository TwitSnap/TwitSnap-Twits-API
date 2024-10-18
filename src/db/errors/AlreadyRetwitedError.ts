

export class AlreadyRetwitedError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, AlreadyRetwitedError.prototype);
    }
}
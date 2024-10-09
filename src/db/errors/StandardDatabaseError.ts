export class StandardDatabaseError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, StandardDatabaseError.prototype);
    }
}
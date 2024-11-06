export class MessageTooLongError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, MessageTooLongError.prototype);
    }
}
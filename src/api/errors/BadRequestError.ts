/**
 * Represents an error that occurs when a request is bad formatted.
 *
 * This class extends the built-in `Error` class and sets the prototype to `BadRequestError`
 * to ensure proper inheritance in custom error handling scenarios.
 */
export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}
export class MissingEnvVarError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, MissingEnvVarError.prototype);
    }
}
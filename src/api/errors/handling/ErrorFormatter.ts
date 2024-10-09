/**
 * Defines a strategy for formatting errors.
 *
 * Implementations of this interface should provide a method for converting
 * an `Error` object into a formatted string representation.
 */
export interface ErrorFormatter {
    /**
     * Formats the provided error into a string representation.
     *
     * @param error - The error to be formatted.
     * @returns A string that represents the formatted error.
     */
    formatError(error: Error): string
}
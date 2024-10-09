/**
 * Interface for logging strategies.
 * Defines methods for logging informational and error messages.
 */
export interface LoggingStrategy{
    /**
     * Logs an informational message.
     *
     * @param message - The informational message to log.
     */
    logInfo(message: string): void;

    /**
     * Logs an error message.
     *
     * @param message - The error message to log.
     */
    logError(message: string): void;

    /**
     * Logs a debug message.
     *
     * @param message - The debug message to log.
     */
    logDebug(message: string): void;
}
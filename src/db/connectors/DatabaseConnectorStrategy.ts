/**
 * Interface for a database connector strategy.
 *
 * This interface defines the contract for a class that connects to a database.
 * It includes methods for initializing the connection and retrieving the data source.
 *
 * @template T - The type of the initialized connection.
 * @template Y - The type of the data source.
 */
export interface DatabaseConnectorStrategy<T, Y> {
    /**
     * Initializes the database connection.
     *
     * This method should handle the process of establishing a connection to the database
     * and return a promise that resolves with the initialized connection.
     *
     * @returns {Promise<T>} A promise that resolves with the initialized connection.
     */
    initializeConnection(): Promise<T>;

    /**
     * Retrieves the data source.
     *
     * This method should return the data source that is used for interacting with the database.
     *
     * @returns {Y} The data source for database interactions.
     */
    getDataSource(): Y;

        /**
     * Shuts down the database connection.
     *
     * This method should handle the process of closing the database connection
     * and return a promise that resolves when the shutdown is complete.
     *
     * @returns {Promise<void>} A promise that resolves when the connection has been shut down.
     */
    shutdownConnection(): Promise<void>;
}
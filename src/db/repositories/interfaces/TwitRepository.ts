import { Twit } from "../../../services/domain/Twit";

export interface TwitRepository {
    /**
     * Retrieves a `User` entity by its unique identifier.
     *
     * @param id - The unique identifier of the User.
     * @returns A promise that resolves to the `User` entity if found, or `null` if not found.
     */
    getById: (id: string) => Promise<Twit | null>;

    /**
     * Saves a new or existing `User` entity to the storage.
     *
     * @param user - The `User` entity to be saved.
     * @returns A promise that resolves to the saved `User` entity.
     */
    save: (user: Twit) => Promise<Twit>;
}

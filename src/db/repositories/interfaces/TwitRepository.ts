import { EagerResult } from 'neo4j-driver';
import { Comment } from '../../../services/domain/Comment';
import { Post } from '../../../services/domain/Post';
import { Twit } from "../../../services/domain/Twit";

export interface TwitRepository {
    /**
     * Retrieves a `User` entity by its unique identifier.
     *
     * @param id - The unique identifier of the User.
     * @returns A promise that resolves to the `User` entity if found, or `null` if not found.
     */
    getById: (id: string) => Promise<Post | null>;

    /**
     * Saves a new or existing `User` entity to the storage.
     *
     * @param user - The `User` entity to be saved.
     * @returns A promise that resolves to the saved `User` entity.
     */
    save: (user: Twit) => Promise<EagerResult>;

    comment_post: (comment:Comment) => Promise<EagerResult>
}

import { OverViewPost, OverViewPosts, Post } from './../../../services/domain/Post';
import { EagerResult } from 'neo4j-driver';
import { CommentQuery } from '../../../services/domain/Comment';
import { editTwit, Twit } from "../../../services/domain/Twit";
import { Pagination } from '../../../services/domain/Pagination';
import { Stats } from '../../../services/domain/Stats';

export interface TwitRepository {
    /**
     * Retrieves a `User` entity by its unique identifier.
     *
     * @param id - The unique identifier of the User.
     * @returns A promise that resolves to the `User` entity if found, or `null` if not found.
     */
    getById: (id: string, user_id: string) => Promise<OverViewPost | null>;

    /**
     * Saves a new or existing `User` entity to the storage.
     *
     * @param user - The `User` entity to be saved.
     * @returns A promise that resolves to the saved `User` entity.
     */
    save: (user: Twit) => Promise<OverViewPost[]>;

    comment_post: (comment:CommentQuery) => Promise<EagerResult>

    getAllByUserId: (id: string,pagination:Pagination, is_prohibited: boolean, user_id:string, follwing: Array<string>, banned_ids: string[]) => Promise<OverViewPosts>;

    likeTwit: (post_id: string, user_id: string) => Promise<void>;

    retwit: (post_id: string, user_id: string) => Promise<void>;

    getCommentsFrom: (post_id: string, pagination: Pagination, user_id:string, banned_ids: string[]) => Promise<OverViewPost[]>

    getStatsFromPeriod: (user_id: string, period: string, banned_ids: string[]) => Promise<Stats>;

    getFeedFor: (user_id: string, pagination: Pagination, following: Array<string>, banned_ids: string[]) => Promise<OverViewPosts>;

    delete: (post_id: string, user_id: string) => Promise<void>;

    patch: (twit: editTwit) => Promise<void>;

    saveFavorite: (user_id: string, post_id: string) => Promise<void>;

    getFavoritesFrom: (target_id: string, pagination: Pagination, user_id:string, following: Array<string>, banned_ids: string[]) => Promise<OverViewPost[]>;

    getAccountsFor: (user_interests:string[], banned_ids: string[], user_id:string) => Promise<string[]>;

    getTrendingTopics: (user_id: string, lista_baneados: string[]) => Promise<[string,Number][]>

    getTopicsFilteredByTag: (user_id: string,  banned_ids: string[], pagination: Pagination, filter: string, following: Array<string>) => Promise<OverViewPosts>;
}

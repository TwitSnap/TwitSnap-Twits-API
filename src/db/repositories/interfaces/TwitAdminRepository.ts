import { OverViewPostAdmin } from './../../../services/domain/PostAdmin';
import { Pagination } from "../../../services/domain/Pagination";
import { OverViewPost, OverViewPosts } from "../../../services/domain/Post";

export interface TwitAdminRepository {

    getAllPosts: (pagination: Pagination, filter_by_id: boolean, optional_user: string) => Promise<OverViewPostAdmin[]>;

    blockPost: (post_id: string) => Promise<void>;

    getPost: (post_id: string) => Promise<OverViewPostAdmin[]>;

}
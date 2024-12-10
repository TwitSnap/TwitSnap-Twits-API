import { twitAdminController } from './../../utils/container/container';
import { Router } from "express";
import { twitController } from "../../utils/container/container";

const router = Router();

// Normal User Routes
router.post("/v1/twit",twitController.postTwit);
router.post("/v1/twit/like",twitController.like);
router.post("/v1/twit/retwit", twitController.retwit);
router.post("/v1/twit/comment",twitController.comment);
router.post("/v1/twit/favorite",twitController.saveFavorite);
router.get("/v1/twit/favorite",twitController.getFavorites)
router.get("/v1/twit/post", twitController.getPost);
router.patch("/v1/twit/post",twitController.editPost);
router.delete("/v1/twit/post",twitController.deletePost);
router.get("/v1/twit/post/comments",twitController.getCommentsFromPost);
router.get("/v1/twit/posts/user",twitController.getAllPostsFromUser);
router.get("/v1/twit/user/stats",twitController.getStats);
router.get("/v1/twit/feed",twitController.getFeed);
router.get("/v1/twit/user/recommendation", twitController.getRecommendedAccounts);
router.get("/v1/twit/trending", twitController.trendingTopics)
router.get("/v1/twit/filter/posts", twitController.getFilteredPosts);
router.get("/v1/twit/posts/search", twitController.searchTwits);


// Admin User Routes

router.get("/v1/twit/admin/post", twitAdminController.getPost);
router.get("/v1/twit/admin/posts", twitAdminController.getPosts);
router.post("/v1/twit/admin/block", twitAdminController.blockTwit);
router.get("/v1/twit/admin/healthcheck",twitAdminController.healthCheck);



export default router;
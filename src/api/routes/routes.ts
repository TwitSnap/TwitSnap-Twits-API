
import { Router } from "express";
import { twitController } from "../../utils/container/container";

const router = Router();

router.post("/v1/twit",twitController.postTwit);
router.post("/v1/twit/like",twitController.like);
router.post("/v1/twit/retwit", twitController.retwit);
router.post("/v1/twit/comment",twitController.comment);
router.get("/v1/twit/post", twitController.getPost);
router.patch("/v1/twit/post",twitController.editPost);
router.delete("/v1/twit/post",twitController.deletePost);
router.get("/v1/twit/post/comments",twitController.getCommentsFromPost);
router.get("/v1/twit/posts/user",twitController.getAllPostsFromUser);
router.get("/v1/twit/user/stats",twitController.getStats);


export default router;
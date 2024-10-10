
import { Router } from "express";
import { twitController } from "../../utils/container/container";

const router = Router();

router.post("/v1/twit",twitController.postTwit);
router.post("/v1/twit/like/:id",twitController.like);
router.post("/v1/twit/comment",twitController.comment)
router.get("/v1/twit/post", twitController.getPost)


export default router;
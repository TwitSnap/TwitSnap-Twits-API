
import { Router } from "express";
import { twitController } from "../../utils/container/container";

const router = Router();

router.post("/v1/twit/post",twitController.post_twit);
router.post("/v1/twit/like/:id",twitController.like);


export default router;
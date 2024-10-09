import { Router } from "express";
import { federateAuthController, userController } from "../../utils/container/container";

const router = Router();

router.post("/v1/auth/register", userController.register);
router.post("/v1/auth/login", userController.logIn);

export default router;
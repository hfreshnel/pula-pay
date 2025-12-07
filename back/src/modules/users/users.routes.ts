import { Router } from "express";
import verifyAuth from "../../middleware/verifyAuth.js";
import * as controller from "./users.controller.js";

const router = Router();

router.get("/me", verifyAuth, controller.getAppUser);

export default router;
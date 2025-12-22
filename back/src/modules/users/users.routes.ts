import { Router } from "express";

import verifyAuth from "../../middleware/verifyAuth.js";
import * as controller from "./users.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

router.get("/me", verifyAuth, asyncHandler(controller.getAppUser));

export default router;
import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { registerSchema, verifySchema, loginSchema } from "./auth.schemas.js";
import * as authController from "./auth.controller.js"
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

router.post("/register", validateBody(registerSchema), asyncHandler(authController.register));
router.post("/verify", validateBody(verifySchema), asyncHandler(authController.verify));
router.post("/login", validateBody(loginSchema), asyncHandler(authController.login));

export default router;
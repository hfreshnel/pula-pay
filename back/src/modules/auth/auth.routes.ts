import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { registerSchema, verifySchema, loginSchema } from "./auth.schemas.js";
import * as authController from "./auth.controller.js"

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/verify", validateBody(verifySchema), authController.verify);
router.post("/login", validateBody(loginSchema), authController.login);

export default router;
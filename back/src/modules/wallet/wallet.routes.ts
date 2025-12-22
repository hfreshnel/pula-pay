import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import { depositSchema, withdrawSchema, transferSchema, txIdParamsSchema, userIdParamsSchema, resolveRecipientQuerySchema } from "./wallet.schemas.js";
import * as controller from "./wallet.controller.js"
import { asyncHandler } from "../../middleware/asyncHandler.js";
import verifyAuth from "../../middleware/verifyAuth.js";

const router = Router();

router.use(verifyAuth);

router.get("/transactions/:txId", validateParams(txIdParamsSchema), asyncHandler(controller.getTransactionStatus));
router.get("/users/transactions", asyncHandler(controller.getTransactions));
router.get("/users/balance", asyncHandler(controller.getAccountBalance));
router.get("/resolve-recipient", validateQuery(resolveRecipientQuerySchema), asyncHandler(controller.resolveRecipient));

router.post("/transfer", validateBody(transferSchema), asyncHandler(controller.transfer));
router.post("/deposits", validateBody(depositSchema), asyncHandler(controller.createDeposit));
router.post("/withdraw", validateBody(withdrawSchema), asyncHandler(controller.createWithdraw));

export default router;
import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import { depositSchema, withdrawSchema, transferSchema, txIdParamsSchema, userIdParamsSchema } from "./wallet.schemas.js";
import * as controller from "./wallet.controller.js"
import userService from "../../services/userService.js";

const router = Router();

router.get("/transactions/:txId", validateParams(txIdParamsSchema), controller.getTransactionStatus);
router.get("/users/:userId/transactions", validateParams(userIdParamsSchema), controller.getTransactions);
router.get("/users/:userId/balance", validateParams(userIdParamsSchema), controller.getAccountBalance);
router.get("/resolve-recipient", async (req, res) => {
  const senderId = req.query.senderId as string;
  const phone = req.query.phone as string;

  const user = await userService.getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: "no user with this number" });
  if (user.id === senderId) {
    return res.status(400).json({ error: "cannot send to yourself" });
  }

  res.json({ userId: user.id });
});

router.post("/transfer", validateBody(transferSchema), controller.transfer);
router.post("/deposits", validateBody(depositSchema), controller.createDeposit);
router.post("/withdraw", validateBody(withdrawSchema), controller.createWithdraw);

export default router;
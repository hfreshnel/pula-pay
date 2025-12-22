import { Router } from "express";
import { prisma } from "../../services/client.js";

const router = Router();
router.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get("/ready", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});

export default router;
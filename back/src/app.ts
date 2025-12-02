import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { logger } from "./config/logger.js";
import { swaggerDocument } from "./config/swagger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./modules/health/health.routes.js";
import userRouter from "./modules/users/users.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import walletRouter from "./modules/wallet/wallet.routes.js";

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.FRONT_URL }));
app.use(pinoHttp({ logger }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Routes
app.use("/health", healthRouter);
app.use("/", userRouter);
app.use("/auth", authRouter);
app.use("/wallet", walletRouter);
app.use(errorHandler);

export default app;
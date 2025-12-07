import path from "path";
import { fileURLToPath } from "url";
import YAML from "yamljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerPath = path.resolve(__dirname, "..", "docs", "swagger.yaml");

export const swaggerDocument = YAML.load(swaggerPath);
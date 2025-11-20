import path from "path";
import dotenv from "dotenv";
import { debug, warn } from "./log.js";

// Load environment variables from .env file if it exists
export function loadEnv(): void {
  try {
    const envFilePath = path.resolve(
      process.cwd(),
      process.env.ENV_FILE || ".env",
    );
    debug(`Attempting to load environment variables from: ${envFilePath}`);

    const result = dotenv.config({
      path: envFilePath,
    });

    if (result.error) {
      debug(
        `No .env file found at ${envFilePath}, using environment variables directly.`,
      );
    } else {
      debug(`Successfully loaded environment variables from ${envFilePath}`);
      debug(`Loaded ${Object.keys(result.parsed || {}).length} variables`);
    }
  } catch (error) {
    warn(
      "Error loading .env file, using environment variables directly:",
      error,
    );
  }
}

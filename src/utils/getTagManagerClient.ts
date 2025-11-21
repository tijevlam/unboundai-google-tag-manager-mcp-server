import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { debug, error as logError } from "./log.js";

type TagManagerClient = ReturnType<typeof google.tagmanager>;

const READ_WRITE_TAG_MANAGER_SCOPE = [
  "https://www.googleapis.com/auth/tagmanager.readonly",
  "https://www.googleapis.com/auth/tagmanager.edit.containers",
  "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
  "https://www.googleapis.com/auth/tagmanager.manage.users",
  "https://www.googleapis.com/auth/tagmanager.manage.accounts,https://www.googleapis.com/auth/tagmanager.publish",
];

let authClient: GoogleAuth | null = null;

function getAuthClient(): GoogleAuth {
  if (!authClient) {
    try {
      debug("Initializing Google Auth client...");
      debug(`Required scopes: ${READ_WRITE_TAG_MANAGER_SCOPE.join(", ")}`);
      debug(
        `GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? "Set" : "Not set"}`,
      );

      authClient = new GoogleAuth({
        scopes: READ_WRITE_TAG_MANAGER_SCOPE,
      });

      debug("Google Auth client initialized successfully");
    } catch (err) {
      logError("Failed to initialize Google Auth client:", err);
      throw err;
    }
  }
  return authClient;
}

export async function getTagManagerClient(): Promise<TagManagerClient> {
  try {
    debug("Getting Tag Manager client...");
    const auth = getAuthClient();

    debug("Creating Tag Manager API client (v2)...");
    const client = google.tagmanager({
      version: "v2",
      auth: auth as any,
    });

    debug("Tag Manager client created successfully");
    return client;
  } catch (err) {
    logError("Error creating Tag Manager client:", err);
    if (err instanceof Error) {
      logError("Error details:", {
        message: err.message,
        stack: err.stack,
      });
    }
    throw err;
  }
}

import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { log } from "./log.js";

type TagManagerClient = ReturnType<typeof google.tagmanager>;

const READ_WRITE_TAG_MANAGER_SCOPE =
  "https://www.googleapis.com/auth/tagmanager.edit.containers";

let authClient: GoogleAuth | null = null;

function getAuthClient(): GoogleAuth {
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: [READ_WRITE_TAG_MANAGER_SCOPE],
    });
  }
  return authClient;
}

export async function getTagManagerClient(): Promise<TagManagerClient> {
  try {
    const auth = getAuthClient();

    return google.tagmanager({
      version: "v2",
      auth: auth as any,
    });
  } catch (error) {
    log("Error creating Tag Manager client:", error);
    throw error;
  }
}

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const listAccounts = (server: McpServer): void =>
  server.tool(
    "tag_manager_list_accounts",
    "Lists all GTM accounts accessible by the authenticated user",
    {},
    async (): Promise<CallToolResult> => {
      log("Running tool: tag_manager_list_accounts");

      try {
        const tagmanager = await getTagManagerClient();
        const response = await tagmanager.accounts.list({});

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      } catch (error) {
        return createErrorResponse("Error listing accounts", error);
      }
    },
  );

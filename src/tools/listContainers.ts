import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const listContainers = (server: McpServer): void =>
  server.tool(
    "tag_manager_list_containers",
    "Lists all containers within the specified GTM account",
    {
      accountId: z.string().describe("The GTM account ID"),
    },
    async ({ accountId }): Promise<CallToolResult> => {
      log(`Running tool: tag_manager_list_containers for account ${accountId}`);

      try {
        const tagmanager = await getTagManagerClient();
        const response = await tagmanager.accounts.containers.list({
          parent: `accounts/${accountId}`,
        });

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      } catch (error) {
        return createErrorResponse(
          `Error listing containers for account ${accountId}`,
          error,
        );
      }
    },
  );

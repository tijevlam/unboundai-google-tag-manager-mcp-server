import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const getContainer = (server: McpServer): void =>
  server.tool(
    "tag_manager_get_container",
    "Gets a specific container from an account",
    {
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The container ID"),
    },
    async ({ accountId, containerId }): Promise<CallToolResult> => {
      log(
        `Running tool: tag_manager_get_container for account ${accountId}, container ${containerId}`,
      );

      try {
        const tagmanager = await getTagManagerClient();
        const response = await tagmanager.accounts.containers.get({
          path: `accounts/${accountId}/containers/${containerId}`,
        });

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      } catch (error) {
        return createErrorResponse(
          `Error getting container ${containerId} in account ${accountId}`,
          error,
        );
      }
    },
  );

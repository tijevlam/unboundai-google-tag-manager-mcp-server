import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const deleteContainer = (server: McpServer): void =>
  server.tool(
    "tag_manager_delete_container",
    "Deletes a container from the specified GTM account",
    {
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The container ID to delete"),
    },
    async ({ accountId, containerId }): Promise<CallToolResult> => {
      log(
        `Running tool: tag_manager_delete_container for account ${accountId}, container ${containerId}`,
      );

      try {
        const tagmanager = await getTagManagerClient();
        await tagmanager.accounts.containers.delete({
          path: `accounts/${accountId}/containers/${containerId}`,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Container ${containerId} was successfully deleted`,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(
          `Error deleting container ${containerId} from account ${accountId}`,
          error,
        );
      }
    },
  );

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const createContainer = (server: McpServer): void =>
  server.tool(
    "tag_manager_create_container",
    "Creates a new container in the specified GTM account",
    {
      accountId: z.string().describe("The GTM account ID"),
      name: z.string().describe("Name for the new container"),
      usageContext: z
        .array(z.string())
        .describe(
          "Usage contexts for the container (e.g., ['web', 'android', 'ios'])",
        ),
    },
    async ({ accountId, name, usageContext }): Promise<CallToolResult> => {
      log(
        `Running tool: tag_manager_create_container for account ${accountId}`,
      );

      try {
        const tagmanager = await getTagManagerClient();
        const response = await tagmanager.accounts.containers.create({
          parent: `accounts/${accountId}`,
          requestBody: {
            name,
            usageContext,
          },
        });

        return {
          content: [
            { type: "text", text: JSON.stringify(response.data, null, 2) },
          ],
        };
      } catch (error) {
        return createErrorResponse(
          `Error creating container in account ${accountId}`,
          error,
        );
      }
    },
  );

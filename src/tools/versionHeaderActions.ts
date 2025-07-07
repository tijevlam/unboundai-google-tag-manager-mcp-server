import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { createErrorResponse, getTagManagerClient, log } from "../utils";

export const versionHeaderActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "gtm_version_header",
    "Performs all container version header operations: list, latest. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["list", "latest"])
        .describe(
          "The container version header operation to perform. Must be one of: 'list', 'latest'.",
        ),
      accountId: z
        .string()
        .describe("The unique ID of the GTM Account containing the container."),
      containerId: z.string().describe("The unique ID of the GTM Container."),
      includeDeleted: z
        .boolean()
        .optional()
        .describe(
          "Whether to also retrieve deleted (archived) versions. Required for 'list' action.",
        ),
      pageToken: z
        .string()
        .optional()
        .describe("A token for pagination. Optional for 'list' action."),
    },
    async ({ action, accountId, containerId, includeDeleted, pageToken }) => {
      log(`Running tool: gtm_version_header with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient(props.accessToken);

        switch (action) {
          case "list": {
            if (includeDeleted === undefined) {
              throw new Error(
                `includeDeleted is required for ${action} action`,
              );
            }

            const response =
              await tagmanager.accounts.containers.version_headers.list({
                parent: `accounts/${accountId}/containers/${containerId}`,
                includeDeleted,
                pageToken,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "latest": {
            const response =
              await tagmanager.accounts.containers.version_headers.latest({
                parent: `accounts/${accountId}/containers/${containerId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(
          `Error performing ${action} on container version header`,
          error,
        );
      }
    },
  );
};

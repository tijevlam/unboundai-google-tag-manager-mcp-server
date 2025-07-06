import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { createErrorResponse, getTagManagerClient, log } from "../utils";

export const destinationActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "gtm_destination",
    "Performs all destination operations: get, list, link, unlink. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["get", "list", "link", "unlink"])
        .describe(
          "The destination operation to perform. Must be one of: 'get', 'list', 'link', 'unlink'.",
        ),
      accountId: z
        .string()
        .describe(
          "The unique ID of the GTM Account containing the destination.",
        ),
      containerId: z
        .string()
        .describe(
          "The unique ID of the GTM Container containing the destination.",
        ),
      destinationId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM Destination. Required for 'get', 'link', and 'unlink' actions.",
        ),
      allowUserPermissionFeatureUpdate: z
        .boolean()
        .optional()
        .describe(
          "If true, allows user permission feature update during linking. Optional for 'link' action.",
        ),
    },
    async ({
      action,
      accountId,
      containerId,
      destinationId,
      allowUserPermissionFeatureUpdate,
    }) => {
      log(`Running tool: gtm_destination with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient(props.accessToken);

        switch (action) {
          case "get": {
            if (!destinationId) {
              throw new Error(`destinationId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.destinations.get({
                path: `accounts/${accountId}/containers/${containerId}/destinations/${destinationId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response =
              await tagmanager.accounts.containers.destinations.list({
                parent: `accounts/${accountId}/containers/${containerId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "link": {
            if (!destinationId) {
              throw new Error(`destinationId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.destinations.link({
                parent: `accounts/${accountId}/containers/${containerId}`,
                destinationId,
                allowUserPermissionFeatureUpdate,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "unlink": {
            if (!destinationId) {
              throw new Error(`destinationId is required for ${action} action`);
            }

            await tagmanager.accounts.containers.destinations.link({
              parent: `accounts/${accountId}/containers/${containerId}`,
              destinationId: destinationId,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Destination ${destinationId} was successfully unlinked`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(
          `Error performing ${action} on destination`,
          error,
        );
      }
    },
  );
};

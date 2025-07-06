import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { TransformationSchema } from "../schemas/TransformationSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import Schema$Transformation = tagmanager_v2.Schema$Transformation;

const PayloadSchema = TransformationSchema.omit({
  accountId: true,
  containerId: true,
  workspaceId: true,
  transformationId: true,
  fingerprint: true,
});

export const transformationActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "gtm_transformation",
    "Performs all GTM transformation operations: create, get, list, update, remove, revert. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["create", "get", "list", "update", "remove", "revert"])
        .describe(
          "The GTM transformation operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove', 'revert'.",
        ),
      accountId: z
        .string()
        .describe(
          "The unique ID of the GTM Account containing the transformation.",
        ),
      containerId: z
        .string()
        .describe(
          "The unique ID of the GTM Container containing the transformation.",
        ),
      workspaceId: z
        .string()
        .describe(
          "The unique ID of the GTM Workspace containing the transformation.",
        ),
      transformationId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM transformation. Required for 'get', 'update', 'remove', and 'revert' actions.",
        ),
      createOrUpdateConfig: PayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM transformation resource, except IDs.",
      ),
      fingerprint: z
        .string()
        .optional()
        .describe(
          "The fingerprint for optimistic concurrency control. Required for 'update' and 'revert' actions.",
        ),
      pageToken: z
        .string()
        .optional()
        .describe("A token for pagination. Optional for 'list' action."),
    },
    async ({
      action,
      accountId,
      containerId,
      workspaceId,
      transformationId,
      createOrUpdateConfig,
      fingerprint,
      pageToken,
    }) => {
      log(`Running tool: gtm_transformation with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient(props.accessToken);

        switch (action) {
          case "create": {
            if (!createOrUpdateConfig) {
              throw new Error(
                `createOrUpdateConfig is required for ${action} action`,
              );
            }

            const response =
              await tagmanager.accounts.containers.workspaces.transformations.create(
                {
                  parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                  requestBody: createOrUpdateConfig as Schema$Transformation,
                },
              );

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!transformationId) {
              throw new Error(
                `transformationId is required for ${action} action`,
              );
            }

            const response =
              await tagmanager.accounts.containers.workspaces.transformations.get(
                {
                  path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/transformations/${transformationId}`,
                },
              );

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response =
              await tagmanager.accounts.containers.workspaces.transformations.list(
                {
                  parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                  pageToken,
                },
              );

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "update": {
            if (!transformationId) {
              throw new Error(
                `transformationId is required for ${action} action`,
              );
            }

            if (!createOrUpdateConfig) {
              throw new Error(
                `createOrUpdateConfig is required for ${action} action`,
              );
            }

            if (!fingerprint) {
              throw new Error(`fingerprint is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.transformations.update(
                {
                  path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/transformations/${transformationId}`,
                  fingerprint,
                  requestBody: createOrUpdateConfig as Schema$Transformation,
                },
              );

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!transformationId) {
              throw new Error(
                `transformationId is required for ${action} action`,
              );
            }

            await tagmanager.accounts.containers.workspaces.transformations.delete(
              {
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/transformations/${transformationId}`,
              },
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Transformation ${transformationId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "revert": {
            if (!transformationId) {
              throw new Error(
                `transformationId is required for ${action} action`,
              );
            }

            const response =
              await tagmanager.accounts.containers.workspaces.transformations.revert(
                {
                  path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/transformations/${transformationId}`,
                  fingerprint,
                },
              );

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
          `Error performing ${action} on GTM transformation`,
          error,
        );
      }
    },
  );
};

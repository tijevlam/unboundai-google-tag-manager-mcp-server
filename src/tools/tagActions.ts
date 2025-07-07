import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { TagSchema } from "../schemas/TagSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import Schema$Tag = tagmanager_v2.Schema$Tag;

const PayloadSchema = TagSchema.omit({
  accountId: true,
  containerId: true,
  workspaceId: true,
  tagId: true,
  fingerprint: true,
});

export const tagActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "gtm_tag",
    "Performs all GTM tag operations: create, get, list, update, remove, revert. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["create", "get", "list", "update", "remove", "revert"])
        .describe(
          "The GTM tag operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove', 'revert'.",
        ),
      accountId: z
        .string()
        .describe("The unique ID of the GTM Account containing the tag."),
      containerId: z
        .string()
        .describe("The unique ID of the GTM Container containing the tag."),
      workspaceId: z
        .string()
        .describe("The unique ID of the GTM Workspace containing the tag."),
      tagId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM tag. Required for 'get', 'update', 'remove', and 'revert' actions.",
        ),
      createOrUpdateConfig: PayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM tag resource, except IDs."
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
      tagId,
      createOrUpdateConfig,
      fingerprint,
      pageToken,
    }) => {
      log(`Running tool: gtm_tag with action ${action}`);

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
              await tagmanager.accounts.containers.workspaces.tags.create({
                parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                requestBody: createOrUpdateConfig as Schema$Tag,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!tagId) {
              throw new Error(`tagId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.tags.get({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response =
              await tagmanager.accounts.containers.workspaces.tags.list({
                parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                pageToken,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "update": {
            if (!tagId) {
              throw new Error(`tagId is required for ${action} action`);
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
              await tagmanager.accounts.containers.workspaces.tags.update({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
                fingerprint,
                requestBody: createOrUpdateConfig as Schema$Tag,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!tagId) {
              throw new Error(`tagId is required for ${action} action`);
            }

            await tagmanager.accounts.containers.workspaces.tags.delete({
              path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Tag ${tagId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "revert": {
            if (!tagId) {
              throw new Error(`tagId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.tags.revert({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
                fingerprint,
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
          `Error performing ${action} on GTM tag`,
          error,
        );
      }
    },
  );
};

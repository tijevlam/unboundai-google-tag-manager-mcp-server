import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { TriggerSchema } from "../schemas/TriggerSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import Schema$Trigger = tagmanager_v2.Schema$Trigger;

const PayloadSchema = TriggerSchema.omit({
  accountId: true,
  containerId: true,
  workspaceId: true,
  triggerId: true,
  fingerprint: true,
});

export const triggerActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "tag_manager_trigger",
    "Performs all GTM trigger operations: create, get, list, update, remove, revert. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["create", "get", "list", "update", "remove", "revert"])
        .describe(
          "The GTM trigger operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove', 'revert'.",
        ),
      accountId: z
        .string()
        .describe("The unique ID of the GTM Account containing the trigger."),
      containerId: z
        .string()
        .describe("The unique ID of the GTM Container containing the trigger."),
      workspaceId: z
        .string()
        .describe("The unique ID of the GTM Workspace containing the trigger."),
      triggerId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM trigger. Required for 'get', 'update', 'remove', and 'revert' actions.",
        ),
      createOrUpdateConfig: PayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM trigger resource, except IDs.",
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
      triggerId,
      createOrUpdateConfig,
      fingerprint,
      pageToken,
    }) => {
      log(`Running tool: tag_manager_trigger with action ${action}`);

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
              await tagmanager.accounts.containers.workspaces.triggers.create({
                parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                requestBody: createOrUpdateConfig as Schema$Trigger,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!triggerId) {
              throw new Error(`triggerId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.triggers.get({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers/${triggerId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response =
              await tagmanager.accounts.containers.workspaces.triggers.list({
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
            if (!triggerId) {
              throw new Error(`triggerId is required for ${action} action`);
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
              await tagmanager.accounts.containers.workspaces.triggers.update({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers/${triggerId}`,
                fingerprint,
                requestBody: createOrUpdateConfig as Schema$Trigger,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!triggerId) {
              throw new Error(`triggerId is required for ${action} action`);
            }

            await tagmanager.accounts.containers.workspaces.triggers.delete({
              path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers/${triggerId}`,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Trigger ${triggerId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "revert": {
            if (!triggerId) {
              throw new Error(`triggerId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.triggers.revert({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers/${triggerId}`,
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
          `Error performing ${action} on GTM trigger`,
          error,
        );
      }
    },
  );
};

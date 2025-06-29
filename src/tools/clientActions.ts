import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { ClientSchema } from "../schemas/ClientSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import Schema$Client = tagmanager_v2.Schema$Client;

const PayloadSchema = ClientSchema.omit({
  accountId: true,
  containerId: true,
  workspaceId: true,
  clientId: true,
  fingerprint: true,
});

export const clientActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "tag_manager_client",
    "Performs all client operations: create, get, list, update, remove, revert. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["create", "get", "list", "update", "remove", "revert"])
        .describe(
          "The client operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove', 'revert'.",
        ),
      accountId: z
        .string()
        .describe("The unique ID of the GTM Account containing the client."),
      containerId: z
        .string()
        .describe("The unique ID of the GTM Container containing the client."),
      workspaceId: z
        .string()
        .describe("The unique ID of the GTM Workspace containing the client."),
      clientId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM Client. Required for 'get', 'update', 'remove', and 'revert' actions.",
        ),
      createOrUpdateConfig: PayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM Client resource, except IDs.",
      ),
      pageToken: z
        .string()
        .optional()
        .describe("A token for pagination. Optional for 'list' action."),
      fingerprint: z
        .string()
        .optional()
        .describe(
          "The fingerprint for optimistic concurrency control. Required for 'update' and 'revert' actions.",
        ),
    },
    async ({
      action,
      accountId,
      containerId,
      workspaceId,
      clientId,
      createOrUpdateConfig,
      pageToken,
      fingerprint,
    }) => {
      log(`Running tool: tag_manager_client with action ${action}`);

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
              await tagmanager.accounts.containers.workspaces.clients.create({
                parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                requestBody: createOrUpdateConfig as Schema$Client,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!clientId) {
              throw new Error(`clientId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.clients.get({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/clients/${clientId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response =
              await tagmanager.accounts.containers.workspaces.clients.list({
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
            if (!clientId) {
              throw new Error(`clientId is required for ${action} action`);
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
              await tagmanager.accounts.containers.workspaces.clients.update({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/clients/${clientId}`,
                fingerprint,
                requestBody: createOrUpdateConfig as Schema$Client,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!clientId) {
              throw new Error(`clientId is required for ${action} action`);
            }

            await tagmanager.accounts.containers.workspaces.clients.delete({
              path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/clients/${clientId}`,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Client ${clientId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "revert": {
            if (!clientId) {
              throw new Error(`clientId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.clients.revert({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/clients/${clientId}`,
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
          `Error performing ${action} on client`,
          error,
        );
      }
    },
  );
};

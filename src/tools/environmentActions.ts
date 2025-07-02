import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { EnvironmentSchema } from "../schemas/EnvironmentSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";

const PayloadSchema = EnvironmentSchema.omit({
  accountId: true,
  containerId: true,
  environmentId: true,
  fingerprint: true,
});

export const environmentActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "tag_manager_environment",
    "Performs all environment operations: create, get, list, update, remove, reauthorize. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["create", "get", "list", "update", "remove", "reauthorize"])
        .describe(
          "The environment operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove', 'reauthorize'.",
        ),
      accountId: z
        .string()
        .describe(
          "The unique ID of the GTM Account containing the environment.",
        ),
      containerId: z
        .string()
        .describe(
          "The unique ID of the GTM Container containing the environment.",
        ),
      environmentId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM Environment. Required for 'get', 'update', 'remove', and 'reauthorize' actions.",
        ),
      createOrUpdateConfig: PayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM Environment resource, except IDs.",
      ),
      fingerprint: z
        .string()
        .optional()
        .describe(
          "The fingerprint for optimistic concurrency control. Required for 'update' action.",
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
      environmentId,
      createOrUpdateConfig,
      fingerprint,
      pageToken,
    }) => {
      log(`Running tool: tag_manager_environment with action ${action}`);
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
              await tagmanager.accounts.containers.environments.create({
                parent: `accounts/${accountId}/containers/${containerId}`,
                requestBody: createOrUpdateConfig,
              });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!environmentId) {
              throw new Error(`environmentId is required for ${action} action`);
            }
            const response =
              await tagmanager.accounts.containers.environments.get({
                path: `accounts/${accountId}/containers/${containerId}/environments/${environmentId}`,
              });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response =
              await tagmanager.accounts.containers.environments.list({
                parent: `accounts/${accountId}/containers/${containerId}`,
                pageToken,
              });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "update": {
            if (!environmentId) {
              throw new Error(`environmentId is required for ${action} action`);
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
              await tagmanager.accounts.containers.environments.update({
                path: `accounts/${accountId}/containers/${containerId}/environments/${environmentId}`,
                fingerprint,
                requestBody: createOrUpdateConfig,
              });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!environmentId) {
              throw new Error(`environmentId is required for ${action} action`);
            }
            await tagmanager.accounts.containers.environments.delete({
              path: `accounts/${accountId}/containers/${containerId}/environments/${environmentId}`,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Environment ${environmentId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "reauthorize": {
            if (!environmentId) {
              throw new Error(`environmentId is required for ${action} action`);
            }
            const response =
              await tagmanager.accounts.containers.environments.reauthorize({
                path: `accounts/${accountId}/containers/${containerId}/environments/${environmentId}`,
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
          `Error performing ${action} on environment`,
          error,
        );
      }
    },
  );
};

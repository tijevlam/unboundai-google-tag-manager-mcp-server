import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { createErrorResponse, getTagManagerClient, log } from "../utils";

export const builtInVariableActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "tag_manager_built_in_variable",
    "Performs all built-in variable operations: create, list, remove, revert. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["create", "list", "remove", "revert"])
        .describe(
          "The built-in variable operation to perform. Must be one of: 'create', 'list', 'remove', 'revert'.",
        ),
      accountId: z
        .string()
        .describe(
          "The unique ID of the GTM Account containing the built-in variable.",
        ),
      containerId: z
        .string()
        .describe(
          "The unique ID of the GTM Container containing the built-in variable.",
        ),
      workspaceId: z
        .string()
        .describe(
          "The unique ID of the GTM Workspace containing the built-in variable.",
        ),
      type: z
        .string()
        .optional()
        .describe(
          "The built-in variable type. Required for 'revert' and 'remove' actions.",
        ),
      types: z
        .array(z.string())
        .optional()
        .describe(
          "Array of built-in variable types. Optional for 'list' action.",
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
      types,
      type,
      pageToken,
    }) => {
      log(`Running tool: tag_manager_built_in_variable with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient(props.accessToken);

        switch (action) {
          case "create": {
            if (!types) {
              throw new Error(`types is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.built_in_variables.create(
                {
                  parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                  type: types,
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
              await tagmanager.accounts.containers.workspaces.built_in_variables.list(
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
          case "remove": {
            if (!types) {
              throw new Error(`types is required for ${action} action`);
            }

            await tagmanager.accounts.containers.workspaces.built_in_variables.delete(
              {
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/built_in_variables`,
                type: types,
              },
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Built-in variables deleted in workspace ${workspaceId} for container ${containerId} in account ${accountId}`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "revert": {
            if (!type) {
              throw new Error(`type is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.built_in_variables.revert(
                {
                  path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/built_in_variables`,
                  type,
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
          `Error performing ${action} on built-in variable`,
          error,
        );
      }
    },
  );
};

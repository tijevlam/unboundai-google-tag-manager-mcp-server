import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { UserPermissionSchema } from "../schemas/UserPermissionSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import Schema$UserPermission = tagmanager_v2.Schema$UserPermission;

export const userPermissionActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "tag_manager_user_permission",
    "Performs all user permission operations: create, get, list, update, remove. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["create", "get", "list", "update", "remove"])
        .describe(
          "The user permission operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove'.",
        ),
      accountId: z
        .string()
        .describe(
          "The unique ID of the GTM Account containing the user permission.",
        ),
      userPermissionId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the user permission. Required for 'get', 'update', and 'remove' actions.",
        ),
      createOrUpdateConfig: UserPermissionSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM user permission resource.",
      ),
      pageToken: z
        .string()
        .optional()
        .describe("A token for pagination. Optional for 'list' action."),
    },
    async ({
      action,
      accountId,
      userPermissionId,
      createOrUpdateConfig,
      pageToken,
    }) => {
      log(`Running tool: tag_manager_user_permission with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient(props.accessToken);

        switch (action) {
          case "create": {
            if (!createOrUpdateConfig) {
              throw new Error(
                `createOrUpdateConfig is required for ${action} action`,
              );
            }

            const response = await tagmanager.accounts.user_permissions.create({
              parent: `accounts/${accountId}`,
              requestBody: createOrUpdateConfig as Schema$UserPermission,
            });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!userPermissionId) {
              throw new Error(
                `userPermissionId is required for ${action} action`,
              );
            }

            const response = await tagmanager.accounts.user_permissions.get({
              path: `accounts/${accountId}/user_permissions/${userPermissionId}`,
            });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response = await tagmanager.accounts.user_permissions.list({
              parent: `accounts/${accountId}`,
              pageToken,
            });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "update": {
            if (!userPermissionId) {
              throw new Error(
                `userPermissionId is required for ${action} action`,
              );
            }

            if (!createOrUpdateConfig) {
              throw new Error(
                `createOrUpdateConfig is required for ${action} action`,
              );
            }

            const response = await tagmanager.accounts.user_permissions.update({
              path: `accounts/${accountId}/user_permissions/${userPermissionId}`,
              requestBody: createOrUpdateConfig as Schema$UserPermission,
            });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!userPermissionId) {
              throw new Error(
                `userPermissionId is required for ${action} action`,
              );
            }

            await tagmanager.accounts.user_permissions.delete({
              path: `accounts/${accountId}/user_permissions/${userPermissionId}`,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `User permission ${userPermissionId} was successfully deleted`,
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
          `Error performing ${action} on user permission`,
          error,
        );
      }
    },
  );
};

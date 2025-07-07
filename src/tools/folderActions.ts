import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { FolderSchema } from "../schemas/FolderSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import Schema$Folder = tagmanager_v2.Schema$Folder;

const PayloadSchema = FolderSchema.omit({
  accountId: true,
  containerId: true,
  workspaceId: true,
  folderId: true,
  fingerprint: true,
});

export const folderActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "gtm_folder",
    "Performs all folder operations: create, get, list, update, remove, revert, entities, moveEntitiesToFolder. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum([
          "create",
          "get",
          "list",
          "update",
          "remove",
          "revert",
          "entities",
          "moveEntitiesToFolder",
        ])
        .describe(
          "The folder operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove', 'revert', 'entities', 'moveEntitiesToFolder'.",
        ),
      accountId: z
        .string()
        .describe("The unique ID of the GTM Account containing the folder."),
      containerId: z
        .string()
        .describe("The unique ID of the GTM Container containing the folder."),
      workspaceId: z
        .string()
        .describe("The unique ID of the GTM Workspace containing the folder."),
      folderId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM Folder. Required for 'get', 'update', 'remove', 'revert', 'entities', and 'moveEntitiesToFolder' actions.",
        ),
      createOrUpdateConfig: PayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM Folder resource, except IDs.",
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
        .describe(
          "A token for pagination. Optional for 'list' and 'entities' actions.",
        ),
      tagId: z
        .array(z.string())
        .optional()
        .describe(
          "The tags to be moved to the folder. Required for 'moveEntitiesToFolder' action.",
        ),
      triggerId: z
        .array(z.string())
        .optional()
        .describe(
          "The triggers to be moved to the folder. Required for 'moveEntitiesToFolder' action.",
        ),
      variableId: z
        .array(z.string())
        .optional()
        .describe(
          "The variables to be moved to the folder. Required for 'moveEntitiesToFolder' action.",
        ),
    },
    async ({
      action,
      accountId,
      containerId,
      workspaceId,
      folderId,
      createOrUpdateConfig,
      fingerprint,
      pageToken,
      tagId,
      triggerId,
      variableId,
    }) => {
      log(`Running tool: gtm_folder with action ${action}`);

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
              await tagmanager.accounts.containers.workspaces.folders.create({
                parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                requestBody: createOrUpdateConfig as Schema$Folder,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!folderId) {
              throw new Error(`folderId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.folders.get({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/folders/${folderId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            const response =
              await tagmanager.accounts.containers.workspaces.folders.list({
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
            if (!folderId) {
              throw new Error(`folderId is required for ${action} action`);
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
              await tagmanager.accounts.containers.workspaces.folders.update({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/folders/${folderId}`,
                fingerprint,
                requestBody: createOrUpdateConfig as Schema$Folder,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!folderId) {
              throw new Error(`folderId is required for ${action} action`);
            }

            await tagmanager.accounts.containers.workspaces.folders.delete({
              path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/folders/${folderId}`,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Folder ${folderId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "revert": {
            if (!folderId) {
              throw new Error(`folderId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.folders.revert({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/folders/${folderId}`,
                fingerprint,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "entities": {
            if (!folderId) {
              throw new Error(`folderId is required for ${action} action`);
            }

            const response =
              await tagmanager.accounts.containers.workspaces.folders.entities({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/folders/${folderId}`,
                pageToken,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "moveEntitiesToFolder": {
            if (!folderId) {
              throw new Error(`folderId is required for ${action} action`);
            }

            if (!tagId && !triggerId && !variableId) {
              throw new Error(
                `At least one of tagId, triggerId, or variableId is required for ${action} action`,
              );
            }

            await tagmanager.accounts.containers.workspaces.folders.move_entities_to_folder(
              {
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/folders/${folderId}`,
                tagId,
                triggerId,
                variableId,
              },
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Entities moved to folder ${folderId} in workspace ${workspaceId} for container ${containerId} in account ${accountId}`,
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
          `Error performing ${action} on folder`,
          error,
        );
      }
    },
  );
};

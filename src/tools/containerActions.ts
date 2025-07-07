import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { CombineConfigSchema } from "../schemas/CombineConfigSchema";
import { ContainerSchema } from "../schemas/ContainerSchema";
import { MoveTagIdConfigSchema } from "../schemas/MoveTagIdConfigSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";

const ContainerPayloadSchema = ContainerSchema.omit({
  accountId: true,
  containerId: true,
  fingerprint: true,
});

const MoveTagIdConfigPayloadSchema = MoveTagIdConfigSchema.omit({
  accountId: true,
  containerId: true,
});

const CombineConfigPayloadSchema = CombineConfigSchema.omit({
  accountId: true,
});

export const containerActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "gtm_container",
    "Performs all container-related operations: create, get, update, remove, list, combine, lookup, moveTagId, snippet. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum([
          "create",
          "get",
          "list",
          "update",
          "remove",
          "combine",
          "lookup",
          "moveTagId",
          "snippet",
        ])
        .describe(
          "The container operation to perform. Must be one of: 'create', 'get', 'list', 'update', 'remove', 'combine', 'lookup', 'moveTagId', 'snippet'.",
        ),
      accountId: z
        .string()
        .describe("The unique ID of the GTM Account containing the container."),
      containerId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM Container. Required for 'get', 'update', 'remove', 'combine', 'lookup', 'moveTagId', and 'snippet' actions.",
        ),
      destinationId: z
        .string()
        .optional()
        .describe(
          "The destination ID linked to a GTM Container (e.g., AW-123456789). Required for the 'lookup' action.",
        ),
      createOrUpdateConfig: ContainerPayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM Container resource.",
      ),
      pageToken: z
        .string()
        .optional()
        .describe("A token for pagination. Optional for 'list' action."),
      fingerprint: z
        .string()
        .optional()
        .describe(
          "The fingerprint for optimistic concurrency control. Required for 'update' action.",
        ),
      combineConfig: CombineConfigPayloadSchema.optional().describe(
        "Configuration for 'combine' action. Specifies which containers to combine.",
      ),
      moveTagIdConfig: MoveTagIdConfigPayloadSchema.optional().describe(
        "Configuration for 'moveTagId' action. Specifies tag ID mapping for moving tags between containers.",
      ),
    },
    async ({
      action,
      accountId,
      containerId,
      destinationId,
      createOrUpdateConfig,
      pageToken,
      fingerprint,
      combineConfig,
      moveTagIdConfig,
    }) => {
      log(`Running tool: gtm_container with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient(props.accessToken);

        switch (action) {
          case "create": {
            if (!createOrUpdateConfig) {
              throw new Error(
                `createOrUpdateConfig is required for ${action} action`,
              );
            }

            const response = await tagmanager.accounts.containers.create({
              parent: `accounts/${accountId}`,
              requestBody: createOrUpdateConfig,
            });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "get": {
            if (!accountId) {
              throw new Error(`accountId is required for ${action} action`);
            }

            if (!containerId) {
              throw new Error(`containerId is required for ${action} action`);
            }

            const response = await tagmanager.accounts.containers.get({
              path: `accounts/${accountId}/containers/${containerId}`,
            });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "update": {
            if (!createOrUpdateConfig) {
              throw new Error(
                `createOrUpdateConfig is required for ${action} action`,
              );
            }

            if (!containerId) {
              throw new Error(`containerId is required for ${action} action`);
            }

            if (!fingerprint) {
              throw new Error(`fingerprint is required for ${action} action`);
            }

            const response = await tagmanager.accounts.containers.update({
              path: `accounts/${accountId}/containers/${containerId}`,
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
            if (!accountId) {
              throw new Error(`accountId is required for ${action} action`);
            }

            if (!containerId) {
              throw new Error(`containerId is required for ${action} action`);
            }

            await tagmanager.accounts.containers.delete({
              path: `accounts/${accountId}/containers/${containerId}`,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Container ${containerId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "list": {
            if (!accountId) {
              throw new Error(`accountId is required for ${action} action`);
            }

            const response = await tagmanager.accounts.containers.list({
              parent: `accounts/${accountId}`,
              pageToken,
            });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "combine": {
            if (!combineConfig) {
              throw new Error(`combineConfig is required for ${action} action`);
            }

            const {
              fromContainerId,
              toContainerId,
              allowUserPermissionFeatureUpdate,
              settingSource,
            } = combineConfig;

            const response = await tagmanager.accounts.containers.combine({
              path: `accounts/${accountId}/containers/${fromContainerId}`,
              containerId: toContainerId,
              allowUserPermissionFeatureUpdate,
              settingSource,
            });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "lookup": {
            if (!destinationId) {
              throw new Error(`destinationId is required for ${action} action`);
            }

            const response = await tagmanager.accounts.containers.lookup({
              destinationId,
            });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "moveTagId": {
            if (!containerId) {
              throw new Error(`containerId is required for ${action} action`);
            }

            if (!moveTagIdConfig) {
              throw new Error(
                `moveTagIdConfig is required for ${action} action`,
              );
            }

            const {
              tagId,
              tagName,
              allowUserPermissionFeatureUpdate,
              copySettings,
              copyTermsOfService,
              copyUsers,
            } = moveTagIdConfig;

            const response = await tagmanager.accounts.containers.move_tag_id({
              path: `accounts/${accountId}/containers/${containerId}`,
              tagId,
              tagName,
              allowUserPermissionFeatureUpdate,
              copySettings,
              copyTermsOfService,
              copyUsers,
            });
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "snippet": {
            if (!accountId) {
              throw new Error(`accountId is required for ${action} action`);
            }

            if (!containerId) {
              throw new Error(`containerId is required for ${action} action`);
            }

            const response = await tagmanager.accounts.containers.snippet({
              path: `accounts/${accountId}/containers/${containerId}`,
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
          `Error performing ${action} on container`,
          error,
        );
      }
    },
  );
};

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel";
import { ContainerVersionSchema } from "../schemas/ContainerVersionSchema";
import { createErrorResponse, getTagManagerClient, log } from "../utils";
import Schema$ContainerVersion = tagmanager_v2.Schema$ContainerVersion;

const PayloadSchema = ContainerVersionSchema.omit({
  accountId: true,
  containerId: true,
  containerVersionId: true,
});

export const versionActions = (
  server: McpServer,
  { props }: McpAgentToolParamsModel,
): void => {
  server.tool(
    "tag_manager_version",
    "Performs all container version operations: get, live, publish, remove, setLatest, undelete, update. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum([
          "get",
          "live",
          "publish",
          "remove",
          "setLatest",
          "undelete",
          "update",
        ])
        .describe(
          "The container version operation to perform. Must be one of: 'get', 'live', 'publish', 'remove', 'setLatest', 'undelete', 'update'.",
        ),
      accountId: z
        .string()
        .describe(
          "The unique ID of the GTM Account containing the container version.",
        ),
      containerId: z
        .string()
        .describe("The unique ID of the GTM Container containing the version."),
      containerVersionId: z
        .string()
        .optional()
        .describe(
          "The unique ID of the GTM container version. Required for 'get', 'publish', 'remove', 'setLatest', 'undelete', and 'update' actions.",
        ),
      createOrUpdateConfig: PayloadSchema.optional().describe(
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM container version resource, except IDs.",
      ),
      fingerprint: z
        .string()
        .optional()
        .describe(
          "The fingerprint for optimistic concurrency control. Required for 'publish' and 'update' actions.",
        ),
    },
    async ({
      action,
      accountId,
      containerId,
      containerVersionId,
      createOrUpdateConfig,
      fingerprint,
    }) => {
      log(`Running tool: tag_manager_version with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient(props.accessToken);

        switch (action) {
          case "get": {
            if (!containerVersionId) {
              throw new Error(
                `containerVersionId is required for ${action} action`,
              );
            }

            const response = await tagmanager.accounts.containers.versions.get({
              path: `accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}`,
            });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "live": {
            const response = await tagmanager.accounts.containers.versions.live(
              {
                parent: `accounts/${accountId}/containers/${containerId}`,
              },
            );

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "publish": {
            if (!containerVersionId) {
              throw new Error(
                `containerVersionId is required for ${action} action`,
              );
            }

            const response =
              await tagmanager.accounts.containers.versions.publish({
                path: `accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}`,
                fingerprint,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "remove": {
            if (!containerVersionId) {
              throw new Error(
                `containerVersionId is required for ${action} action`,
              );
            }

            await tagmanager.accounts.containers.versions.delete({
              path: `accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}`,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Container version ${containerVersionId} was successfully deleted`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "setLatest": {
            if (!containerVersionId) {
              throw new Error(
                `containerVersionId is required for ${action} action`,
              );
            }

            const response =
              await tagmanager.accounts.containers.versions.set_latest({
                path: `accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "undelete": {
            if (!containerVersionId) {
              throw new Error(
                `containerVersionId is required for ${action} action`,
              );
            }

            const response =
              await tagmanager.accounts.containers.versions.undelete({
                path: `accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}`,
              });

            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "update": {
            if (!containerVersionId) {
              throw new Error(
                `containerVersionId is required for ${action} action`,
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
              await tagmanager.accounts.containers.versions.update({
                path: `accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}`,
                fingerprint,
                requestBody: createOrUpdateConfig as Schema$ContainerVersion,
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
          `Error performing ${action} on container version`,
          error,
        );
      }
    },
  );
};

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tagmanager_v2 } from "googleapis";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel.js";
import { TagSchema } from "../schemas/TagSchema.js";
import {
  createErrorResponse,
  getTagManagerClient,
  log,
  paginateArray,
} from "../utils/index.js";
import Schema$Tag = tagmanager_v2.Schema$Tag;

const PayloadSchema = TagSchema.omit({
  accountId: true,
  containerId: true,
  workspaceId: true,
  tagId: true,
  fingerprint: true,
});

const ITEMS_PER_PAGE = 20;

// GA4 Configuration tag parameter keys
const GA4_PARAM_KEYS = ["measurementId", "sendPageView"];

/**
 * Merges incoming partial tag fields into the existing tag.
 * This ensures that required fields like 'type' and 'parameter' are preserved
 * when performing partial updates.
 */
function mergeTag(
  existingTag: Schema$Tag,
  partial: Partial<Schema$Tag>,
): Schema$Tag {
  const merged = { ...existingTag };

  // Merge all fields from partial into merged, overwriting existing values
  for (const key in partial) {
    if (Object.hasOwn(partial, key)) {
      const value = partial[key as keyof Schema$Tag];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }

  return merged;
}

/**
 * Ensures the tag has minimal integrity for required fields.
 * For GA4 Configuration tags, ensures the type is 'gaawc'.
 */
function ensureMinimalIntegrity(tag: Schema$Tag): void {
  // If tag has parameters that indicate it's a GA4 config but no type, set it
  if (!tag.type && tag.parameter) {
    const hasGA4Params = tag.parameter.some((p) =>
      GA4_PARAM_KEYS.includes(p.key ?? ""),
    );
    if (hasGA4Params) {
      tag.type = "gaawc";
    }
  }
}

export const tagActions = (
  server: McpServer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _toolParams: McpAgentToolParamsModel,
): void => {
  server.tool(
    "gtm_tag",
    `Performs all GTM tag operations: create, get, list, update, remove, revert. The 'list' action returns up to ${ITEMS_PER_PAGE} items per page.`,
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
        "Configuration for 'create' and 'update' actions. All fields correspond to the GTM tag resource, except IDs.",
      ),
      fingerprint: z
        .string()
        .optional()
        .describe(
          "The fingerprint for optimistic concurrency control. Optional for 'update' action if included in createOrUpdateConfig. Required for 'revert' action.",
        ),
      page: z
        .number()
        .min(1)
        .default(1)
        .describe(
          `Page number for pagination (starts from 1). Each page contains up to itemsPerPage items.`,
        ),
      itemsPerPage: z
        .number()
        .min(1)
        .max(ITEMS_PER_PAGE)
        .default(ITEMS_PER_PAGE)
        .describe(
          `Number of items to return per page (1-${ITEMS_PER_PAGE}). Default: ${ITEMS_PER_PAGE}. Use lower values if experiencing response issues.`,
        ),
    },
    async ({
      action,
      accountId,
      containerId,
      workspaceId,
      tagId,
      createOrUpdateConfig,
      fingerprint,
      page,
      itemsPerPage,
    }) => {
      log(`Running tool: gtm_tag with action ${action}`);

      try {
        const tagmanager = await getTagManagerClient();

        switch (action) {
          case "create": {
            if (!createOrUpdateConfig) {
              throw new Error(
                `createOrUpdateConfig is required for ${action} action`,
              );
            }

            // Validate that type is provided for create action
            if (!createOrUpdateConfig.type) {
              throw new Error(
                `'type' field is required in createOrUpdateConfig for ${action} action. Specify the tag type (e.g., 'gaawc' for GA4 Configuration).`,
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
            let all: Schema$Tag[] = [];
            let currentPageToken = "";

            do {
              const response =
                await tagmanager.accounts.containers.workspaces.tags.list({
                  parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                  pageToken: currentPageToken,
                });

              if (response.data.tag) {
                all = all.concat(response.data.tag);
              }

              currentPageToken = response.data.nextPageToken || "";
            } while (currentPageToken);

            const paginatedResult = paginateArray(all, page, itemsPerPage);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(paginatedResult, null, 2),
                },
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

            // Fetch the existing tag to preserve required fields
            log(`Fetching existing tag ${tagId} before update`);
            const existingTagResponse =
              await tagmanager.accounts.containers.workspaces.tags.get({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
              });

            const existingTag = existingTagResponse.data;
            if (!existingTag) {
              throw new Error(
                `Could not retrieve existing tag ${tagId} for update`,
              );
            }

            // Merge incoming partial fields into the existing tag
            const mergedTag = mergeTag(
              existingTag,
              createOrUpdateConfig as Schema$Tag,
            );

            // Ensure minimal integrity (e.g., GA4 Config tags have type 'gaawc')
            ensureMinimalIntegrity(mergedTag);

            // Handle fingerprint: use provided fingerprint, or fall back to existing tag's fingerprint
            if (fingerprint) {
              mergedTag.fingerprint = fingerprint;
            } else if ((createOrUpdateConfig as any).fingerprint) {
              // Note: PayloadSchema omits fingerprint, so we need to cast to any to access it
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              mergedTag.fingerprint = (createOrUpdateConfig as any).fingerprint;
            } else if (existingTag.fingerprint) {
              // Use the existing tag's fingerprint if none was provided
              mergedTag.fingerprint = existingTag.fingerprint;
            } else {
              throw new Error(
                `fingerprint is required for ${action} action. The existing tag does not have a fingerprint, so you must provide one.`,
              );
            }

            log(`Updating tag ${tagId} with merged fields`);
            const response =
              await tagmanager.accounts.containers.workspaces.tags.update({
                path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
                requestBody: mergedTag,
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

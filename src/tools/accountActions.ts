import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAgentToolParamsModel } from "../models/McpAgentModel.js";
import { AccountSchema } from "../schemas/AccountSchema.js";
import {
  createErrorResponse,
  getTagManagerClient,
  log,
} from "../utils/index.js";
import { debug } from "../utils/log.js";

const PayloadSchema = AccountSchema.omit({
  accountId: true,
});

export const accountActions = (
  server: McpServer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _toolParams: McpAgentToolParamsModel,
): void => {
  debug("Registering gtm_account tool...");
  server.tool(
    "gtm_account",
    "Performs all account-related operations: get, list, update. Use the 'action' parameter to select the operation.",
    {
      action: z
        .enum(["get", "list", "update"])
        .describe(
          "The account operation to perform. Must be one of: 'get', 'list', 'update'.",
        ),
      accountId: z.string().describe("The unique ID of the GTM Account."),
      config: PayloadSchema.optional().describe(
        "Configuration for 'update' action. All fields correspond to the GTM Account resource.",
      ),
    },
    async ({ action, accountId, config }) => {
      log(`Running tool: gtm_account with action ${action}`);
      debug(`Account ID: ${accountId || "N/A"}`);
      debug(`Config provided: ${!!config}`);

      try {
        debug("Getting Tag Manager client...");
        const tagmanager = await getTagManagerClient();
        debug("Tag Manager client obtained");

        switch (action) {
          case "get": {
            if (!accountId) {
              throw new Error(`accountId is required for ${action} action`);
            }

            debug(`Fetching account: accounts/${accountId}`);
            const response = await tagmanager.accounts.get({
              path: `accounts/${accountId}`,
            });
            debug(`Account fetched successfully: ${response.data.name}`);
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "list": {
            debug("Listing all accounts...");
            const response = await tagmanager.accounts.list({});
            debug(`Retrieved ${response.data.account?.length || 0} accounts`);
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          }
          case "update": {
            if (!accountId) {
              throw new Error(`accountId is required for ${action} action`);
            }

            if (!config) {
              throw new Error(`config is required for ${action} action`);
            }

            debug(`Updating account: accounts/${accountId}`);
            const response = await tagmanager.accounts.update({
              path: `accounts/${accountId}`,
              requestBody: config,
            });
            debug(`Account updated successfully: ${response.data.name}`);
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
          `Error performing ${action} on account`,
          error,
        );
      }
    },
  );
  debug("gtm_account tool registered successfully");
};

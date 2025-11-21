import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TAG_MANAGER_REMOVE_MCP_SERVER_DATA } from "../constants/tools.js";
import { error as logError, debug } from "./log.js";

export function createErrorResponse(
  message: string,
  error?: any,
): CallToolResult {
  let detailedMessage = "";

  debug(`Creating error response for: ${message}`);

  if (error?.code) {
    if (error.code === 401) {
      detailedMessage = `It seems that your token has been expired, please use ${TAG_MANAGER_REMOVE_MCP_SERVER_DATA} tool to clear your session in the MCP client`;
    } else {
      const messages = (error?.errors || []).map(
        (item: { message?: string }) => item?.message,
      );

      detailedMessage = `${message}: Google API Error ${error.code} - ${messages.join(". ")}`;
    }
  } else if (error instanceof Error) {
    detailedMessage = `${message}: ${error.message}`;
    debug("Error stack trace:", error.stack);
  } else {
    detailedMessage = `${message}: ${String(error)}`;
  }

  logError("MCP Tool Error:", detailedMessage);

  return {
    isError: true,
    content: [{ type: "text", text: detailedMessage }],
  };
}

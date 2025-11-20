#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools/index.js";
import { getPackageVersion } from "./utils/index.js";
import { debug, info, error as logError } from "./utils/log.js";

// Log startup information
debug("=== MCP Server Initialization Started ===");
debug(`Node version: ${process.version}`);
debug(`Platform: ${process.platform}`);
debug(`Architecture: ${process.arch}`);
debug(`Current working directory: ${process.cwd()}`);
debug(`Environment variables:`, {
  DEBUG: process.env.DEBUG,
  LOG_LEVEL: process.env.LOG_LEVEL,
  NO_COLOR: process.env.NO_COLOR,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? "Set"
    : "Not set",
  NODE_ENV: process.env.NODE_ENV,
});

let server: McpServer;
let serverVersion: string;

try {
  debug("Getting package version...");
  serverVersion = getPackageVersion();
  debug(`Package version: ${serverVersion}`);
} catch (err) {
  logError("Failed to get package version:", err);
  serverVersion = "unknown";
}

try {
  debug("Creating MCP Server instance...");
  server = new McpServer({
    name: "google-tag-manager-mcp-server",
    version: serverVersion,
  });
  debug("MCP Server instance created successfully");
} catch (err) {
  logError("Failed to create MCP Server instance:", err);
  process.exit(1);
}

// Register all tools
debug(`Registering ${tools.length} tool groups...`);
let toolCount = 0;
try {
  tools.forEach((register, index) => {
    try {
      debug(`Registering tool group ${index + 1}/${tools.length}...`);
      register(server, { props: {} });
      toolCount++;
      debug(`Tool group ${index + 1} registered successfully`);
    } catch (err) {
      logError(`Failed to register tool group ${index + 1}:`, err);
      throw err;
    }
  });
  info(`Successfully registered ${toolCount} tool groups`);
} catch (err) {
  logError("Failed to register tools:", err);
  process.exit(1);
}

async function main(): Promise<void> {
  try {
    debug("Creating StdioServerTransport...");
    const transport = new StdioServerTransport();
    debug("StdioServerTransport created successfully");

    debug("Connecting server to transport...");
    await server.connect(transport);
    debug("Server connected to transport successfully");

    info("Google Tag Manager MCP Server running on stdio");
    debug("=== MCP Server Initialization Complete ===");
  } catch (err) {
    logError("Failed to start server:", err);
    throw err;
  }
}

main().catch((err) => {
  logError("Fatal error in main():", err);
  if (err instanceof Error && err.stack) {
    logError("Stack trace:", err.stack);
  }
  process.exit(1);
});

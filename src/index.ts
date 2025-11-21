#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools/index.js";
import { getPackageVersion } from "./utils/index.js";

const server = new McpServer({
  name: "unboundai-gtm-mcp-server",
  version: getPackageVersion(),
});

// Register all tools
tools.forEach((register) => {
  register(server, { props: {} });
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Tag Manager MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

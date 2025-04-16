// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { GoogleAuth } from 'google-auth-library';
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Check if colors should be disabled
const useColors = !process.env.NO_COLOR;

// Helper function for logging that respects NO_COLOR
function log(message: string): void {
    // Remove emoji and color codes if NO_COLOR is set
    if (!useColors) {
        // Replace emoji and other special characters with plain text
        message = message
            .replace(/✅/g, 'SUCCESS:')
            .replace(/❌/g, 'ERROR:')
            .replace(/ℹ️/g, 'INFO:')
            .replace(/\u2139\ufe0f/g, 'INFO:');
    }
    console.error(message);
}

// Load environment variables from .env file if it exists
try {
    dotenv.config({ path: process.env.ENV_FILE || '.env' });
} catch (error) {
    console.error("Note: No .env file found, using environment variables directly.");
}

// --- Configuration ---
const MCP_PROTOCOL_VERSION = "1.0";

// Read version from package.json
let packageVersion = "1.0.0"; // Default version as fallback
try {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageVersion = packageJson.version || packageVersion;
    }
} catch (error) {
    console.error("Could not read package.json, using default version:", error);
}

// --- Create MCP Server Instance ---
const server = new McpServer({
    name: "google-tag-manager",
    version: packageVersion,
    protocolVersion: MCP_PROTOCOL_VERSION,
    vendor: "stape-io",
    homepage: "https://github.com/stape-io/mcp-google-tag-manager"
});

// --- Helper function for error messages ---
function createErrorResponse(message: string, error?: any): CallToolResult {
    let detailedMessage = message;
    if (error) {
        // Try to recognize specific Google API errors
        if (error.code && error.details) { // Standard gRPC error structure
            detailedMessage = `${message}: Google API Error ${error.code} - ${error.details}`;
        } else if (error instanceof Error) {
            detailedMessage = `${message}: ${error.message}`;
        } else {
            detailedMessage = `${message}: ${String(error)}`;
        }
    }
    console.error("MCP Tool Error:", detailedMessage); // Log errors to stderr
    return {
        isError: true,
        content: [{ type: "text", text: detailedMessage }],
    };
}

// --- Helper function to obtain an authenticated TagManager client ---
async function getTagManagerClient() {
    try {
        const auth = new google.auth.GoogleAuth({
            scopes: [
                'https://www.googleapis.com/auth/tagmanager.readonly',
                'https://www.googleapis.com/auth/tagmanager.edit.containers'
            ],
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
        
        return google.tagmanager({
            version: 'v2',
            auth
        });
    } catch (error) {
        console.error("Error creating Tag Manager client:", error);
        throw error;
    }
}

// --- Google Tag Manager API Tools ---

server.tool(
    "tag_manager_list_accounts",
    "Lists all GTM accounts accessible by the authenticated user",
    {},
    async (): Promise<CallToolResult> => {
        log("Running tool: tag_manager_list_accounts");
        
        try {
            const tagmanager = await getTagManagerClient();
            const response = await tagmanager.accounts.list({});
            
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return createErrorResponse("Error listing accounts", error);
        }
    }
);

server.tool(
    "tag_manager_list_containers",
    "Lists all containers within the specified GTM account",
    {
        accountId: z.string().describe("The GTM account ID")
    },
    async ({ accountId }): Promise<CallToolResult> => {
        log(`Running tool: tag_manager_list_containers for account ${accountId}`);
        
        try {
            const tagmanager = await getTagManagerClient();
            const response = await tagmanager.accounts.containers.list({
                parent: `accounts/${accountId}`
            });
            
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return createErrorResponse(`Error listing containers for account ${accountId}`, error);
        }
    }
);

server.tool(
    "tag_manager_get_container",
    "Gets a specific container from an account",
    {
        accountId: z.string().describe("The GTM account ID"),
        containerId: z.string().describe("The container ID")
    },
    async ({ accountId, containerId }): Promise<CallToolResult> => {
        log(`Running tool: tag_manager_get_container for account ${accountId}, container ${containerId}`);
        
        try {
            const tagmanager = await getTagManagerClient();
            const response = await tagmanager.accounts.containers.get({
                path: `accounts/${accountId}/containers/${containerId}`
            });
            
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return createErrorResponse(`Error getting container ${containerId} in account ${accountId}`, error);
        }
    }
);

server.tool(
    "tag_manager_create_container",
    "Creates a new container in the specified GTM account",
    {
        accountId: z.string().describe("The GTM account ID"),
        name: z.string().describe("Name for the new container"),
        usageContext: z.array(z.string()).describe("Usage contexts for the container (e.g., ['web', 'android', 'ios'])")
    },
    async ({ accountId, name, usageContext }): Promise<CallToolResult> => {
        log(`Running tool: tag_manager_create_container for account ${accountId}`);
        
        try {
            const tagmanager = await getTagManagerClient();
            const response = await tagmanager.accounts.containers.create({
                parent: `accounts/${accountId}`,
                requestBody: {
                    name,
                    usageContext
                }
            });
            
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return createErrorResponse(`Error creating container in account ${accountId}`, error);
        }
    }
);

server.tool(
    "tag_manager_delete_container",
    "Deletes a container from the specified GTM account",
    {
        accountId: z.string().describe("The GTM account ID"),
        containerId: z.string().describe("The container ID to delete")
    },
    async ({ accountId, containerId }): Promise<CallToolResult> => {
        log(`Running tool: tag_manager_delete_container for account ${accountId}, container ${containerId}`);
        
        try {
            const tagmanager = await getTagManagerClient();
            await tagmanager.accounts.containers.delete({
                path: `accounts/${accountId}/containers/${containerId}`
            });
            
            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, message: `Container ${containerId} was successfully deleted` }, null, 2) }]
            };
        } catch (error: any) {
            return createErrorResponse(`Error deleting container ${containerId} from account ${accountId}`, error);
        }
    }
);

server.tool(
    "tag_manager_list_workspaces",
    "Lists all workspaces in a container",
    {
        accountId: z.string().describe("The GTM account ID"),
        containerId: z.string().describe("The container ID")
    },
    async ({ accountId, containerId }): Promise<CallToolResult> => {
        log(`Running tool: tag_manager_list_workspaces for account ${accountId}, container ${containerId}`);
        
        try {
            const tagmanager = await getTagManagerClient();
            const response = await tagmanager.accounts.containers.workspaces.list({
                parent: `accounts/${accountId}/containers/${containerId}`
            });
            
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return createErrorResponse(`Error listing workspaces for container ${containerId} in account ${accountId}`, error);
        }
    }
);

server.tool(
    "tag_manager_get_container_snippet",
    "Gets the tagging snippet for a container",
    {
        accountId: z.string().describe("The GTM account ID"),
        containerId: z.string().describe("The container ID")
    },
    async ({ accountId, containerId }): Promise<CallToolResult> => {
        log(`Running tool: tag_manager_get_container_snippet for account ${accountId}, container ${containerId}`);
        
        try {
            const tagmanager = await getTagManagerClient();
            const response = await tagmanager.accounts.containers.snippet({
                path: `accounts/${accountId}/containers/${containerId}`
            });
            
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return createErrorResponse(`Error getting container snippet for container ${containerId} in account ${accountId}`, error);
        }
    }
);

// --- Start the MCP server ---
async function main() {
    try {
        log("Starting MCP server with stdio transport...");
        const transport = new StdioServerTransport();
        await server.connect(transport);
        log("✅ MCP server started");
    } catch (error) {
        log(`❌ Error starting server: ${error}`);
        process.exit(1);
    }
}

main();
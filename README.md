# MCP Server for Google Tag Manager

This is an MCP server that provides an interface to the Google Tag Manager API using Google Application Default Credentials (ADC).

## Setup instructions

Setup involves the following steps:

1. Install Node.js (v20 or later recommended)
2. Enable Google Tag Manager API in your Google Cloud project
3. Configure Google Application Default Credentials (ADC)
4. Configure your MCP client (Claude Desktop, Gemini CLI, etc.)

### Enable Google Tag Manager API

[Follow the instructions](https://support.google.com/googleapi/answer/6158841) to enable the Google Tag Manager API in your Google Cloud project:

* [Google Tag Manager API](https://console.cloud.google.com/apis/library/tagmanager.googleapis.com)

### Configure Google Application Default Credentials

Configure your [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/provide-credentials-adc). Make sure the credentials are for a user with access to your Google Tag Manager accounts.

Credentials must include the Google Tag Manager edit scope:

```
https://www.googleapis.com/auth/tagmanager.edit.containers
```

Check out [Manage OAuth Clients](https://support.google.com/cloud/answer/15549257) for how to create an OAuth client.

Here are some sample `gcloud` commands you might find useful:

- Set up ADC using user credentials and an OAuth desktop or web client after downloading the client JSON to `YOUR_CLIENT_JSON_FILE`.

  ```shell
  gcloud auth application-default login \
    --scopes https://www.googleapis.com/auth/tagmanager.edit.containers,https://www.googleapis.com/auth/cloud-platform \
    --client-id-file=YOUR_CLIENT_JSON_FILE
  ```

- Set up ADC using service account impersonation.

  ```shell
  gcloud auth application-default login \
    --impersonate-service-account=SERVICE_ACCOUNT_EMAIL \
    --scopes=https://www.googleapis.com/auth/tagmanager.edit.containers,https://www.googleapis.com/auth/cloud-platform
  ```

When the `gcloud auth application-default` command completes, copy the `PATH_TO_CREDENTIALS_JSON` file location printed to the console in the following message. You'll need this for the next step!

```
Credentials saved to file: [PATH_TO_CREDENTIALS_JSON]
```

### Configure Claude Desktop

1. Open Claude Desktop and navigate to Settings -> Developer -> Edit Config. This opens the configuration file that controls which MCP servers Claude can access.

2. Add the following configuration. Replace `PATH_TO_CREDENTIALS_JSON` with the path you copied in the previous step:

```json
{
  "mcpServers": {
    "gtm-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "google-tag-manager-mcp-server"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "PATH_TO_CREDENTIALS_JSON"
      }
    }
  }
}
```

3. Restart Claude Desktop. The tools will become available for you to use.

## Troubleshooting

**MCP Server Name Length Limit**

Some MCP clients (like Cursor AI) have a 60-character limit for the combined MCP server name + tool name length. If you use a longer server name in your configuration (e.g., `gtm-mcp-server-your-additional-long-name`), some tools may be filtered out.

To avoid this issue:
- Use shorter server names in your MCP configuration (e.g., `gtm-mcp-server`)

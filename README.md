# mcp-cli

A CLI inspector for the Model Context Protocol

## Features

- Run MCP servers from various sources
- List Tools, Resources, Prompts
- Call Tools, Read Resources, Read Prompts
- OAuth support for SSE and Streamable HTTP servers

## Usage

### Run with a config file

```bash
npx @wong2/mcp-cli -c config.json
```

The config file has the same format as the Claude Desktop config file.

### Connect to a running server over Streamable HTTP

```bash
npx @wong2/mcp-cli --url http://localhost:8000/mcp
```

### Non-interactive mode

Run a specific tool, resource, or prompt without interactive prompts:

```bash
npx @wong2/mcp-cli [--config config.json] <command> <server-name>:<target> [--args '{}']
```

Examples:

```bash
# Call a tool without arguments
npx @wong2/mcp-cli -c config.json call-tool filesystem:list_files

# Call a tool with arguments
npx @wong2/mcp-cli -c config.json call-tool filesystem:read_file --args '{"path": "package.json"}'

### Purge stored data (OAuth tokens, etc.)

```bash
npx @wong2/mcp-cli purge
```

## Related

- [mcpservers.org](https://mcpservers.org) - A curated list of MCP servers

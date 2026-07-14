#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRemoteTransport } from '../src/oauth/logging.js'
import { McpOAuthClientProvider } from '../src/oauth/provider.js'
import crypto from 'node:crypto'
import { formatToolsDocument } from './format-tool-description.js'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  const configPath = resolve(projectRoot, 'config.json')
  const config = JSON.parse(await readFile(configPath, 'utf-8'))
  const [serverName, serverConfig] = Object.entries(config.mcpServers)[0]
  const outPath = join(projectRoot, `${serverName}-tool-descriptions.md`)

  if (serverConfig.ignoreCertificateErrors) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  const uri = serverConfig.url || serverConfig.sse
  if (!uri) {
    throw new Error('Only remote URL/SSE servers are supported by this script')
  }

  const serverId = crypto.createHash('sha256').update(uri).digest('hex')
  const authProvider = new McpOAuthClientProvider(serverId, 'http://127.0.0.1:0/oauth/callback', {
    oauthScopes: serverConfig.oauthScopes,
  })
  const transport = createRemoteTransport(uri, authProvider, { sse: Boolean(serverConfig.sse) })
  const client = new Client({ name: 'mcp-cli-dump', version: '1.0.0' }, { capabilities: {} })

  await client.connect(transport)
  const { tools } = await client.listTools()
  await client.close()

  const content = formatToolsDocument({ serverName, uri, tools })
  await writeFile(outPath, content, 'utf-8')
  console.log(`Wrote ${tools.length} tool descriptions to ${outPath}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

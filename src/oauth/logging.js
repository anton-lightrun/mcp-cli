import colors from 'yoctocolors'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { logger } from '../utils.js'

export function logOAuth(label, url) {
  logger.log(colors.cyan(`[oauth] ${label} ${url}`))
}

export function logOAuthClientId(clientId, { registered = false } = {}) {
  const suffix = registered ? ' (newly registered)' : ''
  logOAuth('client_id', `${clientId}${suffix}`)
}

export function logOAuthTokens(tokens, { event = 'tokens' } = {}) {
  if (!tokens) {
    logOAuth(event, '(none)')
    return
  }
  if (tokens.access_token) logOAuth(`${event} access_token`, tokens.access_token)
  if (tokens.refresh_token) logOAuth(`${event} refresh_token`, tokens.refresh_token)
}

export function createLoggingFetch(fetchFn = globalThis.fetch) {
  return async (input, init) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method =
      init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')
    logOAuth('→', `${method} ${url}`)
    const response = await fetchFn(input, init)
    logOAuth('←', `${response.status} ${response.url || url}`)
    return response
  }
}

export function createRemoteTransport(uri, authProvider, { sse = false } = {}) {
  const opts = { authProvider, fetch: createLoggingFetch() }
  return sse
    ? new SSEClientTransport(new URL(uri), opts)
    : new StreamableHTTPClientTransport(new URL(uri), opts)
}

// @ts-check

import open from 'open'
import { config } from '../config.js'
import { sanitizeUrl } from 'strict-url-sanitise'

import { applyScopesToAuthorizationUrl, normalizeScopes } from './scopes.js'
import { logOAuth, logOAuthClientId, logOAuthTokens } from './logging.js'

/** @typedef {import("@modelcontextprotocol/sdk/client/auth.js").OAuthClientProvider} OAuthClientProvider */
/** @implements {OAuthClientProvider} */
export class McpOAuthClientProvider {
  constructor(serverId, redirectUrl, { oauthScopes } = {}) {
    this.serverId = serverId
    this.redirectUrl = redirectUrl
    this.oauthScopes = normalizeScopes(oauthScopes)
  }

  get clientMetadata() {
    return {
      redirect_uris: [this.redirectUrl],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_name: 'mcp-cli',
      client_uri: 'https://mcp-cli',
      ...(this.oauthScopes ? { scope: this.oauthScopes } : {}),
    }
  }

  async clientInformation() {
    const info = config.get(`oauth.${this.serverId}.clientInformation`)
    if (info?.client_id) {
      logOAuthClientId(info.client_id)
    }
    return info
    // return {
    //   client_id: 'web_app',
    //   redirect_uris: [this.redirectUrl],
    // }
  }

  async saveClientInformation(clientInformation) {
    await config.set(`oauth.${this.serverId}.clientInformation`, clientInformation)
    if (clientInformation?.client_id) {
      logOAuthClientId(clientInformation.client_id, { registered: true })
    }
  }

  async tokens() {
    const tokens = config.get(`oauth.${this.serverId}.tokens`)
    logOAuthTokens(tokens, { event: 'startup' })
    return tokens
  }

  async saveTokens(tokens) {
    await config.set(`oauth.${this.serverId}.tokens`, tokens)
    logOAuthTokens(tokens, { event: 'refreshed' })
  }

  async redirectToAuthorization(authorizationUrl) {
    applyScopesToAuthorizationUrl(authorizationUrl, this.oauthScopes)
    const clientId = authorizationUrl.searchParams.get('client_id')
    if (clientId) logOAuthClientId(clientId)
    logOAuth('authorize →', authorizationUrl.toString())
    await open(sanitizeUrl(authorizationUrl.toString()))
  }

  async codeVerifier() {
    return config.get(`oauth.${this.serverId}.codeVerifier`)
  }

  async saveCodeVerifier(codeVerifier) {
    await config.set(`oauth.${this.serverId}.codeVerifier`, codeVerifier)
  }
}

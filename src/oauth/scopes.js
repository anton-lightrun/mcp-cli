export function normalizeScopes(scopes) {
  if (!scopes) return undefined
  if (Array.isArray(scopes)) return scopes.filter(Boolean).join(' ')
  return String(scopes).trim() || undefined
}

export function mergeScopeStrings(...parts) {
  const set = new Set()
  for (const part of parts) {
    if (!part) continue
    for (const scope of part.split(/\s+/)) {
      if (scope) set.add(scope)
    }
  }
  return set.size ? [...set].join(' ') : undefined
}

/** Merge configured scopes whenever the transport assigns _scope from the server. */
export function enhanceTransportWithScopes(transport, oauthScopes) {
  const extra = normalizeScopes(oauthScopes)
  if (!extra) return transport

  let scope = mergeScopeStrings(transport._scope, extra)
  Object.defineProperty(transport, '_scope', {
    get() {
      return scope
    },
    set(value) {
      scope = mergeScopeStrings(value, extra)
    },
    configurable: true,
  })
  return transport
}

export function applyScopesToAuthorizationUrl(url, oauthScopes) {
  const extra = normalizeScopes(oauthScopes)
  if (!extra) return url

  const scope = mergeScopeStrings(url.searchParams.get('scope'), extra)
  url.searchParams.set('scope', scope)
  if (scope.includes('offline_access')) {
    url.searchParams.set('prompt', 'consent')
  }
  return url
}

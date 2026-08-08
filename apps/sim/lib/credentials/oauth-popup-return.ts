/**
 * Routes a chat OAuth flow's return leg through the self-closing completion
 * page, so a connect started from chat comes back to the tab that started it
 * instead of leaving a second copy of the app open behind the provider.
 */

export const OAUTH_POPUP_COMPLETE_PATH = '/oauth/chat-complete'
export const OAUTH_POPUP_RETURN_TO_PARAM = 'returnTo'

/** Matches the MCP OAuth popup (`hooks/mcp/use-mcp-oauth-popup.ts`) so the two consent windows open alike. */
export const OAUTH_POPUP_FEATURES = 'width=560,height=720,resizable=yes,scrollbars=yes'

/**
 * Shared across chips on purpose: a second connect reuses (and refocuses) the
 * one window rather than leaving an abandoned consent screen behind. Nothing
 * here tracks a per-chip attempt, so there is no result for a reused window to
 * strand.
 */
export const OAUTH_POPUP_WINDOW_NAME = 'sim-oauth-connect'

/**
 * Rewrites an authorize URL so its eventual return lands on the completion
 * page, carrying the original destination for the case where the window cannot
 * close itself.
 *
 * Returns null when the flow must stay on the plain anchor: a cross-origin
 * authorize URL (the value is streamed model output, checked only for a safe
 * protocol) would otherwise take the popup path, dropping the anchor's
 * `rel="noopener"` and handing a foreign page our window handle. An authorize
 * URL with no return param to rewrite has nowhere to put the completion page.
 */
export function buildOAuthPopupAuthorizeUrl(rawUrl: string): string | null {
  let authorizeUrl: URL
  try {
    authorizeUrl = new URL(rawUrl, window.location.origin)
  } catch {
    return null
  }
  if (authorizeUrl.origin !== window.location.origin) return null

  const returnParam = authorizeUrl.searchParams.has('callbackURL') ? 'callbackURL' : 'returnUrl'
  const rawReturnUrl = authorizeUrl.searchParams.get(returnParam)
  if (!rawReturnUrl) return null

  // Anchored on the return URL the server generated rather than this tab's
  // origin: both the authorize route and the custom-provider callbacks accept a
  // return target only when it matches the deployment's configured base URL,
  // which a proxied or aliased origin need not equal.
  const completeUrl = new URL(
    OAUTH_POPUP_COMPLETE_PATH,
    new URL(rawReturnUrl, window.location.origin).origin
  )
  completeUrl.searchParams.set(OAUTH_POPUP_RETURN_TO_PARAM, rawReturnUrl)
  authorizeUrl.searchParams.set(returnParam, completeUrl.toString())
  return authorizeUrl.toString()
}

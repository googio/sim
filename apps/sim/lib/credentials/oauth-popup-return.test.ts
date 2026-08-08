/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://sim.test/workspace/workspace-1/chat/chat-1" }
 */
import { describe, expect, it } from 'vitest'
import {
  buildOAuthPopupAuthorizeUrl,
  OAUTH_POPUP_COMPLETE_PATH,
  OAUTH_POPUP_RETURN_TO_PARAM,
} from '@/lib/credentials/oauth-popup-return'

describe('buildOAuthPopupAuthorizeUrl', () => {
  it('routes the return through the completion page and keeps the original destination', () => {
    const result = buildOAuthPopupAuthorizeUrl(
      'https://sim.test/api/auth/oauth2/authorize?providerId=google-email&callbackURL=https%3A%2F%2Fsim.test%2Fworkspace%2Fworkspace-1%2Fchat%2Fchat-1'
    )

    const callbackUrl = new URL(new URL(result as string).searchParams.get('callbackURL') ?? '')
    expect(callbackUrl.pathname).toBe(OAUTH_POPUP_COMPLETE_PATH)
    expect(callbackUrl.searchParams.get(OAUTH_POPUP_RETURN_TO_PARAM)).toBe(
      'https://sim.test/workspace/workspace-1/chat/chat-1'
    )
  })

  it('rewrites returnUrl for the custom-provider authorize routes', () => {
    const result = buildOAuthPopupAuthorizeUrl(
      'https://sim.test/api/auth/trello/authorize?returnUrl=https%3A%2F%2Fsim.test%2Fworkspace%2Fws-1%2Fchat%2Fc-1'
    )

    const returnUrl = new URL(new URL(result as string).searchParams.get('returnUrl') ?? '')
    expect(returnUrl.pathname).toBe(OAUTH_POPUP_COMPLETE_PATH)
  })

  it('anchors the completion page on the server-generated return origin, not this tab', () => {
    // The authorize route accepts a return target only when it matches the
    // deployment's configured base URL, which a proxied origin need not equal.
    const result = buildOAuthPopupAuthorizeUrl(
      'https://sim.test/api/auth/oauth2/authorize?providerId=slack&callbackURL=https%3A%2F%2Fapp.sim.test%2Fworkspace%2Fws-1'
    )

    const callbackUrl = new URL(new URL(result as string).searchParams.get('callbackURL') ?? '')
    expect(callbackUrl.origin).toBe('https://app.sim.test')
  })

  it('refuses a cross-origin authorize URL so the caller keeps its noopener anchor', () => {
    expect(
      buildOAuthPopupAuthorizeUrl(
        'https://evil.example/api/auth/oauth2/authorize?callbackURL=https%3A%2F%2Fevil.example%2Fsink'
      )
    ).toBeNull()
  })

  it('refuses an authorize URL with no return param to rewrite', () => {
    expect(
      buildOAuthPopupAuthorizeUrl('https://sim.test/api/auth/oauth2/authorize?providerId=github')
    ).toBeNull()
  })
})

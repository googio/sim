'use client'

import { useEffect } from 'react'
import { OAUTH_POPUP_RETURN_TO_PARAM } from '@/lib/credentials/oauth-popup-return'

const CLOSE_FALLBACK_DELAY_MS = 400

/**
 * The fallback redirect must never leave this origin — the target rides in a
 * query param the user could have tampered with.
 */
function sanitizeReturnTo(raw: string | null): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw, window.location.origin)
    return url.origin === window.location.origin ? url.toString() : null
  } catch {
    return null
  }
}

/**
 * Behavior half of the chat OAuth return leg: closes the window it runs in.
 * Renders nothing, so the page's frame paints as server markup before this
 * hydrates.
 *
 * The credential has already landed server-side by the time this runs — the
 * page exists only so the flow stops somewhere disposable instead of loading a
 * second copy of the app over the tab the user started from.
 *
 * A window the browser refuses to close redirects on to where the flow began.
 * That is the popup-blocked path: the anchor's `target='_blank'` opens this leg
 * in a new tab, which no script may close.
 */
export function ChatCompleteHandoff() {
  useEffect(() => {
    const returnTo = sanitizeReturnTo(
      new URL(window.location.href).searchParams.get(OAUTH_POPUP_RETURN_TO_PARAM)
    )
    window.close()
    const timer = window.setTimeout(() => {
      window.location.replace(returnTo ?? '/workspace')
    }, CLOSE_FALLBACK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return null
}

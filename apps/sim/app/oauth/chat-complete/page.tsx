import type { Metadata } from 'next'
import { DesktopHandoffShell } from '@/app/desktop/components/desktop-handoff-shell'
import { ChatCompleteHandoff } from '@/app/oauth/chat-complete/chat-complete-handoff'

export const metadata: Metadata = {
  title: 'Returning to Sim',
  robots: { index: false },
}

/**
 * Post-OAuth return leg for the chat credential chips. The chip rewrites the
 * authorize URL's return param to land here, so the OAuth window finishes on
 * this page — which closes itself — instead of loading a second copy of the app
 * over the chat the user started from.
 *
 * Visible for a few hundred milliseconds in a popup, or briefly in a tab when
 * the popup was blocked, so it wears the same handoff frame as the other
 * minimal-chrome gates rather than styling of its own.
 */
export default function ChatCompletePage() {
  return (
    <>
      <ChatCompleteHandoff />
      <DesktopHandoffShell title='Finishing the connection' description='Returning you to Sim.' />
    </>
  )
}

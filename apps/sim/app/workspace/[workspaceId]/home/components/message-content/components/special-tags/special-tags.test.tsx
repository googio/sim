/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://sim.test/workspace/workspace-1/chat/chat-1" }
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseUserPermissionsContext, mockUseWorkspaceCredential } = vi.hoisted(() => ({
  mockUseUserPermissionsContext: vi.fn(),
  mockUseWorkspaceCredential: vi.fn(),
}))

vi.mock('@/app/workspace/[workspaceId]/providers/workspace-permissions-provider', () => ({
  useUserPermissionsContext: mockUseUserPermissionsContext,
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ workspaceId: 'workspace-1' }),
}))

vi.mock('@/hooks/queries/credentials', () => ({
  useWorkspaceCredential: mockUseWorkspaceCredential,
}))

import type { CredentialTagData } from '@/app/workspace/[workspaceId]/home/components/message-content/components/special-tags/special-tags'
import {
  parseSpecialTags,
  SpecialTags,
} from '@/app/workspace/[workspaceId]/home/components/message-content/components/special-tags/special-tags'

/**
 * Minimal dependency-free render harness (the repo has no `@testing-library/react`). Mounts the
 * component in a real React 19 root under jsdom, matching the pattern in `use-autosave.test.tsx`.
 */
function renderCredentialLink(data: CredentialTagData): { container: HTMLDivElement; root: Root } {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  const root: Root = createRoot(container)
  act(() => {
    root.render(<SpecialTags segment={{ type: 'credential', data }} />)
  })
  return { container, root }
}

describe('CredentialDisplay link tag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUserPermissionsContext.mockReturnValue({ canEdit: true })
    mockUseWorkspaceCredential.mockReturnValue({ data: null })
  })

  it('does not render an anchor for a javascript: scheme value', () => {
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'github',
      value: 'javascript:alert(1)',
    })

    expect(container.querySelector('a')).toBeNull()
    act(() => root.unmount())
  })

  it('does not render an anchor for a data: scheme value', () => {
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'github',
      value: 'data:text/html,<script>alert(1)</script>',
    })

    expect(container.querySelector('a')).toBeNull()
    act(() => root.unmount())
  })

  it('renders a working link for a real http(s) connect URL', () => {
    const url = 'https://sim.test/api/auth/oauth2/authorize?providerId=google-drive'
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'google-drive',
      value: url,
    })

    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe(url)
    expect(container.textContent).toContain('Connect Google Drive')
    act(() => root.unmount())
  })

  it('runs the connect in a popup so the chat tab is never navigated', () => {
    const popup = { focus: vi.fn() }
    const openSpy = vi
      .spyOn(window, 'open')
      .mockReturnValue(popup as unknown as ReturnType<typeof window.open>)
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'google-email',
      value:
        'https://sim.test/api/auth/oauth2/authorize?providerId=google-email&callbackURL=https%3A%2F%2Fsim.test%2Fworkspace%2Fworkspace-1%2Fchat%2Fchat-1',
    })

    const link = container.querySelector('a')
    const defaultPrevented = !link?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )

    expect(defaultPrevented).toBe(true)
    expect(popup.focus).toHaveBeenCalledOnce()
    const callbackUrl = new URL(
      new URL(openSpy.mock.calls[0][0] as string).searchParams.get('callbackURL') ?? ''
    )
    expect(callbackUrl.pathname).toBe('/oauth/chat-complete')
    openSpy.mockRestore()
    act(() => root.unmount())
  })

  it('falls back to the anchor, still via the completion page, when the popup is blocked', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'google-email',
      value:
        'https://sim.test/api/auth/oauth2/authorize?providerId=google-email&callbackURL=https%3A%2F%2Fsim.test%2Fworkspace%2Fworkspace-1%2Fchat%2Fchat-1',
    })

    const link = container.querySelector('a')
    const defaultPrevented = !link?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )

    // The tab still opens, but on a page that closes itself instead of a second
    // copy of the chat.
    expect(defaultPrevented).toBe(false)
    const callbackUrl = new URL(
      new URL(link?.getAttribute('href') ?? '').searchParams.get('callbackURL') ?? ''
    )
    expect(callbackUrl.pathname).toBe('/oauth/chat-complete')
    openSpy.mockRestore()
    act(() => root.unmount())
  })

  it('keeps a cross-origin connect URL on the anchor instead of a popup', () => {
    const openSpy = vi.spyOn(window, 'open')
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'google-email',
      value:
        'https://evil.example/api/auth/oauth2/authorize?callbackURL=https%3A%2F%2Fevil.example',
    })

    const link = container.querySelector('a')
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    // The anchor carries rel='noopener noreferrer'; window.open would not.
    expect(openSpy).not.toHaveBeenCalled()
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    openSpy.mockRestore()
    act(() => root.unmount())
  })

  it('renders nothing when the user cannot edit, regardless of URL safety', () => {
    mockUseUserPermissionsContext.mockReturnValue({ canEdit: false })
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'github',
      value: 'https://github.com/login/oauth/authorize',
    })

    expect(container.querySelector('a')).toBeNull()
    act(() => root.unmount())
  })

  it('labels a reconnect URL with the credential display name', () => {
    mockUseWorkspaceCredential.mockReturnValue({
      data: { id: 'cred-1', displayName: "Justin's Gmail" },
    })
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'google-email',
      value:
        'https://sim.test/api/auth/oauth2/authorize?providerId=google-email&workspaceId=ws-1&credentialId=cred-1',
    })

    expect(mockUseWorkspaceCredential).toHaveBeenCalledWith('cred-1')
    expect(container.textContent).toContain("Reconnect Justin's Gmail")
    act(() => root.unmount())
  })

  it('falls back to the integration name while the reconnect credential is unresolved', () => {
    const { container, root } = renderCredentialLink({
      type: 'link',
      provider: 'google-email',
      value:
        'https://sim.test/api/auth/oauth2/authorize?providerId=google-email&workspaceId=ws-1&credentialId=cred-1',
    })

    expect(container.textContent).toContain('Reconnect Gmail')
    act(() => root.unmount())
  })
})

describe('parseSpecialTags sim_key placeholder', () => {
  it('accepts a value-less {"type":"sim_key"} tag as a credential segment', () => {
    const { segments } = parseSpecialTags('<credential>{"type":"sim_key"}</credential>', false)
    const credential = segments.find((s) => s.type === 'credential')
    expect(credential).toEqual({ type: 'credential', data: { type: 'sim_key' } })
  })

  it('still accepts the legacy {"redacted":true} form as a value-less sim_key placeholder', () => {
    const { segments } = parseSpecialTags(
      '<credential>{"type":"sim_key","redacted":true}</credential>',
      false
    )
    const credential = segments.find((s) => s.type === 'credential')
    expect(credential?.type).toBe('credential')
    if (credential?.type === 'credential') {
      expect(credential.data.type).toBe('sim_key')
      expect(credential.data.value).toBeUndefined()
    }
  })
})

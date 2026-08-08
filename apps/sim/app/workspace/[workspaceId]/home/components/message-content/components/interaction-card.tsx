import { forwardRef, type InputHTMLAttributes, type MouseEventHandler, type ReactNode } from 'react'
import { Chip, cn } from '@sim/emcn'
import { Loader } from '@sim/emcn/icons'

export const INTERACTION_CARD_ROW_CLASSES =
  'flex items-center gap-2 border-[var(--border)] px-2 py-2 text-left transition-colors'

export const INTERACTION_CARD_TEXT_INPUT_CLASSES =
  'min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--text-body)] text-sm outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed'

export interface InteractionCardRecapItem {
  label: string
  values: readonly string[]
  /**
   * Renders the values quietly, for an outcome the user declined rather than
   * completed. Off by default — a recap value is normally the answer or the
   * result, and has to stay readable.
   */
  muted?: boolean
}

interface InteractionCardProps {
  children: ReactNode
  title?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * Shared chat-inline card chrome for terminal UI tags that need user input.
 * Question choices and credential controls use this same shell so their
 * spacing, border, surface, and header remain visually identical.
 */
export function InteractionCard({ children, title, actions, className }: InteractionCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border-1)] bg-[var(--white)] px-2.5 py-2 dark:bg-[var(--surface-4)]',
        className
      )}
    >
      {title !== undefined && (
        <div className='flex items-center justify-between gap-2 px-2 py-2'>
          <p className='min-w-0 flex-1 break-words text-[var(--text-primary)] text-sm'>{title}</p>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

interface InteractionCardRecapProps {
  items: readonly InteractionCardRecapItem[]
}

/** Shared answered-state layout used by questions and credential requests. */
export function InteractionCardRecap({ items }: InteractionCardRecapProps) {
  return (
    <InteractionCard>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className='px-2 py-2'>
          <p className='text-[var(--text-primary)] text-sm'>{item.label}</p>
          <div
            className={cn(
              'mt-1.5 flex flex-col gap-1 text-sm',
              item.muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-body)]'
            )}
          >
            {item.values.map((value, valueIndex) => (
              <p key={`${value}-${valueIndex}`}>{value}</p>
            ))}
          </div>
        </div>
      ))}
    </InteractionCard>
  )
}

export interface InteractionCardInputRowProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  divided?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  inputClassName?: string
}

/** Shared inline-input row used by question free text and credential secrets. */
export const InteractionCardInputRow = forwardRef<HTMLInputElement, InteractionCardInputRowProps>(
  ({ divided = false, leading, trailing, inputClassName, ...inputProps }, ref) => (
    <div className={cn(INTERACTION_CARD_ROW_CLASSES, divided && 'border-t')}>
      {leading}
      <input
        ref={ref}
        className={cn(INTERACTION_CARD_TEXT_INPUT_CLASSES, inputClassName)}
        {...inputProps}
      />
      {trailing}
    </div>
  )
)
InteractionCardInputRow.displayName = 'InteractionCardInputRow'

interface InteractionCardFooterProps {
  label: string
  /** Left-aligned progress, e.g. "1 of 2 ready". Omitted when there is nothing to count. */
  hint?: string
  /** Shows the spinner and blocks re-entry while the commit is in flight. */
  loading?: boolean
  disabled?: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}

/**
 * The terminal action for every interaction card, in the shape the design
 * system already uses for a form's commit: a separated footer with the primary
 * action right-aligned, mirroring `ChipModalFooter`.
 *
 * Deliberately not another row. The rows above are the work — a choice to make,
 * an account to connect, a secret to paste — so giving the commit their
 * geometry made it read as one more of them, down to the trailing arrow that on
 * a credential row means "this opens a window".
 */
export function InteractionCardFooter({
  label,
  hint,
  loading = false,
  disabled = false,
  onClick,
}: InteractionCardFooterProps) {
  return (
    <div className='flex items-center justify-between gap-2 border-[var(--border)] border-t px-2 py-2'>
      <span className='min-w-0 flex-1 truncate text-[var(--text-body)] text-sm'>{hint}</span>
      <Chip variant='primary' disabled={disabled || loading} onClick={onClick}>
        {loading ? <Loader animate className='size-[14px]' /> : null}
        {label}
      </Chip>
    </div>
  )
}

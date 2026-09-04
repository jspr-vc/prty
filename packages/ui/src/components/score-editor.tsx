'use client'

import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'
import { useRef, useState } from 'react'

interface Props {
  /** The authoritative score, as the server last reduced it. */
  value: number
  /** What one tap of − or + is worth in this game. */
  step: number
  /** Name of the player or team, for the controls' accessible labels. */
  subject: string
  onAdjust: (delta: number) => void
  onSet: (value: number) => void
  /** How the score reads when nobody is editing it. */
  format?: (value: number) => string
  className?: string
}

/**
 * Manual scoring for the host: taps for the usual nudge, typing for a number
 * pulled out of the air. A draft is held while the field has focus, so a
 * half-typed number never reaches the reducer, and the edit is committed on
 * Enter or blur rather than per keystroke — every commit is a round trip the
 * whole room sees.
 */
export function ScoreEditor({ value, step, subject, onAdjust, onSet, format, className }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  // Escape blurs the field, and blur commits, so the two have to agree through
  // something that updates synchronously.
  const abandoned = useRef(false)

  const commit = () => {
    if (abandoned.current) {
      abandoned.current = false
      return
    }
    if (draft === null) return
    const parsed = Math.trunc(Number(draft))
    setDraft(null)
    if (draft.trim() !== '' && Number.isFinite(parsed) && parsed !== value) onSet(parsed)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Subtract ${step} from ${subject}`}
        onClick={() => onAdjust(-step)}
      >
        −
      </Button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`${subject} score`}
        className="h-8 w-24 rounded-md border bg-background px-2 text-right font-medium text-sm tabular-nums"
        value={draft ?? (format ? format(value) : String(value))}
        onFocus={(event) => {
          abandoned.current = false
          setDraft(String(value))
          // Select on the next frame: the value only becomes editable once the
          // draft has rendered.
          const input = event.currentTarget
          requestAnimationFrame(() => input.select())
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            abandoned.current = true
            setDraft(null)
            event.currentTarget.blur()
          }
        }}
      />
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Add ${step} to ${subject}`}
        onClick={() => onAdjust(step)}
      >
        +
      </Button>
    </div>
  )
}

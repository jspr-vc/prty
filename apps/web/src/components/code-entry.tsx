import { useNavigate } from '@tanstack/react-router'
import { SESSION_CODE_LENGTH } from '@workspace/common/consts'
import { useState } from 'react'

export function CodeEntry() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (code.length === SESSION_CODE_LENGTH) {
          void navigate({ to: '/s/$code', params: { code } })
        }
      }}
    >
      <input
        // biome-ignore lint/a11y/noAutofocus: this input is the entire screen on a TV
        autoFocus
        value={code}
        maxLength={SESSION_CODE_LENGTH}
        onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        className="stage-code w-[10ch] rounded-lg border-4 border-stage-line bg-stage-panel px-6 py-4 text-center font-bold font-mono uppercase tracking-[0.2em] outline-none focus:border-stage-accent"
      />
    </form>
  )
}

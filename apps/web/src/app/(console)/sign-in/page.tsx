'use client'

import { authClient } from '@workspace/auth/client'
import { APP_NAME } from '@workspace/common/consts'
import { Button } from '@workspace/ui/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const result =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name })

    setPending(false)
    if (result.error) {
      setError(result.error.message ?? 'Something went wrong')
      return
    }
    router.push('/host')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground text-sm">
          {mode === 'sign-in' ? 'Sign in to host a night.' : 'Create a host account.'}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'sign-up' && (
          <Field label="Name" value={name} onChange={setName} autoComplete="name" />
        )}
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </Button>
      </form>

      <button
        type="button"
        className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
      >
        {mode === 'sign-in' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="font-medium text-sm">{label}</span>
      <input
        required
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </label>
  )
}

import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthProvider'

export function LoginScreen() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signInWithEmail(email)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
      <div className="w-full max-w-sm">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-indigo-400">
          Second Brain
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-5 text-center">
            <p className="font-medium text-emerald-300">Check your email</p>
            <p className="mt-2 text-sm text-neutral-400">
              We sent a sign-in link to <span className="text-neutral-200">{email}</span>.
              Click it and you'll land back here, logged in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label className="block text-sm text-neutral-400" htmlFor="email">
              Sign in with your email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send magic link'}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        )}
      </div>
    </main>
  )
}

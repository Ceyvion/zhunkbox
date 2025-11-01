import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { clsx } from 'clsx'
import type { CatalogData } from '../lib/catalog'
import type { Trinket } from '../types'

type AdminPageProps = {
  catalog: CatalogData
  catalogStatus: 'idle' | 'loading' | 'error'
  onReloadCatalog: () => Promise<CatalogData | null>
  onNavigateHome: () => void
}

type CharmFormState = {
  id: string
  name: string
  price: string
  icon: string
  tags: string
}

const EMPTY_FORM: CharmFormState = {
  id: '',
  name: '',
  price: '',
  icon: '',
  tags: '',
}

type Feedback = { type: 'success' | 'error'; message: string }

function charmToForm(charm: Trinket): CharmFormState {
  return {
    id: charm.id,
    name: charm.name,
    price: charm.price.toString(),
    icon: charm.icon ?? '',
    tags: (charm.tags ?? []).join(', '),
  }
}

function parseTags(input: string) {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function AdminPage({ catalog, catalogStatus, onReloadCatalog, onNavigateHome }: AdminPageProps) {
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ready'>('checking')
  const [authPending, setAuthPending] = useState(false)
  const [requestPending, setRequestPending] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [charms, setCharms] = useState<Trinket[]>(catalog.trinkets)
  const [casePriceInput, setCasePriceInput] = useState<string>(() => catalog.casePrice.toFixed(2))
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [newCharm, setNewCharm] = useState<CharmFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CharmFormState | null>(null)

  useEffect(() => {
    setCharms(catalog.trinkets)
    setCasePriceInput(catalog.casePrice.toFixed(2))
  }, [catalog])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const refreshFromServer = useCallback(async () => {
    const next = await onReloadCatalog()
    if (next) {
      setCharms(next.trinkets)
      setCasePriceInput(next.casePrice.toFixed(2))
    }
  }, [onReloadCatalog])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' })
        if (!res.ok) throw new Error('Not authenticated')
        if (cancelled) return
        setAuthState('ready')
        await refreshFromServer()
      } catch {
        if (!cancelled) {
          setAuthState('login')
        }
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [refreshFromServer])

  const casePriceNumber = useMemo(() => Number.parseFloat(casePriceInput), [casePriceInput])
  const inventoryStatusLabel = useMemo(() => {
    if (catalogStatus === 'loading') return 'Syncing…'
    if (catalogStatus === 'error') return 'Using offline data'
    return `${charms.length} charms`
  }, [catalogStatus, charms.length])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthPending(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: loginForm.username.trim(),
          password: loginForm.password,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof payload?.message === 'string' ? payload.message : 'Sign-in failed')
      }
      setFeedback({ type: 'success', message: 'Signed in' })
      setAuthState('ready')
      setLoginForm({ username: '', password: '' })
      await refreshFromServer()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Sign-in failed' })
      setAuthState('login')
    } finally {
      setAuthPending(false)
    }
  }

  async function handleLogout() {
    setRequestPending(true)
    setFeedback(null)
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
      setAuthState('login')
      setFeedback({ type: 'success', message: 'Signed out' })
      setEditingId(null)
      setEditForm(null)
    } finally {
      setRequestPending(false)
    }
  }

  async function handleCasePriceSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!Number.isFinite(casePriceNumber) || casePriceNumber <= 0) {
      setFeedback({ type: 'error', message: 'Enter a price greater than zero.' })
      return
    }
    setRequestPending(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/catalog/case-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ casePrice: casePriceNumber }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof payload?.message === 'string' ? payload.message : 'Failed to save case price')
      }
      if (typeof payload.casePrice === 'number') {
        setCasePriceInput(payload.casePrice.toFixed(2))
      }
      await refreshFromServer()
      setFeedback({ type: 'success', message: 'Case price updated' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update price' })
    } finally {
      setRequestPending(false)
    }
  }

  async function handleCreateCharm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const priceNumber = Number.parseFloat(newCharm.price)
    if (!newCharm.name.trim()) {
      setFeedback({ type: 'error', message: 'Name is required.' })
      return
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setFeedback({ type: 'error', message: 'Price must be a positive number.' })
      return
    }
    setRequestPending(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/charms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: newCharm.id.trim() || undefined,
          name: newCharm.name.trim(),
          price: priceNumber,
          icon: newCharm.icon.trim() || undefined,
          tags: parseTags(newCharm.tags),
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof payload?.message === 'string' ? payload.message : 'Failed to create charm')
      }
      setNewCharm(EMPTY_FORM)
      await refreshFromServer()
      setFeedback({ type: 'success', message: 'Charm added to inventory' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to create charm' })
    } finally {
      setRequestPending(false)
    }
  }

  function beginEdit(charm: Trinket) {
    setEditingId(charm.id)
    setEditForm(charmToForm(charm))
    setFeedback(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function handleUpdateCharm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingId || !editForm) return
    const priceNumber = Number.parseFloat(editForm.price)
    if (!editForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Name is required.' })
      return
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setFeedback({ type: 'error', message: 'Price must be a positive number.' })
      return
    }
    setRequestPending(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/charms/${encodeURIComponent(editingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name.trim(),
          price: priceNumber,
          icon: editForm.icon.trim() || undefined,
          tags: parseTags(editForm.tags),
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof payload?.message === 'string' ? payload.message : 'Failed to update charm')
      }
      setEditingId(null)
      setEditForm(null)
      await refreshFromServer()
      setFeedback({ type: 'success', message: 'Charm updated' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update charm' })
    } finally {
      setRequestPending(false)
    }
  }

  async function handleDeleteCharm(id: string) {
    if (!window.confirm('Remove this charm from the catalog?')) return
    setRequestPending(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/charms/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.status !== 204) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(typeof payload?.message === 'string' ? payload.message : 'Failed to delete charm')
      }
      if (editingId === id) {
        setEditingId(null)
        setEditForm(null)
      }
      await refreshFromServer()
      setFeedback({ type: 'success', message: 'Charm deleted' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete charm' })
    } finally {
      setRequestPending(false)
    }
  }

  const isMutating = requestPending || catalogStatus === 'loading'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventory console</h1>
          <p className="text-sm opacity-70">Manage charms, case pricing, and admin access.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" onClick={onNavigateHome}>
            ← Back to site
          </button>
          {authState === 'ready' ? (
            <button
              type="button"
              className="chip chip--danger"
              onClick={handleLogout}
              disabled={isMutating}
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      {feedback ? (
        <div
          role="status"
          className={clsx(
            'rounded-md border px-4 py-3 text-sm',
            feedback.type === 'success'
              ? 'border-green-500/60 bg-green-50 text-green-700'
              : 'border-rose-400/60 bg-rose-50 text-rose-700',
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      {authState === 'checking' ? (
        <section className="paper p-6 text-sm opacity-70">Checking admin session…</section>
      ) : null}

      {authState === 'login' ? (
        <form className="paper flex max-w-md flex-col gap-4 p-6" onSubmit={handleLogin}>
          <div>
            <h2 className="text-lg font-semibold">Admin sign-in</h2>
            <p className="text-sm opacity-70">Use your admin credentials to continue.</p>
          </div>
          <label className="space-y-1 text-sm font-medium">
            Username
            <input
              className="chip w-full focus:outline-none"
              autoComplete="username"
              value={loginForm.username}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Password
            <input
              className="chip w-full focus:outline-none"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <button className="tape-btn self-start" type="submit" disabled={authPending}>
            {authPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : null}

      {authState === 'ready' ? (
        <>
          <section className="paper space-y-6 p-6">
            <div>
              <h2 className="text-lg font-semibold">Case price</h2>
              <p className="text-sm opacity-70">
                This price is used in the checkout summary for every configuration.
              </p>
            </div>
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleCasePriceSave}>
              <label className="flex-1 space-y-1 text-sm font-medium">
                Price (USD)
                <input
                  className="chip w-full focus:outline-none"
                  type="number"
                  min="0"
                  step="0.01"
                  value={casePriceInput}
                  onChange={(event) => setCasePriceInput(event.target.value)}
                  required
                />
              </label>
              <button className="tape-btn sm:self-start" type="submit" disabled={isMutating}>
                {isMutating ? 'Saving…' : 'Save'}
              </button>
            </form>
          </section>

          <section className="paper space-y-6 p-6">
            <div>
              <h2 className="text-lg font-semibold">Add new charm</h2>
              <p className="text-sm opacity-70">
                Upload assets separately under <code>public/icons</code>, then link the file path here.
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreateCharm}>
              <label className="space-y-1 text-sm font-medium">
                Custom id (optional)
                <input
                  className="chip w-full focus:outline-none"
                  value={newCharm.id}
                  onChange={(event) => setNewCharm((prev) => ({ ...prev, id: event.target.value }))}
                  placeholder="e.g. cozy-cat"
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Name
                <input
                  className="chip w-full focus:outline-none"
                  value={newCharm.name}
                  onChange={(event) => setNewCharm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Price (USD)
                <input
                  className="chip w-full focus:outline-none"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCharm.price}
                  onChange={(event) => setNewCharm((prev) => ({ ...prev, price: event.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Icon path
                <input
                  className="chip w-full focus:outline-none"
                  value={newCharm.icon}
                  onChange={(event) => setNewCharm((prev) => ({ ...prev, icon: event.target.value }))}
                  placeholder="/icons/new.svg"
                />
              </label>
              <label className="sm:col-span-2 space-y-1 text-sm font-medium">
                Tags
                <input
                  className="chip w-full focus:outline-none"
                  value={newCharm.tags}
                  onChange={(event) => setNewCharm((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="comma, separated, tags"
                />
              </label>
              <div className="flex items-center gap-2 sm:col-span-2">
                <button className="tape-btn" type="submit" disabled={isMutating}>
                  {isMutating ? 'Adding…' : 'Add charm'}
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setNewCharm(EMPTY_FORM)}
                  disabled={isMutating}
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          <section className="paper space-y-4 p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Existing charms</h2>
                <p className="text-sm opacity-70">Edit pricing, tags, or remove items from the catalog.</p>
                {catalogStatus === 'error' ? (
                  <p className="text-xs text-rose-600">
                    Could not reach the admin API. Updates will retry once you are back online.
                  </p>
                ) : null}
              </div>
              <span
                className={clsx(
                  'text-sm',
                  catalogStatus === 'error' ? 'text-rose-600' : 'opacity-60',
                )}
              >
                {inventoryStatusLabel}
              </span>
            </div>
            <div className="space-y-3">
              {charms.map((charm) => {
                const isEditing = editingId === charm.id && editForm
                return (
                  <div
                    key={charm.id}
                    className="rounded-lg border border-dashed border-black/10 bg-white/80 p-4 shadow-sm"
                  >
                    {!isEditing ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-base font-semibold">{charm.name}</div>
                          <div className="text-sm opacity-70">
                            <span className="font-mono text-xs">{charm.id}</span> · ${charm.price.toFixed(2)}
                          </div>
                          {charm.tags && charm.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 text-xs uppercase opacity-70">
                              {charm.tags.map((tag) => (
                                <span key={tag} className="chip !px-2 !py-0.5 text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="chip"
                            onClick={() => beginEdit(charm)}
                            disabled={isMutating}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="chip chip--danger"
                            onClick={() => handleDeleteCharm(charm.id)}
                            disabled={isMutating}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleUpdateCharm}>
                        <div className="sm:col-span-2 text-base font-semibold">{editForm.name}</div>
                        <label className="space-y-1 text-sm font-medium">
                          Name
                          <input
                            className="chip w-full focus:outline-none"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                            }
                            required
                          />
                        </label>
                        <label className="space-y-1 text-sm font-medium">
                          Price (USD)
                          <input
                            className="chip w-full focus:outline-none"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price}
                            onChange={(event) =>
                              setEditForm((prev) => (prev ? { ...prev, price: event.target.value } : prev))
                            }
                            required
                          />
                        </label>
                        <label className="space-y-1 text-sm font-medium">
                          Icon path
                          <input
                            className="chip w-full focus:outline-none"
                            value={editForm.icon}
                            onChange={(event) =>
                              setEditForm((prev) => (prev ? { ...prev, icon: event.target.value } : prev))
                            }
                          />
                        </label>
                        <label className="sm:col-span-2 space-y-1 text-sm font-medium">
                          Tags
                          <input
                            className="chip w-full focus:outline-none"
                            value={editForm.tags}
                            onChange={(event) =>
                              setEditForm((prev) => (prev ? { ...prev, tags: event.target.value } : prev))
                            }
                          />
                        </label>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <button className="tape-btn" type="submit" disabled={isMutating}>
                            {isMutating ? 'Saving…' : 'Save changes'}
                          </button>
                          <button className="chip" type="button" onClick={cancelEdit} disabled={isMutating}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

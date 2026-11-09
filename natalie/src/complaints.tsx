import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { isPostHogConfigured, posthog } from './posthog'

/* Chore complaints. Anyone can file one; the others see it on a dark screen when they open the app,
   and it only goes away once someone says it has been taken care of. Complaints are anonymous: `by` is kept only so we know which one is yours, and it is never shown. Prototype data lives in sessionStorage. */

export type Complaint = { id: string; by: string; text: string; at: number; resolved?: boolean }

const KEY = 'harmony.complaints2'
const SEEN_KEY = 'harmony.complaintsSeen'
const DAY = 24 * 3600 * 1000

// Demo: the house starts with no complaints; one appears when somebody files it.
const seed = (): Complaint[] => []

function load(): Complaint[] {
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved) return JSON.parse(saved) as Complaint[]
  } catch { /* storage unavailable */ }
  return seed()
}
const save = (c: Complaint[]) => { try { sessionStorage.setItem(KEY, JSON.stringify(c)) } catch { /* storage unavailable */ } }
const loadSeen = (): string[] => { try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]') as string[] } catch { return [] } }

/** "2 days ago", "5 hours ago", "just now" */
export function ago(at: number) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000))
  if (m < 2) return 'just now'
  if (m < 60) return `${m} minutes ago`
  const h = Math.round(m / 60)
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`
  const d = Math.round(h / 24)
  return d === 1 ? '1 day ago' : `${d} days ago`
}

type Store = {
  complaints: Complaint[]
  /** Every complaint nobody has marked as done yet, anonymous, yours included. */
  pending: Complaint[]
  file: (text: string) => void
  resolve: (id: string) => void
  alertOpen: boolean
  openAlert: () => void
  closeAlert: () => void
  /** True when there are complaints you have not been shown yet this session. */
  hasUnseen: boolean
  /** The complaint that was just filed, shown as a red banner for a few seconds. */
  banner: Complaint | null
  dismissBanner: () => void
}
const Ctx = createContext<Store | null>(null)

export function ComplaintsProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState(load)
  const [seen, setSeen] = useState(loadSeen)
  const pending = useMemo(() => complaints.filter((c) => !c.resolved), [complaints])
  const hasUnseen = pending.some((c) => !seen.includes(c.id))
  const [alertOpen, setAlertOpen] = useState(false)
  const [banner, setBanner] = useState<Complaint | null>(null)
  const timer = useRef<number>(0)
  const dismissBanner = () => { window.clearTimeout(timer.current); setBanner(null) }
  const commit = (next: Complaint[]) => { setComplaints(next); save(next) }
  const file: Store['file'] = (text) => {
    const id = `cp${Date.now()}`
    const c: Complaint = { id, by: 'you', text, at: Date.now() }
    if (isPostHogConfigured) posthog.capture('complaint_filed')
    commit([c, ...complaints])
    // Everyone gets a red heads-up (in this demo, you see it too).
    window.clearTimeout(timer.current)
    setBanner(c)
    timer.current = window.setTimeout(() => setBanner(null), 7000)
    // You just wrote it, so don't pop it up in your own face.
    const next = [...seen, id]
    setSeen(next)
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  const resolve: Store['resolve'] = (id) => {
    const complaint = complaints.find((c) => c.id === id)
    if (complaint && !complaint.resolved && isPostHogConfigured) posthog.capture('complaint_resolved')
    commit(complaints.map((c) => (c.id === id ? { ...c, resolved: true } : c)))
  }
  const closeAlert = () => {
    setAlertOpen(false)
    const next = Array.from(new Set([...seen, ...pending.map((c) => c.id)]))
    setSeen(next)
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  return <Ctx.Provider value={{ complaints, pending, file, resolve, alertOpen, openAlert: () => setAlertOpen(true), closeAlert, hasUnseen, banner, dismissBanner }}>{children}</Ctx.Provider>
}

export function useComplaints() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useComplaints must be used inside ComplaintsProvider')
  return s
}

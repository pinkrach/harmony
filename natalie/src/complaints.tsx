import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/* Chore complaints. Anyone can file one; the others see it on a dark screen when they open the app,
   and it only goes away once someone says it has been taken care of. Complaints are anonymous: `by` is kept only so we know which one is yours, and it is never shown. Prototype data lives in sessionStorage. */

export type Complaint = { id: string; by: string; text: string; at: number; resolved?: boolean }

const KEY = 'harmony.complaints'
const SEEN_KEY = 'harmony.complaintsSeen'
const DAY = 24 * 3600 * 1000

const seed = (): Complaint[] => [
  { id: 'cp1', by: 'sofi', text: 'The dishes in the sink have been there for two days.', at: Date.now() - 2 * DAY },
  { id: 'cp2', by: 'mara', text: 'The bathroom light was left on all night.', at: Date.now() - DAY / 2 },
]

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
}
const Ctx = createContext<Store | null>(null)

export function ComplaintsProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState(load)
  const [seen, setSeen] = useState(loadSeen)
  const pending = useMemo(() => complaints.filter((c) => !c.resolved), [complaints])
  const hasUnseen = pending.some((c) => !seen.includes(c.id))
  const [alertOpen, setAlertOpen] = useState(false)
  const commit = (next: Complaint[]) => { setComplaints(next); save(next) }
  const file: Store['file'] = (text) => {
    const id = `cp${Date.now()}`
    commit([{ id, by: 'you', text, at: Date.now() }, ...complaints])
    // You just wrote it, so don't pop it up in your own face.
    const next = [...seen, id]
    setSeen(next)
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  const resolve: Store['resolve'] = (id) => commit(complaints.map((c) => (c.id === id ? { ...c, resolved: true } : c)))
  const closeAlert = () => {
    setAlertOpen(false)
    const next = Array.from(new Set([...seen, ...pending.map((c) => c.id)]))
    setSeen(next)
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  return <Ctx.Provider value={{ complaints, pending, file, resolve, alertOpen, openAlert: () => setAlertOpen(true), closeAlert, hasUnseen }}>{children}</Ctx.Provider>
}

export function useComplaints() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useComplaints must be used inside ComplaintsProvider')
  return s
}

import { createContext, useContext, useState, type ReactNode } from 'react'
import { isPostHogConfigured, posthog, posthogLogger } from './posthog'

export const rooms = ['Kitchen', 'Living room', 'Bathroom', 'Other'] as const
export type Room = (typeof rooms)[number]
export type Chore = { id: number; t: string; emoji: string; who: string; date: string; time: string; done: boolean; room: Room; vis?: 'public' | 'private' }

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d }
export const nextSaturday = () => addDays((6 - new Date().getDay() + 7) % 7)
export const dayText = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
export const timeText = (t: string) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}` }

/** "Today · 8:00 pm", "Tomorrow", "Mon, Oct 12 · 6:30 pm" */
export function dueLabel(c: Pick<Chore, 'date' | 'time'>) {
  const day = c.date === iso(addDays(0)) ? 'Today' : c.date === iso(addDays(1)) ? 'Tomorrow' : c.date === iso(addDays(-1)) ? 'Yesterday' : dayText(new Date(`${c.date}T00:00`))
  return `${day}${c.time ? ` · ${timeText(c.time)}` : ''}`
}
export const isLate = (c: Chore) => !c.done && c.date < iso(addDays(0))

const seed = (): Chore[] => [
  { id: 1, t: 'Do my dishes', emoji: '🍽️', who: 'you', date: iso(addDays(0)), time: '20:00', done: false, room: 'Kitchen' },
  { id: 2, t: 'Wash my dishes', emoji: '🍽️', who: 'diego', date: iso(addDays(-1)), time: '', done: false, room: 'Kitchen' },
  { id: 3, t: 'Clean my room', emoji: '🧹', who: 'mara', date: iso(addDays(2)), time: '10:00', done: false, room: 'Other', vis: 'private' },
  { id: 4, t: 'Rake the leaves on the terrace', emoji: '🍂', who: 'sofi', date: iso(addDays(0)), time: '', done: true, room: 'Other' },
  { id: 5, t: 'Make my bed', emoji: '🛏️', who: 'you', date: iso(addDays(0)), time: '', done: true, room: 'Other', vis: 'private' },
  // Friday, Nov 13: a busy day up to 6 pm, then the evening stays free
  { id: 6, t: 'Take out the recycling', emoji: '♻️', who: 'you', date: '2026-11-13', time: '08:30', done: false, room: 'Kitchen' },
  { id: 7, t: 'Water the plants', emoji: '🪴', who: 'sofi', date: '2026-11-13', time: '09:30', done: false, room: 'Living room' },
  { id: 8, t: 'Do the laundry', emoji: '🧺', who: 'you', date: '2026-11-13', time: '13:00', done: false, room: 'Other' },
  { id: 9, t: 'Wipe the kitchen counters', emoji: '🧽', who: 'diego', date: '2026-11-13', time: '15:30', done: false, room: 'Kitchen' },
]

type Store = { chores: Chore[]; reminded: number[]; remind: (id: number) => void; add: (c: Omit<Chore, 'id' | 'done'>) => void; toggle: (id: number) => void; update: (id: number, patch: Partial<Chore>) => void }
const Ctx = createContext<Store | null>(null)

export function ChoresProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useState(seed)
  const [reminded, setReminded] = useState<number[]>([])
  const remind: Store['remind'] = (id) => setReminded((l) => (l.includes(id) ? l : [...l, id]))
  const add: Store['add'] = (c) => {
    if (isPostHogConfigured) {
      posthog.capture('chore_created', { room: c.room, visibility: c.vis ?? 'public', has_due_time: Boolean(c.time) })
      posthogLogger.info('chore created', { room: c.room, visibility: c.vis ?? 'public', has_due_time: Boolean(c.time) })
    }
    setChores((l) => [{ ...c, id: Date.now(), done: false }, ...l])
  }
  const toggle: Store['toggle'] = (id) => {
    const chore = chores.find((c) => c.id === id)
    if (chore && isPostHogConfigured) {
      posthog.capture('chore_completion_toggled', { completed: !chore.done, room: chore.room, visibility: chore.vis ?? 'public' })
      posthogLogger.info('chore completion toggled', { completed: !chore.done, room: chore.room, visibility: chore.vis ?? 'public' })
    }
    setChores((l) => l.map((c) => (c.id === id ? { ...c, done: !c.done } : c)))
  }
  const update: Store['update'] = (id, patch) => setChores((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  return <Ctx.Provider value={{ chores, reminded, remind, add, toggle, update }}>{children}</Ctx.Provider>
}

export function useChores() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useChores must be used inside ChoresProvider')
  return s
}

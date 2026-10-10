import { createContext, useContext, useState, type ReactNode } from 'react'

export type Chore = { id: number; t: string; emoji: string; who: string; date: string; time: string; done: boolean }

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
  { id: 1, t: 'Take out the trash', emoji: '🗑️', who: 'you', date: iso(addDays(0)), time: '20:00', done: false },
  { id: 2, t: 'Wash the dishes', emoji: '🍽️', who: 'diego', date: iso(addDays(-1)), time: '', done: false },
  { id: 3, t: 'Clean the bathroom', emoji: '🛁', who: 'mara', date: iso(addDays(2)), time: '10:00', done: false },
  { id: 4, t: 'Vacuum the living room', emoji: '🧹', who: 'sofi', date: iso(addDays(0)), time: '', done: true },
  { id: 5, t: 'Water the plants', emoji: '🪴', who: 'you', date: iso(addDays(0)), time: '', done: true },
]

type Store = { chores: Chore[]; add: (c: Omit<Chore, 'id' | 'done'>) => void; toggle: (id: number) => void }
const Ctx = createContext<Store | null>(null)

export function ChoresProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useState(seed)
  const add: Store['add'] = (c) => setChores((l) => [{ ...c, id: Date.now(), done: false }, ...l])
  const toggle: Store['toggle'] = (id) => setChores((l) => l.map((c) => (c.id === id ? { ...c, done: !c.done } : c)))
  return <Ctx.Provider value={{ chores, add, toggle }}>{children}</Ctx.Provider>
}

export function useChores() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useChores must be used inside ChoresProvider')
  return s
}

import type { Chore } from './chores'

export type Repeat = 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly'
export const repeatLabels: Record<Repeat, string> = { none: 'Doesn’t repeat', daily: 'Every day', weekdays: 'Weekdays (Mon–Fri)', weekends: 'Weekends', weekly: 'Every week' }

export type Rsvp = 'yes' | 'no'
export type Note = { who: string; text: string }
/** Someone else asked to move/resize this event; nothing changes until its owner approves. */
export type Proposal = { by: string; start: number; end: number }
/** `by` = who created it (missing on older saved events = you). `rsvp` = invited roommates' replies. */
export type CalEvent = { id: string; date: string; start: number; end: number; title: string; who: string[]; color: string; repeat?: Repeat; until?: string; by?: string; rsvp?: Record<string, Rsvp>; proposal?: Proposal; swap?: { by: string; message: string } }

/** Does something that starts on `date` and repeats (until `until`, inclusive) happen on `key`? */
export function occursOn(e: { date: string; repeat?: Repeat; until?: string }, key: string) {
  if (key === e.date) return true
  if (!e.repeat || e.repeat === 'none' || key < e.date) return false
  if (e.until && key > e.until) return false
  const dow = new Date(`${key}T00:00`).getDay()
  if (e.repeat === 'daily') return true
  if (e.repeat === 'weekdays') return dow >= 1 && dow <= 5
  if (e.repeat === 'weekends') return dow === 0 || dow === 6
  return dow === new Date(`${e.date}T00:00`).getDay()
}

/** Shared spaces that can be reserved as calendar events titled "<space> reserved". */
export const ROOMS = ['Kitchen', 'Living room']
export const reservedRoom = (e: { title: string }) => ROOMS.find((r) => e.title === `${r} reserved`)

export const endOfYear = (d = new Date()) => `${d.getFullYear()}-12-31`

const EVENTS_KEY = 'harmony.events'
const END = 24

export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

export function timeLabel(h: number) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  const n = hh % 12 === 0 ? 12 : hh % 12
  return `${n}${mm ? `:${String(mm).padStart(2, '0')}` : ''}${hh >= 12 ? 'pm' : 'am'}`
}

/** Chores for a day, in the same shape the calendar draws. */
export function choresToEvents(chores: Chore[], date: string): CalEvent[] {
  return chores.filter((c) => c.date === date).map((c) => {
    const [hh, mm] = (c.time || '09:00').split(':').map(Number)
    const start = hh + (mm || 0) / 60
    return { id: `chore-${c.id}`, date: c.date, start, end: Math.min(start + 0.5, END), title: `${c.emoji} ${c.t}`, who: [c.who], color: 'var(--mint)' }
  })
}

function sampleEvents(): CalEvent[] {
  const today = new Date()
  return [
    { id: 's1', date: dateKey(today), start: 18.5, end: 19.5, title: 'Cook dinner together', who: ['you', 'sofi', 'mara'], color: 'var(--brand)', by: 'you', proposal: { by: 'sofi', start: 19, end: 21 } },
    { id: 's2', date: dateKey(today), start: 21, end: 23, title: 'Movie night in the living room', who: ['you', 'diego', 'mara', 'sofi'], color: 'var(--purple)', by: 'diego', rsvp: { mara: 'yes' } },
    { id: 's3', date: dateKey(addDays(today, 2)), start: 11, end: 12, title: 'Landlord visit · fix the sink', who: ['you'], color: 'var(--yellow-d)', by: 'you' },
    { id: 's4', date: dateKey(addDays(today, 1)), start: 17, end: 18, title: 'Sofi & Mara · study session', who: ['sofi', 'mara'], color: 'var(--blue-d)', by: 'sofi' },
    { id: 's5', date: dateKey(addDays(today, 1)), start: 10, end: 12, title: 'Kitchen reserved', who: ['sofi'], color: 'var(--blue-d)', by: 'sofi' },
    { id: 's6', date: dateKey(addDays(today, 1)), start: 18, end: 20, title: 'Living room reserved', who: ['you'], color: 'var(--blue-d)', by: 'you', swap: { by: 'mara', message: 'Hi! Could I use the living room then? I have friends coming over.' } },
  ]
}

export function loadEvents(): CalEvent[] {
  try {
    const saved = sessionStorage.getItem(EVENTS_KEY)
    if (saved) return JSON.parse(saved) as CalEvent[]
  } catch { /* storage unavailable */ }
  return sampleEvents()
}

export function saveEvents(events: CalEvent[]) {
  try { sessionStorage.setItem(EVENTS_KEY, JSON.stringify(events)) } catch { /* storage unavailable */ }
}

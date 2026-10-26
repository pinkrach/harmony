import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CalendarDays, Car, Check, ChevronLeft, ChevronRight, ClipboardList, Home, KeyRound, Plus, ShowerHead, Sofa, Trash2, UtensilsCrossed, Users, Wrench, type LucideIcon } from 'lucide-react'
import { Avatar, Chip, PageHead, Segmented, Sheet } from '../components/ui'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { iso } from '../chores'
import { byId, hourLabel, presence, roommates } from '../data'
import { useChores } from '../chores'
import { choresToEvents, dateKey, endOfYear, loadEvents, occursOn, repeatLabels, saveEvents, timeLabel, type CalEvent, type Repeat } from '../events'

/* ───────── Time helpers ───────── */

const START = 0 // the whole day, midnight to midnight
const SPAN = 24
const END = START + SPAN
const pct = (h: number) => ((h - START) / SPAN) * 100
const NEW_EVENT_COLOR = 'var(--mint)' // the one palette color not already used by events or roommates

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const hoursOf = (d: Date) => d.getHours() + d.getMinutes() / 60

/** Re-renders every 30 seconds so the "now" line keeps moving. */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  return now
}

/* ───────── Combined availability chart ───────── */

type Ranges = [number, number][]

function homeNow(ranges: Ranges, h: number) {
  return ranges.some(([a, b]) => h >= a && h < b)
}

/** The range of `ranges` that covers hour `h`, or the next one that starts after it. */
function statusFor(ranges: Ranges, h: number | null) {
  const sorted = [...ranges].sort((x, y) => x[0] - y[0])
  if (!sorted.length) return 'Away all day'
  const range = (a: number, b: number) => `${timeLabel(a)} – ${timeLabel(b)}`
  if (h === null) return `Home ${sorted.map(([a, b]) => range(a, b)).join(', ')}`
  const cur = sorted.find(([a, b]) => h >= a && h < b)
  if (cur) return `Home now · until ${timeLabel(cur[1])}`
  const next = sorted.find(([a]) => a > h)
  return next ? `Away · back at ${timeLabel(next[0])}` : 'Away for the rest of the day'
}

/** Who's home: one calm tile per roommate, with a single slim bar for the day. */
function WhoIsHome({ isToday, nowH, homeOf, onEditHome }: { isToday: boolean; nowH: number; homeOf: (id: string) => Ranges; onEditHome: () => void }) {
  const showNow = isToday && nowH >= START && nowH < END
  return (
    <div className="who-home">
      <div className="wh-axis" aria-hidden>
        {[0, 6, 12, 18, 24].map((h) => <span key={h} style={{ left: `${pct(h)}%` }}>{hourLabel(h % 24)}</span>)}
      </div>
      <div className="day-list tiles">
        {roommates.map((r) => {
          const ranges = homeOf(r.id)
          const home = isToday && homeNow(ranges, nowH)
          return (
            <div className={`day-row who-row${home ? ' is-home' : ''}`} key={r.id}>
              <Avatar id={r.id} size={40} home={isToday ? home : undefined} />
              <div className="day-txt">
                <b>{r.id === 'you' ? 'You' : r.name}</b>
                <small>{statusFor(ranges, isToday ? nowH : null)}</small>
                <span className="wh-bar" aria-hidden>
                  {ranges.map(([s, e], i) => <i key={i} style={{ left: `${pct(Math.max(s, START))}%`, width: `${pct(Math.min(e, END)) - pct(Math.max(s, START))}%`, background: r.color }} />)}
                  {showNow && <em style={{ left: `${pct(nowH)}%` }} />}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <button type="button" className="slot open slot-action" onClick={onEditHome}>
        <Home size={16} aria-hidden /> Edit when you’re home
      </button>
    </div>
  )
}

/* ───────── Day timeline (vertical, like a phone calendar) ───────── */

const HOUR_PX = 64

/** Side-by-side columns for events that overlap in time. */
function layoutDay(events: CalEvent[]) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: { ev: CalEvent; col: number; cols: number }[] = []
  let cluster: typeof out = []
  let clusterEnd = -1
  const flush = () => { const n = Math.max(1, ...cluster.map((c) => c.col + 1)); cluster.forEach((c) => (c.cols = n)); out.push(...cluster); cluster = []; clusterEnd = -1 }
  for (const ev of sorted) {
    if (cluster.length && ev.start >= clusterEnd) flush()
    const used = cluster.filter((c) => c.ev.end > ev.start).map((c) => c.col)
    let col = 0
    while (used.includes(col)) col++
    cluster.push({ ev, col, cols: 1 })
    clusterEnd = Math.max(clusterEnd, ev.end)
  }
  flush()
  return out
}

const EMOJI_LEAD = /^\p{Extended_Pictographic}\uFE0F?\s*/u

/** A fitting icon for an event, from what it's about. */
function iconFor(ev: CalEvent): LucideIcon {
  if (ev.id.startsWith('chore-')) return ClipboardList
  const t = ev.title.toLowerCase()
  if (/bath|shower/.test(t)) return ShowerHead
  if (/living|sofa|couch/.test(t)) return Sofa
  if (/cook|dinner|lunch|breakfast|meal|kitchen/.test(t)) return UtensilsCrossed
  if (/movie|film|friends|party|game|guests|night/.test(t)) return Users
  if (/landlord|fix|repair|sink|inspection/.test(t)) return Wrench
  if (/car|parking|permit/.test(t)) return Car
  return CalendarDays
}

function DayTimeline({ events, isToday, nowH, onPick, onEdit }: { events: CalEvent[]; isToday: boolean; nowH: number; onPick: (h: number) => void; onEdit: (e: CalEvent) => void }) {
  const box = useRef<HTMLDivElement>(null)
  // Land on the current hour when the page opens, so today's plans are in view.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const target = isToday ? Math.max(START, nowH - 1.5) : 7 // other days open at 7am
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY + (target - START) * HOUR_PX - 150) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const showNow = isToday && nowH >= START && nowH < END
  const laid = layoutDay(events)
  return (
    <div className="vtl" ref={box}>
      <div className="vtl-grid" style={{ height: SPAN * HOUR_PX }}>
        {Array.from({ length: SPAN + 1 }, (_, i) => (
          <div key={i} className="vtl-hour" style={{ top: i * HOUR_PX }}><span>{hourLabel((START + i) % 24)}</span></div>
        ))}
        <div
          className="vtl-lane"
          title="Tap to add an event"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const h = START + (e.clientY - r.top) / HOUR_PX
            onPick(Math.min(END - 0.5, Math.max(START, Math.floor(h * 2) / 2)))
          }}
        >
          {showNow && <span className="vtl-now" style={{ top: (nowH - START) * HOUR_PX }} aria-hidden />}
          {laid.map(({ ev, col, cols }) => {
            const chore = ev.id.startsWith('chore-')
            const Icon = iconFor(ev)
            const top = (Math.max(ev.start, START) - START) * HOUR_PX
            const slot = ev.id.startsWith('bath-') // 30-minute bathroom slots stay slim so neighbours don't overlap
            const height = slot ? (Math.min(ev.end, END) - Math.max(ev.start, START)) * HOUR_PX - 3 : Math.max(54, (Math.min(ev.end, END) - Math.max(ev.start, START)) * HOUR_PX - 4)
            const names = ev.who.map((id) => (id === 'you' ? 'You' : byId(id).name)).join(', ')
            const title = ev.title.replace(EMOJI_LEAD, '')
            return (
              <button
                key={ev.id}
                type="button"
                className={`vtl-ev${chore ? ' is-chore' : ''}${cols > 1 ? ' narrow' : ''}${slot ? ' slot' : ''}`}
                style={{ top, height, left: `${(col / cols) * 100}%`, width: `calc(${100 / cols}% - 6px)`, '--c': ev.color } as React.CSSProperties}
                aria-label={chore ? `${title}. Chore, ${timeLabel(ev.start)}` : `Edit ${title}, ${timeLabel(ev.start)} to ${timeLabel(ev.end)}`}
                onClick={(e) => { e.stopPropagation(); if (!chore) onEdit(ev) }}
              >
                <span className="vtl-ico" aria-hidden><Icon size={slot ? 16 : cols > 1 ? 18 : 22} /></span>
                <span className="vtl-txt">
                  <b>{slot ? `${title} · ${names}` : title}</b>
                  {!slot && <small>{cols > 1 ? timeLabel(ev.start) : `${timeLabel(ev.start)} · ${names}${ev.repeat && ev.repeat !== 'none' ? ' · ↻' : ''}`}</small>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ───────── Add-event popup ───────── */

const TIMES = Array.from({ length: SPAN * 2 + 1 }, (_, i) => START + i / 2) // 12:00am … 12:00am

type EventFields = Omit<CalEvent, 'id' | 'date' | 'color'>

function RepeatFields({ repeat, until, onRepeat, onUntil, options = ['none', 'daily', 'weekdays', 'weekends', 'weekly'] }: { repeat: Repeat; until: string; onRepeat: (r: Repeat) => void; onUntil: (u: string) => void; options?: Repeat[] }) {
  return (
    <div className="ev-times">
      <div className="field" style={repeat === 'none' ? { gridColumn: '1 / -1' } : undefined}>
        <label htmlFor="rep-kind">Repeat</label>
        <select id="rep-kind" className="input plain" value={repeat} onChange={(e) => onRepeat(e.target.value as Repeat)}>
          {options.map((r) => <option key={r} value={r}>{repeatLabels[r]}</option>)}
        </select>
      </div>
      {repeat !== 'none' && (
        <div className="field">
          <label htmlFor="rep-until">Until</label>
          <input id="rep-until" className="input plain" type="date" value={until} min={iso(new Date())} onChange={(e) => onUntil(e.target.value)} />
        </div>
      )}
    </div>
  )
}

function EventPopup({ dayLabel, start: initialStart, existing, preset, heading, onSave, onDelete, onClose }: { dayLabel: string; start: number; existing?: CalEvent; preset?: string; heading?: string; onSave: (e: EventFields) => void; onDelete?: () => void; onClose: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? preset ?? '')
  const [start, setStart] = useState(existing?.start ?? initialStart)
  const [end, setEnd] = useState(existing?.end ?? Math.min(initialStart + 1, END))
  const [who, setWho] = useState<string[]>(existing?.who ?? ['you'])
  const [repeat, setRepeat] = useState<Repeat>(existing?.repeat ?? 'none')
  const [until, setUntil] = useState(existing?.until ?? endOfYear())
  const clean = title.trim()
  const valid = clean.length > 0 && end > start && who.length > 0

  const toggle = (id: string) => setWho(who.includes(id) ? who.filter((w) => w !== id) : [...who, id])
  // Moving the start keeps the event's length (capped at midnight).
  const changeStart = (s: number) => { setEnd(Math.min(s + (end - start), END)); setStart(s) }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-event-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ title: clean, start, end, who, repeat, until: repeat === 'none' ? undefined : until }) }}
      >
        <div>
          <h2 id="add-event-title">{existing ? 'Edit event' : heading ?? 'Add event'}</h2>
          <div className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{dayLabel}</div>
        </div>
        <div className="field">
          <label htmlFor="ev-title">What’s happening?</label>
          <input id="ev-title" className="input plain" placeholder="e.g. Game night" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus autoComplete="off" maxLength={50} />
        </div>
        <div className="ev-times">
          <div className="field">
            <label htmlFor="ev-start">Starts</label>
            <select id="ev-start" className="input plain" value={start} onChange={(e) => changeStart(Number(e.target.value))}>
              {TIMES.slice(0, -1).map((t) => <option key={t} value={t}>{timeLabel(t)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ev-end">Ends</label>
            <select id="ev-end" className="input plain" value={end} onChange={(e) => setEnd(Number(e.target.value))}>
              {TIMES.filter((t) => t > start).map((t) => <option key={t} value={t}>{timeLabel(t)}</option>)}
            </select>
          </div>
        </div>
        <fieldset className="field ev-who">
          <legend>Who’s in?</legend>
          <div className="ev-who-row">
            {roommates.map((r) => (
              <button key={r.id} type="button" className="ev-person" aria-pressed={who.includes(r.id)} onClick={() => toggle(r.id)}>
                <Avatar id={r.id} size={34} />
                <span>{r.name}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <RepeatFields repeat={repeat} until={until} onRepeat={setRepeat} onUntil={setUntil} />
        <div className="modal-actions">
          {existing && onDelete && <button type="button" className="btn sm ghost danger-text" onClick={onDelete} style={{ marginRight: 'auto' }}><Trash2 size={16} aria-hidden /> Delete</button>}
          <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
          {existing
            ? <button type="submit" className="btn sm" disabled={!valid}><Check size={18} aria-hidden /> Save</button>
            : <button type="submit" className="btn sm" disabled={!valid}><Plus size={18} aria-hidden /> Add event</button>}
        </div>
      </form>
    </div>,
    document.body,
  )
}

/* ───────── Edit-your-home-times popup ───────── */

/** Sort and merge overlapping/touching ranges so the chart stays clean. */
function tidy(ranges: Ranges): Ranges {
  const sorted = ranges.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0])
  const out: Ranges = []
  for (const [a, b] of sorted) {
    const last = out[out.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else out.push([a, b])
  }
  return out
}

function HomeTimesPopup({ dayLabel, initial, onSave, onClose }: { dayLabel: string; initial: Ranges; onSave: (r: Ranges) => void; onClose: () => void }) {
  const [ranges, setRanges] = useState<Ranges>(initial.map(([a, b]) => [a, b]))
  const valid = ranges.every(([a, b]) => b > a)

  const set = (i: number, which: 0 | 1, v: number) =>
    setRanges(ranges.map((r, j) => {
      if (j !== i) return r
      const next: [number, number] = [r[0], r[1]]
      next[which] = v
      if (which === 0 && next[1] <= v) next[1] = Math.min(v + 1, END)
      return next
    }))
  // New times start in the first gap you're not already home (up to 2 hours long).
  const covered = (t: number) => ranges.some(([a, b]) => t >= a && t < b)
  const gapStart = TIMES.slice(0, -1).find((t) => !covered(t))
  const addRange = () => {
    if (gapStart === undefined) return
    const nextStart = Math.min(END, ...ranges.map(([a]) => a).filter((a) => a > gapStart))
    setRanges([...ranges, [gapStart, Math.min(gapStart + 2, nextStart)]])
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        onSubmit={(e) => { e.preventDefault(); if (valid) onSave(tidy(ranges)) }}
      >
        <div>
          <h2 id="home-title">When are you home?</h2>
          <div className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{dayLabel}</div>
        </div>
        {ranges.length === 0 ? (
          <p className="more" style={{ margin: 0 }}>Away all day. Add a time if you’ll be home.</p>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {ranges.map(([a, b], i) => (
              <div className="home-range" key={i}>
                <select aria-label={`Home from, time ${i + 1}`} className="input plain" value={a} onChange={(e) => set(i, 0, Number(e.target.value))}>
                  {TIMES.slice(0, -1).map((t) => <option key={t} value={t}>{timeLabel(t)}</option>)}
                </select>
                <span className="muted" style={{ fontWeight: 800 }}>to</span>
                <select aria-label={`Home until, time ${i + 1}`} className="input plain" value={b} onChange={(e) => set(i, 1, Number(e.target.value))}>
                  {TIMES.filter((t) => t > a).map((t) => <option key={t} value={t}>{timeLabel(t)}</option>)}
                </select>
                <button type="button" className="icon-btn home-remove" aria-label={`Remove time ${i + 1}`} onClick={() => setRanges(ranges.filter((_, j) => j !== i))}>
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="slot open slot-action" style={{ marginTop: 0, alignSelf: 'flex-start' }} onClick={addRange} disabled={gapStart === undefined}>
          <Plus size={16} aria-hidden /> Add a time
        </button>
        <div className="modal-actions">
          <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn sm" disabled={!valid}><Check size={18} aria-hidden /> Save</button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

/* ───────── Events list for the selected day ───────── */

/* ───────── Bathroom slots & parking (unchanged) ───────── */

const ME = 'you' // the logged-in roommate (Natalie) in this prototype
const HOME_KEY = 'harmony.myHome'
const BATH_KEY = 'harmony.bathroom'
type BathSlot = { who: string; start: number; repeat?: Repeat; until?: string } // 30-minute slots, every day unless set

const sampleBath: BathSlot[] = [
  { who: 'sofi', start: 7 }, { who: 'diego', start: 7.5 }, { who: 'you', start: 8 }, { who: 'mara', start: 21.5 },
]

function loadBath(): BathSlot[] {
  try {
    const saved = sessionStorage.getItem(BATH_KEY)
    if (saved) return JSON.parse(saved) as BathSlot[]
  } catch { /* storage unavailable */ }
  return sampleBath
}

const BATH_TIMES = Array.from({ length: SPAN * 2 }, (_, i) => START + i / 2) // 12:00am … 11:30pm

function BathTimePopup({ current, currentRepeat, currentUntil, taken, onSave, onClose }: { current: number | null; currentRepeat?: Repeat; currentUntil?: string; taken: BathSlot[]; onSave: (start: number, repeat: Repeat, until?: string) => void; onClose: () => void }) {
  const firstFree = BATH_TIMES.find((t) => !taken.some((s) => s.start === t)) ?? START
  const [start, setStart] = useState(current ?? firstFree)
  const takenBy = (t: number) => taken.find((s) => s.start === t)
  const [repeat, setRepeat] = useState<Repeat>(currentRepeat ?? 'daily')
  const [until, setUntil] = useState(currentUntil ?? endOfYear())

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bath-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        onSubmit={(e) => { e.preventDefault(); if (!takenBy(start)) onSave(start, repeat, until) }}
      >
        <div>
          <h2 id="bath-title">{current === null ? 'Pick your bathroom time' : 'Change your bathroom time'}</h2>
          <div className="muted" style={{ fontWeight: 700, fontSize: 14 }}>Slots are 30 minutes. Times other roommates have are greyed out.</div>
        </div>
        <div className="field">
          <label htmlFor="bath-start">Start time</label>
          <select id="bath-start" className="input plain" value={start} onChange={(e) => setStart(Number(e.target.value))} autoFocus>
            {BATH_TIMES.map((t) => {
              const who = takenBy(t)
              return <option key={t} value={t} disabled={!!who}>{timeLabel(t)} – {timeLabel(t + 0.5)}{who ? ` · ${byId(who.who).name}` : ''}</option>
            })}
          </select>
        </div>
        <RepeatFields repeat={repeat} until={until} onRepeat={setRepeat} onUntil={setUntil} options={['daily', 'weekdays', 'weekends']} />
        <div className="modal-actions">
          <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn sm">Save time</button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function Parking() {
  return (
    <div className="stack">
      <div className="card tint-yellow row">
        <span className="bubble-ico bg-yellow"><Car aria-hidden /></span>
        <div className="grow"><b>Street permit · Zone B</b><div className="muted" style={{ fontSize: 14, fontWeight: 700 }}>One car at a time. Pick a time that works.</div></div>
      </div>
      <div className="perm pop"><div className="grow"><div className="when">Tue · 9:00am – 1:00pm</div><span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>Available</span></div><button className="btn sm">Reserve permit</button></div>
      <div className="perm taken pop" style={{ '--i': 1 } as React.CSSProperties}>
        <div className="grow"><div className="when row"><AlertTriangle size={18} aria-hidden /> Tue · 2:00pm – 6:00pm</div><span style={{ fontWeight: 700, fontSize: 14 }}>Diego already has this one</span></div>
        <button className="btn sm ghost">Choose another time</button>
      </div>
      <div className="perm pop" style={{ '--i': 2 } as React.CSSProperties}><div className="grow"><div className="when">Wed · 8:00am – 12:00pm</div><span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>Available</span></div><button className="btn sm">Reserve permit</button></div>
    </div>
  )
}

/* ───────── Page ───────── */

export default function Calendar() {
  const now = useNow()
  const today = dateKey(now)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(0)
  const [day, setDay] = useState(today)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = this week, -1 = last week, 1 = next week…
  const [events, setEvents] = useState<CalEvent[]>(loadEvents)
  const [adding, setAdding] = useState<number | null>(null)
  const [editing, setEditing] = useState<CalEvent | null>(null)
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [pendingStart, setPendingStart] = useState<number | null>(null) // time tapped on the day, kept while you choose what to add
  const askWhatToAdd = (h?: number) => { setPendingStart(h ?? null); setMenu(true) }
  const startAt = () => pendingStart ?? nextHalfHour()
  const [reserving, setReserving] = useState(false)
  const [reserve, setReserve] = useState<string | null>(null)
  const [bath, setBath] = useState<BathSlot[]>(loadBath)
  const [editingBath, setEditingBath] = useState(false)
  const saveBath = (next: BathSlot[]) => {
    setBath(next)
    try { sessionStorage.setItem(BATH_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  const myBath = bath.find((s) => s.who === ME) ?? null
  const [myHome, setMyHome] = useState<Record<string, Ranges>>(() => {
    try { return JSON.parse(sessionStorage.getItem(HOME_KEY) ?? '{}') as Record<string, Ranges> } catch { return {} }
  })
  const [editingHome, setEditingHome] = useState(false)
  const idSeq = useRef(0)
  const { chores } = useChores()

  // The current week, Monday → Sunday.
  const monday = addDays(now, -((now.getDay() + 6) % 7) + weekOffset * 7)
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const [y, m, d] = day.split('-').map(Number)
  const selected = new Date(y, m - 1, d)

  // Arrows move a week at a time and keep the same weekday selected.
  const shiftWeek = (by: number) => {
    setWeekOffset(weekOffset + by)
    setDay(dateKey(addDays(selected, by * 7)))
  }
  const backToToday = () => { setWeekOffset(0); setDay(today) }
  const fmtShort = (x: Date) => x.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const weekRange = `${fmtShort(week[0])} – ${week[0].getMonth() === week[6].getMonth() ? week[6].getDate() : fmtShort(week[6])}, ${week[6].getFullYear()}`
  const nowH = hoursOf(now)
  const isToday = day === today

  const dayEvents = events.filter((e) => occursOn(e, day)).sort((a, b) => a.start - b.start)
  // Bathroom slots live in the calendar too: one 30-minute card per roommate, every day.
  const bathEvents: CalEvent[] = bath.filter((s) => occursOn({ date: '2000-01-01', repeat: s.repeat ?? 'daily', until: s.until }, day)).map((s) => ({ id: `bath-${s.who}`, date: day, start: s.start, end: s.start + 0.5, title: 'Bathroom', who: [s.who], color: 'var(--blue-d)' }))
  const shown = [...dayEvents, ...choresToEvents(chores, day), ...bathEvents].sort((a, b) => a.start - b.start)
  const openEvent = (ev: CalEvent) => {
    if (ev.id.startsWith('bath-')) { if (ev.who[0] === ME) setEditingBath(true); return }
    setEditing(ev)
  }
  const dayLabel = selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  // The yellow button starts a new event at the next half hour (or 6pm when viewing another day).
  const nextHalfHour = () => {
    if (!isToday) return 18
    const h = Math.ceil(nowH * 2) / 2
    return h >= START && h < END ? h : START
  }
  useEffect(() => {
    if (params.get('add') !== '1') return
    askWhatToAdd(nextHalfHour())
    const next = new URLSearchParams(params)
    next.delete('add')
    setParams(next, { replace: true })
  }, [params, setParams])

  const store = (next: CalEvent[]) => { setEvents(next); saveEvents(next) }

  // Your own home times can be changed per day; everyone else uses the sample schedule.
  const homeOf = (id: string): Ranges => (id === ME ? myHome[day] ?? presence[ME] : presence[id])
  const saveHome = (ranges: Ranges) => {
    const next = { ...myHome, [day]: ranges }
    setMyHome(next)
    try { sessionStorage.setItem(HOME_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    setEditingHome(false)
  }
  const updateEvent = (fields: EventFields) => {
    if (!editing) return
    store(events.map((e) => (e.id === editing.id ? { ...e, ...fields } : e)))
    setEditing(null)
  }
  const deleteEvent = () => {
    if (!editing) return
    store(events.filter((e) => e.id !== editing.id))
    setEditing(null)
  }

  const addEvent = (e: EventFields) => {
    const next = [...events, { ...e, id: `e${Date.now()}-${idSeq.current++}`, date: day, color: reserve ? 'var(--blue-d)' : NEW_EVENT_COLOR }]
    setEvents(next)
    saveEvents(next)
    setAdding(null)
    setReserve(null)
  }

  const dayStrip = (
    <div className="week-block">
      <div className="week-head">
        <b>{weekRange}</b>
        {weekOffset !== 0 && <button type="button" className="link week-today" onClick={backToToday}>Back to today</button>}
      </div>
      <div className="week-nav">
        <button type="button" className="week-arrow prev" aria-label="Previous week" onClick={() => shiftWeek(-1)}><ChevronLeft size={20} strokeWidth={3} aria-hidden /></button>
        <div className="day-strip">
          {week.map((d) => {
            const k = dateKey(d)
            const hasMark = events.some((e) => occursOn(e, k)) || chores.some((c) => c.date === k && !c.done)
            return (
              <button className={`day${k === today ? ' today' : ''}`} key={k} aria-pressed={day === k} onClick={() => setDay(k)} aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${hasMark ? ', has plans' : ''}`}>
                <small>{k === today ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}</small>
                <b>{d.getDate()}</b>
                {hasMark && day !== k ? <span className="pip-dot" /> : <span style={{ height: 6 }} />}
              </button>
            )
          })}
        </div>
        <button type="button" className="week-arrow next" aria-label="Next week" onClick={() => shiftWeek(1)}><ChevronRight size={20} strokeWidth={3} aria-hidden /></button>
      </div>
    </div>
  )

  return (
    <>
      <PageHead title="Calendar" right={tab !== 2 ? <button type="button" className="cal-plus" aria-label="Add to the calendar" onClick={() => askWhatToAdd()}><Plus size={24} strokeWidth={3} aria-hidden /></button> : undefined} />
      <div className="cal-sticky">
        <Segmented options={['Schedule', 'Who’s home', 'Parking']} onChange={setTab} />
        {tab !== 2 && <div className="cal-week">{dayStrip}</div>}
      </div>
      {tab === 0 && (
        <>
          <div className="section-head vtl-head"><h2>{dayLabel}</h2><Chip tone="purple">{shown.length} {shown.length === 1 ? 'plan' : 'plans'}</Chip></div>
          <DayTimeline events={shown} isToday={isToday} nowH={nowH} onPick={askWhatToAdd} onEdit={openEvent} />
        </>
      )}
      {tab === 1 && (
        <>
          <div className="section-head vtl-head"><h2>{dayLabel}</h2></div>
          <WhoIsHome isToday={isToday} nowH={nowH} homeOf={homeOf} onEditHome={() => setEditingHome(true)} />
        </>
      )}
      {tab === 2 && <Parking />}

      <Sheet open={menu} title="What do you want to add?" icon={<Plus aria-hidden />} tone="bg-purple" onClose={() => setMenu(false)}>
        <div className="add-menu">
          <button type="button" className="add-opt" onClick={() => { setMenu(false); setAdding(startAt()) }}>
            <span className="add-ico" aria-hidden><CalendarDays size={22} /></span>
            <span className="grow"><b>Event</b><small>Dinner, guests, plans for everyone</small></span>
          </button>
          <button type="button" className="add-opt" onClick={() => { setMenu(false); setReserving(true) }}>
            <span className="add-ico" aria-hidden><KeyRound size={22} /></span>
            <span className="grow"><b>Reservation</b><small>Bathroom, kitchen, living room</small></span>
          </button>
          <button type="button" className="add-opt" onClick={() => { setMenu(false); navigate('/app/chores?add=1') }}>
            <span className="add-ico" aria-hidden><ClipboardList size={22} /></span>
            <span className="grow"><b>Chore</b><small>Who does what, and when</small></span>
          </button>
        </div>
      </Sheet>
      <Sheet open={reserving} title="What do you want to reserve?" icon={<KeyRound aria-hidden />} tone="bg-purple" onClose={() => setReserving(false)}>
        <div className="add-menu">
          {[{ n: 'Bathroom', icon: ShowerHead, hint: myBath ? `Your slot: ${timeLabel(myBath.start)}` : '30-minute slot' }, { n: 'Kitchen', icon: UtensilsCrossed, hint: 'Cooking or hosting' }, { n: 'Living room', icon: Sofa, hint: 'Friends over, study session' }].map(({ n, icon: Icon, hint }) => (
            <button key={n} type="button" className="add-opt" onClick={() => { setReserving(false); if (n === 'Bathroom') setEditingBath(true); else { setReserve(n); setAdding(startAt()) } }}>
              <span className="add-ico" aria-hidden><Icon size={22} /></span>
              <span className="grow"><b>{n}</b><small>{hint}</small></span>
            </button>
          ))}
        </div>
      </Sheet>

      {editingBath && (
        <BathTimePopup
          current={myBath?.start ?? null}
          currentRepeat={myBath?.repeat}
          currentUntil={myBath?.until}
          taken={bath.filter((s) => s.who !== ME)}
          onSave={(start, repeat, until) => { saveBath([...bath.filter((s) => s.who !== ME), { who: ME, start, repeat, until }]); setEditingBath(false) }}
          onClose={() => setEditingBath(false)}
        />
      )}
      {adding !== null && <EventPopup dayLabel={dayLabel} start={adding} preset={reserve ? `${reserve} reserved` : undefined} heading={reserve ? `Reserve the ${reserve.toLowerCase()}` : undefined} onSave={addEvent} onClose={() => { setAdding(null); setReserve(null) }} />}
      {editingHome && <HomeTimesPopup key={day} dayLabel={dayLabel} initial={homeOf(ME)} onSave={saveHome} onClose={() => setEditingHome(false)} />}
      {editing && !editing.id.startsWith('chore-') && <EventPopup key={editing.id} dayLabel={dayLabel} start={editing.start} existing={editing} onSave={updateEvent} onDelete={deleteEvent} onClose={() => setEditing(null)} />}

    </>
  )
}

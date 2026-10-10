import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CalendarDays, Car, Check, ChevronLeft, ChevronRight, Home, Pencil, Plus, Trash2 } from 'lucide-react'
import { Avatar, AvatarStack, Chip, PageHead, Segmented } from '../components/ui'
import { Link } from 'react-router-dom'
import { byId, hourLabel, presence, roommates } from '../data'
import { useChores } from '../chores'

/* ───────── Time helpers ───────── */

const START = 6 // chart starts at 6am
const SPAN = 18 // …and runs 18 hours, to midnight
const END = START + SPAN
const pct = (h: number) => ((h - START) / SPAN) * 100
const NEW_EVENT_COLOR = 'var(--mint)' // the one palette color not already used by events or roommates

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const hoursOf = (d: Date) => d.getHours() + d.getMinutes() / 60

/** "6:30pm" style label for any decimal hour (including minutes that aren't :00 or :30). */
function timeLabel(h: number) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  const n = hh % 12 === 0 ? 12 : hh % 12
  return `${n}${mm ? `:${String(mm).padStart(2, '0')}` : ''}${hh >= 12 ? 'pm' : 'am'}`
}

/** Re-renders every 30 seconds so the "now" line keeps moving. */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  return now
}

/* ───────── Events (kept for this browser tab) ───────── */

type CalEvent = { id: string; date: string; start: number; end: number; title: string; who: string[]; color: string }
const EVENTS_KEY = 'harmony.events'

function sampleEvents(): CalEvent[] {
  const today = new Date()
  return [
    { id: 's1', date: dateKey(today), start: 18.5, end: 19.5, title: 'Cook dinner together', who: ['you', 'sofi', 'mara'], color: 'var(--brand)' },
    { id: 's2', date: dateKey(today), start: 21, end: 23, title: 'Movie night in the living room', who: ['you', 'diego', 'mara', 'sofi'], color: 'var(--purple)' },
    { id: 's3', date: dateKey(addDays(today, 2)), start: 11, end: 12, title: 'Landlord visit · fix the sink', who: ['you'], color: 'var(--yellow-d)' },
  ]
}

function loadEvents(): CalEvent[] {
  try {
    const saved = sessionStorage.getItem(EVENTS_KEY)
    if (saved) return JSON.parse(saved) as CalEvent[]
  } catch { /* storage unavailable */ }
  return sampleEvents()
}

function saveEvents(events: CalEvent[]) {
  try { sessionStorage.setItem(EVENTS_KEY, JSON.stringify(events)) } catch { /* storage unavailable */ }
}

/* ───────── Combined availability chart ───────── */

type Ranges = [number, number][]

function homeNow(ranges: Ranges, h: number) {
  return ranges.some(([a, b]) => h >= a && h < b)
}

function Chart({ days, isToday, nowH, events, homeOf, onPick, onEdit, onEditHome }: { days: ReactNode; isToday: boolean; nowH: number; events: CalEvent[]; homeOf: (id: string) => Ranges; onPick: (h: number) => void; onEdit: (e: CalEvent) => void; onEditHome: () => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const showNow = isToday && nowH >= START && nowH < END

  // Turn a click position on any track into a time, rounded down to the half hour.
  const timeAt = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const h = START + ((e.clientX - r.left) / r.width) * SPAN
    return Math.min(END - 0.5, Math.max(START, Math.floor(h * 2) / 2))
  }
  const trackProps = {
    title: 'Click to add an event',
    onClick: (e: MouseEvent<HTMLElement>) => onPick(timeAt(e)),
    onMouseMove: (e: MouseEvent<HTMLElement>) => setHover(timeAt(e)),
    onMouseLeave: () => setHover(null),
  }
  const marks = (
    <>
      {showNow && <span className="g-now" style={{ left: `${pct(nowH)}%` }} />}
      {hover !== null && <span className="g-hover" style={{ left: `${pct(hover)}%` }} />}
    </>
  )

  return (
    <div className="card flat cal-chart">
      {days}
      <div className="g-hours">
        <span />
        <div className="hrs">
          {Array.from({ length: SPAN / 3 + 1 }, (_, i) => START + i * 3).map((h) => (
            <span key={h} style={{ left: `${pct(h)}%` }}>{hourLabel(h % 24).replace(':00', '')}</span>
          ))}
          {showNow && <b className="now-tag" style={{ left: `${pct(nowH)}%` }}>{timeLabel(nowH)}</b>}
          {hover !== null && (!showNow || Math.abs(hover - nowH) > 1.5) && <b className="now-tag hover" style={{ left: `${pct(hover)}%` }}>{timeLabel(hover)}</b>}
        </div>
      </div>

      {roommates.map((r) => (
        <div className="g-row" key={r.id}>
          <div className="g-label">
            <Avatar id={r.id} size={28} home={isToday ? homeNow(homeOf(r.id), nowH) : undefined} />
            <span className="g-name">{r.name}</span>
          </div>
          <div className="g-track" {...trackProps}>
            {homeOf(r.id).map(([s, e], i) => (
              <span key={i} className="g-bar" style={{ left: `${pct(s)}%`, width: `${pct(e) - pct(s)}%`, background: r.color, color: r.ink, animationDelay: `${i * 80}ms` }}>
                <span className="g-bar-text">{e - s >= 2 ? 'Home' : ''}</span>
              </span>
            ))}
            {marks}
          </div>
        </div>
      ))}

      <div className="g-row">
        <div className="g-label"><span className="bubble-ico bg-teal g-ico"><CalendarDays size={15} aria-hidden /></span><span className="g-name">Events</span></div>
        <div className="g-track" {...trackProps}>
          {events.map((ev) => (
            <span key={ev.id} className="g-bar g-event" role="button" tabIndex={0} aria-label={ev.id.startsWith('chore-') ? `${ev.title}. Open in Chores` : `Edit ${ev.title}`} onClick={(e) => { e.stopPropagation(); if (!ev.id.startsWith('chore-')) onEdit(ev) }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!ev.id.startsWith('chore-')) onEdit(ev) } }} onMouseMove={(e) => e.stopPropagation()} title={`${ev.title} · ${timeLabel(ev.start)}–${timeLabel(ev.end)}`} style={{ left: `${pct(Math.max(ev.start, START))}%`, width: `${pct(Math.min(ev.end, END)) - pct(Math.max(ev.start, START))}%`, background: ev.color }}>
              <span className="g-bar-text">{ev.title}</span>
            </span>
          ))}
          {marks}
        </div>
      </div>

      <div className="legend">
        <span><i style={{ background: `linear-gradient(90deg, ${roommates.map((r) => r.color).join(', ')})` }} />At home</span>
        <span><i style={{ background: 'var(--coral)' }} />Now</span>
      </div>
      <p className="cal-hint">Tap anywhere on the chart to add an event at that time.</p>
      <button type="button" className="slot open slot-action" onClick={onEditHome}>
        <Home size={16} aria-hidden /> Edit when you’re home
      </button>
    </div>
  )
}

/* ───────── Add-event popup ───────── */

const TIMES = Array.from({ length: SPAN * 2 + 1 }, (_, i) => START + i / 2) // 6:00am … 12:00am

type EventFields = Omit<CalEvent, 'id' | 'date' | 'color'>

function EventPopup({ dayLabel, start: initialStart, existing, onSave, onDelete, onClose }: { dayLabel: string; start: number; existing?: CalEvent; onSave: (e: EventFields) => void; onDelete?: () => void; onClose: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [start, setStart] = useState(existing?.start ?? initialStart)
  const [end, setEnd] = useState(existing?.end ?? Math.min(initialStart + 1, END))
  const [who, setWho] = useState<string[]>(existing?.who ?? ['you'])
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
        onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ title: clean, start, end, who }) }}
      >
        <div>
          <h2 id="add-event-title">{existing ? 'Edit event' : 'Add event'}</h2>
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

function EventList({ events, onEdit }: { events: CalEvent[]; onEdit: (e: CalEvent) => void }) {
  return (
    <>
      <div className="section-head" style={{ marginTop: 20 }}><h2>Events</h2></div>
      {events.length === 0 ? (
        <p className="more">No events this day yet. Tap the chart to add one.</p>
      ) : (
        <div className="stack">
          {events.map((e, i) => {
            const t = timeLabel(e.start)
            const chore = e.id.startsWith('chore-')
            const body = (
              <>
                <span className="time">{t.slice(0, -2)}<small>{t.slice(-2)}</small></span>
                <span className="bar" style={{ background: e.color }} />
                <span className="grow">
                  <span className="ev-title">{e.title}</span>
                  <span className="muted ev-when">{timeLabel(e.start)} – {timeLabel(e.end)}</span>
                  <span className="ev-people"><AvatarStack ids={e.who} size={28} /></span>
                </span>
                {chore ? <Chip tone="teal">Chore</Chip> : <span className="ev-edit"><Pencil size={16} aria-hidden /> Edit</span>}
              </>
            )
            return chore ? (
              <Link to="/app/chores" className="card event event-btn pop" key={e.id} style={{ '--i': i } as React.CSSProperties} aria-label={`${e.title}. Open in Chores`}>
                {body}
              </Link>
            ) : (
              <button type="button" className="card event event-btn pop" key={e.id} style={{ '--i': i } as React.CSSProperties} onClick={() => onEdit(e)} aria-label={`${e.title}, ${timeLabel(e.start)} to ${timeLabel(e.end)}. Edit event`}>
                {body}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ───────── Bathroom slots & parking (unchanged) ───────── */

const ME = 'you' // the logged-in roommate (Natalie) in this prototype
const HOME_KEY = 'harmony.myHome'
const BATH_KEY = 'harmony.bathroom'
type BathSlot = { who: string; start: number } // 30-minute slots

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

const BATH_TIMES = Array.from({ length: SPAN * 2 }, (_, i) => START + i / 2) // 6:00am … 11:30pm

function BathTimePopup({ current, taken, onSave, onClose }: { current: number | null; taken: BathSlot[]; onSave: (start: number) => void; onClose: () => void }) {
  const firstFree = BATH_TIMES.find((t) => !taken.some((s) => s.start === t)) ?? START
  const [start, setStart] = useState(current ?? firstFree)
  const takenBy = (t: number) => taken.find((s) => s.start === t)

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bath-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        onSubmit={(e) => { e.preventDefault(); if (!takenBy(start)) onSave(start) }}
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
        <div className="modal-actions">
          <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn sm">Save time</button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function Bathroom() {
  const [slots, setSlots] = useState<BathSlot[]>(loadBath)
  const [editing, setEditing] = useState(false)
  const update = (next: BathSlot[]) => {
    setSlots(next)
    try { sessionStorage.setItem(BATH_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  const mine = slots.find((s) => s.who === ME) ?? null
  const others = slots.filter((s) => s.who !== ME)
  const sorted = [...slots].sort((a, b) => a.start - b.start)

  return (
    <>
      <div className="section-head" style={{ marginTop: 20 }}><h2>Bathroom slots</h2><Chip tone="blue">30 min each</Chip></div>
      <div className="slot-grid">
        {sorted.map((s) => (
          <div key={s.who + s.start} className="slot">
            <b>{timeLabel(s.start)}</b>
            <Avatar id={s.who} size={28} />
            <span>{byId(s.who).name}</span>
          </div>
        ))}
      </div>
      <button type="button" className="slot open slot-action" onClick={() => setEditing(true)}>
        {mine ? <><Pencil size={16} aria-hidden /> Edit your time</> : <><Plus size={18} aria-hidden /> Pick your time</>}
      </button>

      {editing && (
        <BathTimePopup
          current={mine?.start ?? null}
          taken={others}
          onSave={(start) => { update([...others, { who: ME, start }]); setEditing(false) }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
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
  const [tab, setTab] = useState(0)
  const [day, setDay] = useState(today)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = this week, -1 = last week, 1 = next week…
  const [events, setEvents] = useState<CalEvent[]>(loadEvents)
  const [adding, setAdding] = useState<number | null>(null)
  const [editing, setEditing] = useState<CalEvent | null>(null)
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

  const dayEvents = events.filter((e) => e.date === day).sort((a, b) => a.start - b.start)
  const choreEvents: CalEvent[] = chores.filter((c) => c.date === day).map((c) => {
    const [hh, mm] = (c.time || '09:00').split(':').map(Number)
    const start = hh + (mm || 0) / 60
    return { id: `chore-${c.id}`, date: c.date, start, end: Math.min(start + 0.5, END), title: `${c.emoji} ${c.t}`, who: [c.who], color: 'var(--mint)' }
  })
  const shown = [...dayEvents, ...choreEvents].sort((a, b) => a.start - b.start)
  const dayLabel = selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  // The yellow button starts a new event at the next half hour (or 6pm when viewing another day).
  const nextHalfHour = () => {
    if (!isToday) return 18
    const h = Math.ceil(nowH * 2) / 2
    return h >= START && h < END ? h : START
  }

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
    const next = [...events, { ...e, id: `e${Date.now()}-${idSeq.current++}`, date: day, color: NEW_EVENT_COLOR }]
    setEvents(next)
    saveEvents(next)
    setAdding(null)
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
            const hasMark = events.some((e) => e.date === k) || chores.some((c) => c.date === k && !c.done)
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
      <PageHead title="Calendar" />
      <Segmented options={['Schedule', 'Parking']} onChange={setTab} />
      <div style={{ height: 16 }} />
      {tab === 0 && (
        <>
          <Chart days={dayStrip} isToday={isToday} nowH={nowH} events={shown} homeOf={homeOf} onPick={(h) => setAdding(h)} onEdit={setEditing} onEditHome={() => setEditingHome(true)} />
          <EventList events={shown} onEdit={setEditing} />
          <Bathroom />
        </>
      )}
      {tab === 1 && <Parking />}
      {tab === 0 && <button className="fab" aria-label="Add event" onClick={() => setAdding(nextHalfHour())}><Plus size={30} aria-hidden /><span className="fab-label">Add event</span></button>}

      {adding !== null && <EventPopup dayLabel={dayLabel} start={adding} onSave={addEvent} onClose={() => setAdding(null)} />}
      {editingHome && <HomeTimesPopup key={day} dayLabel={dayLabel} initial={homeOf(ME)} onSave={saveHome} onClose={() => setEditingHome(false)} />}
      {editing && !editing.id.startsWith('chore-') && <EventPopup key={editing.id} dayLabel={dayLabel} start={editing.start} existing={editing} onSave={updateEvent} onDelete={deleteEvent} onClose={() => setEditing(null)} />}

    </>
  )
}

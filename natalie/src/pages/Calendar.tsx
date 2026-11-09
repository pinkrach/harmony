import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CalendarDays, Car, Check, ChevronLeft, ChevronRight, ClipboardList, Clock, Home, KeyRound, Pencil, Plus, ShowerHead, Sofa, Trash2, UtensilsCrossed, Users, Wrench, X, type LucideIcon } from 'lucide-react'
import { Avatar, Chip, Sheet } from '../components/ui'
import { TimeField } from '../components/TimeField'
import { Celebration, Intro, markSeen, resetSeen, wasSeen } from '../components/Moments'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { iso, type Chore } from '../chores'
import { byId, hourLabel, presence, roommates } from '../data'
import { useChores } from '../chores'
import { choresToEvents, dateKey, endOfYear, loadEvents, occursOn, repeatLabels, reservedRoom, ROOMS, saveEvents, timeLabel, type CalEvent, type Note, type Repeat, type Rsvp } from '../events'
import { isPostHogConfigured, posthog } from '../posthog'

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

function DayTimeline({ events, isToday, nowH, pending, onPick, onEdit, onMove }: { events: CalEvent[]; isToday: boolean; nowH: number; pending?: { start: number; end: number } | null; onPick: (h: number, end?: number) => void; onEdit: (e: CalEvent) => void; onMove: (e: CalEvent, start: number, end: number) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ id: string; start: number; end: number } | null>(null)
  const dragged = useRef(false)
  const lane = useRef<HTMLDivElement>(null)
  const [ghost, setGhost] = useState<{ start: number; end: number } | null>(null)

  // Press on an empty spot and drag up or down to draw a new block; letting go opens the "what is it?" choices.
  // Mouse: drag right away. Touch: press and hold a moment first, so scrolling still works.
  const beginCreate = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.vtl-ev')) return
    const el = lane.current
    if (!el) return
    const y0 = e.clientY
    const touch = e.pointerType !== 'mouse'
    const at = (y: number) => Math.min(END - 0.5, Math.max(START, Math.floor((START + (y - el.getBoundingClientRect().top) / HOUR_PX) * 2) / 2))
    const anchor = at(y0)
    let active = false
    let cur = { start: anchor, end: anchor + 0.5 }
    const calc = (y: number) => { const h = at(y); return h >= anchor ? { start: anchor, end: h + 0.5 } : { start: h, end: anchor + 0.5 } }
    const activate = () => { active = true; dragged.current = true; navigator.vibrate?.(8); setGhost(cur) }
    const timer = touch ? window.setTimeout(activate, 350) : undefined
    const stopScroll = (t: TouchEvent) => { if (active) t.preventDefault() }
    const move = (m: PointerEvent) => {
      if (!active) {
        if (Math.abs(m.clientY - y0) > 6) { if (!touch) activate(); else cleanup() } // finger moved first: that's a scroll
        if (!active) return
      }
      cur = calc(m.clientY)
      setGhost(cur)
    }
    const up = () => {
      const made = active
      const { start, end } = cur
      cleanup()
      if (made) onPick(start, end)
    }
    const cleanup = () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', cleanup)
      document.removeEventListener('touchmove', stopScroll)
      setGhost(null)
      window.setTimeout(() => { dragged.current = false }, 50)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', cleanup)
    document.addEventListener('touchmove', stopScroll, { passive: false })
  }

  // Drag an event to move it, or drag its bottom grip to stretch/shrink it. Snaps to 30 minutes.
  // Mouse: drag right away. Touch: press and hold a moment first, so scrolling still works.
  const beginDrag = (e: React.PointerEvent, ev: CalEvent, mode: 'move' | 'resize' | 'start') => {
    if (e.button !== 0) return
    if (mode !== 'move') e.stopPropagation()
    const y0 = e.clientY
    const touch = e.pointerType !== 'mouse'
    const len = ev.end - ev.start
    let active = false
    let cur = { start: ev.start, end: ev.end }
    const calc = (y: number) => {
      const dh = Math.round(((y - y0) / HOUR_PX) * 2) / 2
      if (mode === 'move') { const s = Math.min(END - len, Math.max(START, ev.start + dh)); return { start: s, end: s + len } }
      if (mode === 'start') return { start: Math.min(ev.end - 0.5, Math.max(START, ev.start + dh)), end: ev.end }
      return { start: ev.start, end: Math.min(END, Math.max(ev.start + 0.5, ev.end + dh)) }
    }
    const activate = () => { active = true; dragged.current = true; navigator.vibrate?.(8); setDrag({ id: ev.id, ...cur }) }
    const timer = touch && mode === 'move' ? window.setTimeout(activate, 320) : undefined
    if (mode !== 'move') activate()
    const stopScroll = (t: TouchEvent) => { if (active) t.preventDefault() }
    const move = (m: PointerEvent) => {
      if (!active) {
        if (Math.abs(m.clientY - y0) > 6) { if (!touch) activate(); else cleanup() } // finger moved first: that's a scroll
        return
      }
      cur = calc(m.clientY)
      setDrag({ id: ev.id, ...cur })
    }
    const up = () => {
      const changed = active && (cur.start !== ev.start || cur.end !== ev.end)
      cleanup()
      if (changed) onMove(ev, cur.start, cur.end)
    }
    const cleanup = () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', cleanup)
      document.removeEventListener('touchmove', stopScroll)
      setDrag(null)
      window.setTimeout(() => { dragged.current = false }, 50)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', cleanup)
    document.addEventListener('touchmove', stopScroll, { passive: false })
  }
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
          ref={lane}
          title="Tap, or press and drag, to add something"
          onPointerDown={beginCreate}
          onClick={(e) => {
            if (dragged.current) return
            const r = e.currentTarget.getBoundingClientRect()
            const h = START + (e.clientY - r.top) / HOUR_PX
            onPick(Math.min(END - 0.5, Math.max(START, Math.floor(h * 2) / 2)))
          }}
        >
          {(ghost ?? pending) && (() => {
            const g = (ghost ?? pending)!
            return (
              <div className={`vtl-ghost${ghost ? '' : ' set'}`} style={{ top: (g.start - START) * HOUR_PX, height: (g.end - g.start) * HOUR_PX - 3 }} aria-hidden>
                <b>New</b><small>{timeLabel(g.start)} – {timeLabel(g.end)}</small>
              </div>
            )
          })()}
          {showNow && <span className="vtl-now" style={{ top: (nowH - START) * HOUR_PX }} aria-hidden />}
          {laid.map(({ ev, col, cols }) => {
            const chore = ev.id.startsWith('chore-')
            const Icon = iconFor(ev)
            const slot = ev.id.startsWith('bath-') // 30-minute bathroom slots stay slim so neighbours don't overlap
            const movable = !slot && (!chore || ev.who.includes('you'))
            const stretch = movable && !chore
            const live = drag?.id === ev.id ? drag : null
            const evStart = live?.start ?? ev.start
            const evEnd = live?.end ?? ev.end
            const top = (Math.max(evStart, START) - START) * HOUR_PX
            const height = slot ? (Math.min(evEnd, END) - Math.max(evStart, START)) * HOUR_PX - 3 : Math.max(54, (Math.min(evEnd, END) - Math.max(evStart, START)) * HOUR_PX - 4)
            const names = ev.who.map((id) => (id === 'you' ? 'You' : byId(id).name)).join(', ')
            const title = ev.title.replace(EMOJI_LEAD, '')
            return (
              <button
                key={ev.id}
                type="button"
                className={`vtl-ev${chore ? ' is-chore' : ''}${cols > 1 ? ' narrow' : ''}${slot ? ' slot' : ''}${live ? ' dragging' : ''}${ev.proposal ? ' has-proposal' : ''}`}
                style={{ top, height, left: `${(col / cols) * 100}%`, width: `calc(${100 / cols}% - 6px)`, '--c': ev.color } as React.CSSProperties}
                aria-label={`Details for ${title}, ${timeLabel(ev.start)} to ${timeLabel(ev.end)}${stretch ? '. Press and drag to move, or drag the top or bottom edge to change its length' : movable ? '. Press and drag to move it' : ''}`}
                onPointerDown={movable ? (e) => beginDrag(e, ev, 'move') : undefined}
                onClick={(e) => { e.stopPropagation(); if (dragged.current) return; onEdit(ev) }}
              >
                <span className="vtl-ico" aria-hidden><Icon size={slot ? 16 : cols > 1 ? 18 : 22} /></span>
                <span className="vtl-txt">
                  <b>{slot ? `${title} · ${names}` : title}</b>
                  {!slot && <small>{live ? `${timeLabel(evStart)} – ${timeLabel(evEnd)}` : cols > 1 ? timeLabel(ev.start) : `${timeLabel(ev.start)} · ${names}${ev.repeat && ev.repeat !== 'none' ? ' · ↻' : ''}`}</small>}
                  {ev.proposal && !live && <small className="vtl-prop">⏳ Change requested</small>}
                  {ev.swap && !ev.proposal && !live && <small className="vtl-prop">🔑 Switch requested</small>}
                </span>
                {stretch && <span className="vtl-grip top" aria-hidden onPointerDown={(e) => beginDrag(e, ev, 'start')} />}
                {stretch && <span className="vtl-grip" aria-hidden onPointerDown={(e) => beginDrag(e, ev, 'resize')} />}
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

/** Another reservation of the same room that overlaps this time, if any. */
function roomClash(events: CalEvent[], day: string, room: string, start: number, end: number, ignoreId?: string) {
  return events.find((e) => e.id !== ignoreId && e.title === `${room} reserved` && occursOn(e, day) && start < e.end && e.start < end)
}

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

/* ───────── Event details (tap an event) ───────── */

function EventDetails({ ev, dayLabel, notes, chore, onNote, onSwap, onSwapAnswer, onEdit, onDelete, onRsvp, onProposal, onBath, onChores, onClose }: { ev: CalEvent; dayLabel: string; notes: Note[]; chore?: Chore; onNote: (text: string) => void; onSwap: (message: string | null) => void; onSwapAnswer: (a: 'accept' | 'decline') => void; onEdit: () => void; onDelete: () => void; onRsvp: (r: Rsvp) => void; onProposal: (a: 'approve' | 'decline' | 'cancel') => void; onBath: () => void; onChores: () => void; onClose: () => void }) {
  const kind = ev.id.startsWith('chore-') ? 'chore' : ev.id.startsWith('bath-') ? 'bath' : 'event'
  const creator = ev.by ?? ME
  const mine = kind === 'event' && creator === ME
  const invited = kind === 'event' && creator !== ME && ev.who.includes(ME)
  const reply = ev.rsvp?.[ME]
  const [draft, setDraft] = useState('')
  const [asking, setAsking] = useState(false)
  const [ask, setAsk] = useState('')
  const room = reservedRoom(ev)
  const nameOf = (id: string) => (id === ME ? 'You' : byId(id).name)
  const status = (id: string) => (id === creator ? 'Host' : ev.rsvp?.[id] === 'yes' ? 'Going' : ev.rsvp?.[id] === 'no' ? 'Declined' : 'Invited')
  const when = `${dayLabel} · ${timeLabel(ev.start)} – ${timeLabel(ev.end)}${ev.repeat && ev.repeat !== 'none' ? ` · ${repeatLabels[ev.repeat]}` : ''}`
  const prop = ev.proposal
  const post = () => { const t = draft.trim(); if (t) { onNote(t); setDraft('') } }
  return (
    <Sheet open title={kind === 'chore' ? 'Chore details' : kind === 'bath' ? 'Bathroom slot' : 'Event details'} icon={kind === 'chore' ? <ClipboardList aria-hidden /> : kind === 'bath' ? <ShowerHead aria-hidden /> : <CalendarDays aria-hidden />} tone="bg-purple" onClose={onClose}>
      <div className="ev-det">
        <h3 className="ev-det-title">{ev.title.replace(EMOJI_LEAD, '')}</h3>
        <div className="ev-det-row"><Clock size={20} aria-hidden /><span>{when}</span></div>
        {kind === 'event' && <div className="ev-det-row"><Pencil size={20} aria-hidden /><span>{mine ? 'Created by you' : `Created by ${byId(creator).name}`}</span></div>}
        {kind === 'bath' && <>
          <div className="ev-det-row"><ShowerHead size={20} aria-hidden /><span>Main bathroom</span></div>
          <div className="ev-det-person"><Avatar id={ev.who[0]} size={34} /><span className="grow"><b>{nameOf(ev.who[0])}</b></span><small className="ev-det-status host">Slot owner</small></div>
        </>}
        {kind === 'chore' && chore && <>
          <div className="ev-det-row"><Home size={20} aria-hidden /><span>{chore.room}</span></div>
          <div className="ev-det-person"><Avatar id={chore.who} size={34} /><span className="grow"><b>{nameOf(chore.who)}</b></span><small className={`ev-det-status ${chore.done ? 'going' : ''}`}>{chore.done ? 'Done' : 'To do'}</small></div>
        </>}
        {kind === 'event' && (
          <div className="ev-det-people">
            {[creator, ...ev.who.filter((w) => w !== creator)].map((id) => (
              <div className="ev-det-person" key={id}><Avatar id={id} size={34} /><span className="grow"><b>{nameOf(id)}</b></span><small className={`ev-det-status ${status(id).toLowerCase()}`}>{status(id)}</small></div>
            ))}
          </div>
        )}
      </div>

      {prop && (
        <div className="ev-prop">
          <b>{prop.by === ME ? 'You asked to change this' : `${byId(prop.by).name} asked to change this`}</b>
          <span>New time: {timeLabel(prop.start)} – {timeLabel(prop.end)} · not changed yet</span>
          {mine && prop.by !== ME && (
            <div className="ev-det-actions">
              <button type="button" className="btn ghost" onClick={() => onProposal('decline')}><X size={18} aria-hidden /> Decline</button>
              <button type="button" className="btn" onClick={() => onProposal('approve')}><Check size={18} aria-hidden /> Approve</button>
            </div>
          )}
          {prop.by === ME && <button type="button" className="btn sm ghost" onClick={() => onProposal('cancel')}>Cancel request</button>}
        </div>
      )}

      {room && creator === ME && ev.swap && ev.swap.by !== ME && (
        <div className="ev-prop">
          <b>{byId(ev.swap.by).name} asked to switch the {room.toLowerCase()}</b>
          <span>“{ev.swap.message}”</span>
          <div className="ev-det-actions">
            <button type="button" className="btn ghost" onClick={() => onSwapAnswer('decline')}><X size={18} aria-hidden /> Decline</button>
            <button type="button" className="btn" onClick={() => onSwapAnswer('accept')}><Check size={18} aria-hidden /> Accept</button>
          </div>
        </div>
      )}

      {room && creator !== ME && (
        <div className="ev-swap">
          {ev.swap?.by === ME ? (
            <>
              <b>Switch requested</b>
              <span>Waiting for {byId(creator).name} to answer.</span>
              <button type="button" className="btn sm ghost" onClick={() => onSwap(null)}>Cancel request</button>
            </>
          ) : asking ? (
            <form onSubmit={(e) => { e.preventDefault(); const t = ask.trim(); if (t) { onSwap(t); setAsking(false) } }}>
              <label htmlFor="swap-msg"><b>Message for {byId(creator).name}</b></label>
              <input id="swap-msg" className="input plain" value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={140} autoFocus />
              <div className="ev-det-actions">
                <button type="button" className="btn ghost" onClick={() => setAsking(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={!ask.trim()}>Send request</button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn ghost" onClick={() => { setAsk(`Hi! Could I use the ${room.toLowerCase()} at this time? Is it ok to switch?`); setAsking(true) }}>Request switch</button>
          )}
        </div>
      )}

      <div className="ev-notes">
        <h4>Notes</h4>
        {notes.length === 0 && <p className="muted ev-notes-empty">No notes yet.</p>}
        {notes.map((n, i) => (
          <div className="ev-note" key={i}><Avatar id={n.who} size={28} /><div><b>{nameOf(n.who)}</b><p>{n.text}</p></div></div>
        ))}
        <form className="ev-note-form" onSubmit={(e) => { e.preventDefault(); post() }}>
          <input className="input plain" placeholder="Leave a note for your roommates" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={140} aria-label="Add a note" />
          <button type="submit" className="btn sm" disabled={!draft.trim()}>Post</button>
        </form>
      </div>

      {invited && (
        <div className="ev-det-actions">
          <button type="button" className={`btn${reply === 'yes' ? '' : ' ghost'}`} onClick={() => onRsvp('yes')}><Check size={18} aria-hidden /> {reply === 'yes' ? 'You’re going' : 'Accept'}</button>
          <button type="button" className={`btn${reply === 'no' ? '' : ' ghost'}`} onClick={() => onRsvp('no')}><X size={18} aria-hidden /> {reply === 'no' ? 'You declined' : 'Decline'}</button>
        </div>
      )}
      {mine && (
        <div className="ev-det-actions">
          <button type="button" className="btn ghost danger-text" onClick={onDelete}><Trash2 size={18} aria-hidden /> Delete</button>
          <button type="button" className="btn" onClick={onEdit}><Pencil size={18} aria-hidden /> Edit</button>
        </div>
      )}
      {kind === 'bath' && ev.who[0] === ME && <div className="ev-det-actions"><button type="button" className="btn" onClick={onBath}><Clock size={18} aria-hidden /> Change my time</button></div>}
      {kind === 'chore' && <div className="ev-det-actions"><button type="button" className="btn" onClick={onChores}><ClipboardList size={18} aria-hidden /> Open in Chores</button></div>}
    </Sheet>
  )
}

function EventPopup({ dayLabel, start: initialStart, end: initialEnd, existing, preset, heading, events, day, room, onRoom, onSave, onDelete, onClose }: { dayLabel: string; start: number; end?: number; existing?: CalEvent; preset?: string; heading?: string; events: CalEvent[]; day: string; room?: string; onRoom?: (r: string) => void; onSave: (e: EventFields) => void; onDelete?: () => void; onClose: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? preset ?? '')
  const [start, setStart] = useState(existing?.start ?? initialStart)
  const [end, setEnd] = useState(existing?.end ?? initialEnd ?? Math.min(initialStart + 1, END))
  const [who, setWho] = useState<string[]>(existing?.who ?? ['you'])
  const [repeat, setRepeat] = useState<Repeat>(existing?.repeat ?? 'none')
  const [until, setUntil] = useState(existing?.until ?? endOfYear())
  const clean = title.trim()
  const clash = room ? roomClash(events, day, room, start, end, existing?.id) : undefined
  const freeRooms = clash ? ROOMS.filter((r) => r !== room && !roomClash(events, day, r, start, end, existing?.id)) : []
  const valid = clean.length > 0 && end > start && who.length > 0 && !clash
  // Switching rooms renames a default "<room> reserved" title along with it.
  const pickRoom = (r: string) => { if (room && title === `${room} reserved`) setTitle(`${r} reserved`); onRoom?.(r) }

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
            <TimeField id="ev-start" label="Start time" value={start} onChange={changeStart} />
          </div>
          <div className="field">
            <label htmlFor="ev-end">Ends</label>
            <TimeField id="ev-end" label="End time" value={end} onChange={(v) => setEnd(v === 0 ? END : v)} />
          </div>
        </div>
        {end <= start && <p className="time-hint" role="alert">The end needs to be after the start.</p>}
        {room && (
          <div className={`room-check${clash ? ' busy' : ''}`} role="status">
            {clash ? (
              <>
                <b>{room} is already reserved</b> from {timeLabel(clash.start)} to {timeLabel(clash.end)}{clash.by && clash.by !== ME ? ` by ${byId(clash.by).name}` : ''}.
                {freeRooms.length > 0
                  ? <span className="room-alt">Free at this time: {freeRooms.map((r) => onRoom ? <button type="button" key={r} className="chip purple" onClick={() => pickRoom(r)}>{r}</button> : <b key={r}>{r}</b>)}</span>
                  : <span className="room-alt">Nothing else is free then. Try another time.</span>}
              </>
            ) : (
              <><Check size={16} aria-hidden /> {room} is free at this time.</>
            )}
          </div>
        )}
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
                <TimeField floating id={`home-from-${i}`} label={`Home from, time ${i + 1}`} value={a} onChange={(v) => set(i, 0, v)} />
                <span className="muted" style={{ fontWeight: 800 }}>to</span>
                <TimeField floating id={`home-to-${i}`} label={`Home until, time ${i + 1}`} value={b} onChange={(v) => set(i, 1, v === 0 ? END : v)} />
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

const ME = 'you' // the logged-in roommate (you) in this prototype
const NOTES_KEY = 'harmony.notes'
const sampleNotes: Record<string, Note[]> = {
  s2: [{ who: 'mara', text: 'I’ll bring popcorn 🍿' }, { who: 'diego', text: 'Picking the movie. Vote in the group chat!' }],
  f1: [{ who: 'diego', text: 'Easy pace, I promise 😅 Meet at the door.' }, { who: 'you', text: 'I’m in! Bringing water.' }],
  f2: [{ who: 'mara', text: 'Making a big batch of soup. Leave me the stove please 🍲' }],
  f3: [{ who: 'you', text: 'Waiting on the delivery. Ring me if I’m in the shower.' }, { who: 'sofi', text: 'I’ll be around until noon too.' }],
  f4: [{ who: 'sofi', text: 'Ordering from the Thai place, tell me what you want!' }, { who: 'diego', text: 'Pad thai for me 🙌' }, { who: 'mara', text: 'Veggie curry please.' }],
  f6: [{ who: 'mara', text: 'List is in Groceries. I’ll drive.' }, { who: 'you', text: 'Adding oat milk and sponges.' }],
  f7: [{ who: 'you', text: 'Quick one: bills, the chore wheel and the rent plan.' }, { who: 'diego', text: 'I’ll bring the receipts.' }],
  'chore-6': [{ who: 'you', text: 'Bins go out before 9, the truck comes early.' }],
  'chore-7': [{ who: 'sofi', text: 'The big fern needs a little extra 🌿' }],
  'chore-8': [{ who: 'you', text: 'Using the shared machine, I’ll be done by 3.' }],
  'chore-9': [{ who: 'diego', text: 'Before the grocery haul arrives!' }],
  'bath-sofi': [{ who: 'sofi', text: 'I take about 20 min. Fan stays on, please don’t turn it off.' }],
  'bath-diego': [{ who: 'diego', text: 'Quick shower, out by 7:45.' }],
}
function loadNotes(): Record<string, Note[]> {
  try {
    const saved = sessionStorage.getItem(NOTES_KEY)
    if (saved) return JSON.parse(saved) as Record<string, Note[]>
  } catch { /* storage unavailable */ }
  return sampleNotes
}
const HOME_KEY = 'harmony.myHome'
const BATH_KEY = 'harmony.bathroom'
type BathSlot = { who: string; start: number; end?: number; repeat?: Repeat; until?: string } // 30 minutes unless an end time is set, every day unless set

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

function BathTimePopup({ current, currentEnd, currentRepeat, currentUntil, taken, onSave, onClose }: { current: number | null; currentEnd?: number; currentRepeat?: Repeat; currentUntil?: string; taken: BathSlot[]; onSave: (start: number, end: number, repeat: Repeat, until?: string) => void; onClose: () => void }) {
  const endOf = (s: BathSlot) => s.end ?? s.start + 0.5
  const clashing = (a: number, b: number) => taken.find((s) => a < endOf(s) && s.start < b)
  const firstFree = Array.from({ length: SPAN * 2 }, (_, i) => START + i / 2).find((t) => !clashing(t, t + 0.5)) ?? START
  const [start, setStart] = useState(current ?? firstFree)
  const [end, setEnd] = useState(current !== null ? currentEnd ?? current + 0.5 : firstFree + 0.5)
  const [repeat, setRepeat] = useState<Repeat>(currentRepeat ?? 'daily')
  const [until, setUntil] = useState(currentUntil ?? endOfYear())
  const clash = clashing(start, end)
  const valid = end > start && !clash
  const changeStart = (v: number) => { setEnd(Math.min(v + (end - start), END)); setStart(v) }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bath-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        onSubmit={(e) => { e.preventDefault(); if (valid) onSave(start, end, repeat, until) }}
      >
        <div>
          <h2 id="bath-title">{current === null ? 'Pick your bathroom time' : 'Change your bathroom time'}</h2>
          <div className="muted" style={{ fontWeight: 700, fontSize: 14 }}>Choose when you will use it. Times your roommates have can’t be picked.</div>
        </div>
        <div className="ev-times">
          <div className="field">
            <label htmlFor="bath-start">Starts</label>
            <TimeField id="bath-start" label="Start time" value={start} onChange={changeStart} />
          </div>
          <div className="field">
            <label htmlFor="bath-end">Ends</label>
            <TimeField id="bath-end" label="End time" value={end} onChange={(v) => setEnd(v === 0 ? END : v)} />
          </div>
        </div>
        {end <= start && <p className="time-hint" role="alert">The end needs to be after the start.</p>}
        <div className={`room-check${clash ? ' busy' : ''}`} role="status">
          {clash
            ? <><b>The bathroom is already taken</b> from {timeLabel(clash.start)} to {timeLabel(endOf(clash))} by {byId(clash.who).name}. Pick another time.</>
            : <><Check size={16} aria-hidden /> The bathroom is free at this time.</>}
        </div>
        <RepeatFields repeat={repeat} until={until} onRepeat={setRepeat} onUntil={setUntil} options={['daily', 'weekdays', 'weekends']} />
        <div className="modal-actions">
          <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn sm" disabled={!valid}>Save time</button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default function Calendar() {
  const now = useNow()
  const today = dateKey(now)
  const [params, setParams] = useSearchParams()
  const [day, setDay] = useState(today)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = this week, -1 = last week, 1 = next week…
  const [events, setEvents] = useState<CalEvent[]>(loadEvents)
  const [adding, setAdding] = useState<number | null>(null)
  const [editing, setEditing] = useState<CalEvent | null>(null)
  const [viewing, setViewing] = useState<CalEvent | null>(null)
  const [pendingMove, setPendingMove] = useState<{ ev: CalEvent; start: number; end: number } | null>(null)
  const [notes, setNotes] = useState<Record<string, Note[]>>(loadNotes)
  // First-time moments: a welcome the first time you open the calendar, and a cheer for your first reservation / event.
  const [intro, setIntro] = useState(() => (params.get('reset') === '1' ? (resetSeen(), true) : !wasSeen('calendar-intro')))
  const [cheer, setCheer] = useState<'reservation' | 'event' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const say = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 3200) }
  const firstWin = (kind: 'reservation' | 'event') => { if (!wasSeen(`first-${kind}`)) { markSeen(`first-${kind}`); setCheer(kind) } }
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [pendingStart, setPendingStart] = useState<number | null>(null) // time tapped on the day, kept while you choose what to add
  const [pendingEnd, setPendingEnd] = useState<number | null>(null) // set when you drew a block by dragging
  const askWhatToAdd = (h?: number, end?: number) => { setPendingStart(h ?? null); setPendingEnd(end ?? null); setMenu(true) }
  const startAt = () => pendingStart ?? nextHalfHour()
  const [reserving, setReserving] = useState(false)
  const [reserve, setReserve] = useState<string | null>(null)
  // The block you drew stays on the day while you choose what it is and fill it in.
  const drawing = pendingStart !== null && (menu || reserving || adding !== null) ? { start: pendingStart, end: pendingEnd ?? Math.min(END, pendingStart + 1) } : null
  useEffect(() => {
    if (!menu) return
    const t = window.setTimeout(() => {
      const g = document.querySelector('.vtl-ghost')
      if (!g) return
      const r = g.getBoundingClientRect()
      const stickyBottom = document.querySelector('.cal-sticky')?.getBoundingClientRect().bottom ?? 120
      // Keep the block just under the day strip, clear of the sheet that rises from the bottom.
      if (r.bottom > window.innerHeight * 0.45 || r.top < stickyBottom + 4) window.scrollBy({ top: r.top - stickyBottom - 16, behavior: 'smooth' })
    }, 60)
    return () => window.clearTimeout(t)
  }, [menu])
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
  const { chores, update: updateChore } = useChores()

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
  const bathEvents: CalEvent[] = bath.filter((s) => occursOn({ date: '2000-01-01', repeat: s.repeat ?? 'daily', until: s.until }, day)).map((s) => ({ id: `bath-${s.who}`, date: day, start: s.start, end: s.end ?? s.start + 0.5, title: 'Bathroom', who: [s.who], color: 'var(--blue-d)' }))
  const shown = [...dayEvents, ...choresToEvents(chores, day), ...bathEvents].sort((a, b) => a.start - b.start)
  const openEvent = (ev: CalEvent) => setViewing(ev)
  const addNote = (id: string, text: string) => {
    const next = { ...notes, [id]: [...(notes[id] ?? []), { who: ME, text }] }
    setNotes(next)
    try { sessionStorage.setItem(NOTES_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  // After a drag: your own events change right away (after you confirm); someone else's only get a request.
  const confirmMove = () => {
    if (!pendingMove) return
    const { ev, start, end } = pendingMove
    if (ev.id.startsWith('chore-')) {
      updateChore(Number(ev.id.slice(6)), { time: `${String(Math.floor(start)).padStart(2, '0')}:${start % 1 ? '30' : '00'}` })
      setPendingMove(null)
      return
    }
    const own = (ev.by ?? ME) === ME
    store(events.map((e) => (e.id === ev.id ? (own ? { ...e, start, end, proposal: undefined } : { ...e, proposal: { by: ME, start, end } }) : e)))
    setPendingMove(null)
  }
  const answerProposal = (a: 'approve' | 'decline' | 'cancel') => {
    if (!viewing?.proposal) return
    const { start, end } = viewing.proposal
    const next: CalEvent = a === 'approve' ? { ...viewing, start, end, proposal: undefined } : { ...viewing, proposal: undefined }
    store(events.map((e) => (e.id === viewing.id ? next : e)))
    setViewing(next)
  }
  const dayLabel = selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  // The yellow button starts a new event at the next half hour (or 6pm when viewing another day).
  const nextHalfHour = () => {
    if (!isToday) return 18
    const h = Math.ceil(nowH * 2) / 2
    return h >= START && h < END ? h : START
  }
  // Coming from a notification: jump to the event's day and open it.
  useEffect(() => {
    const id = params.get('event')
    if (!id) return
    const ev = events.find((e) => e.id === id)
    if (ev) {
      const [ey, em, ed] = ev.date.split('-').map(Number)
      const evDate = new Date(ey, em - 1, ed)
      const mondayOf = (x: Date) => addDays(new Date(x.getFullYear(), x.getMonth(), x.getDate()), -((x.getDay() + 6) % 7))
      setWeekOffset(Math.round((mondayOf(evDate).getTime() - mondayOf(now).getTime()) / (7 * 86400000)))
      setDay(ev.date)
      setViewing(ev)
    }
    const next = new URLSearchParams(params)
    next.delete('event')
    setParams(next, { replace: true })
  }, [params, setParams])
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
    if (isPostHogConfigured) posthog.capture('calendar_event_updated', { is_reservation: Boolean(reservedRoom(editing)), repeats: fields.repeat !== 'none' })
    store(events.map((e) => (e.id === editing.id ? { ...e, ...fields } : e)))
    setEditing(null)
  }
  const deleteEvent = () => {
    if (!editing) return
    if (isPostHogConfigured) posthog.capture('calendar_event_deleted', { is_reservation: Boolean(reservedRoom(editing)) })
    store(events.filter((e) => e.id !== editing.id))
    setEditing(null)
  }

  const addEvent = (e: EventFields) => {
    if (isPostHogConfigured) posthog.capture('calendar_event_created', { is_reservation: Boolean(reserve), invitee_count: e.who.length, repeats: e.repeat !== 'none' })
    const next = [...events, { ...e, id: `e${Date.now()}-${idSeq.current++}`, date: day, by: ME, color: reserve ? 'var(--blue-d)' : NEW_EVENT_COLOR }]
    setEvents(next)
    saveEvents(next)
    setAdding(null)
    setReserve(null)
    const firstTime = !wasSeen(`first-${reserve ? 'reservation' : 'event'}`)
    firstWin(reserve ? 'reservation' : 'event')
    if (reserve && !firstTime) say(`${reserve} reserved. Your roommates were notified.`)
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
      <div className="cal-sticky">
        <div className="cal-week">{dayStrip}</div>
      </div>
      <div className="section-head vtl-head"><h2>{dayLabel}</h2><Chip tone="purple">{shown.length} {shown.length === 1 ? 'plan' : 'plans'}</Chip></div>
      <DayTimeline events={shown} isToday={isToday} nowH={nowH} pending={drawing} onPick={askWhatToAdd} onEdit={openEvent} onMove={(ev, start, end) => setPendingMove({ ev, start, end })} />

      <Sheet open={menu} title="What do you want to add?" icon={<Plus aria-hidden />} tone="bg-purple" onClose={() => setMenu(false)}>
        {pendingStart !== null && <p className="muted add-when">{selected.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {timeLabel(pendingStart)}{pendingEnd !== null ? ` – ${timeLabel(pendingEnd)}` : ''}</p>}
        <div className="add-menu">
          <button type="button" className="add-opt" onClick={() => { setMenu(false); setAdding(startAt()) }}>
            <span className="add-ico" aria-hidden><CalendarDays size={22} /></span>
            <span className="grow"><b>Event</b><small>Dinner, guests, plans for everyone</small></span>
          </button>
          <button type="button" className="add-opt" onClick={() => { setMenu(false); setReserving(true) }}>
            <span className="add-ico" aria-hidden><KeyRound size={22} /></span>
            <span className="grow"><b>Reservation</b><small>Bathroom, kitchen, living room</small></span>
          </button>
          <button type="button" className="add-opt" onClick={() => { setMenu(false); navigate(`/app/chores?add=1&date=${day}&time=${String(Math.floor(startAt())).padStart(2, '0')}:${startAt() % 1 ? '30' : '00'}`) }}>
            <span className="add-ico" aria-hidden><ClipboardList size={22} /></span>
            <span className="grow"><b>Chore</b><small>Who does what, and when</small></span>
          </button>
        </div>
      </Sheet>
      <Sheet open={reserving} title="What do you want to reserve?" icon={<KeyRound aria-hidden />} tone="bg-purple" onClose={() => setReserving(false)}>
        <div className="add-menu">
          {[{ n: 'Bathroom', icon: ShowerHead, hint: myBath ? `Your time: ${timeLabel(myBath.start)} – ${timeLabel(myBath.end ?? myBath.start + 0.5)}` : 'Pick a start and end time' }, { n: 'Kitchen', icon: UtensilsCrossed, hint: 'Cooking or hosting' }, { n: 'Living room', icon: Sofa, hint: 'Friends over, study session' }].map(({ n, icon: Icon, hint }) => (
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
          currentEnd={myBath?.end}
          currentRepeat={myBath?.repeat}
          currentUntil={myBath?.until}
          taken={bath.filter((s) => s.who !== ME)}
          onSave={(start, end, repeat, until) => { saveBath([...bath.filter((s) => s.who !== ME), { who: ME, start, end, repeat, until }]); setEditingBath(false); if (!myBath) firstWin('reservation'); say('Bathroom time saved. Your roommates were notified.') }}
          onClose={() => setEditingBath(false)}
        />
      )}
      {adding !== null && <EventPopup dayLabel={dayLabel} start={adding} end={pendingEnd ?? undefined} events={events} day={day} room={reserve ?? undefined} onRoom={(r) => setReserve(r)} preset={reserve ? `${reserve} reserved` : undefined} heading={reserve ? `Reserve the ${reserve.toLowerCase()}` : undefined} onSave={addEvent} onClose={() => { setAdding(null); setReserve(null) }} />}
      {editingHome && <HomeTimesPopup key={day} dayLabel={dayLabel} initial={homeOf(ME)} onSave={saveHome} onClose={() => setEditingHome(false)} />}
      {viewing && (
        <EventDetails
          ev={viewing}
          dayLabel={dayLabel}
          notes={notes[viewing.id] ?? []}
          chore={viewing.id.startsWith('chore-') ? chores.find((c) => `chore-${c.id}` === viewing.id) : undefined}
          onNote={(t) => addNote(viewing.id, t)}
          onSwap={(msg) => { const next = { ...viewing, swap: msg ? { by: ME, message: msg } : undefined }; store(events.map((e) => (e.id === viewing.id ? next : e))); setViewing(next); if (msg) say(`Request sent to ${byId(viewing.by ?? ME).name}.`) }}
          onSwapAnswer={(a) => {
            const sw = viewing.swap
            if (!sw) return
            const next: CalEvent = a === 'accept' ? { ...viewing, by: sw.by, who: [sw.by], swap: undefined } : { ...viewing, swap: undefined }
            store(events.map((e) => (e.id === viewing.id ? next : e)))
            setViewing(next)
            say(a === 'accept' ? `${byId(sw.by).name} now has the ${(reservedRoom(viewing) ?? 'room').toLowerCase()}.` : `You said no to ${byId(sw.by).name}.`)
          }}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
          onDelete={() => { if (isPostHogConfigured) posthog.capture('calendar_event_deleted', { is_reservation: Boolean(reservedRoom(viewing)) }); store(events.filter((e) => e.id !== viewing.id)); setViewing(null) }}
          onRsvp={(r) => { if (isPostHogConfigured) posthog.capture('calendar_event_rsvp_updated', { response: r }); const next = { ...viewing, rsvp: { ...viewing.rsvp, [ME]: r } }; store(events.map((e) => (e.id === viewing.id ? next : e))); setViewing(next) }}
          onProposal={answerProposal}
          onBath={() => { setViewing(null); setEditingBath(true) }}
          onChores={() => navigate('/app/chores')}
        />
      )}
      {toast && <div className="toast-note" role="status">{toast}</div>}
      {intro && (
        <Intro button="Let’s go" onClose={() => { markSeen('calendar-intro'); setIntro(false); if (params.get('reset')) { const n = new URLSearchParams(params); n.delete('reset'); setParams(n, { replace: true }) } }}>
          Plan your events and reserve a spot in your apartment here!
        </Intro>
      )}
      {cheer && (
        <Celebration onClose={() => setCheer(null)}>
          {cheer === 'reservation' ? 'You made your first reservation! 🎉' : 'You scheduled your first event! 🎉'}
        </Celebration>
      )}
      {pendingMove && (() => {
        const { ev, start, end } = pendingMove
        const own = (ev.by ?? ME) === ME
        const title = ev.title.replace(EMOJI_LEAD, '')
        const rr = reservedRoom(ev)
        const clash = rr ? roomClash(events, day, rr, start, end, ev.id) : undefined
        return (
          <Sheet open title={ev.id.startsWith('chore-') ? 'Change this chore?' : own ? 'Change this event?' : 'Send a change request?'} icon={<Clock aria-hidden />} tone="bg-purple" onClose={() => setPendingMove(null)}>
            <p className="ev-confirm"><b>{title}</b><br />{timeLabel(ev.start)} – {timeLabel(ev.end)} → <b>{timeLabel(start)} – {timeLabel(end)}</b></p>
            {clash && <p className="room-check busy" role="alert"><b>{rr} is already reserved</b> from {timeLabel(clash.start)} to {timeLabel(clash.end)}. Pick another time.</p>}
            {!own && <p className="muted ev-confirm-note">This is {byId(ev.by ?? ME).name}’s event. It won’t change until they approve.</p>}
            <div className="ev-det-actions">
              <button type="button" className="btn ghost" onClick={() => setPendingMove(null)}>Keep as is</button>
              {!clash && <button type="button" className="btn" onClick={confirmMove}>{own ? 'Confirm' : 'Send request'}</button>}
            </div>
          </Sheet>
        )
      })()}
      {editing && !editing.id.startsWith('chore-') && <EventPopup key={editing.id} dayLabel={dayLabel} start={editing.start} existing={editing} events={events} day={day} room={reservedRoom(editing)} onSave={updateEvent} onDelete={deleteEvent} onClose={() => setEditing(null)} />}

    </>
  )
}

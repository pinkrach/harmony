import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock, Users } from 'lucide-react'
import ChoreWheelCard from '../components/ChoreWheel'
import EveryoneChores from '../components/EveryoneChores'
import { BellRing, CalendarDays, Check as CheckIcon, CheckCheck, ChevronDown, ClipboardPlus, Clock, CookingPot, Plus, Sofa, ShowerHead, Home as HomeIcon, type LucideIcon } from 'lucide-react'
import { Avatar, Check, Chip, PageHead, Segmented, Sheet } from '../components/ui'
import { Celebration, markSeen, wasSeen } from '../components/Moments'
import { TimeField } from '../components/TimeField'
import { byId, roommates } from '../data'
import { dayText, dueLabel, isLate, iso, rooms, timeText, useChores, type Chore, type Room } from '../chores'

const roomIcon: Record<Room, LucideIcon> = { Kitchen: CookingPot, 'Living room': Sofa, Bathroom: ShowerHead, Other: HomeIcon }
const roomEmoji: Record<Room, string> = { Kitchen: '🍽️', 'Living room': '🛋️', Bathroom: '🛁', Other: '🧹' }

const toHours = (t: string) => { const [h, m] = t.split(':').map(Number); return h + (m || 0) / 60 }
const toClock = (v: number) => { const total = Math.min(23 * 60 + 59, Math.round(v * 60)); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` }

function NewChore({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: Omit<Chore, 'id' | 'done'>) => void }) {
  const [t, setT] = useState('')
  const [picked, setPicked] = useState(iso(new Date()))
  const [time, setTime] = useState('')
  const [room, setRoom] = useState<Room>('Kitchen')
  const [vis, setVis] = useState<'public' | 'private'>('public')

  const date = new Date(`${picked || iso(new Date())}T00:00`)
  const summary = `${dayText(date)}${time ? ` · ${timeText(time)}` : ''}`
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!t.trim() || !picked) return
    onAdd({ t: t.trim(), emoji: roomEmoji[room], who: 'you', date: iso(date), time, room, vis })
    setT(''); setPicked(iso(new Date())); setTime(''); setRoom('Kitchen'); setVis('public')
  }
  return (
    <Sheet open={open} title="New chore" icon={<ClipboardPlus aria-hidden />} tone="bg-teal" onClose={onClose}>
      <form className="stack" style={{ gap: 18 }} onSubmit={submit}>
        <div className="field">
          <label htmlFor="chore-name">What needs doing?</label>
          <input id="chore-name" className="input plain" value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. Take out the recycling" maxLength={40} />
        </div>
        <div className="field">
          <span className="lbl">Which room?</span>
          <div className="pick-row">
            {rooms.map((r) => { const Icon = roomIcon[r]; return <button type="button" key={r} className="pick" aria-pressed={room === r} onClick={() => setRoom(r)}><Icon size={18} aria-hidden />{r}</button> })}
          </div>
        </div>
        <div className="field">
            <span className="lbl">Who can see it?</span>
            <div className="pick-row">
              <button type="button" className="pick" aria-pressed={vis === 'public'} onClick={() => setVis('public')}><Users size={18} aria-hidden />Everyone</button>
              <button type="button" className="pick" aria-pressed={vis === 'private'} onClick={() => setVis('private')}><Lock size={18} aria-hidden />Only me</button>
            </div>
            <p className="muted vis-hint">{vis === 'public' ? 'Your roommates can see it and send you a reminder if it is late.' : 'Only you will see this one.'}</p>
        </div>
        <div className="field">
          <span className="lbl">Pick a day and time</span>
          <div className="when-fields">
            <label className="when-field"><CalendarDays size={18} aria-hidden /><span className="sr-only">Pick a day</span>
              <input className="input plain" type="date" value={picked} min={iso(new Date())} onChange={(e) => setPicked(e.target.value)} />
            </label>
            {time ? (
              <div className="when-time">
                <Clock size={18} aria-hidden />
                <TimeField id="chore-time" label="Time" value={toHours(time)} onChange={(v) => setTime(toClock(v))} />
                <button type="button" className="link" onClick={() => setTime('')}>Clear</button>
              </div>
            ) : (
              <button type="button" className="pick" onClick={() => setTime('09:00')}><Clock size={18} aria-hidden />Add a time</button>
            )}
          </div>
          <p className="when-summary"><b>Due:</b> {picked ? summary : 'Choose a day'}{!time && <span className="muted"> · add a time if it matters</span>}</p>
        </div>
        <button className="btn block" type="submit" disabled={!t.trim() || !picked}><Plus size={20} aria-hidden /> Add chore</button>
      </form>
    </Sheet>
  )
}

export default function Chores() {
  const [params, setParams] = useSearchParams()
  const [sheet, setSheet] = useState(params.get('add') === '1')
  useEffect(() => {
    if (params.get('add') !== '1') return
    setSheet(true)
    const next = new URLSearchParams(params)
    next.delete('add')
    setParams(next, { replace: true })
  }, [params, setParams])
  const { chores, add, toggle, reminded, remind } = useChores()
  const [view, setView] = useState(0)
  const [closed, setClosed] = useState<Room[]>([])

  const [cheer, setCheer] = useState(false)
  const addChore = (c: Omit<Chore, 'id' | 'done'>) => {
    add(c)
    setSheet(false)
    if (!wasSeen('first-chore')) { markSeen('first-chore'); setCheer(true) }
  }
  // "Mine" is every chore you put on yourself, shared or private, so you can check them off. "Everyone" shows what the others have on the wheel.
  const shown = chores.filter((c) => c.who === 'you')
  const left = shown.filter((c) => !c.done)
  const done = shown.filter((c) => c.done)

  // Same tile as "Your day" on Home: avatar, who/when, and one control on the right.
  const row = (c: Chore) => {
    const late = isLate(c)
    const reminder = reminded.includes(c.id)
    const mine = c.who === 'you'
    return (
      <div key={c.id} className={`day-row chore${late ? ' is-late' : ''}${c.done ? ' is-done' : ''}`}>
        <Avatar id={c.who} size={40} />
        <div className="day-txt">
          <b>{c.t}</b>
          <small className={late && !reminder ? 'late' : ''}>{mine ? (c.vis === 'private' ? 'Only you · ' : 'Shared · ') : reminder ? `${byId(c.who).name} has been reminded · ` : `${byId(c.who).name} · `}{dueLabel(c)}</small>
        </div>
        {mine || c.done ? (
          <Check label={mine ? `Mark ${c.t} complete` : `${c.t}, done by ${byId(c.who).name}`} defaultOn={c.done} onToggle={() => toggle(c.id)} locked={!mine} />
        ) : reminder ? (
          <span className="remind-done"><CheckIcon size={14} strokeWidth={3} aria-hidden /> Reminded</span>
        ) : (
          <button type="button" className="remind-btn" onClick={() => remind(c.id)} aria-label={`Send ${byId(c.who).name} a reminder`}><BellRing size={14} aria-hidden /> Remind</button>
        )}
      </div>
    )
  }

  return (
    <>
      <PageHead title="Chores" sub={`${left.length} left · ${done.length} done today`} right={<div className="count" aria-label={`${done.length} of ${shown.length} chores done`}><CheckCheck size={20} aria-hidden /><b key={done.length} className="tick">{done.length}</b><span>/{shown.length}</span></div>} />
      <div className="chores-layout">
      <div className="chores-main">
      <ChoreWheelCard />
      <Segmented options={['Mine', 'Everyone']} initial={0} onChange={setView} />
      <div style={{ height: 16 }} />

      {view === 1 ? <EveryoneChores /> : (
      <div className="stack room-groups">
        {shown.length === 0 && <div className="more">No chores of your own yet. Tap New chore to add one.</div>}
        {rooms.map((r) => {
          const list = shown.filter((c) => c.room === r).sort((a, b) => Number(a.done) - Number(b.done))
          if (!list.length) return null
          const open = !closed.includes(r)
          const Icon = roomIcon[r]
          const todo = list.filter((c) => !c.done).length
          return (
            <section key={r} className="room-group">
              <button type="button" className="room-head" aria-expanded={open} onClick={() => setClosed((c) => (open ? [...c, r] : c.filter((x) => x !== r)))}>
                <span className="room-ico" aria-hidden><Icon size={20} /></span>
                <span className="grow"><b>{r}</b><small>{todo === 0 ? 'All done' : `${todo} to do`}</small></span>
                <ChevronDown size={20} className="room-chev" aria-hidden />
              </button>
              {open && <div className="stack day-list">{list.map(row)}</div>}
            </section>
          )
        })}
      </div>
      )}
      </div>
      </div>

      <button className="fab" aria-label="New chore" onClick={() => setSheet(true)}><Plus size={26} aria-hidden /><span className="fab-label">New chore</span></button>
      <NewChore open={sheet} onClose={() => setSheet(false)} onAdd={addChore} />
      {cheer && <Celebration onClose={() => setCheer(false)}>You added your first chore! 🎉</Celebration>}
    </>
  )
}

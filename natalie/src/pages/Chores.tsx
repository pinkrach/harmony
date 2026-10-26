import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BellRing, CalendarDays, Check as CheckIcon, CheckCheck, ChevronDown, ClipboardPlus, Clock, CookingPot, Plus, Sofa, ShowerHead, Home as HomeIcon, type LucideIcon } from 'lucide-react'
import { Avatar, Check, Chip, PageHead, Segmented, Sheet } from '../components/ui'
import { byId, roommates } from '../data'
import { addDays, dayText, dueLabel, isLate, iso, nextSaturday, rooms, timeText, useChores, type Chore, type Room } from '../chores'

const roomIcon: Record<Room, LucideIcon> = { Kitchen: CookingPot, 'Living room': Sofa, Bathroom: ShowerHead, Other: HomeIcon }
const emojis = ['🗑️', '🍽️', '🛁', '🧹', '🪴', '🧺', '🧽', '🐶']
const whens = ['Today', 'Tomorrow', 'Weekend', 'Pick date'] as const
type When = (typeof whens)[number]

const dateFor = (w: When, picked: string) => (w === 'Today' ? new Date() : w === 'Tomorrow' ? addDays(1) : w === 'Weekend' ? nextSaturday() : new Date(`${picked}T00:00`))

function NewChore({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: Omit<Chore, 'id' | 'done'>) => void }) {
  const [t, setT] = useState('')
  const [emoji, setEmoji] = useState(emojis[0])
  const [who, setWho] = useState('you')
  const [when, setWhen] = useState<When>('Today')
  const [picked, setPicked] = useState(iso(addDays(2)))
  const [time, setTime] = useState('')
  const [room, setRoom] = useState<Room>('Kitchen')

  const date = dateFor(when, picked)
  const summary = `${dayText(date)}${time ? ` · ${timeText(time)}` : ''}`
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!t.trim() || !picked) return
    onAdd({ t: t.trim(), emoji, who, date: iso(date), time, room })
    setT(''); setEmoji(emojis[0]); setWho('you'); setWhen('Today'); setTime(''); setRoom('Kitchen')
  }
  return (
    <Sheet open={open} title="New chore" icon={<ClipboardPlus aria-hidden />} tone="bg-teal" onClose={onClose}>
      <form className="stack" style={{ gap: 18 }} onSubmit={submit}>
        <div className="field">
          <label htmlFor="chore-name">What needs doing?</label>
          <input id="chore-name" className="input plain" value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. Take out the recycling" maxLength={40} />
        </div>
        <div className="field">
          <span className="lbl">Pick an icon</span>
          <div className="pick-row">
            {emojis.map((e) => <button type="button" key={e} className="pick emoji" aria-pressed={emoji === e} aria-label={`Icon ${e}`} onClick={() => setEmoji(e)}>{e}</button>)}
          </div>
        </div>
        <div className="field">
          <span className="lbl">Which room?</span>
          <div className="pick-row">
            {rooms.map((r) => { const Icon = roomIcon[r]; return <button type="button" key={r} className="pick" aria-pressed={room === r} onClick={() => setRoom(r)}><Icon size={18} aria-hidden />{r}</button> })}
          </div>
        </div>
        <div className="field">
          <span className="lbl">Who’s on it?</span>
          <div className="pick-row">
            {roommates.map((r) => <button type="button" key={r.id} className="pick" aria-pressed={who === r.id} onClick={() => setWho(r.id)}><Avatar id={r.id} size={26} />{r.id === 'you' ? 'Me' : r.name}</button>)}
          </div>
        </div>
        <div className="field">
          <span className="lbl">When?</span>
          <div className="pick-row">
            {whens.map((w) => <button type="button" key={w} className="pick" aria-pressed={when === w} onClick={() => setWhen(w)}>{w === 'Pick date' && <CalendarDays size={18} aria-hidden />}{w}</button>)}
          </div>
          <div className="when-fields">
            {when === 'Pick date' && (
              <label className="when-field"><CalendarDays size={18} aria-hidden /><span className="sr-only">Date</span>
                <input className="input plain" type="date" value={picked} min={iso(new Date())} onChange={(e) => setPicked(e.target.value)} />
              </label>
            )}
            <label className="when-field"><Clock size={18} aria-hidden /><span className="sr-only">Time (optional)</span>
              <input className="input plain" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              {time && <button type="button" className="link" onClick={() => setTime('')}>Clear</button>}
            </label>
          </div>
          <p className="when-summary"><b>Due:</b> {picked || when === 'Pick date' ? summary : 'Choose a date'}{!time && <span className="muted"> · add a time if it matters</span>}</p>
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

  const addChore = (c: Omit<Chore, 'id' | 'done'>) => {
    add(c)
    setSheet(false)
  }
  const shown = chores.filter((c) => view === 1 || c.who === 'you')
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
          <small className={late && !reminder ? 'late' : ''}>{mine ? 'Your turn' : reminder ? `${byId(c.who).name} has been reminded` : `${byId(c.who).name}’s turn`} · {dueLabel(c)}</small>
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
      <Segmented options={['Mine', 'Everyone']} initial={0} onChange={setView} />
      <div style={{ height: 16 }} />

      <div className="stack room-groups">
        {shown.length === 0 && <div className="more">No chores here yet.</div>}
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
      </div>
      </div>

      <button className="fab" aria-label="New chore" onClick={() => setSheet(true)}><Plus size={26} aria-hidden /><span className="fab-label">New chore</span></button>
      <NewChore open={sheet} onClose={() => setSheet(false)} onAdd={addChore} />
    </>
  )
}

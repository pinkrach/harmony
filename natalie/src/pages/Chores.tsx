import { useState } from 'react'
import { BellRing, CalendarDays, CheckCheck, ClipboardPlus, Clock, Plus } from 'lucide-react'
import { Avatar, Check, Chip, PageHead, Segmented, Sheet } from '../components/ui'
import RoomScene from '../components/RoomScene'
import { byId, roommates } from '../data'
import { addDays, dayText, dueLabel, isLate, iso, nextSaturday, timeText, useChores, type Chore } from '../chores'

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

  const date = dateFor(when, picked)
  const summary = `${dayText(date)}${time ? ` · ${timeText(time)}` : ''}`
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!t.trim() || !picked) return
    onAdd({ t: t.trim(), emoji, who, date: iso(date), time })
    setT(''); setEmoji(emojis[0]); setWho('you'); setWhen('Today'); setTime('')
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
  const [sheet, setSheet] = useState(false)
  const { chores, add, toggle } = useChores()
  const [view, setView] = useState(1)
  const [nudged, setNudged] = useState<number[]>([])

  const addChore = (c: Omit<Chore, 'id' | 'done'>) => {
    add(c)
    setSheet(false)
  }
  const shown = chores.filter((c) => view === 1 || c.who === 'you')
  const left = shown.filter((c) => !c.done)
  const done = shown.filter((c) => c.done)

  const row = (c: Chore, i: number) => (
    <div key={c.id} className={`card task pop${c.done ? ' done' : ''}${isLate(c) ? ' late' : ''}`} style={{ '--i': i, borderColor: isLate(c) ? 'var(--coral)' : undefined } as React.CSSProperties}>
      <Check label={`Mark ${c.t} complete`} defaultOn={c.done} onToggle={() => toggle(c.id)} />
      <div className="grow">
        <div className="tt"><span aria-hidden>{c.emoji}</span> {c.t}</div>
        <div className="who"><Avatar id={c.who} size={24} /><span>{c.who === 'you' ? 'You' : byId(c.who).name} · {dueLabel(c)}</span></div>
      </div>
      {c.done ? <Chip tone="teal">Done</Chip>
        : isLate(c) ? <button className="btn sm coral" onClick={() => setNudged((n) => [...n, c.id])} disabled={nudged.includes(c.id)}><BellRing size={16} aria-hidden /> {nudged.includes(c.id) ? 'Sent!' : 'Nudge'}</button>
        : c.date === iso(new Date()) ? <Chip tone="yellow">Due soon</Chip> : <Chip>Later</Chip>}
    </div>
  )

  return (
    <>
      <PageHead title="Chores" sub={`${left.length} left · ${done.length} done today`} right={<div className="count" aria-label={`${done.length} of ${shown.length} chores done`}><CheckCheck size={20} aria-hidden /><b>{done.length}</b><span>/{shown.length}</span></div>} />
      <RoomScene done={done.length} total={shown.length} />
      <Segmented options={['Mine', 'Everyone']} initial={1} onChange={setView} />
      <div style={{ height: 16 }} />

      <div className="stack">
        {left.map(row)}
        {left.length === 0 && <div className="more">🎉 Nothing left. Nice work!</div>}
        {done.length > 0 && <div className="section-head" style={{ margin: '8px 2px 0' }}><h2>Done today</h2></div>}
        {done.map((c, i) => row(c, i))}
      </div>

      <button className="fab" aria-label="New chore" onClick={() => setSheet(true)}><Plus size={26} aria-hidden /><span className="fab-label">New chore</span></button>
      <NewChore open={sheet} onClose={() => setSheet(false)} onAdd={addChore} />
    </>
  )
}

import { useState } from 'react'
import { BellRing, CheckCheck, Plus } from 'lucide-react'
import { Avatar, Check, Chip, PageHead, PipSays, Progress, Segmented } from '../components/ui'
import { byId } from '../data'

type Chore = { id: number; t: string; emoji: string; who: string; due: string; late?: boolean; chip?: ['' | 'yellow', string]; done: boolean }

const seed: Chore[] = [
  { id: 1, t: 'Take out the trash', emoji: '🗑️', who: 'you', due: 'Tonight', chip: ['yellow', 'Due soon'], done: false },
  { id: 2, t: 'Wash the dishes', emoji: '🍽️', who: 'diego', due: 'Yesterday', late: true, done: false },
  { id: 3, t: 'Clean the bathroom', emoji: '🛁', who: 'mara', due: 'Saturday', chip: ['', 'Later'], done: false },
  { id: 4, t: 'Vacuum the living room', emoji: '🧹', who: 'sofi', due: 'Today', done: true },
  { id: 5, t: 'Water the plants', emoji: '🪴', who: 'you', due: 'Today', done: true },
]

export default function Chores() {
  const [chores, setChores] = useState(seed)
  const [view, setView] = useState(1)
  const [nudged, setNudged] = useState<number[]>([])

  const toggle = (id: number) => setChores((l) => l.map((c) => (c.id === id ? { ...c, done: !c.done } : c)))
  const shown = chores.filter((c) => view === 1 || c.who === 'you')
  const left = shown.filter((c) => !c.done)
  const done = shown.filter((c) => c.done)
  const pct = shown.length ? Math.round((done.length / shown.length) * 100) : 0

  const row = (c: Chore, i: number) => (
    <div key={c.id} className={`card task pop${c.done ? ' done' : ''}${c.late && !c.done ? ' late' : ''}`} style={{ '--i': i, borderColor: c.late && !c.done ? 'var(--coral)' : undefined } as React.CSSProperties}>
      <Check label={`Mark ${c.t} complete`} defaultOn={c.done} onToggle={() => toggle(c.id)} />
      <div className="grow">
        <div className="tt"><span aria-hidden>{c.emoji}</span> {c.t}</div>
        <div className="who"><Avatar id={c.who} size={24} /><span>{c.who === 'you' ? 'You' : byId(c.who).name} · {c.due}</span></div>
      </div>
      {c.done ? <Chip tone="teal">Done</Chip>
        : c.late ? <button className="btn sm coral" onClick={() => setNudged((n) => [...n, c.id])} disabled={nudged.includes(c.id)}><BellRing size={16} aria-hidden /> {nudged.includes(c.id) ? 'Sent!' : 'Nudge'}</button>
        : c.chip && <Chip tone={c.chip[0]}>{c.chip[1]}</Chip>}
    </div>
  )

  return (
    <>
      <PageHead title="Chores" sub={`${left.length} left · ${done.length} done`} />
      <PipSays mood={left.length === 0 ? 'cheer' : 'happy'}>
        {left.length === 0 ? 'Everything’s done. Sparkling clean!' : `${left.length} left. Tap a circle when it’s done!`}
      </PipSays>
      <Segmented options={['Mine', 'Everyone']} initial={1} onChange={setView} />
      <div style={{ height: 16 }} />

      <div className="card chore-summary pop">
        <div className="top">
          <span className="bubble-ico bg-teal"><CheckCheck aria-hidden /></span>
          <div className="grow">
            <div className="card-title">Today’s progress</div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{done.length} of {shown.length} chores done</div>
          </div>
          <b className="pct">{pct}%</b>
        </div>
        <Progress value={pct} />
      </div>

      <div className="stack">
        {left.map(row)}
        {left.length === 0 && <div className="more">🎉 Nothing left. Nice work!</div>}
        {done.length > 0 && <div className="section-head" style={{ margin: '8px 2px 0' }}><h2>Done today</h2></div>}
        {done.map((c, i) => row(c, i))}
      </div>

      <button className="fab" aria-label="New chore"><Plus size={30} aria-hidden /><span className="fab-label">New chore</span></button>
    </>
  )
}

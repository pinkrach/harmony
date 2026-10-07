import { BellRing, Plus } from 'lucide-react'
import { Avatar, Check, Chip, PageHead, PipSays, Segmented } from '../components/ui'

const todo = [
  { t: 'Take out the trash', who: 'you', due: 'Tonight', chip: ['yellow', 'Due soon'] },
  { t: 'Wash the dishes', who: 'diego', due: 'Yesterday', overdue: true },
  { t: 'Clean the bathroom', who: 'mara', due: 'Saturday', chip: ['', 'Later'] },
] as const

export default function Chores() {
  return (
    <>
      <PageHead title="Chores" />
      <PipSays mood="cheer">3 left. Tap a circle when it’s done!</PipSays>
      <Segmented options={['Mine', 'Everyone']} initial={1} />
      <div style={{ height: 16 }} />

      <div className="stack">
        {todo.map((c, i) => (
          <div key={c.t} className="card task pop" style={{ '--i': i, borderColor: 'overdue' in c ? 'var(--coral)' : undefined } as React.CSSProperties}>
            <Check label={`Mark ${c.t} complete`} />
            <div className="grow">
              <div className="tt">{c.t}</div>
              <div className="row" style={{ marginTop: 4 }}><Avatar id={c.who} size={24} /><span className="muted" style={{ fontSize: 14, fontWeight: 700 }}>{c.due}</span></div>
            </div>
            {'overdue' in c ? <button className="btn sm coral"><BellRing size={16} aria-hidden /> Nudge</button> : <Chip tone={c.chip[0] as '' | 'yellow'}>{c.chip[1]}</Chip>}
          </div>
        ))}
        <div className="more">2 done today · nice work!</div>
      </div>

      <button className="fab" aria-label="New chore"><Plus size={30} aria-hidden /><span className="fab-label">New chore</span></button>
    </>
  )
}

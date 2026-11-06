import { useState } from 'react'
import { BellRing, Check as CheckIcon, Lock } from 'lucide-react'
import { Avatar } from './ui'
import { roommates } from '../data'
import { freqLabel, loadDone, loadWheel, ownerOf, periodLeft, stepNow } from '../rotation'
import { iso, useChores } from '../chores'

/** What everyone else has on the wheel this round, plus the chores they chose to share. A reminder shows up when the deadline is close. */
export default function EveryoneChores() {
  const n = roommates.length
  const wheel = loadWheel()
  const done = loadDone()
  const { chores } = useChores()
  const [reminded, setReminded] = useState<string[]>([])
  const freq = wheel.freq
  const base = stepNow(freq)
  const left = periodLeft(freq)
  const today = iso(new Date())
  const remind = (key: string, who: string, what: string) => reminded.includes(key)
    ? <span className="remind-done"><CheckIcon size={14} strokeWidth={3} aria-hidden /> Reminded</span>
    : <button type="button" className="remind-btn" onClick={() => setReminded([...reminded, key])} aria-label={`Remind ${who} about ${what}`}><BellRing size={14} aria-hidden /> Remind</button>

  return (
    <div className="eo-people">
      {roommates.map((r, j) => {
        const slices = wheel.packs.filter((_, k) => ownerOf(k, base, n) === j)
        const wheelChores = slices.flatMap((p) => p.chores)
        const shared = chores.filter((c) => c.who === r.id && c.vis !== 'private')
        const me = r.id === 'you'
        if (me && shared.length === 0) return null
        const pending = wheelChores.filter((c) => !done[`${freq}${base}:${c.id}`])
        return (
          <section className="eo-person" key={r.id}>
            <header>
              <Avatar id={r.id} size={38} />
              <div className="grow"><b>{me ? 'You' : r.name}</b>
                <small>{me ? 'Chores you chose to share' : wheelChores.length === 0 ? 'Nothing on the wheel' : pending.length === 0 ? 'All done this round' : `${freq === 'never' ? 'On the wheel' : freqLabel[freq]} · ${left.text}`}</small>
              </div>
            </header>
            {!me && wheelChores.map((c) => {
              const isDone = !!done[`${freq}${base}:${c.id}`]
              return <div className={`eo-task${isDone ? ' done' : ''}`} key={c.id}><span className="eo-dot" aria-hidden /><span className="eo-name">{c.emoji} {c.t}</span>{!isDone && left.soon && remind(`w-${r.id}-${c.id}`, r.name, c.t)}</div>
            })}
            {shared.map((c) => (
              <div className={`eo-task${c.done ? ' done' : ''}`} key={c.id}><span className="eo-dot" aria-hidden /><span className="eo-name">{c.emoji} {c.t}<small className="eo-own">Own chore</small></span>{!me && !c.done && c.date <= today && remind(`o-${c.id}`, r.name, c.t)}</div>
            ))}
          </section>
        )
      })}
      <p className="eo-note"><Lock size={14} aria-hidden /> Private chores stay private. You only see what is on the wheel and what people chose to share.</p>
    </div>
  )
}

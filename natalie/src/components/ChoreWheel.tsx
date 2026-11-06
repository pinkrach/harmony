import { useEffect, useMemo, useState } from 'react'
import { Check as CheckIcon, Maximize2, Plus, RotateCw, X } from 'lucide-react'
import { Avatar } from './ui'
import { Sheet } from './ui'
import { roommates } from '../data'
import { type Pack, castVote, freqLabel, freqNext, freqNow, freqs, loadDone, loadWheel, ownerOf, proposalText, saveDone, saveWheel, stepNow, stepRange, stepStart, type Freq, type WheelProposal, type WheelState } from '../rotation'

const C = 160
// Solid, saturated slice colors. Yours is always the brand purple.
const MINE = '#5f43a8'
const SLICE = ['#1b7d58', '#e0a800', '#e0566c', '#2c5a7d']
const HUB = '#2b2150'
export const sliceColor = (k: number, mine: boolean) => (mine ? MINE : SLICE[k % SLICE.length])
const pt = (r: number, a: number): [number, number] => { const t = (a * Math.PI) / 180; return [C + r * Math.sin(t), C - r * Math.cos(t)] }
function wedge(a: number, half: number, r1: number, r2: number) {
  const p1 = pt(r2, a - half), p2 = pt(r2, a + half), p3 = pt(r1, a + half), p4 = pt(r1, a - half)
  return `M${p1} A${r2} ${r2} 0 0 1 ${p2} L${p3} A${r1} ${r1} 0 0 0 ${p4} Z`
}

type WheelProps = { packs: Pack[]; step: number; freq: Freq; turn: number; half?: boolean; selected?: number | null; onPick?: (k: number) => void }

/** The wheel itself. `half` shows only its right side, with the slice that is yours turned to face you. */
function Wheel({ packs, step: turns, freq, turn, half = false, selected = null, onPick }: WheelProps) {
  const n = roommates.length
  const step = 360 / n
  return (
    <svg className={`cw-svg${half ? ' half' : ''}`} viewBox={half ? '186 10 134 300' : '0 0 320 320'} role="img" aria-label="Chore wheel. Each slice is a group of chores and the roommate who has it.">
      <g className="cw-spin" style={{ transform: `rotate(${turn}deg)` }}>
        {packs.map((p, k) => {
          const a = k * step
          const mine = ownerOf(k, turns, n) === 0
          const [ex, ey] = pt(130, a)
          const [cx, cy] = pt(100, a)
          const o = roommates[ownerOf(k, turns, n)]
          return (
            <g key={p.id} className={onPick ? 'cw-slice click' : 'cw-slice'} onClick={onPick ? () => onPick(k) : undefined}>
              <path d={wedge(a, step / 2, 82, 152)} fill={sliceColor(k, mine)} stroke={selected === k ? 'var(--ink)' : 'var(--card)'} strokeWidth={selected === k ? 4 : 3} />
              {p.chores.slice(0, 3).map((c, i, arr) => {
                const off = (i - (arr.length - 1) / 2) * 26
                const rad = (a * Math.PI) / 180
                const x = ex + off * Math.cos(rad)
                const y = ey + off * Math.sin(rad)
                return (
                  <g key={c.id} className="cw-lab" style={{ transform: `rotate(${-turn}deg)`, transformOrigin: `${x}px ${y}px` }}>
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="23">{c.emoji}</text>
                  </g>
                )
              })}
              <g className="cw-lab" style={{ transform: `rotate(${-turn}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
                <circle cx={cx} cy={cy} r={17} fill={o.color} stroke="#fff" strokeWidth={3} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="700" fill={o.ink}>{o.initials}</text>
              </g>
            </g>
          )
        })}
      </g>
      <circle cx={C} cy={C} r={74} fill={HUB} stroke="var(--card)" strokeWidth="3" />
      {!half && (
        <>
          <text x={C} y={C - 8} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fill="#cfc6ee">{freq === 'never' ? 'Forever' : freq === 'daily' ? 'Today' : 'Starts'}</text>
          <text x={C} y={C + 12} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="#fff">{stepStart(turns, freq)}</text>
        </>
      )}
    </svg>
  )
}

export default function ChoreWheelCard() {
  const n = roommates.length
  const turnStep = 360 / n
  const [wheel, setWheel] = useState<WheelState>(loadWheel)
  const { packs, freq, proposals } = wheel
  const [done, setDone] = useState<Record<string, boolean>>(loadDone)
  const [open, setOpen] = useState(false)
  const [ahead, setAhead] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState<string | null>(null)

  const base = stepNow(freq)
  const step = base + ahead
  const mineK = (st: number) => Math.max(0, packs.findIndex((_, k) => ownerOf(k, st, n) === 0))
  const aim = (st: number) => 90 - mineK(st) * turnStep // turns the slice that is yours to face the right
  const [turn, setTurn] = useState(() => aim(base))
  const spinTo = (st: number) => setTurn((t) => { const d = (((aim(st) - t) % 360) + 360) % 360; return d === 0 ? t : t + d })
  useEffect(() => { setAhead(0); spinTo(stepNow(freq)) }, [freq]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (a: number) => { setAhead(a); spinTo(base + a) }
  const close = () => { setOpen(false); setPicked(null); setNote(null); if (ahead !== 0) go(0) }
  const commit = (w: WheelState) => { setWheel(w); saveWheel(w) }
  const vote = (id: string, voter: string, v: 'yes' | 'no') => {
    const r = castVote(wheel, id, voter, v)
    commit(r.state)
    if (r.outcome === 'applied') setNote('Everyone agreed. The wheel was updated.')
    if (r.outcome === 'rejected') setNote('That change was declined, so nothing changed.')
  }
  const allAgree = (p: WheelProposal) => {
    let w = wheel
    for (const r of roommates) w = castVote(w, p.id, r.id, 'yes').state
    commit(w)
    setNote('Everyone agreed. The wheel was updated.')
  }
  const propose = (p: Omit<WheelProposal, 'id' | 'by' | 'votes'>) => {
    commit({ ...wheel, proposals: [...proposals, { ...p, id: `w${Date.now()}`, by: 'you', votes: { you: 'yes' } }] })
    setNote('Sent to your roommates. It changes once everyone agrees.')
  }

  const mineNow = useMemo(() => packs.map((p, k) => ({ p, k })).filter(({ k }) => ownerOf(k, base, n) === 0), [packs, base, n])
  const toggle = (key: string) => { const next = { ...done, [key]: !done[key] }; setDone(next); saveDone(next) }
  const addChore = (k: number) => {
    const t = draft.trim()
    if (!t) return
    propose({ kind: 'add', slice: k, chore: { id: `c${Date.now()}`, t, emoji: '🧼' } })
    setDraft('')
  }
  const sel = picked !== null ? packs[picked] : null
  const nowLabel = ahead === 0 ? freqNow[freq] : ahead === 1 ? `The ${freqNext[freq]}` : `In ${ahead} turns`

  return (
    <div className="cw-stick">
    <section className="cw" aria-label="Chore wheel">
      <button type="button" className="cw-half" onClick={() => setOpen(true)} aria-label="Open the chore wheel">
        <Wheel packs={packs} step={base} freq={freq} turn={turn} half />
        <span className="cw-hint" aria-hidden><Maximize2 size={14} /></span>
      </button>

      <div className="cw-check">
        <h2>{freqNow[freq]}</h2>
        {mineNow.length === 0 && <p className="cw-none">Nothing from the wheel for you right now.</p>}
        {mineNow.map(({ p }) => (
          <div className="cw-group" key={p.id}>
            {p.chores.map((c) => {
              const key = `${freq}${base}:${c.id}`
              const isDone = !!done[key]
              return (
                <button type="button" key={c.id} className={`cw-task${isDone ? ' done' : ''}`} role="checkbox" aria-checked={isDone} onClick={() => toggle(key)}>
                  <span className="cw-box" aria-hidden>{isDone && <CheckIcon size={14} strokeWidth={4} />}</span>
                  <span>{c.emoji} {c.t}</span>
                </button>
              )
            })}
          </div>
        ))}
        <small className="cw-freq">{freq === 'never' ? 'Stays with you' : `Rotates ${freqLabel[freq].toLowerCase()}`}</small>
      </div>

      <Sheet open={open} title="Chore wheel" icon={<RotateCw aria-hidden />} tone="bg-purple" onClose={close}>
        <p className="cw-sub">{nowLabel} · {stepRange(step, freq)}</p>
        <Wheel packs={packs} step={step} freq={freq} turn={turn} selected={picked} onPick={(k) => setPicked(picked === k ? null : k)} />
        {freq !== 'never' && (
          <div className="cw-buttons">
            <button type="button" className="btn sm ghost" onClick={() => go(0)} disabled={ahead === 0}>{freqNow[freq]}</button>
            <button type="button" className="btn sm" onClick={() => go(ahead + 1)}><RotateCw size={16} aria-hidden /> See {freqNext[freq]}</button>
          </div>
        )}

        <div className="cw-rhythm">
          <b>How often does the wheel turn?</b>
          <small>Changing it asks everyone to agree.</small>
          <div className="pick-row">
            {freqs.map((f) => <button type="button" key={f} className="pick" aria-pressed={freq === f} onClick={() => { if (f !== freq && !proposals.some((p) => p.kind === 'freq' && p.freq === f)) propose({ kind: 'freq', freq: f }) }}>{freqLabel[f]}</button>)}
          </div>
        </div>

        {note && <p className="cw-note" role="status">{note}</p>}
        {proposals.length > 0 && (
          <div className="cw-pending">
            <b>Waiting for everyone</b>
            {proposals.map((p) => {
              const waiting = roommates.filter((r) => p.votes[r.id] !== 'yes')
              const myTurn = p.votes.you !== 'yes' && p.by !== 'you'
              return (
                <div className="cw-prop" key={p.id}>
                  <p>{proposalText(p, packs)}</p>
                  <div className="cw-votes">
                    {roommates.map((r) => <span key={r.id} className={`cw-vote${p.votes[r.id] === 'yes' ? ' yes' : ''}`}><Avatar id={r.id} size={22} />{p.votes[r.id] === 'yes' ? 'Agreed' : 'Waiting'}</span>)}
                  </div>
                  {myTurn ? (
                    <div className="cw-vote-btns">
                      <button type="button" className="btn sm ghost" onClick={() => vote(p.id, 'you', 'no')}>Decline</button>
                      <button type="button" className="btn sm" onClick={() => vote(p.id, 'you', 'yes')}>Agree</button>
                    </div>
                  ) : (
                    <div className="cw-vote-btns">
                      <small>{waiting.length ? `Waiting for ${waiting.map((r) => (r.id === 'you' ? 'you' : r.name)).join(', ')}` : ''}</small>
                      {p.by === 'you' && <button type="button" className="btn sm ghost" onClick={() => allAgree(p)}>Demo: everyone agrees</button>}
                      {p.by === 'you' && <button type="button" className="btn sm ghost" onClick={() => vote(p.id, 'you', 'no')}>Cancel</button>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="cw-legend">
          {packs.map((p, k) => {
            const o = ownerOf(k, step, n)
            const mine = o === 0
            return (
              <button type="button" key={p.id} className={`cw-leg${picked === k ? ' on' : ''}`} onClick={() => setPicked(picked === k ? null : k)} aria-pressed={picked === k}>
                <span className="cw-dot" style={{ background: sliceColor(k, mine) }} aria-hidden />
                <span className="cw-leg-txt">
                  <b>{mine ? 'You' : roommates[o].name}</b>
                  <small>{p.chores.map((c) => `${c.emoji} ${c.t}`).join(' · ') || 'No chores yet'}</small>
                </span>
              </button>
            )
          })}
        </div>
        {sel && picked !== null ? (
          <div className="cw-edit">
            <div className="cw-edit-head">
              <b>{ownerOf(picked, step, n) === 0 ? 'Your slice' : `${roommates[ownerOf(picked, step, n)].name}’s slice`}</b>
              <small>Suggest adding or removing chores. Everyone has to agree.</small>
            </div>
            <div className="cw-chores">
              {sel.chores.map((c) => (
                <div className="cw-chore" key={c.id}><span>{c.emoji} {c.t}</span><button type="button" className="icon-btn" aria-label={`Suggest removing ${c.t}`} onClick={() => propose({ kind: 'remove', slice: picked, chore: c })}><X size={16} aria-hidden /></button></div>
              ))}
            </div>
            <form className="cw-add" onSubmit={(e) => { e.preventDefault(); addChore(picked) }}>
              <input className="input plain" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Suggest a chore for this slice" maxLength={40} aria-label="Add a chore to this slice" />
              <button type="submit" className="btn sm" disabled={!draft.trim()}><Plus size={16} aria-hidden /> Suggest</button>
            </form>
          </div>
        ) : (
          <p className="cw-tip">Tap a slice or a row to edit its chores.</p>
        )}
      </Sheet>
    </section>
    </div>
  )
}

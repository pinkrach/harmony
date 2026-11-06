import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check as Tick, ClipboardList, Clock, KeyRound, Wallet, X } from 'lucide-react'
import { Rail } from '../components/ui'
import { byId } from '../data'
import RoomScene from '../components/RoomScene'
import { dueLabel, useChores } from '../chores'
import { dateKey, loadEvents, reservedRoom, saveEvents, timeLabel, type CalEvent } from '../events'
import { share, usePayments, youOwe } from '../payments'
import { useHomeHealth } from '../health'

const ME = 'you'

// Pip is sassy but kind. One message stays up for a full minute, then he picks another.
const NAG = [
  'Go do your chores. The house is not going to clean itself.',
  'Chores first, scrolling later. I’m watching you.',
  'That trash is not going to take itself out, you know.',
  'I would do it myself, but I have no hands. Go on!',
  'A clean home is a happy home. Start with one chore.',
  'Psst… your to-do list misses you.',
  'Future you is begging you to do the dishes now.',
]
const PRAISE = [
  'All done! You are officially the favorite roommate.',
  'Spotless. I am so proud of you!',
  'Nothing left to do. Go treat yourself!',
]

type Item = { key: string; icon: ReactNode; title: string; sub: string; left?: string; mins: number; actions: ReactNode }

/** "45 min left" / "2 h left" when something is due within a few hours. */
function leftText(mins: number) {
  if (mins <= 0) return 'Overdue'
  if (mins > 180) return undefined
  return mins >= 60 ? `${Math.round(mins / 60)} h left` : `${mins} min left`
}

export default function Home() {
  const { bills } = usePayments()
  const { chores, toggle } = useChores()
  const health = useHomeHealth()
  const [events, setEvents] = useState<CalEvent[]>(loadEvents)
  const [now, setNow] = useState(() => new Date())
  // Reservations your roommates made stay here until you say you've seen them.
  const [seen, setSeen] = useState<string[]>(() => { try { return JSON.parse(sessionStorage.getItem('harmony.seenReservations') ?? '[]') as string[] } catch { return [] } })
  const markSeen = (id: string) => { const next = [...seen, id]; setSeen(next); try { sessionStorage.setItem('harmony.seenReservations', JSON.stringify(next)) } catch { /* storage unavailable */ } }
  const [taps, setTaps] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const today = dateKey(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const store = (next: CalEvent[]) => { setEvents(next); saveEvents(next) }
  const patch = (id: string, fields: Partial<CalEvent>) => store(events.map((e) => (e.id === id ? { ...e, ...fields } : e)))

  const mine = chores.filter((c) => c.who === ME)
  const doneCount = mine.filter((c) => c.done).length
  const pct = mine.length ? Math.round((doneCount / mine.length) * 100) : 100
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const allDone = mine.every((c) => c.done)
  const pool = allDone ? PRAISE : NAG
  const phrase = pool[(Math.floor(now.getTime() / 60000) + taps) % pool.length]

  const btn = (label: string, icon: ReactNode, onClick: () => void, ghost = false) => (
    <button type="button" className={`hm-btn${ghost ? ' ghost' : ''}`} onClick={onClick}>{icon}{label}</button>
  )

  const items: Item[] = []
  // Invitations from roommates.
  for (const e of events) {
    const by = e.by ?? ME
    if (by !== ME && e.who.includes(ME) && !e.rsvp?.[ME] && e.date >= today) {
      items.push({
        key: `inv-${e.id}`, icon: <CalendarDays size={20} />, mins: 9999,
        title: `${byId(by).name} invited you to ${e.title}`, sub: `${e.date === today ? 'Today' : e.date} · ${timeLabel(e.start)} – ${timeLabel(e.end)}`,
        actions: <>{btn('Decline', <X size={16} aria-hidden />, () => patch(e.id, { rsvp: { ...e.rsvp, [ME]: 'no' } }), true)}{btn('Accept', <Tick size={16} aria-hidden />, () => patch(e.id, { rsvp: { ...e.rsvp, [ME]: 'yes' } }))}</>,
      })
    }
    // A roommate reserved the kitchen or living room.
    const room = reservedRoom(e)
    if (room && by !== ME && e.date >= today && !seen.includes(e.id)) {
      items.push({
        key: `res-${e.id}`, icon: <KeyRound size={20} />, mins: 9998,
        title: `${byId(by).name} reserved the ${room.toLowerCase()}`, sub: `${e.date === today ? 'Today' : new Date(`${e.date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${timeLabel(e.start)} – ${timeLabel(e.end)}`,
        actions: btn('Got it', <Tick size={16} aria-hidden />, () => markSeen(e.id)),
      })
    }
    // A roommate asked to take over one of your reservations.
    if (room && by === ME && e.swap && e.swap.by !== ME) {
      const sw = e.swap
      items.push({
        key: `swap-${e.id}`, icon: <KeyRound size={20} />, mins: 9997,
        title: `${byId(sw.by).name} asked to switch the ${room.toLowerCase()}`, sub: `“${sw.message}”`,
        actions: <>{btn('Decline', <X size={16} aria-hidden />, () => patch(e.id, { swap: undefined }), true)}{btn('Accept', <Tick size={16} aria-hidden />, () => patch(e.id, { by: sw.by, who: [sw.by], swap: undefined }))}</>,
      })
    }
    // Someone asked to move one of your events.
    if (by === ME && e.proposal && e.proposal.by !== ME) {
      const p = e.proposal
      items.push({
        key: `prop-${e.id}`, icon: <Clock size={20} />, mins: 9999,
        title: `${byId(p.by).name} wants to move ${e.title}`, sub: `New time: ${timeLabel(p.start)} – ${timeLabel(p.end)}`,
        actions: <>{btn('Decline', <X size={16} aria-hidden />, () => patch(e.id, { proposal: undefined }), true)}{btn('Approve', <Tick size={16} aria-hidden />, () => patch(e.id, { start: p.start, end: p.end, proposal: undefined }))}</>,
      })
    }
  }
  // Your chores that are due.
  for (const c of mine) {
    if (c.done || c.date > today) continue
    const [hh, mm] = (c.time || '').split(':').map(Number)
    const mins = c.date < today ? -1 : c.time ? hh * 60 + (mm || 0) - nowMin : 24 * 60 - nowMin
    items.push({
      key: `chore-${c.id}`, icon: <ClipboardList size={20} />, mins,
      title: `Your turn: ${c.t}`, sub: dueLabel(c), left: leftText(mins),
      actions: btn('Done', <Tick size={16} aria-hidden />, () => toggle(c.id)),
    })
  }
  // Bills you still owe.
  for (const b of bills.filter(youOwe)) {
    const mins = b.date < today ? -1 : b.date === today ? 24 * 60 - nowMin : 9999
    items.push({
      key: `bill-${b.id}`, icon: <Wallet size={20} />, mins,
      title: `Pay ${b.t} · $${share(b).toFixed(2)}`, sub: `To ${byId(b.payer).name} · due ${b.date === today ? 'today' : new Date(`${b.date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`, left: leftText(mins),
      actions: <Link to="/app/payments" className="hm-btn">Pay</Link>,
    })
  }
  items.sort((a, b) => a.mins - b.mins)

  return (
    <div className="home-screen hm">
      <div className="hm-fixed">
        <header className="greet">
          <small>Casa Girasol</small>
          <h1>{greeting}, welcome!</h1>
        </header>

        <section className="health" data-zone={health.zone} aria-label="Your chores">
          <div className="health-scene">
            <div className="hsay">
              <span>{phrase}</span>
            </div>
            <button type="button" className="health-pip-btn" onClick={() => setTaps((n) => n + 1)} aria-label="Pip in your home. Tap to hear something new">
              <RoomScene bare done={doneCount} total={mine.length} />
            </button>
          </div>
          <div className="hprog hm-prog">
            <div className="hm-prog-main">
              <div className="hprog-top"><b>Your chores</b><span>{pct}%</span></div>
              <Rail className="hprog-rail" value={pct} label={`${doneCount} of ${mine.length} of your chores done`} />
              <small>{doneCount} of {mine.length} done</small>
            </div>
            <Link to="/app/chores" className="hm-go">Go to chores</Link>
          </div>
        </section>
      </div>

      <section className="hm-notes" aria-label="Notifications">
        <div className="section-head">
          <h2>Notifications</h2>
          {items.length > 0 && <span className="hm-count">{items.length}</span>}
        </div>
        <div className="hm-scroll">
          {items.length === 0 && <p className="hm-empty">You’re all caught up 🎉</p>}
          {items.map((it) => (
            <div className="hm-note" key={it.key}>
              <span className="hm-ico" aria-hidden>{it.icon}</span>
              <div className="hm-txt">
                <b>{it.title}</b>
                <small>{it.sub}{it.left && <> · <em>{it.left}</em></>}</small>
              </div>
              <div className="hm-acts">{it.actions}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

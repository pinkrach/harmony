import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Wallet } from 'lucide-react'
import { BellRing, Check as Tick } from 'lucide-react'
import { Avatar, Check, Rail } from '../components/ui'
import { byId } from '../data'
import RoomScene from '../components/RoomScene'
import { dueLabel, isLate, useChores } from '../chores'
import { dateKey, loadEvents, occursOn, timeLabel } from '../events'
import { share, usePayments, youOwe } from '../payments'
import { PHRASES, useHomeHealth } from '../health'

export default function Home() {
  const { bills } = usePayments()
  const { chores, toggle, reminded, remind } = useChores()
  const health = useHomeHealth()
  const [pick, setPick] = useState(0)
  const [talk, setTalk] = useState(true)
  const [tick, setTick] = useState(0)
  // Pip talks for 6s, goes quiet for 5s, then says something new. Tapping him makes him talk right away.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const hide = () => { setTalk(false); t = setTimeout(show, 5000) }
    const show = () => { setPick((n) => n + 1); setTalk(true); t = setTimeout(hide, 6000) }
    t = setTimeout(hide, 6000)
    return () => clearTimeout(t)
  }, [tick])

  const now = new Date()
  const today = dateKey(now)
  const events = loadEvents().filter((e) => occursOn(e, today)).sort((a, b) => a.start - b.start)
  const todo = chores.filter((c) => !c.done && c.date <= today)
  const bill = bills.find(youOwe)
  const doneCount = chores.filter((c) => c.done).length
  const pct = chores.length ? Math.round((doneCount / chores.length) * 100) : 100
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // What's actually wrong comes first (so no information is lost), then the jokes.
  const pool = [...(health.reason ? [`${health.reason} Just saying.`] : []), ...PHRASES[health.zone]]
  const phrase = pool[pick % pool.length]

  const choreRow = (c: (typeof todo)[number]) => (
    <div className={`day-row chore${isLate(c) ? ' is-late' : ''}`} key={`c${c.id}`}>
      <Avatar id={c.who} size={40} />
      <Link to="/app/chores" className="day-txt">
        <b>{c.t}</b>
        <small className={isLate(c) && !reminded.includes(c.id) ? 'late' : ''}>{c.who === 'you' ? 'Your turn' : reminded.includes(c.id) ? `${byId(c.who).name} has been reminded` : `${byId(c.who).name}’s turn`} · {dueLabel(c)}</small>
      </Link>
      {c.who === 'you' ? (
        <Check label={`Mark ${c.t} complete`} defaultOn={c.done} onToggle={() => toggle(c.id)} />
      ) : reminded.includes(c.id) ? (
        <span className="remind-done"><Tick size={14} strokeWidth={3} aria-hidden /> Reminded</span>
      ) : (
        <button type="button" className="remind-btn" onClick={() => remind(c.id)} aria-label={`Send ${byId(c.who).name} a reminder`}><BellRing size={14} aria-hidden /> Remind</button>
      )}
    </div>
  )
  const eventRow = (e: (typeof events)[number]) => (
    <Link key={e.id} to="/app/calendar" className="day-row event">
      <span className="day-ico" style={{ background: e.color }} aria-hidden><CalendarDays size={18} /></span>
      <span className="day-txt"><b>{e.title}</b><small>{timeLabel(e.start)} – {timeLabel(e.end)}</small></span>
      <span className="day-time">{timeLabel(e.start)}</span>
    </Link>
  )
  const billRow = bill && (
    <Link key="bill" to="/app/payments" className="day-row bill">
      <span className="day-ico bg-peach" aria-hidden><Wallet size={18} /></span>
      <span className="day-txt"><b>{bill.t} · ${share(bill).toFixed(2)}</b><small>Your share</small></span>
      <span className="day-pay">Pay</span>
    </Link>
  )
  // Four rows at most, so the day fits on one screen: what's yours first, then the bill, then plans.
  const rows = [...todo.slice(0, 2).map(choreRow), ...(billRow ? [billRow] : []), ...events.slice(0, 2).map(eventRow), ...todo.slice(2).map(choreRow)].slice(0, 4)

  return (
    <div className="home-screen">
      <header className="greet">
        <small>Casa Girasol</small>
        <h1>{greeting}, Natalie!</h1>
      </header>

      <div className="home-hero">
        <section className="health" data-zone={health.zone} aria-label="Household progress">
          <div className="health-scene">
            <div className={`hsay${talk ? '' : ' off'}`}>
              <span>{phrase}</span>
            </div>
            <button type="button" className="health-pip-btn" onClick={() => { setPick((n) => n + 1); setTalk(true); setTick((n) => n + 1) }} aria-label="Pip in your home. Tap to hear something new">
              <RoomScene bare done={doneCount} total={chores.length} />
            </button>
          </div>
          <div className="hprog">
            <div className="hprog-top"><b>Household progress</b><span>{pct}%</span></div>
            <Rail className="hprog-rail" value={pct} label={`${doneCount} of ${chores.length} chores done`} />
            <small>{doneCount} of {chores.length} shared tasks done</small>
          </div>
        </section>
      </div>

      <section className="yday" aria-label="Your day">
        <div className="section-head">
          <h2>Your day</h2>
          <p className="home-day">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="day-list">
          {rows.length === 0 && <p className="more">Nothing left today. Enjoy it! 🎉</p>}
          {rows}
        </div>
      </section>
    </div>
  )
}

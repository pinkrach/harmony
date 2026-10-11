import { Link } from 'react-router-dom'
import { CalendarPlus, Carrot, ClipboardPlus, Wallet } from 'lucide-react'
import { AvatarStack, Check, Chip } from '../components/ui'
import { Pip, type Mood } from '../components/Pip'
import { isLate, useChores, type Chore } from '../chores'
import { choresToEvents, dateKey, loadEvents, timeLabel } from '../events'
import { useGroceries } from '../groceries'
import { totals, usePayments } from '../payments'

const actions = [
  { to: '/app/calendar?add=1', label: 'Add event', icon: CalendarPlus, gold: true },
  { to: '/app/payments', label: 'You owe', icon: Wallet },
  { to: '/app/shopping?add=1', label: 'Add grocery', icon: Carrot },
  { to: '/app/chores?add=1', label: 'Log chore', icon: ClipboardPlus },
]

const houseMood = (done: number, total: number): Mood => {
  const p = total ? done / total : 1
  if (p < 0.25) return 'sad'
  if (p < 0.5) return 'meh'
  if (p < 1) return 'happy'
  return 'cheer'
}

function unhappyWhy(chores: Chore[]): string | null {
  const late = chores.filter(isLate)
  const left = chores.filter((c) => !c.done)
  if (late.length === 1) return `${late[0].t} is late.`
  if (late.length > 1) return `${late.length} chores are late.`
  if (left.length === 1) return `${left[0].t} still needs doing.`
  if (left.length > 1) return `${left.length} chores still need doing.`
  return null
}

export default function Home() {
  const { owe } = totals(usePayments().bills)
  const { items, toggle: toggleItem } = useGroceries()
  const { chores, toggle } = useChores()
  const now = new Date()
  const today = dateKey(now)
  const events = [...loadEvents().filter((e) => e.date === today), ...choresToEvents(chores, today)].sort((a, b) => a.start - b.start)
  const doneCount = chores.filter((c) => c.done).length
  const lateCount = chores.filter(isLate).length
  const mood: Mood = lateCount ? (lateCount > 1 ? 'sad' : 'meh') : houseMood(doneCount, chores.length)
  const note = mood === 'sad' || mood === 'meh' ? unhappyWhy(chores) : null
  const choreRows = [...chores.filter((c) => !c.done), ...chores.filter((c) => c.done)]

  return (
    <div className="home-screen">
      <div className="home-hero">
        <div className="home-pip">
          <Pip mood={mood} wave={mood === 'cheer'} />
          {note && <p className="house-note">{note}</p>}
        </div>
        <div className="home-actions">
          {actions.map(({ to, label, icon: Icon, gold }) => (
            <Link key={label} to={to} className={`home-action${gold ? ' gold' : ''}`}>
              <Icon size={18} aria-hidden />
              <span>{label}</span>
              {label === 'You owe' && <b>{owe > 0 ? `-$${owe.toFixed(2)}` : '$0.00'}</b>}
            </Link>
          ))}
        </div>
      </div>

      <section className="home-block" aria-label="Calendar">
        <div className="section-head">
          <div>
            <h2>Calendar</h2>
            <p className="home-day">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
          <Link to="/app/calendar" className="link">Open</Link>
        </div>
        {events.length === 0 ? (
          <p className="more">No events this day yet.</p>
        ) : (
          <div className="stack">
            {events.map((e, i) => {
              const t = timeLabel(e.start)
              const chore = e.id.startsWith('chore-')
              return (
                <Link key={e.id} to={chore ? '/app/chores' : '/app/calendar'} className="card event event-btn pop" style={{ '--i': i } as React.CSSProperties} aria-label={`${e.title}. Open ${chore ? 'Chores' : 'Calendar'}`}>
                  <span className="time">{t.slice(0, -2)}<small>{t.slice(-2)}</small></span>
                  <span className="bar" style={{ background: e.color }} />
                  <span className="grow">
                    <span className="ev-title">{e.title}</span>
                    <span className="muted ev-when">{timeLabel(e.start)} – {timeLabel(e.end)}</span>
                    <span className="ev-people"><AvatarStack ids={e.who} size={28} /></span>
                  </span>
                  {chore ? <Chip tone="teal">Chore</Chip> : <Chip tone="purple">Event</Chip>}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <div className="home-split">
        <section className="home-block" aria-label="Groceries">
          <div className="section-head">
            <h2>Groceries</h2>
            <Link to="/app/shopping" className="link">Open</Link>
          </div>
          <div className="mini-card">
            {items.length === 0 && <p className="muted home-empty">List is empty</p>}
            {items.map((it) => (
              <div className={`mini-row${it.bought ? ' done' : ''}`} key={it.id}>
                <Check label={`Mark ${it.n} purchased`} xp={5} defaultOn={it.bought} onToggle={() => toggleItem(it.id)} />
                <span>{it.n}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="home-block" aria-label="Chores">
          <div className="section-head">
            <h2>Chores</h2>
            <Link to="/app/chores" className="link">Open</Link>
          </div>
          <div className="mini-card">
            {choreRows.length === 0 && <p className="muted home-empty">All done</p>}
            {choreRows.map((c) => (
              <div className={`mini-row${c.done ? ' done' : ''}`} key={c.id}>
                <Check label={`Mark ${c.t} complete`} defaultOn={c.done} onToggle={() => toggle(c.id)} />
                <span><span aria-hidden>{c.emoji}</span> {c.t}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

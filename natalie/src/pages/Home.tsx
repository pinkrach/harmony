import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Wallet } from 'lucide-react'
import { Check } from '../components/ui'

const START = 15
const HOURS = 4
const NOW = 15.7

const events = [
  { title: 'Grocery run', time: '3–4pm', start: 15, end: 16, color: '#7c5cff' },
  { title: 'Bathroom · Natalie', time: '4:15–5pm', start: 16.25, end: 17, color: '#22c58b' },
  { title: 'House dinner', time: '5:30–6:30pm', start: 17.5, end: 18.5, color: '#5a3de0' },
]

const chores = [
  { t: 'Take out the trash', who: 'you', when: 'Tonight' },
]

const startingNotes = [
  { who: 'Sofi', text: 'checked off the kitchen as clean' },
  { who: 'Diego', text: 'bought oat milk' },
  { who: 'Mara', text: 'paid you back $12' },
]

const top = (h: number) => `${((h - START) / HOURS) * 100}%`
const height = (a: number, b: number) => `${((b - a) / HOURS) * 100}%`

export default function Home() {
  const [notes, setNotes] = useState(startingNotes)
  const dismiss = (text: string) => setNotes((list) => list.filter((note) => note.text !== text))

  return (
    <div className="home-screen">
      <div className="home-pair">
        <Link to="/app/payments" className="tile sky">
          <Wallet aria-hidden />
          <b>-$49.75</b>
          <span>Wallet · you owe</span>
        </Link>
        <Link to="/app/shopping" className="tile pink">
          <ShoppingCart aria-hidden />
          <b>5</b>
          <span>Shopping</span>
        </Link>
      </div>

      <section className="home-block" aria-label="Notifications">
        <div className="section-head">
          <h2>Notifications</h2>
          {notes.length > 0 && (
            <button type="button" className="btn sm" onClick={() => setNotes([])}>Clear all</button>
          )}
        </div>
        <div className="home-notes">
          {notes.map((note) => (
            <div className="card note pop" key={note.text}>
              <p className="grow"><b>{note.who}</b> {note.text}</p>
              <button type="button" className="note-x" aria-label={`Dismiss ${note.who}`} onClick={() => dismiss(note.text)}>×</button>
            </div>
          ))}
          {notes.length === 0 && <p className="muted home-empty">You’re caught up</p>}
        </div>
      </section>

      <section className="home-block" aria-label="Calendar">
        <div className="section-head">
          <h2>Calendar</h2>
          <Link to="/app/calendar" className="btn sm">Open</Link>
        </div>
      <Link to="/app/calendar" className="gcal" aria-label="Today’s calendar, next few hours">
        <div className="gcal-top">
          <span className="gcal-num">30</span>
          <span>Tuesday</span>
        </div>
        <div className="gcal-body">
          <div className="gcal-hours">
            {['3 PM', '4 PM', '5 PM', '6 PM'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="gcal-col">
            {['3 PM', '4 PM', '5 PM', '6 PM'].map((label, i) => (
              <i key={label} className="gcal-line" style={{ top: `${(i / HOURS) * 100}%` }} />
            ))}
            {events.map((event) => (
              <div
                key={event.title}
                className="gcal-event"
                style={{ top: top(event.start), height: height(event.start, event.end), background: event.color }}
              >
                <b>{event.title}</b>
                <span>{event.time}</span>
              </div>
            ))}
            <i className="gcal-now" style={{ top: top(NOW) }} />
          </div>
        </div>
      </Link>
      </section>

      <section className="home-block" aria-label="Chores">
        <div className="section-head">
          <h2>Chores</h2>
          <Link to="/app/chores" className="link">This week</Link>
        </div>
        <div className="stack">
          {chores.map((chore) => (
            <div className="card task pop" key={chore.t}>
              <Check label={`Mark ${chore.t} complete`} />
              <div className="tt grow">{chore.t}</div>
              <span className="muted">{chore.when}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

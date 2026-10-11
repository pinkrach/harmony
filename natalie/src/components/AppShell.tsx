import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, CalendarDays, Carrot, ClipboardList, Flame, Home, Wallet } from 'lucide-react'
import { Pip } from './Pip'
import { Avatar } from './ui'

const startingNotes = [
  { who: 'Sofi', text: 'checked off the kitchen as clean' },
  { who: 'Diego', text: 'bought oat milk' },
  { who: 'Mara', text: 'paid you back $12' },
]

function HomeBell() {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(startingNotes)
  const box = useRef<HTMLDivElement>(null)
  const dismiss = (text: string) => setNotes((list) => list.filter((note) => note.text !== text))

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="home-bell" ref={box}>
      <button
        type="button"
        className="icon-btn"
        aria-expanded={open}
        aria-controls="home-notes"
        aria-label={notes.length ? `Notifications, ${notes.length} new` : 'Notifications'}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={20} aria-hidden />
        {notes.length > 0 && <span className="badge" />}
      </button>
      {open && (
        <div className="card note-pop" id="home-notes" role="region" aria-label="Notifications">
          <div className="section-head">
            <h2>Notifications</h2>
            {notes.length > 0 && (
              <button type="button" className="btn sm ghost" onClick={() => setNotes([])}>Clear all</button>
            )}
          </div>
          <div className="home-notes">
            {notes.map((note) => (
              <div className="card note" key={note.text}>
                <p className="grow"><b>{note.who}</b> {note.text}</p>
                <button type="button" className="note-x" aria-label={`Dismiss ${note.who}`} onClick={() => dismiss(note.text)}>×</button>
              </div>
            ))}
            {notes.length === 0 && <p className="muted home-empty">You’re caught up</p>}
          </div>
        </div>
      )}
    </div>
  )
}

const tabs = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/chores', label: 'Chores', icon: ClipboardList },
  { to: '/app/payments', label: 'Bills', icon: Wallet },
  { to: '/app/shopping', label: 'Groceries', icon: Carrot },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
]

function Nav() {
  return (
    <>
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon size={24} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  )
}

export default function AppShell() {
  const { pathname } = useLocation()
  const home = pathname.startsWith('/app/home')
  return (
    <div className={home ? 'app app-home' : 'app'}>
      <aside className="sidebar" aria-label="Main">
        <div className="brand">
          <Pip size={40} />
          Harmony
        </div>
        <Nav />
        <div className="side-foot">
          {!home && (
            <div className="card tint-yellow flat row">
              <Flame color="#c25100" aria-hidden />
              <div>
                <b>5-day streak!</b>
                <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Household chores on time</div>
              </div>
            </div>
          )}
          {!home && (
            <Link to="/preferences" className="row card flat" style={{ padding: 10 }}>
              <Avatar id="you" size={40} />
              <div className="grow">
                <b>Natalie</b>
                <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Casa Girasol</div>
              </div>
            </Link>
          )}
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="brand">
            <Pip size={34} />
            Harmony
          </div>
          <span className="grow" />
          <HomeBell />
        </header>
        <main className="main" key={pathname}>
          <div className="page">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Main">
        <Nav />
      </nav>
    </div>
  )
}

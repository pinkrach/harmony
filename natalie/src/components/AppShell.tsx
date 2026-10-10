import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, CalendarDays, ClipboardList, Flame, Home, Refrigerator, Star, Wallet } from 'lucide-react'
import { Pip } from './Pip'
import { Avatar } from './ui'

const tabs = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/chores', label: 'Chores', icon: ClipboardList },
  { to: '/app/payments', label: 'Pay', icon: Wallet },
  { to: '/app/shopping', label: 'Groceries', icon: Refrigerator },
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

      <div>
        <header className="topbar">
          {home ? (
            <>
              <div className="brand">
                <Pip size={34} />
                Harmony
              </div>
              <span className="grow" />
              <p className="house-name">Natalie</p>
            </>
          ) : (
            <>
              <div className="brand">
                <Pip size={34} />
                Harmony
              </div>
              <span className="grow" />
              <span className="pill-stat flame"><Flame size={18} aria-hidden />5</span>
              <span className="pill-stat star"><Star size={18} aria-hidden fill="currentColor" />240</span>
              <button className="icon-btn" aria-label="Notifications, 3 new"><Bell size={22} aria-hidden /><span className="badge" /></button>
            </>
          )}
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

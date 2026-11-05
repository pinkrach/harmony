import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Carrot, ClipboardList, Flame, Home, Wallet } from 'lucide-react'
import { Pip } from './Pip'
import { Avatar } from './ui'

/** One accent color across the app (Harmony lavender). */
const tabs = [
  { to: '/app/home', label: 'Home', icon: Home, tone: 'brand' },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays, tone: 'brand' },
  { to: '/app/chores', label: 'Chores', icon: ClipboardList, tone: 'brand' },
  { to: '/app/payments', label: 'Bills', icon: Wallet, tone: 'brand' },
  { to: '/app/shopping', label: 'Groceries', icon: Carrot, tone: 'brand' },
]

function Nav() {
  const navigate = useNavigate()
  /** Page exit: the old page fades out quickly (View Transitions), then the new page rises in. Falls back to a plain navigation. */
  const go = (to: string) => (e: React.MouseEvent) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (!doc.startViewTransition || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    e.preventDefault()
    doc.startViewTransition(() => { flushSync(() => navigate(to)) })
  }
  return (
    <>
      {tabs.map(({ to, label, icon: Icon, tone }) => (
        <NavLink key={to} to={to} onClick={go(to)} className={({ isActive }) => `nav-item tone-${tone}${isActive ? ' active' : ''}`}>
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
  const tone = tabs.find((t) => pathname.startsWith(t.to))?.tone ?? 'brand'
  return (
    <div className={home ? 'app app-home' : 'app'} data-tone={tone}>
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

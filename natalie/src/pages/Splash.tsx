import { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Pip } from '../components/Pip'

/** The door opens, then Pip carries into the login and sign up screen. */
export default function Splash() {
  const nav = useNavigate()
  const gone = useRef(false)

  const leave = () => {
    if (gone.current) return
    gone.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
    if (reduced || !doc.startViewTransition) {
      nav('/login')
      return
    }
    doc.startViewTransition(() => {
      flushSync(() => nav('/login'))
    })
  }

  useEffect(() => {
    const t = setTimeout(leave, 2800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="splash" onClick={leave}>
      <div className="confetti-bg" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, background: ['#ffd23f', '#ff5c7a', '#22c58b', '#3bb2ff', '#fff'][i % 5], animationDuration: `${4 + (i % 5)}s`, animationDelay: `${(i % 7) * 0.5}s` }} />)}</div>
      <div className="doorway" aria-hidden>
        <div className="glow">
          <Pip size={130} mood="cheer" wave />
        </div>
        <div className="door"><span className="knob" /></div>
      </div>
      <h1>Harmony</h1>
      <p className="tag">Opening the door to your home…</p>
      <div className="dots" aria-hidden><i /><i /><i /></div>
      <span className="skip">Tap to skip</span>
    </div>
  )
}

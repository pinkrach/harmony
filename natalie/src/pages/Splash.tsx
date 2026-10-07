import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pip } from '../components/Pip'

/** The door opens, Pip jumps out, then we land on the login. */
export default function Splash() {
  const nav = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => nav('/login'), 3600)
    return () => clearTimeout(t)
  }, [nav])

  return (
    <div className="splash" onClick={() => nav('/login')}>
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

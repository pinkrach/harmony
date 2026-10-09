import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Monitor, Smartphone } from 'lucide-react'

/**
 * Desktop-only helper: shows the app inside a phone frame.
 * The app runs in an iframe so its media queries react to the phone width.
 */
export default function PhoneMode({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [on, setOn] = useState(() => new URLSearchParams(window.location.search).get('phone') === '1')
  const [start, setStart] = useState(pathname)
  const embedded = window.self !== window.top
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(max-width: 699px)').matches
  if (embedded || standalone) return <>{children}</>

  const toggle = () => {
    setStart(pathname)
    setOn(!on)
  }

  return (
    <>
      {on ? (
        <div className="phone-stage">
          <div className="phone">
            <span className="phone-notch" aria-hidden />
            <iframe title="Harmony in phone view" src={start} />
          </div>
        </div>
      ) : (
        children
      )}
      <button className="btn sm yellow phone-toggle" onClick={toggle} aria-pressed={on}>
        {on ? <Monitor size={16} aria-hidden /> : <Smartphone size={16} aria-hidden />}
        {on ? 'Web view' : 'Phone view'}
      </button>
    </>
  )
}

import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Pip } from './Pip'

/* First-time moments. "Seen" is remembered in this browser (localStorage), so each person
   testing on their own computer or phone gets the welcome once, and each first win once.
   Add ?reset=1 to the Calendar address to see them all again. */

const PREFIX = 'harmony.seen.'
export const wasSeen = (key: string) => { try { return localStorage.getItem(PREFIX + key) === '1' } catch { return false } }
export const markSeen = (key: string) => { try { localStorage.setItem(PREFIX + key, '1') } catch { /* storage unavailable */ } }
export const resetSeen = () => { try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)) } catch { /* storage unavailable */ } }

/** Pip walks in and says a few words the first time you open a screen. */
export function Intro({ children, button = 'Got it', onClose }: { children: React.ReactNode; button?: string; onClose: () => void }) {
  return createPortal(
    <div className="moment-backdrop" role="presentation">
      <div className="moment" role="dialog" aria-modal="true" aria-label="Welcome">
        <p className="moment-bubble">{children}</p>
        <Pip size={150} walk />
        <button type="button" className="btn" onClick={onClose} autoFocus>{button}</button>
      </div>
    </div>,
    document.body,
  )
}

const COLORS = ['var(--brand)', 'var(--yellow)', 'var(--mint)', 'var(--coral)', 'var(--blue)', 'var(--peach)']

/** Pip celebrates with confetti the first time you do something. */
export function Celebration({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const pieces = useMemo(() => Array.from({ length: 44 }, (_, i) => ({
    left: `${(i * 97) % 100}%`, delay: `${((i * 53) % 90) / 100}s`, dur: `${2.2 + ((i * 37) % 14) / 10}s`,
    size: 8 + ((i * 11) % 8), rot: (i * 47) % 360, color: COLORS[i % COLORS.length], round: i % 3 === 0,
  })), [])
  return createPortal(
    <div className="moment-backdrop" role="presentation">
      <div className="confetti" aria-hidden>
        {pieces.map((p, i) => (
          <i key={i} style={{ left: p.left, width: p.size, height: p.round ? p.size : p.size * 1.6, background: p.color, borderRadius: p.round ? '50%' : 3, animationDelay: p.delay, animationDuration: p.dur, transform: `rotate(${p.rot}deg)` }} />
        ))}
      </div>
      <div className="moment" role="dialog" aria-modal="true" aria-label="Congratulations">
        <p className="moment-bubble">{children}</p>
        <Pip size={150} mood="cheer" poke={1} />
        <button type="button" className="btn" onClick={onClose} autoFocus>Yay!</button>
      </div>
    </div>,
    document.body,
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check as CheckIcon, X } from 'lucide-react'
import { byId } from '../data'
import { Pip } from './Pip'

export function Avatar({ id, size = 40, home, ring }: { id: string; size?: number; home?: boolean; ring?: boolean }) {
  const r = byId(id)
  return (
    <span className={`avatar${ring ? ' ring' : ''}`} style={{ ['--s' as string]: `${size}px`, background: r.color, color: r.ink }} title={r.name}>
      {r.initials}
      {home !== undefined && <i className={`dot${home ? '' : ' off'}`} aria-label={home ? 'At home' : 'Away'} />}
    </span>
  )
}

export function AvatarStack({ ids, size = 30 }: { ids: string[]; size?: number }) {
  return (
    <span className="stack-av">
      {ids.map((id) => (
        <Avatar key={id} id={id} size={size} />
      ))}
    </span>
  )
}

export function Chip({ tone = '', children }: { tone?: '' | 'teal' | 'coral' | 'yellow' | 'purple' | 'blue'; children: ReactNode }) {
  return <span className={`chip ${tone}`}>{children}</span>
}

export function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => setOn(!on)} />
}

const confettiColors = ['#ffd23f', '#ff5c7a', '#7c5cff', '#22c58b', '#3bb2ff']

export function Check({ label, defaultOn = false, xp = 10, onToggle }: { label: string; defaultOn?: boolean; xp?: number; onToggle?: () => void }) {
  const [on, setOn] = useState(defaultOn)
  const [burst, setBurst] = useState(0)
  const click = () => {
    if (!on) {
      setBurst(Date.now())
      setTimeout(() => setBurst(0), 1000)
    }
    setOn(!on)
    onToggle?.()
  }
  return (
    <span className="check-wrap">
      <button type="button" role="checkbox" aria-checked={on} aria-label={label} className="check" onClick={click}>
        <CheckIcon size={18} strokeWidth={4} aria-hidden />
      </button>
      {burst > 0 && (
        <span className="burst" aria-hidden key={burst}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2
            const d = 34 + (i % 3) * 12
            return <i key={i} style={{ background: confettiColors[i % 5], ['--dx' as string]: `${Math.cos(a) * d}px`, ['--dy' as string]: `${Math.sin(a) * d}px`, ['--rot' as string]: `${i * 70}deg` }} />
          })}
          <b>+{xp} XP</b>
        </span>
      )}
    </span>
  )
}

export function PipSays({ children, mood = 'happy' }: { children: ReactNode; mood?: 'happy' | 'wow' | 'cheer' }) {
  return (
    <div className="says">
      <Pip size={72} mood={mood} wave />
      <div className="bubble">{children}</div>
    </div>
  )
}

export function Segmented({ options, initial = 0, onChange }: { options: string[]; initial?: number; onChange?: (i: number) => void }) {
  const [i, setI] = useState(initial)
  return (
    <div className="segmented" role="tablist">
      {options.map((o, idx) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={i === idx}
          onClick={() => {
            setI(idx)
            onChange?.(idx)
          }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function Progress({ value, tone = '' }: { value: number; tone?: '' | 'yellow' | 'purple' }) {
  return (
    <div className={`progress ${tone}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  )
}

/** Bottom sheet for "add something" flows. Same shell on every tab; `tone` + `icon` tell the tabs apart. */
export function Sheet({ open, title, icon, tone = 'bg-teal', onClose, children }: { open: boolean; title: string; icon: ReactNode; tone?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('input, button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <span className="sheet-grip" aria-hidden />
        <div className="sheet-head">
          <span className={`bubble-ico ${tone}`}>{icon}</span>
          <h2 className="grow">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={22} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

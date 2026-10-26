import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check as CheckIcon, X } from 'lucide-react'
import { byId } from '../data'
import { Pip } from './Pip'
import { celebrate } from '../celebrate'

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


export function Check({ label, defaultOn = false, xp = 10, onToggle, locked = false }: { label: string; defaultOn?: boolean; xp?: number; onToggle?: () => void; locked?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  const click = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!on) celebrate(e.currentTarget, xp) // drawn outside this row, so it plays even if the row moves lists
    setOn(!on)
    onToggle?.()
  }
  return (
    <span className="check-wrap">
      <button type="button" role="checkbox" aria-checked={on} aria-label={label} className={`check${locked ? ' locked' : ''}`} disabled={locked} onClick={click}>
        <CheckIcon size={18} strokeWidth={4} aria-hidden />
      </button>
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
      <div className={`sheet t-${tone.replace('bg-', '')}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
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

/** Thin progress rail. Starts empty and eases to `value` (0–100). Clip-path only, so it never triggers layout. */
export function Rail({ value, tone = 'mint', label, className = '' }: { value: number; tone?: 'mint' | 'brand' | 'yellow'; label: string; className?: string }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, value))))
    return () => cancelAnimationFrame(id)
  }, [value])
  return (
    <div className={`rail ${tone} ${className}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ clipPath: `inset(0 ${100 - shown}% 0 0 round 999px)` }} />
    </div>
  )
}

/** Number that counts up (or down) to `value` in ~600ms. Respects reduced motion. */
export function CountUp({ value, format = (n: number) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { from.current = value; setN(value); return }
    const start = performance.now(); const a = from.current; let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 600)
      const eased = 1 - Math.pow(1 - k, 3)
      const v = a + (value - a) * eased
      from.current = v; setN(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span aria-label={format(value)}>{format(n)}</span>
}

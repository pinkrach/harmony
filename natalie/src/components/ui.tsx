import { useState, type ReactNode } from 'react'
import { Check as CheckIcon } from 'lucide-react'
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

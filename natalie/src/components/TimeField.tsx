import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* A friendly time picker: type a time ("7", "7:30pm", "19:30") or spin the wheels (hour, minutes, AM/PM).
   `value` is hours since midnight (7.5 = 7:30am, 24 = midnight at the end of the day). */

const ROW = 38
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const parts = (v: number) => {
  const total = Math.round(v * 60)
  const hh = Math.floor(total / 60) % 24
  return { h: hh % 12 || 12, m: total % 60, pm: hh >= 12 }
}
const compose = (h12: number, m: number, pm: boolean) => (h12 % 12) + (pm ? 12 : 0) + m / 60
export const clockText = (v: number) => { const p = parts(v); return `${p.h}:${String(p.m).padStart(2, '0')} ${p.pm ? 'PM' : 'AM'}` }

/** "730", "7:30", "7:30pm", "7p", "19:30" → hours, or null if it isn't a time. */
function parse(text: string, current: number): number | null {
  const m = text.trim().toLowerCase().match(/^(\d{1,2})(?::?(\d{2}))?\s*(a|p)?\.?m?\.?$/)
  if (!m) return null
  const h = Number(m[1])
  const mm = m[2] ? Number(m[2]) : 0
  if (mm > 59) return null
  if (m[3]) return h >= 1 && h <= 12 ? compose(h, mm, m[3] === 'p') : null
  if (h > 24 || (h === 24 && mm > 0)) return null
  if (h === 0 || h >= 13) return h + mm / 60
  return compose(h, mm, parts(current).pm) // "7:30" keeps whatever AM/PM it was on
}

function Wheel({ items, index, label, onPick }: { items: string[]; index: number; label: string; onPick: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  const timer = useRef<number>(undefined)
  const busy = useRef(false) // true while we're scrolling it ourselves, so that doesn't count as the user picking
  const busyTimer = useRef<number>(undefined)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (Math.abs(el.scrollTop - index * ROW) > 1) {
      busy.current = true
      window.clearTimeout(busyTimer.current)
      busyTimer.current = window.setTimeout(() => { busy.current = false }, 500)
      el.scrollTo({ top: index * ROW, behavior: first.current ? 'auto' : 'smooth' })
    }
    first.current = false
  }, [index])
  useEffect(() => () => { window.clearTimeout(timer.current); window.clearTimeout(busyTimer.current) }, [])
  const settle = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el || busy.current) return
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)))
      if (i !== index) onPick(i)
    }, 120)
  }
  return (
    <div className="wheel" ref={ref} onScroll={settle} role="listbox" aria-label={label}>
      {items.map((it, i) => (
        <button type="button" key={it} role="option" aria-selected={i === index} className={i === index ? 'on' : ''} onClick={() => onPick(i)}>{it}</button>
      ))}
    </div>
  )
}

export function TimeField({ id, value, onChange, label, floating = false }: { id: string; value: number; onChange: (v: number) => void; label: string; floating?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(clockText(value))
  const [typing, setTyping] = useState(false)
  useEffect(() => { if (!typing) setText(clockText(value)) }, [value, typing])
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const p = parts(value)
  const mIndex = Math.round(p.m / 5) % 12
  const commit = () => {
    setTyping(false)
    const v = parse(text, value)
    if (v === null) setText(clockText(value))
    else { onChange(v); setText(clockText(v)) }
  }
  return (
    <div className={`timefield${floating ? ' floating' : ''}`} ref={box}>
      <input
        id={id}
        className="input plain time-input"
        value={text}
        inputMode="text"
        autoComplete="off"
        aria-label={label}
        onFocus={(e) => { setOpen(true); e.currentTarget.select() }}
        onChange={(e) => { setTyping(true); setText(e.target.value) }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); setOpen(false) } }}
      />
      {open && (
        <div className="wheel-panel" onPointerDown={(e) => e.preventDefault()}>
          <span className="wheel-band" aria-hidden />
          <Wheel label="Hour" items={HOURS.map(String)} index={p.h - 1} onPick={(i) => onChange(compose(HOURS[i], p.m, p.pm))} />
          <Wheel label="Minutes" items={MINUTES.map((m) => String(m).padStart(2, '0'))} index={mIndex} onPick={(i) => onChange(compose(p.h, MINUTES[i], p.pm))} />
          <Wheel label="AM or PM" items={['AM', 'PM']} index={p.pm ? 1 : 0} onPick={(i) => onChange(compose(p.h, p.m, i === 1))} />
        </div>
      )}
    </div>
  )
}

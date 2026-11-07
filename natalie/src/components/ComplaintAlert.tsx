import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, ChevronRight, Megaphone, X } from 'lucide-react'
import caringImg from '../assets/pip/caring.webp'
import sternImg from '../assets/pip/stern.webp'
import { Sheet } from './ui'
import { ago, useComplaints } from '../complaints'

/** Pip with a feeling. `caring` bobs gently ("I've got you"); `stern` waddles in and shakes its head ("we need to talk"). */
function MoodPip({ kind, size }: { kind: 'caring' | 'stern'; size: number }) {
  return (
    <span className={`mpip ${kind}`} style={{ '--mpip': `${size}px` } as React.CSSProperties} role="img" aria-label={kind === 'caring' ? 'Pip looking caring' : 'Pip looking serious'}>
      <img src={kind === 'caring' ? caringImg : sternImg} alt="" draggable={false} />
    </span>
  )
}

/** Dark screen: Pip walks in and tells you what your roommates are complaining about. Swipe through them; tap one to say if it is done. */
export function ComplaintAlert() {
  const { pending, resolve, alertOpen, closeAlert, banner, dismissBanner, openAlert } = useComplaints()
  const [i, setI] = useState(0)
  const [asking, setAsking] = useState<string | null>(null)
  const track = useRef<HTMLDivElement>(null)

  // Everything answered: close.
  useEffect(() => { if (alertOpen && pending.length === 0) closeAlert() }, [pending.length, alertOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (i > pending.length - 1) setI(Math.max(0, pending.length - 1)) }, [pending.length, i])
  useEffect(() => { if (alertOpen) { setI(0); setAsking(null) } }, [alertOpen])

  const redBanner = banner && !alertOpen ? createPortal(
    <div className="ca-banner" role="alert">
      <button type="button" className="ca-banner-main" onClick={() => { dismissBanner(); openAlert() }}>
        <span className="ca-banner-ico" aria-hidden><Megaphone size={20} /></span>
        <span className="ca-banner-txt"><b>New anonymous complaint</b><small>{banner.text}</small></span>
        <span className="ca-banner-see">See</span>
      </button>
      <button type="button" className="ca-banner-x" onClick={dismissBanner} aria-label="Dismiss"><X size={18} aria-hidden /></button>
    </div>,
    document.body,
  ) : null
  if (!alertOpen || pending.length === 0) return redBanner
  const goTo = (n: number) => {
    const el = track.current
    if (!el) return
    const t = Math.min(pending.length - 1, Math.max(0, n))
    el.scrollTo({ left: t * el.clientWidth, behavior: 'smooth' })
    setI(t); setAsking(null)
  }
  const intro = pending.length === 1
    ? 'Hey, someone in the house has a complaint.'
    : `Hey, there are ${pending.length} complaints in the house.`

  return createPortal(
    <div className="ca-backdrop" role="dialog" aria-modal="true" aria-label="Chore complaints">
      <button type="button" className="ca-close" onClick={closeAlert} aria-label="Close for now"><X size={22} aria-hidden /></button>
      <div className="ca-top">
        <p className="ca-bubble">{intro}</p>
        <MoodPip kind="stern" size={150} />
      </div>

      {pending.length > 1 && <p className="ca-count" aria-live="polite">{i + 1} of {pending.length}</p>}
      <div className="ca-carousel">
        {pending.length > 1 && <button type="button" className="ca-arrow" onClick={() => goTo(i - 1)} disabled={i === 0} aria-label="Previous complaint"><ChevronLeft size={22} aria-hidden /></button>}
        <div className="ca-track" ref={track} onScroll={(e) => { const el = e.currentTarget; const n = Math.round(el.scrollLeft / el.clientWidth); if (n !== i) { setI(n); setAsking(null) } }}>
          {pending.map((c) => (
            <div className="ca-slide" key={c.id}>
              {asking === c.id ? (
                <div className="ca-card ask">
                  <b className="ca-q">Has this been taken care of?</b>
                  <p className="ca-quote">“{c.text}”</p>
                  <div className="ca-btns">
                    <button type="button" className="btn ghost" onClick={() => setAsking(null)}>Not yet</button>
                    <button type="button" className="btn" onClick={() => { resolve(c.id); setAsking(null) }}><Check size={18} aria-hidden /> Yes, it’s done</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="ca-card" onClick={() => setAsking(c.id)}>
                  <span className="ca-from"><span className="ca-anon" aria-hidden><Megaphone size={18} /></span><span><b>Anonymous</b><small>{ago(c.at)}</small></span></span>
                  <span className="ca-quote">“{c.text}”</span>
                  <small className="ca-hint">Tap to answer</small>
                </button>
              )}
            </div>
          ))}
        </div>
        {pending.length > 1 && <button type="button" className="ca-arrow" onClick={() => goTo(i + 1)} disabled={i === pending.length - 1} aria-label="Next complaint"><ChevronRight size={22} aria-hidden /></button>}
      </div>
      {pending.length > 1 && <div className="ca-dots" aria-hidden>{pending.map((c, k) => <i key={c.id} className={k === i ? 'on' : ''} />)}</div>}
      <button type="button" className="ca-later" onClick={closeAlert}>Later</button>
    </div>,
    document.body,
  )
}

/** The form: Pip offers to help, you write what is wrong. */
export function ComplaintSheet({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const { file } = useComplaints()
  const [text, setText] = useState('')
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    file(t)
    setText('')
    onSent()
  }
  return (
    <Sheet open={open} title="Chore complaint" icon={<Megaphone aria-hidden />} tone="bg-coral" onClose={onClose}>
      <div className="cc-pip">
        <MoodPip kind="caring" size={104} />
        <p className="cc-bubble">I’ve got you. I can help. What’s going on? It goes to the whole house, without your name.</p>
      </div>
      <form className="stack" style={{ gap: 16 }} onSubmit={send}>
        <div className="field">
          <label htmlFor="cc-text">What’s the complaint?</label>
          <textarea id="cc-text" className="input plain cc-text" rows={3} maxLength={140} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. The dishes in the sink have been there for two days" />
        </div>
        <button type="submit" className="btn danger" disabled={!text.trim()}><Megaphone size={18} aria-hidden /> Send anonymously</button>
      </form>
    </Sheet>
  )
}

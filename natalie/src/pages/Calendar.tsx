import { useState } from 'react'
import { AlertTriangle, Bath, Car, Plus } from 'lucide-react'
import { Avatar, AvatarStack, Chip, PageHead, Segmented } from '../components/ui'
import { bathroom, byId, hourLabel, presence, roommates } from '../data'

const START = 6
const SPAN = 18
const pct = (h: number) => ((h - START) / SPAN) * 100
const NOW = 18.5

const days = [['Mon', 29], ['Tue', 30], ['Wed', 1], ['Thu', 2], ['Fri', 3], ['Sat', 4], ['Sun', 5]] as const

function status(id: string) {
  const segs = presence[id]
  const cur = segs.find(([a, b]) => NOW >= a && NOW < b)
  if (cur) return { home: true, text: `Home until ${hourLabel(cur[1])}` }
  const next = segs.find(([a]) => a > NOW)
  return { home: false, text: next ? `Away · back at ${hourLabel(next[0])}` : 'Away tonight' }
}

function MobilePresence() {
  return (
    <div className="presence-mobile stack">
      {roommates.map((r) => {
        const st = status(r.id)
        return (
          <div className="card flat pm-card" key={r.id}>
            <div className="row">
              <Avatar id={r.id} size={40} home={st.home} />
              <div className="grow">
                <b>{r.name}</b>
                <div className="muted" style={{ fontSize: 14, fontWeight: 700 }}>{st.text}</div>
              </div>
            </div>
            <div className="pm-track">
              {presence[r.id].map(([a, b], i) => (
                <span key={i} style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%`, background: r.color }} />
              ))}
              <i style={{ left: `${pct(NOW)}%` }} />
            </div>
          </div>
        )
      })}
      <div className="pm-axis"><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span></div>
    </div>
  )
}

function Timeline() {
  return (
    <>
    <MobilePresence />
    <div className="card flat gantt-desktop">
      <div className="gantt">
        <div className="gantt-inner">
          <div className="g-hours">
            <span />
            <div className="hrs">
              {Array.from({ length: SPAN }, (_, i) => <span key={i}>{i % 2 === 0 ? hourLabel(START + i) : ''}</span>)}
            </div>
          </div>

          {roommates.map((r) => (
            <div className="g-row" key={r.id}>
              <div className="g-label"><Avatar id={r.id} size={30} /> {r.name}</div>
              <div className="g-track">
                {presence[r.id].map(([s, e], i) => (
                  <span key={i} className="g-bar" style={{ left: `${pct(s)}%`, width: `${pct(e) - pct(s)}%`, background: r.color, color: r.ink, animationDelay: `${i * 80}ms` }}>
                    {e - s >= 2 ? 'At home' : ''}
                  </span>
                ))}
                <span className="g-now" style={{ left: `${pct(NOW)}%` }} />
              </div>
            </div>
          ))}

          <div className="g-row">
            <div className="g-label"><span className="bubble-ico bg-blue" style={{ width: 30, height: 30, borderRadius: 10 }}><Bath size={16} aria-hidden /></span> Bathroom</div>
            <div className="g-track">
              {bathroom.map((b, i) => (
                <span key={i} className="g-bar" style={{ left: `${pct(b.start)}%`, width: `${pct(b.end) - pct(b.start)}%`, background: byId(b.who).color, color: byId(b.who).ink, justifyContent: 'center', padding: 0 }}>
                  {byId(b.who).initials}
                </span>
              ))}
              <span className="g-bar free" style={{ left: `${pct(22)}%`, width: `${pct(23) - pct(22)}%`, justifyContent: 'center', padding: 0 }}><Plus size={14} aria-hidden /></span>
              <span className="g-now" style={{ left: `${pct(NOW)}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="legend" style={{ marginTop: 12 }}>
        <span><i style={{ background: 'var(--brand)' }} />At home</span>
        <span><i style={{ background: 'var(--coral)' }} />Now</span>
        <span><i style={{ border: '2px dashed var(--brand)' }} />Open bathroom slot</span>
      </div>
    </div>
    </>
  )
}

function Bathroom() {
  const slots = [
    { t: '7:00am', who: 'sofi' }, { t: '7:30am', who: 'diego' }, { t: '8:00am', who: 'you' },
    { t: '8:30am', who: null }, { t: '9:00pm', who: null }, { t: '9:30pm', who: 'mara' },
  ]
  return (
    <>
      <div className="section-head" style={{ marginTop: 20 }}><h2>Bathroom slots</h2><Chip tone="blue">30 min each</Chip></div>
      <div className="slot-grid">
        {slots.map((s) => (
          <button key={s.t} className={`slot${s.who ? '' : ' open'}`} style={{ cursor: 'pointer' }}>
            <b>{s.t}</b>
            {s.who ? <><Avatar id={s.who} size={28} /><span>{byId(s.who).name}</span></> : <><Plus size={24} aria-hidden /><span>Claim it</span></>}
          </button>
        ))}
      </div>
    </>
  )
}

function Events() {
  const ev = [
    { time: '6:30', ap: 'pm', t: 'Cook dinner together', who: ['you', 'sofi', 'mara'], c: 'var(--brand)' },
    { time: '9:00', ap: 'pm', t: 'Movie night in the living room', who: ['you', 'diego', 'mara', 'sofi'], c: 'var(--purple)' },
    { time: '11:00', ap: 'am', t: 'Landlord visit · fix the sink', who: ['you'], c: 'var(--yellow-d)', day: 'Sat' },
  ]
  return (
    <div className="stack">
      {ev.map((e, i) => (
        <div className="card event pop" key={e.t} style={{ '--i': i } as React.CSSProperties}>
          <div className="time">{e.time}<small>{e.ap}{e.day ? ` · ${e.day}` : ''}</small></div>
          <span className="bar" style={{ background: e.c }} />
          <div className="grow"><div style={{ fontWeight: 800, fontSize: 17 }}>{e.t}</div><div style={{ marginTop: 8 }}><AvatarStack ids={e.who} size={28} /></div></div>
        </div>
      ))}
    </div>
  )
}

function Parking() {
  return (
    <div className="stack">
      <div className="card tint-yellow row">
        <span className="bubble-ico bg-yellow"><Car aria-hidden /></span>
        <div className="grow"><b>Street permit · Zone B</b><div className="muted" style={{ fontSize: 14, fontWeight: 700 }}>One car at a time. Pick a time that works.</div></div>
      </div>
      <div className="perm pop"><div className="grow"><div className="when">Tue · 9:00am – 1:00pm</div><span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>Available</span></div><button className="btn sm">Reserve permit</button></div>
      <div className="perm taken pop" style={{ '--i': 1 } as React.CSSProperties}>
        <div className="grow"><div className="when row"><AlertTriangle size={18} aria-hidden /> Tue · 2:00pm – 6:00pm</div><span style={{ fontWeight: 700, fontSize: 14 }}>Diego already has this one</span></div>
        <button className="btn sm ghost">Choose another time</button>
      </div>
      <div className="perm pop" style={{ '--i': 2 } as React.CSSProperties}><div className="grow"><div className="when">Wed · 8:00am – 12:00pm</div><span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>Available</span></div><button className="btn sm">Reserve permit</button></div>
    </div>
  )
}

export default function Calendar() {
  const [tab, setTab] = useState(0)
  const [day, setDay] = useState(1)
  return (
    <>
      <PageHead title="Calendar" sub="Who’s home, when" />
      <div className="day-strip">
        {days.map(([d, n], i) => (
          <button className="day" key={d} aria-pressed={day === i} onClick={() => setDay(i)}>
            <small>{d}</small><b>{n}</b>{[1, 5].includes(i) && day !== i ? <span className="pip-dot" /> : <span style={{ height: 6 }} />}
          </button>
        ))}
      </div>
      <Segmented options={['Who’s home', 'Events', 'Parking']} onChange={setTab} />
      <div style={{ height: 16 }} />
      {tab === 0 && <><Timeline /><Bathroom /></>}
      {tab === 1 && <Events />}
      {tab === 2 && <Parking />}
      <button className="fab" aria-label="Add event"><Plus size={30} aria-hidden /><span className="fab-label">Add event</span></button>
    </>
  )
}

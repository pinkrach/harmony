import { useState } from 'react'
import { BellRing, Plus, CheckCircle2, Droplets, HandCoins, Send, Wallet, Wifi, Zap } from 'lucide-react'
import { Chip, PageHead, PipSays } from '../components/ui'

type State = 'owe' | 'overdue' | 'paid'
const seed = [
  { icon: Wifi, tone: 'bg-blue', t: 'Wi‑Fi', sub: 'Due Friday', amt: 18.5, state: 'owe' as State },
  { icon: Zap, tone: 'bg-yellow', t: 'Electricity', sub: '5 days late', amt: 31.25, state: 'overdue' as State },
  { icon: Droplets, tone: 'bg-teal', t: 'Water', sub: 'Mara paid you', amt: 12, state: 'paid' as State },
]

export default function Payments() {
  const [bills, setBills] = useState(seed)
  const [nudged, setNudged] = useState<string[]>([])

  const pay = (t: string) => setBills((l) => l.map((b) => (b.t === t ? { ...b, state: 'paid', sub: 'You paid it 🎉' } : b)))
  const nudge = (t: string) => setNudged((n) => (n.includes(t) ? n : [...n, t]))

  const owed = bills.filter((b) => b.state !== 'paid').reduce((s, b) => s + b.amt, 0)
  const received = bills.filter((b) => b.state === 'paid').reduce((s, b) => s + b.amt, 0)

  return (
    <>
      <PageHead title="Payments" sub="Bills, split fairly" />
      <PipSays mood={owed === 0 ? 'cheer' : 'happy'}>
        {owed === 0 ? 'You’re all paid up. Roomie of the month!' : `You owe $${owed.toFixed(2)} this month. Venmo makes it quick!`}
      </PipSays>

      <div className="balance pop">
        <div className="card tint-coral flat">
          <span className="bubble-ico bg-coral"><Wallet aria-hidden /></span>
          <span className="bal-label">You owe</span>
          <b>${owed.toFixed(2)}</b>
        </div>
        <div className="card tint-teal flat">
          <span className="bubble-ico bg-teal"><HandCoins aria-hidden /></span>
          <span className="bal-label">Received</span>
          <b>${received.toFixed(2)}</b>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 20 }}><h2>This month</h2></div>
      <div className="stack">
        {bills.map((b, i) => (
          <div className={`card bill pop${b.state === 'overdue' ? ' tint-coral' : ''}${b.state === 'paid' ? ' tint-teal' : ''}`} key={b.t} style={{ '--i': i + 1 } as React.CSSProperties}>
            <div className="bill-top">
              <span className={`bubble-ico ${b.tone}`}><b.icon aria-hidden /></span>
              <div className="grow">
                <div className="bill-name">{b.t}</div>
                <div className="muted bill-sub">{b.sub}</div>
              </div>
              <div className="amt">${b.amt.toFixed(2)}</div>
            </div>
            {b.state !== 'paid' && (
              <div className="bill-actions">
                <button className="btn sm venmo grow" onClick={() => pay(b.t)}><Send size={16} aria-hidden /> Pay with Venmo</button>
                {b.state === 'overdue' && (
                  <button className="btn sm coral" aria-label={`Nudge about ${b.t}`} onClick={() => nudge(b.t)} disabled={nudged.includes(b.t)}>
                    <BellRing size={16} aria-hidden /> {nudged.includes(b.t) && 'Sent!'}
                  </button>
                )}
              </div>
            )}
            {b.state === 'paid' && <div className="bill-paid"><Chip tone="teal"><CheckCircle2 size={14} aria-hidden /> Received</Chip></div>}
            {b.state === 'overdue' && <div className="bill-late"><Chip tone="coral">Running late</Chip></div>}
          </div>
        ))}
      </div>
      <button className="fab" aria-label="Add bill"><Plus size={30} aria-hidden /><span className="fab-label">Add bill</span></button>
    </>
  )
}

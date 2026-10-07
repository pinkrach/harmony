import { BellRing, Plus, Send, Wifi, Zap, Droplets } from 'lucide-react'
import { Chip, PageHead, PipSays } from '../components/ui'

const bills = [
  { icon: Wifi, tone: 'bg-blue', t: 'Wi‑Fi', sub: 'Due Friday', amt: 18.5, state: 'owe' },
  { icon: Zap, tone: 'bg-yellow', t: 'Electricity', sub: '5 days late', amt: 31.25, state: 'overdue' },
  { icon: Droplets, tone: 'bg-teal', t: 'Water', sub: 'Mara paid you', amt: 12, state: 'paid' },
] as const

export default function Payments() {
  return (
    <>
      <PageHead title="Payments" />
      <PipSays>You owe $49.75 this month. Venmo makes it quick!</PipSays>

      <div className="stack">
        {bills.map((b, i) => (
          <div className="card bill pop" key={b.t} style={{ '--i': i } as React.CSSProperties}>
            <div className="bill-top">
              <span className={`bubble-ico ${b.tone}`}><b.icon aria-hidden /></span>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 17 }}>{b.t}</div>
                <div className="muted" style={{ fontSize: 14, fontWeight: 700 }}>{b.sub}</div>
              </div>
              <div className="amt">${b.amt.toFixed(2)}</div>
            </div>
            {b.state === 'owe' && <div className="bill-actions"><button className="btn sm venmo grow"><Send size={16} aria-hidden /> Pay with Venmo</button></div>}
            {b.state === 'overdue' && <div className="bill-actions"><button className="btn sm venmo grow"><Send size={16} aria-hidden /> Pay with Venmo</button><button className="btn sm coral" aria-label="Nudge"><BellRing size={16} aria-hidden /></button></div>}
            {b.state === 'paid' && <div style={{ marginTop: 10 }}><Chip tone="teal">Received</Chip></div>}
          </div>
        ))}
      </div>
      <button className="fab" aria-label="Add bill"><Plus size={30} aria-hidden /><span className="fab-label">Add bill</span></button>
    </>
  )
}

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, BellRing, Check, CheckCircle2, Clock, HandCoins, Plus, ReceiptText, Send, Wallet } from 'lucide-react'
import { Avatar, Chip, PageHead, PipSays, Sheet } from '../components/ui'
import { byId, roommates } from '../data'
import { addDays, dayText, iso } from '../chores'
import { isOverdue, kinds, owedToYou, share, totals, unpaid, usePayments, youOwe, type Bill, type Kind } from '../payments'

const money = (n: number) => `$${n.toFixed(2)}`
const name = (id: string) => (id === 'you' ? 'You' : byId(id).name)
const dueText = (date: string) => (date === iso(addDays(0)) ? 'Today' : date === iso(addDays(1)) ? 'Tomorrow' : dayText(new Date(`${date}T00:00`)))

type DueOpt = 'Today' | 'Tomorrow' | 'Pick date'
const dueOpts: DueOpt[] = ['Today', 'Tomorrow', 'Pick date']

function NewBill({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = usePayments()
  const [kind, setKind] = useState<Kind>('wifi')
  const [t, setT] = useState(kinds.wifi.label)
  const [amt, setAmt] = useState('')
  const [payer, setPayer] = useState('you')
  const [others, setOthers] = useState<string[]>(roommates.filter((r) => r.id !== 'you').map((r) => r.id))
  const [due, setDue] = useState<DueOpt>('Tomorrow')
  const [picked, setPicked] = useState(iso(addDays(3)))

  const split = ['you', ...others]
  const total = parseFloat(amt)
  const valid = t.trim() && total > 0 && others.length > 0 && (due !== 'Pick date' || picked)
  const each = total > 0 ? total / split.length : 0
  const date = due === 'Today' ? iso(addDays(0)) : due === 'Tomorrow' ? iso(addDays(1)) : picked

  const pickKind = (k: Kind) => { setKind(k); setT(k === 'other' ? '' : kinds[k].label) }
  const toggleOther = (id: string) => setOthers((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    add({ t: t.trim(), kind, amt: total, payer, split, date })
    setKind('wifi'); setT(kinds.wifi.label); setAmt(''); setPayer('you'); setDue('Tomorrow')
    setOthers(roommates.filter((r) => r.id !== 'you').map((r) => r.id))
    onClose()
  }

  return (
    <Sheet open={open} title="Add bill" icon={<ReceiptText aria-hidden />} tone="bg-blue" onClose={onClose}>
      <form className="stack" style={{ gap: 18 }} onSubmit={submit}>
        <div className="field">
          <span className="lbl">What’s it for?</span>
          <div className="pick-row">
            {(Object.keys(kinds) as Kind[]).map((k) => {
              const K = kinds[k]
              return <button type="button" key={k} className="pick" aria-pressed={kind === k} onClick={() => pickKind(k)}><K.icon size={18} aria-hidden />{K.label}</button>
            })}
          </div>
        </div>
        {kind === 'other' && (
          <div className="field">
            <label htmlFor="bill-name">Bill name</label>
            <input id="bill-name" className="input plain" value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. Cleaning supplies" maxLength={30} />
          </div>
        )}
        <div className="field">
          <label htmlFor="bill-amt">Total amount</label>
          <div className="input-wrap">
            <span className="money-prefix" aria-hidden>$</span>
            <input id="bill-amt" className="input money" inputMode="decimal" type="number" min="0" step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="field">
          <span className="lbl">Who paid it?</span>
          <div className="pick-row">
            {roommates.map((r) => <button type="button" key={r.id} className="pick" aria-pressed={payer === r.id} onClick={() => setPayer(r.id)}><Avatar id={r.id} size={26} />{r.id === 'you' ? 'Me' : r.name}</button>)}
          </div>
        </div>
        <div className="field">
          <span className="lbl">Split with</span>
          <div className="pick-row">
            <span className="pick fixed"><Avatar id="you" size={26} />Me<Check size={16} aria-hidden /></span>
            {roommates.filter((r) => r.id !== 'you').map((r) => <button type="button" key={r.id} className="pick" aria-pressed={others.includes(r.id)} onClick={() => toggleOther(r.id)}><Avatar id={r.id} size={26} />{r.name}</button>)}
          </div>
        </div>
        <div className="field">
          <span className="lbl">Due</span>
          <div className="pick-row">
            {dueOpts.map((d) => <button type="button" key={d} className="pick" aria-pressed={due === d} onClick={() => setDue(d)}>{d}</button>)}
          </div>
          {due === 'Pick date' && <input className="input plain" type="date" aria-label="Due date" value={picked} min={iso(new Date())} onChange={(e) => setPicked(e.target.value)} style={{ marginTop: 8, colorScheme: 'light dark' }} />}
        </div>
        <p className="when-summary">
          {total > 0 && others.length > 0
            ? <><b>{money(each)}</b> each · {payer === 'you' ? 'you cover it, they pay you back' : `${name(payer)} covers it, you pay ${byId(payer).name} back`}</>
            : others.length === 0 ? 'Pick at least one roommate to split with.' : 'Enter an amount to see everyone’s share.'}
        </p>
        <button className="btn block" type="submit" disabled={!valid}><Plus size={20} aria-hidden /> Add bill</button>
      </form>
    </Sheet>
  )
}

function Payers({ b }: { b: Bill }) {
  return (
    <div className="payers" aria-label={`${b.split.length - unpaid(b).length} of ${b.split.length} paid`}>
      {b.split.map((id) => {
        const paid = b.paid.includes(id)
        return (
          <span className={`payer${paid ? ' paid' : ''}`} key={id}>
            <span className="payer-av"><Avatar id={id} size={34} /><i className="st" aria-hidden>{paid ? <Check size={11} strokeWidth={4} /> : <Clock size={11} strokeWidth={3} />}</i></span>
            <small>{id === 'you' ? 'You' : byId(id).name}<span className="sr-only">{paid ? ' paid' : ' hasn’t paid'}</span></small>
          </span>
        )
      })}
      <span className="payers-count muted">{b.split.length - unpaid(b).length} of {b.split.length} paid</span>
    </div>
  )
}

function BillCard({ b, i, onNudge, nudged }: { b: Bill; i: number; onNudge: (key: string) => void; nudged: string[] }) {
  const { markPaid } = usePayments()
  const K = kinds[b.kind]
  const owe = youOwe(b)
  const owed = owedToYou(b)
  const late = isOverdue(b)
  const amount = owe ? share(b) : owed ? share(b) * unpaid(b).length : share(b)
  const dir = owe ? 'owe' : owed ? 'owed' : 'settled'
  return (
    <div className={`card bill ${dir} pop${late ? ' late' : ''}`} style={{ '--i': i } as React.CSSProperties}>
      <div className="bill-top">
        <span className={`bubble-ico ${K.tone}`}><K.icon aria-hidden /></span>
        <div className="grow">
          <div className="bill-name">{b.t}</div>
          <div className="muted bill-sub">
            {owe ? `To ${name(b.payer)}` : b.payer === 'you' ? 'You paid' : `${name(b.payer)} paid`} · {late ? <span className="late-txt">Due {dueText(b.date)}</span> : `Due ${dueText(b.date)}`}
          </div>
        </div>
        <div className={`amt-col ${dir}`}>
          <div className="amt">{owe ? '−' : owed ? '+' : ''}{money(amount)}</div>
          <div className="amt-label">{owe ? 'your share' : owed ? 'still owed' : 'settled'}</div>
        </div>
      </div>

      <Payers b={b} />

      {owe && (
        <div className="bill-actions">
          <button className="btn sm venmo grow" onClick={() => markPaid(b.id, 'you')}><Send size={16} aria-hidden /> Pay {byId(b.payer).name} with Venmo</button>
        </div>
      )}
      {owed && (
        <div className="owed-list">
          {unpaid(b).map((id) => {
            const key = `${b.id}-${id}`
            return (
              <div className="owed-row" key={id}>
                <Avatar id={id} size={28} />
                <span className="grow"><b>{byId(id).name}</b> <span className="muted">owes {money(share(b))}</span></span>
                <button className="btn sm coral" onClick={() => onNudge(key)} disabled={nudged.includes(key)} aria-label={`Nudge ${byId(id).name}`}><BellRing size={15} aria-hidden />{nudged.includes(key) ? 'Sent' : ''}</button>
                <button className="btn sm ghost" onClick={() => markPaid(b.id, id)}>Mark paid</button>
              </div>
            )
          })}
        </div>
      )}
      {dir === 'settled' && <div className="bill-paid"><Chip tone="teal"><CheckCircle2 size={14} aria-hidden /> Everyone’s paid</Chip></div>}
    </div>
  )
}

export default function Payments() {
  const { bills } = usePayments()
  const [sheet, setSheet] = useState(false)
  const [nudged, setNudged] = useState<string[]>([])
  const nudge = (k: string) => setNudged((n) => (n.includes(k) ? n : [...n, k]))

  const { owe, owed } = totals(bills)
  const youOweBills = bills.filter(youOwe)
  const owedBills = bills.filter(owedToYou)
  const settled = bills.filter((b) => !youOwe(b) && !owedToYou(b))
  let n = 0

  const section = (title: string, icon: React.ReactNode, list: Bill[], tone: string) => list.length > 0 && (
    <>
      <div className={`section-head dir ${tone}`}><h2>{icon}{title}</h2><Chip tone={tone === 'owe' ? 'coral' : tone === 'owed' ? 'teal' : ''}>{list.length}</Chip></div>
      <div className="stack">{list.map((b) => <BillCard key={b.id} b={b} i={n++} onNudge={nudge} nudged={nudged} />)}</div>
    </>
  )

  return (
    <>
      <PageHead title="Bills" sub="Split fairly, paid back fast" />
      <PipSays mood={owe === 0 ? 'cheer' : 'happy'}>
        {owe > 0 ? `You owe ${money(owe)} this month. Venmo makes it quick!` : owed > 0 ? `Roomies still owe you ${money(owed)}.` : 'You’re all paid up. Roomie of the month!'}
      </PipSays>

      <div className="balance pop">
        <div className="card tint-coral flat">
          <span className="bubble-ico bg-coral"><Wallet aria-hidden /></span>
          <span className="bal-label">You owe</span>
          <b>{money(owe)}</b>
        </div>
        <div className="card tint-teal flat">
          <span className="bubble-ico bg-teal"><HandCoins aria-hidden /></span>
          <span className="bal-label">Owed to you</span>
          <b>{money(owed)}</b>
        </div>
      </div>

      {section('You owe', <ArrowUpRight size={20} aria-hidden />, youOweBills, 'owe')}
      {section('Owed to you', <ArrowDownLeft size={20} aria-hidden />, owedBills, 'owed')}
      {section('Settled', <CheckCircle2 size={20} aria-hidden />, settled, 'settled')}

      <button className="fab" aria-label="Add bill" onClick={() => setSheet(true)}><Plus size={26} aria-hidden /><span className="fab-label">Add bill</span></button>
      <NewBill open={sheet} onClose={() => setSheet(false)} />
    </>
  )
}

import { Plus } from 'lucide-react'
import { Avatar, Check, PageHead, PipSays } from '../components/ui'

const items = [
  { n: 'Oat milk', who: 'diego' },
  { n: 'Eggs', who: 'you' },
  { n: 'Spinach', who: 'mara' },
  { n: 'Dish soap', who: 'sofi' },
  { n: 'Bananas', who: 'mara' },
]

export default function Shopping() {
  return (
    <>
      <PageHead title="Groceries" />
      <PipSays mood="wow">Need dish soap? Roomies add it, you tick it off!</PipSays>

      <div className="sugg pop" style={{ marginBottom: 16 }}>
        {['Paper towels', 'Toilet paper', 'Sponges'].map((s) => <button key={s}><Plus size={16} aria-hidden /> {s}</button>)}
      </div>

      <div className="card pop" style={{ '--i': 1 } as React.CSSProperties}>
        {items.map((it) => (
          <div className="shop-item" key={it.n}>
            <Check label={`Mark ${it.n} purchased`} xp={5} />
            <div className="grow nm">{it.n}</div>
            <Avatar id={it.who} size={28} />
          </div>
        ))}
      </div>
      <button className="fab" aria-label="Add grocery"><Plus size={26} aria-hidden /><span className="fab-label">Add grocery</span></button>
    </>
  )
}

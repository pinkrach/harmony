import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, ShoppingBasket } from 'lucide-react'
import { Avatar, Check, PageHead, PipSays } from '../components/ui'

const startingItems = [
  { n: 'Oat milk', who: 'diego' },
  { n: 'Eggs', who: 'you' },
  { n: 'Spinach', who: 'mara' },
  { n: 'Dish soap', who: 'sofi' },
  { n: 'Bananas', who: 'mara' },
]

function AddItemPopup({ onAdd, onClose }: { onAdd: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const clean = name.trim()

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        onSubmit={(e) => { e.preventDefault(); if (clean) onAdd(clean) }}
      >
        <h2 id="add-item-title">Add to the list</h2>
        <div className="field">
          <label htmlFor="item-name">What do you need?</label>
          <div className="input-wrap">
            <ShoppingBasket size={20} className="icon" aria-hidden />
            <input id="item-name" className="input" placeholder="e.g. Paper towels" value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="off" maxLength={40} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn sm" disabled={!clean}><Plus size={18} aria-hidden /> Add item</button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default function Shopping() {
  const [items, setItems] = useState(startingItems)
  const [adding, setAdding] = useState(false)

  const addItem = (name: string) => {
    setItems([...items, { n: name, who: 'you' }])
    setAdding(false)
  }

  return (
    <>
      <PageHead title="Groceries" />
      <PipSays mood="wow">Need dish soap? Roomies add it, you tick it off!</PipSays>

      <div className="sugg pop" style={{ marginBottom: 16 }}>
        {['Paper towels', 'Toilet paper', 'Sponges'].map((s) => <button key={s}><Plus size={16} aria-hidden /> {s}</button>)}
      </div>

      <div className="card pop" style={{ '--i': 1 } as React.CSSProperties}>
        {items.map((it, i) => (
          <div className="shop-item" key={`${it.n}-${i}`}>
            <Check label={`Mark ${it.n} purchased`} xp={5} />
            <div className="grow nm">{it.n}</div>
            <Avatar id={it.who} size={28} />
          </div>
        ))}
      </div>
      <button className="fab" aria-label="Add item" onClick={() => setAdding(true)}><Plus size={30} aria-hidden /><span className="fab-label">Add item</span></button>

      {adding && <AddItemPopup onAdd={addItem} onClose={() => setAdding(false)} />}
    </>
  )
}

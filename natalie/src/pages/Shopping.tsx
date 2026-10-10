import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { Avatar, Check, PageHead, PipSays } from '../components/ui'
import { byId, roommates } from '../data'

type Item = { id: string; n: string; who: string }

const ITEMS_KEY = 'harmony.groceries'
const ME = 'you' // the logged-in roommate (Natalie) in this prototype

const startingItems: Item[] = [
  { id: 'g1', n: 'Oat milk', who: 'diego' },
  { id: 'g2', n: 'Eggs', who: 'you' },
  { id: 'g3', n: 'Spinach', who: 'mara' },
  { id: 'g4', n: 'Dish soap', who: 'sofi' },
  { id: 'g5', n: 'Bananas', who: 'mara' },
]

function loadItems(): Item[] {
  try {
    const saved = sessionStorage.getItem(ITEMS_KEY)
    if (saved) return JSON.parse(saved) as Item[]
  } catch { /* storage unavailable */ }
  return startingItems
}

const newId = () => `g${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

/** Row of roommate avatars to pick who is getting an item. */
function WhoPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="ev-who-row" role="radiogroup" aria-label="Who’s getting it?">
      {roommates.map((r) => (
        <button key={r.id} type="button" role="radio" aria-checked={value === r.id} aria-pressed={value === r.id} className="ev-person" onClick={() => onChange(r.id)}>
          <Avatar id={r.id} size={34} />
          <span>{r.name}</span>
        </button>
      ))}
    </div>
  )
}

function Popup({ title, children, onClose, onSubmit }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void }) {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      >
        <h2>{title}</h2>
        {children}
      </form>
    </div>,
    document.body,
  )
}

function AddItemPopup({ onAdd, onClose }: { onAdd: (name: string, who: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [who, setWho] = useState(ME)
  const clean = name.trim()

  return (
    <Popup title="Add to the list" onClose={onClose} onSubmit={() => { if (clean) onAdd(clean, who) }}>
      <div className="field">
        <label htmlFor="item-name">What do you need?</label>
        <div className="input-wrap">
          <ShoppingBasket size={20} className="icon" aria-hidden />
          <input id="item-name" className="input" placeholder="e.g. Paper towels" value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="off" maxLength={40} />
        </div>
      </div>
      <div className="field">
        <span className="picker-label">Who’s getting it?</span>
        <WhoPicker value={who} onChange={setWho} />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn sm" disabled={!clean}><Plus size={18} aria-hidden /> Add item</button>
      </div>
    </Popup>
  )
}

function AssignPopup({ item, onSave, onClose }: { item: Item; onSave: (who: string) => void; onClose: () => void }) {
  const [who, setWho] = useState(item.who)
  return (
    <Popup title={`Who’s getting ${item.n}?`} onClose={onClose} onSubmit={() => onSave(who)}>
      <WhoPicker value={who} onChange={setWho} />
      <div className="modal-actions">
        <button type="button" className="btn sm ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn sm">Save</button>
      </div>
    </Popup>
  )
}

export default function Shopping() {
  const [items, setItems] = useState<Item[]>(loadItems)
  const [adding, setAdding] = useState(false)
  const [assigning, setAssigning] = useState<Item | null>(null)

  const save = (next: Item[]) => {
    setItems(next)
    try { sessionStorage.setItem(ITEMS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  const addItem = (n: string, who: string) => { save([...items, { id: newId(), n, who }]); setAdding(false) }
  const removeItem = (id: string) => save(items.filter((it) => it.id !== id))
  const assign = (id: string, who: string) => { save(items.map((it) => (it.id === id ? { ...it, who } : it))); setAssigning(null) }

  // Quick-add chips only show for things that aren't already on the list.
  const suggestions = ['Paper towels', 'Toilet paper', 'Sponges'].filter((s) => !items.some((it) => it.n.toLowerCase() === s.toLowerCase()))

  return (
    <>
      <PageHead title="Groceries" />
      <PipSays mood="wow">Need dish soap? Roomies add it, you tick it off!</PipSays>

      {suggestions.length > 0 && (
        <div className="sugg pop" style={{ marginBottom: 16 }}>
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => save([...items, { id: newId(), n: s, who: ME }])} aria-label={`Add ${s} to the list`}>
              <Plus size={16} aria-hidden /> {s}
            </button>
          ))}
        </div>
      )}

      <div className="card pop" style={{ '--i': 1 } as React.CSSProperties}>
        {items.length === 0 ? (
          <p className="muted grocery-empty">The list is empty. Tap “Add item” to add something.</p>
        ) : (
          items.map((it) => (
            <div className="shop-item" key={it.id}>
              <Check label={`Mark ${it.n} purchased`} xp={5} />
              <div className="grow nm">{it.n}</div>
              <button type="button" className="assign-btn" onClick={() => setAssigning(it)} aria-label={`${byId(it.who).name} is getting ${it.n}. Change who`} title="Change who’s getting it">
                <Avatar id={it.who} size={28} />
                <span className="assign-name">{byId(it.who).name}</span>
              </button>
              <button type="button" className="icon-btn remove-btn" onClick={() => removeItem(it.id)} aria-label={`Remove ${it.n} from the list`} title="Remove from list">
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
          ))
        )}
      </div>
      <button className="fab" aria-label="Add item" onClick={() => setAdding(true)}><Plus size={30} aria-hidden /><span className="fab-label">Add item</span></button>

      {adding && <AddItemPopup onAdd={addItem} onClose={() => setAdding(false)} />}
      {assigning && <AssignPopup key={assigning.id} item={assigning} onSave={(who) => assign(assigning.id, who)} onClose={() => setAssigning(null)} />}
    </>
  )
}

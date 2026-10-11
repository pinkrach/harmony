import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { Avatar, Check, PageHead, PipSays } from '../components/ui'
import { byId, roommates } from '../data'
import { useGroceries, type Item } from '../groceries'

const ME = 'you' // the logged-in roommate (Natalie) in this prototype

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

export function GroceryList() {
  const { items, remove, assign, toggle } = useGroceries()
  const [assigning, setAssigning] = useState<Item | null>(null)

  return (
    <>
      <div className="card pop" style={{ '--i': 1 } as React.CSSProperties}>
        {items.length === 0 ? (
          <p className="muted grocery-empty">The list is empty. Tap “Add item” to add something.</p>
        ) : (
          items.map((it) => (
            <div className={`shop-item${it.bought ? ' done' : ''}`} key={it.id}>
              <Check label={`Mark ${it.n} purchased`} xp={5} defaultOn={it.bought} onToggle={() => toggle(it.id)} />
              <div className="grow nm">{it.n}</div>
              <button type="button" className="assign-btn" onClick={() => setAssigning(it)} aria-label={`${byId(it.who).name} is getting ${it.n}. Change who`} title="Change who’s getting it">
                <Avatar id={it.who} size={28} />
                <span className="assign-name">{byId(it.who).name}</span>
              </button>
              <button type="button" className="icon-btn remove-btn" onClick={() => remove(it.id)} aria-label={`Remove ${it.n} from the list`} title="Remove from list">
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
          ))
        )}
      </div>
      {assigning && <AssignPopup key={assigning.id} item={assigning} onSave={(who) => { assign(assigning.id, who); setAssigning(null) }} onClose={() => setAssigning(null)} />}
    </>
  )
}

export default function Shopping() {
  const { items, add } = useGroceries()
  const [params, setParams] = useSearchParams()
  const [adding, setAdding] = useState(params.get('add') === '1')
  useEffect(() => {
    if (params.get('add') !== '1') return
    setAdding(true)
    const next = new URLSearchParams(params)
    next.delete('add')
    setParams(next, { replace: true })
  }, [params, setParams])

  const addItem = (n: string, who: string) => { add(n, who); setAdding(false) }

  // Quick-add chips only show for things that aren't already on the list.
  const suggestions = ['Paper towels', 'Toilet paper', 'Sponges'].filter((s) => !items.some((it) => it.n.toLowerCase() === s.toLowerCase()))

  return (
    <>
      <PageHead title="Groceries" />
      <PipSays mood="wow">Need dish soap? Roomies add it, you tick it off!</PipSays>

      {suggestions.length > 0 && (
        <div className="sugg pop" style={{ marginBottom: 16 }}>
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => add(s, ME)} aria-label={`Add ${s} to the list`}>
              <Plus size={16} aria-hidden /> {s}
            </button>
          ))}
        </div>
      )}

      <GroceryList />
      <button className="fab" aria-label="Add item" onClick={() => setAdding(true)}><Plus size={30} aria-hidden /><span className="fab-label">Add item</span></button>

      {adding && <AddItemPopup onAdd={addItem} onClose={() => setAdding(false)} />}
    </>
  )
}

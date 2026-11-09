import { createContext, useContext, useState, type ReactNode } from 'react'
import { isPostHogConfigured, posthog } from './posthog'

export type Item = { id: string; n: string; who: string; bought: boolean }

const ITEMS_KEY = 'harmony.groceries'

const startingItems: Item[] = [
  { id: 'g1', n: 'Oat milk', who: 'diego', bought: false },
  { id: 'g2', n: 'Eggs', who: 'you', bought: false },
  { id: 'g3', n: 'Spinach', who: 'mara', bought: false },
  { id: 'g4', n: 'Dish soap', who: 'sofi', bought: false },
  { id: 'g5', n: 'Bananas', who: 'mara', bought: false },
]

function loadItems(): Item[] {
  try {
    const saved = sessionStorage.getItem(ITEMS_KEY)
    if (saved) return (JSON.parse(saved) as Item[]).map((it) => ({ ...it, bought: !!it.bought }))
  } catch { /* storage unavailable */ }
  return startingItems
}

const newId = () => `g${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

type Store = {
  items: Item[]
  add: (n: string, who: string) => void
  remove: (id: string) => void
  assign: (id: string, who: string) => void
  toggle: (id: string) => void
}

const Ctx = createContext<Store | null>(null)

export function GroceriesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(loadItems)
  const save = (next: Item[]) => {
    setItems(next)
    try { sessionStorage.setItem(ITEMS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  const add: Store['add'] = (n, who) => {
    if (isPostHogConfigured) posthog.capture('grocery_item_added', { assigned_to_self: who === 'you' })
    save([...items, { id: newId(), n, who, bought: false }])
  }
  const remove: Store['remove'] = (id) => {
    const item = items.find((it) => it.id === id)
    if (item && isPostHogConfigured) posthog.capture('grocery_item_removed', { was_purchased: item.bought })
    save(items.filter((it) => it.id !== id))
  }
  const assign: Store['assign'] = (id, who) => {
    const item = items.find((it) => it.id === id)
    if (item && item.who !== who && isPostHogConfigured) posthog.capture('grocery_item_assignment_changed', { assigned_to_self: who === 'you' })
    save(items.map((it) => (it.id === id ? { ...it, who } : it)))
  }
  const toggle: Store['toggle'] = (id) => {
    const item = items.find((it) => it.id === id)
    if (item && isPostHogConfigured) posthog.capture('grocery_item_purchase_toggled', { purchased: !item.bought })
    save(items.map((it) => (it.id === id ? { ...it, bought: !it.bought } : it)))
  }
  return <Ctx.Provider value={{ items, add, remove, assign, toggle }}>{children}</Ctx.Provider>
}

export function useGroceries() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useGroceries must be used inside GroceriesProvider')
  return s
}

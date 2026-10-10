import { createContext, useContext, useState, type ReactNode } from 'react'
import { Droplets, Flame, Home, Receipt, Wifi, Zap, type LucideIcon } from 'lucide-react'
import { addDays, iso } from './chores'

export type Kind = 'wifi' | 'power' | 'water' | 'rent' | 'gas' | 'other'
export const kinds: Record<Kind, { label: string; icon: LucideIcon; tone: string }> = {
  wifi: { label: 'Wi‑Fi', icon: Wifi, tone: 'bg-blue' },
  power: { label: 'Electricity', icon: Zap, tone: 'bg-yellow' },
  water: { label: 'Water', icon: Droplets, tone: 'bg-teal' },
  rent: { label: 'Rent', icon: Home, tone: 'bg-purple' },
  gas: { label: 'Gas', icon: Flame, tone: 'bg-coral' },
  other: { label: 'Other', icon: Receipt, tone: 'bg-purple' },
}

/** `payer` fronted the money. `split` is everyone sharing it (always includes the payer's own share). `paid` = who has settled up. */
export type Bill = { id: number; t: string; kind: Kind; amt: number; payer: string; split: string[]; paid: string[]; date: string }

export const share = (b: Bill) => b.amt / b.split.length
export const youOwe = (b: Bill) => b.payer !== 'you' && b.split.includes('you') && !b.paid.includes('you')
export const owedToYou = (b: Bill) => b.payer === 'you' && b.split.some((p) => !b.paid.includes(p))
export const unpaid = (b: Bill) => b.split.filter((p) => !b.paid.includes(p))
export const isOverdue = (b: Bill) => b.date < iso(new Date()) && (youOwe(b) || owedToYou(b))

const seed = (): Bill[] => [
  { id: 1, t: 'Wi‑Fi', kind: 'wifi', amt: 74, payer: 'diego', split: ['you', 'sofi', 'diego', 'mara'], paid: ['diego', 'mara'], date: iso(addDays(3)) },
  { id: 2, t: 'Electricity', kind: 'power', amt: 125, payer: 'sofi', split: ['you', 'sofi', 'diego', 'mara'], paid: ['sofi'], date: iso(addDays(-5)) },
  { id: 3, t: 'Water', kind: 'water', amt: 48, payer: 'you', split: ['you', 'sofi', 'diego', 'mara'], paid: ['you', 'mara'], date: iso(addDays(1)) },
]

type Store = { bills: Bill[]; add: (b: Omit<Bill, 'id' | 'paid'>) => void; markPaid: (id: number, who: string) => void }
const Ctx = createContext<Store | null>(null)

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState(seed)
  const add: Store['add'] = (b) => setBills((l) => [{ ...b, id: Date.now(), paid: [b.payer] }, ...l])
  const markPaid: Store['markPaid'] = (id, who) => setBills((l) => l.map((b) => (b.id === id && !b.paid.includes(who) ? { ...b, paid: [...b.paid, who] } : b)))
  return <Ctx.Provider value={{ bills, add, markPaid }}>{children}</Ctx.Provider>
}

export function usePayments() {
  const s = useContext(Ctx)
  if (!s) throw new Error('usePayments must be used inside PaymentsProvider')
  return s
}

export function totals(bills: Bill[]) {
  const owe = bills.filter(youOwe).reduce((s, b) => s + share(b), 0)
  const owed = bills.filter(owedToYou).reduce((s, b) => s + share(b) * unpaid(b).length, 0)
  return { owe, owed }
}

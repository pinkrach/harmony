import { roommates, byId } from './data'

/* The chore wheel. The shared house chores are grouped into slices (one per roommate).
   The whole wheel has ONE rhythm: it turns one step every day, week, month or three months, or never (everyone keeps their slice). */

export type Freq = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'never'
export const freqs: Freq[] = ['daily', 'weekly', 'monthly', 'quarterly', 'never']
export const freqLabel: Record<Freq, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Every 3 months', never: 'Stays forever' }
/** What the current stretch is called ("This week") and what "next" means for the preview button. */
export const freqNow: Record<Freq, string> = { daily: 'Today', weekly: 'This week', monthly: 'This month', quarterly: 'These 3 months', never: 'Your chores' }
export const freqNext: Record<Freq, string> = { daily: 'next day', weekly: 'next week', monthly: 'next month', quarterly: 'next 3 months', never: '' }
const periodDays: Record<Freq, number> = { daily: 1, weekly: 7, monthly: 28, quarterly: 91, never: 0 }

export type HouseChore = { id: string; t: string; emoji: string }
export type Pack = { id: string; chores: HouseChore[] }

/** Heavy and light chores are mixed in every slice, and neighbouring slices alternate heavy and light. */
export const starterPacks = (): Pack[] => [
  { id: 'p0', chores: [{ id: 'bath', t: 'Clean the bathroom', emoji: '🛁' }, { id: 'trash', t: 'Take out the trash', emoji: '🗑️' }] },
  { id: 'p1', chores: [{ id: 'vacuum', t: 'Vacuum the living room', emoji: '🛋️' }, { id: 'plants', t: 'Water the plants', emoji: '🪴' }] },
  { id: 'p2', chores: [{ id: 'floors', t: 'Sweep and mop', emoji: '🧹' }, { id: 'counters', t: 'Wipe the kitchen counters', emoji: '🧽' }] },
  { id: 'p3', chores: [{ id: 'oven', t: 'Clean the oven', emoji: '🔥' }, { id: 'fridge', t: 'Clean the fridge', emoji: '🧊' }] },
]

const PACKS_KEY = 'harmony.wheelPacks2'
const FREQ_KEY = 'harmony.wheelFreq'
const DONE_KEY = 'harmony.wheelDone'

export function loadPacks(): Pack[] {
  try {
    const saved = sessionStorage.getItem(PACKS_KEY)
    if (saved) return JSON.parse(saved) as Pack[]
  } catch { /* storage unavailable */ }
  return starterPacks()
}
export function savePacks(p: Pack[]) {
  try { sessionStorage.setItem(PACKS_KEY, JSON.stringify(p)) } catch { /* storage unavailable */ }
}
export function loadFreq(): Freq {
  try {
    const saved = sessionStorage.getItem(FREQ_KEY)
    if (saved && (freqs as string[]).includes(saved)) return saved as Freq
  } catch { /* storage unavailable */ }
  return 'weekly'
}
export function saveFreq(f: Freq) {
  try { sessionStorage.setItem(FREQ_KEY, f) } catch { /* storage unavailable */ }
}
export function loadDone(): Record<string, boolean> {
  try {
    const saved = sessionStorage.getItem(DONE_KEY)
    if (saved) return JSON.parse(saved) as Record<string, boolean>
  } catch { /* storage unavailable */ }
  return { 'weekly0:vacuum': true } // Sofi already vacuumed this week
}
export function saveDone(d: Record<string, boolean>) {
  try { sessionStorage.setItem(DONE_KEY, JSON.stringify(d)) } catch { /* storage unavailable */ }
}

/** Day 0 is Monday, Nov 2, 2026, so weeks, 4-week months and 13-week quarters all line up with Mondays. */
const EPOCH = new Date(2026, 10, 2).getTime()
const DAY = 24 * 3600 * 1000
export const dayIndex = (d = new Date()) => Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - EPOCH) / DAY)

/** How many times the wheel has turned by today (always 0 when it never turns). */
export const stepNow = (freq: Freq) => (freq === 'never' ? 0 : Math.floor(dayIndex() / periodDays[freq]))

const fmt = (x: Date) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const dayText = (x: Date) => x.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
/** "Fri, Nov 6" for a day, "Nov 2 to Nov 8" for longer stretches. */
export function stepRange(step: number, freq: Freq) {
  if (freq === 'never') return 'Until you change the wheel'
  const pd = periodDays[freq]
  const a = new Date(EPOCH + step * pd * DAY + 12 * 3600 * 1000)
  const b = new Date(EPOCH + (step * pd + pd - 1) * DAY + 12 * 3600 * 1000)
  return pd === 1 ? dayText(a) : `${fmt(a)} to ${fmt(b)}`
}
/** Short date shown in the middle of the wheel. */
export function stepStart(step: number, freq: Freq) {
  if (freq === 'never') return 'Always'
  return fmt(new Date(EPOCH + step * periodDays[freq] * DAY + 12 * 3600 * 1000))
}

/** Which roommate (by position) owns slice k after the wheel has turned `step` times. */
export const ownerOf = (k: number, step: number, people: number) => (((k + step) % people) + people) % people

/* Changes to the wheel are proposals: nothing changes until every roommate agrees. */
export type WheelProposal = {
  id: string
  by: string
  kind: 'add' | 'remove' | 'freq'
  slice?: number
  chore?: HouseChore
  freq?: Freq
  votes: Record<string, 'yes' | 'no'>
}
export type WheelState = { packs: Pack[]; freq: Freq; proposals: WheelProposal[] }

const PROPOSALS_KEY = 'harmony.wheelProposals'
const seedProposals = (): WheelProposal[] => [
  { id: 'seed1', by: 'sofi', kind: 'add', slice: 1, chore: { id: 'windows', t: 'Clean the windows', emoji: '🪟' }, votes: { sofi: 'yes', diego: 'yes', mara: 'yes' } },
]
export function loadProposals(): WheelProposal[] {
  try {
    const saved = sessionStorage.getItem(PROPOSALS_KEY)
    if (saved) return JSON.parse(saved) as WheelProposal[]
  } catch { /* storage unavailable */ }
  return seedProposals()
}
export function saveProposals(p: WheelProposal[]) {
  try { sessionStorage.setItem(PROPOSALS_KEY, JSON.stringify(p)) } catch { /* storage unavailable */ }
}
export const loadWheel = (): WheelState => ({ packs: loadPacks(), freq: loadFreq(), proposals: loadProposals() })
export function saveWheel(w: WheelState) { savePacks(w.packs); saveFreq(w.freq); saveProposals(w.proposals) }

export function proposalText(p: WheelProposal, packs: Pack[]) {
  const who = p.by === 'you' ? 'You suggest' : `${byId(p.by).name} suggests`
  const slice = p.slice !== undefined && packs[p.slice] ? packs[p.slice].chores.map((c) => c.emoji).join('') : ''
  if (p.kind === 'add') return `${who} adding “${p.chore?.t}” to the ${slice} slice`
  if (p.kind === 'remove') return `${who} removing “${p.chore?.t}” from the ${slice} slice`
  return `${who} turning the wheel ${p.freq === 'never' ? 'never (everyone keeps their slice)' : freqLabel[p.freq ?? 'weekly'].toLowerCase()}`
}

/** Records one vote. Everyone agreeing applies the change; one "no" drops it. */
export function castVote(w: WheelState, id: string, voter: string, vote: 'yes' | 'no'): { state: WheelState; outcome?: 'applied' | 'rejected'; proposal?: WheelProposal } {
  const p = w.proposals.find((x) => x.id === id)
  if (!p) return { state: w }
  const rest = w.proposals.filter((x) => x.id !== id)
  if (vote === 'no') return { state: { ...w, proposals: rest }, outcome: 'rejected', proposal: p }
  const votes = { ...p.votes, [voter]: 'yes' as const }
  if (!roommates.every((r) => votes[r.id] === 'yes')) return { state: { ...w, proposals: w.proposals.map((x) => (x.id === id ? { ...p, votes } : x)) } }
  let { packs, freq } = w
  if (p.kind === 'add' && p.chore && p.slice !== undefined) packs = packs.map((pk, i) => (i === p.slice ? { ...pk, chores: [...pk.chores, p.chore!] } : pk))
  if (p.kind === 'remove' && p.chore && p.slice !== undefined) packs = packs.map((pk, i) => (i === p.slice ? { ...pk, chores: pk.chores.filter((c) => c.id !== p.chore!.id) } : pk))
  if (p.kind === 'freq' && p.freq) freq = p.freq
  return { state: { packs, freq, proposals: rest }, outcome: 'applied', proposal: p }
}

/** How long until the wheel turns again. `soon` is true when it is close enough that a reminder makes sense. */
export function periodLeft(freq: Freq) {
  if (freq === 'never') return { soon: false, text: 'No deadline', days: 9999 }
  const pd = periodDays[freq]
  const left = pd - 1 - (dayIndex() % pd) // days left after today
  const soon = freq === 'daily' || (freq === 'weekly' && left <= 2) || (freq === 'monthly' && left <= 7) || (freq === 'quarterly' && left <= 14)
  const text = left === 0 ? 'Ends today' : left === 1 ? '1 day left' : `${left} days left`
  return { soon, text, days: left }
}

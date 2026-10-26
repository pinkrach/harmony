import { isLate, useChores, type Chore } from './chores'
import { isOverdue, usePayments, youOwe } from './payments'
import type { Mood } from './components/Pip'

export type Zone = 'low' | 'mid' | 'high'

/** The three zones of the health bar, with where each starts (0–100). */
export const ZONES: { id: Zone; label: string; title: string; from: number }[] = [
  { id: 'low', label: 'Needs love', title: 'Your home needs some love', from: 0 },
  { id: 'mid', label: 'Getting there', title: 'Your home is getting there', from: 34 },
  { id: 'high', label: 'Thriving', title: 'Your home is thriving', from: 67 },
]

export const zoneOf = (score: number): Zone => (score >= 67 ? 'high' : score >= 34 ? 'mid' : 'low')
export const moodOf = (z: Zone): Mood => (z === 'high' ? 'cheer' : z === 'mid' ? 'happy' : 'sad')

/** What Pip says, by how the home is doing. Tap Pip to hear another. */
export const PHRASES: Record<Zone, string[]> = {
  low: [
    'Dishes don’t wash themselves, you know.',
    'I’m not mad. I’m just… dusty.',
    'Is that a sock on the floor? Again?',
    'Psst… the trash is staring at me.',
    'Your future self wants a clean kitchen.',
    'Do a chore and I’ll feel so much better!',
    'Pay a bill and watch me smile.',
  ],
  mid: [
    'Not bad! One more chore and I’m glowing.',
    'We’re getting there. Teamwork!',
    'Halfway to sparkling. Don’t stop now!',
    'I can almost see the floor. Keep going!',
    'Pay a bill and I’ll be glowing.',
  ],
  high: [
    'Your mom would be so proud of you.',
    'This place sparkles. Who are you?!',
    'Clean home, clean vibes.',
    'Roommate of the month? Obviously.',
  ],
}

const quote = (name: string) => `“${name}”`

function why(chores: Chore[]): string | null {
  const late = chores.filter(isLate)
  if (late.length === 1) return `${quote(late[0].t)} is late.`
  if (late.length > 1) return `${quote(late[0].t)} and ${late.length - 1} more ${late.length === 2 ? 'chore is' : 'chores are'} late.`
  return null
}

/**
 * Home health, 0–100, from things people actually do: chores done (late ones hurt) and bills settled
 * (overdue ones hurt). Doing a chore or paying a bill raises it, so Pip's mood follows real life.
 */
export function useHomeHealth() {
  const { chores } = useChores()
  const { bills } = usePayments()

  const done = chores.filter((c) => c.done).length
  const late = chores.filter(isLate).length
  const choreScore = chores.length ? Math.max(0, Math.min(1, done / chores.length - 0.18 * late)) : 1

  const owing = bills.filter(youOwe)
  const overdue = owing.filter(isOverdue).length
  const billScore = bills.length ? Math.max(0, Math.min(1, 1 - owing.length / bills.length - 0.15 * overdue)) : 1

  const score = Math.round(100 * (0.65 * choreScore + 0.35 * billScore))
  const zone = zoneOf(score)
  const next = ZONES.find((z) => z.from > score)
  return {
    score,
    zone,
    title: ZONES.find((z) => z.id === zone)!.title,
    mood: moodOf(zone),
    reason: zone === 'high' ? null : why(chores),
    nextLabel: next?.label ?? (score < 100 ? 'full health' : null),
    ptsToNext: next ? next.from - score : Math.max(0, 100 - score),
  }
}

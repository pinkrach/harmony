export type Roommate = { id: string; name: string; initials: string; color: string; ink: string; home: boolean }

export const roommates: Roommate[] = [
  { id: 'you', name: 'Natalie', initials: 'N', color: '#3bb2ff', ink: '#06304d', home: true },
  { id: 'sofi', name: 'Sofi', initials: 'S', color: '#ff8a80', ink: '#4a1414', home: true },
  { id: 'diego', name: 'Diego', initials: 'D', color: '#ffc83d', ink: '#3a2a00', home: false },
  { id: 'mara', name: 'Mara', initials: 'M', color: '#ff8fc0', ink: '#4d1030', home: true },
]

export const byId = (id: string) => roommates.find((r) => r.id === id)!

// Hours are 24h decimals (7.5 = 7:30am). Timeline spans 6am → midnight.
export const presence: Record<string, [number, number][]> = {
  you: [[6, 8.5], [17.5, 24]],
  sofi: [[6, 9], [13, 14.5], [19, 24]],
  diego: [[7, 10], [16, 24]],
  mara: [[6, 7.5], [11, 15], [18, 24]],
}

export const bathroom: { who: string; start: number; end: number }[] = [
  { who: 'sofi', start: 7, end: 7.5 },
  { who: 'diego', start: 7.5, end: 8 },
  { who: 'you', start: 8, end: 8.5 },
  { who: 'mara', start: 21, end: 21.5 },
]

export const hourLabel = (h: number) => {
  const hh = Math.floor(h)
  const m = h % 1 ? ':30' : ''
  const ap = hh >= 12 && hh < 24 ? 'pm' : 'am'
  const n = hh % 12 === 0 ? 12 : hh % 12
  return `${n}${m}${ap}`
}

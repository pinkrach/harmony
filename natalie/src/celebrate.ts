const COLORS = ['#ffd54a', '#e0566c', '#5f43a8', '#1b7d58', '#8a6fe0']

/**
 * Confetti + "+N XP" at an element (or a point). It is drawn straight on the page, outside React, so it still
 * plays when the thing that triggered it moves to another list or disappears (a chore going from "To do" to "Done",
 * a bill button that vanishes once paid). With reduced motion you get just the XP chip, faded, no flying pieces.
 */
export function celebrate(from: Element | { x: number; y: number }, xp = 10) {
  const rect = 'getBoundingClientRect' in from ? from.getBoundingClientRect() : null
  const x = rect ? rect.left + rect.width / 2 : (from as { x: number }).x
  const y = rect ? rect.top + rect.height / 2 : (from as { y: number }).y
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const box = document.createElement('div')
  box.className = 'fx-burst'
  box.setAttribute('aria-hidden', 'true')
  box.style.left = `${x}px`
  box.style.top = `${y}px`

  if (!reduce) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      const d = 34 + (k % 3) * 12
      const piece = document.createElement('i')
      piece.style.background = COLORS[k % COLORS.length]
      piece.style.setProperty('--dx', `${Math.cos(a) * d}px`)
      piece.style.setProperty('--dy', `${Math.sin(a) * d}px`)
      piece.style.setProperty('--rot', `${k * 70}deg`)
      box.appendChild(piece)
    }
  }
  const label = document.createElement('b')
  label.textContent = `+${xp} XP`
  if (reduce) label.className = 'still'
  box.appendChild(label)

  document.body.appendChild(box)
  window.setTimeout(() => box.remove(), 1100)
}

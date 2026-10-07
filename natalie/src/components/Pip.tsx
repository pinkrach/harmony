type Mood = 'happy' | 'wow' | 'cheer'

/** Pip — Harmony's little house-shaped mascot. */
export function Pip({
  size = 120,
  mood = 'happy',
  wave = false,
  float = false,
}: {
  size?: number
  mood?: Mood
  wave?: boolean
  float?: boolean
}) {
  const cls = ['pip', wave && 'wave', float && 'float'].filter(Boolean).join(' ')
  return (
    <svg viewBox="0 0 120 134" width={size} height={(size * 134) / 120} className={cls} role="img" aria-label="Pip, the Harmony mascot">
      {/* feet */}
      <ellipse cx="42" cy="128" rx="14" ry="6" fill="#d99a00" />
      <ellipse cx="78" cy="128" rx="14" ry="6" fill="#d99a00" />
      {/* chimney */}
      <rect x="78" y="10" width="14" height="26" rx="4" fill="#d94848" />
      {/* body */}
      <rect x="14" y="44" width="92" height="82" rx="32" fill="#ffc83d" />
      <ellipse cx="38" cy="58" rx="12" ry="5" fill="#fff" opacity="0.35" transform="rotate(-20 38 58)" />
      {/* arms */}
      <ellipse cx="12" cy="94" rx="8" ry="12" fill="#ffb41f" transform="rotate(20 12 94)" />
      <g className="arm-r">
        <ellipse cx="108" cy="94" rx="8" ry="12" fill="#ffb41f" transform="rotate(-20 108 94)" />
      </g>
      {/* roof */}
      <path d="M16 52 60 16l44 36z" fill="#ff6b6b" stroke="#ff6b6b" strokeWidth="14" strokeLinejoin="round" />
      <circle cx="60" cy="40" r="6" fill="#ffe1e1" />
      {/* eyes */}
      {mood === 'cheer' ? (
        <>
          <path d="M33 78q9-12 18 0" fill="none" stroke="#1f2a37" strokeWidth="5" strokeLinecap="round" />
          <path d="M69 78q9-12 18 0" fill="none" stroke="#1f2a37" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <g className="eye"><circle cx="42" cy="78" r="12" fill="#fff" /><circle cx={mood === 'wow' ? 42 : 44} cy="79" r="6.5" fill="#1f2a37" /><circle cx="46" cy="75" r="2.2" fill="#fff" /></g>
          <g className="eye"><circle cx="78" cy="78" r="12" fill="#fff" /><circle cx={mood === 'wow' ? 78 : 80} cy="79" r="6.5" fill="#1f2a37" /><circle cx="82" cy="75" r="2.2" fill="#fff" /></g>
        </>
      )}
      {/* cheeks */}
      <circle cx="28" cy="97" r="6" fill="#ff8a80" opacity="0.7" />
      <circle cx="92" cy="97" r="6" fill="#ff8a80" opacity="0.7" />
      {/* mouth */}
      {mood === 'wow' ? (
        <ellipse cx="60" cy="102" rx="6" ry="8" fill="#1f2a37" />
      ) : (
        <path d="M48 98q12 14 24 0z" fill="#1f2a37" stroke="#1f2a37" strokeWidth="3" strokeLinejoin="round" />
      )}
      {mood !== 'wow' && <path d="M54 105q6 4 12 0" fill="none" stroke="#ff8a80" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  )
}

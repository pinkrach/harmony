import type { CSSProperties } from 'react'
import { Pip, type Mood } from './Pip'

const N = 5 // clutter groups; each completed chore tidies one

const pipMood = (removed: number): Mood => (removed <= 1 ? 'sad' : removed === 2 ? 'meh' : removed < N ? 'happy' : 'cheer')

const message = (removed: number) =>
  removed === 0 ? 'Yikes, what a mess! Tick off chores to tidy up.'
  : removed < N / 2 ? 'Getting there. Keep it up!'
  : removed < N ? 'Almost sparkling!'
  : 'Sparkling clean! Nice work, team.'

/** Living room that gets cleaner as chores are completed. */
export default function RoomScene({ done, total }: { done: number; total: number }) {
  const p = total ? done / total : 1
  const removed = Math.min(N, Math.round(p * N))
  const clean = removed / N
  const gone = (k: number) => (k < removed ? ' gone' : '')
  const spark = removed === N

  return (
    <figure className={`room${spark ? ' spark' : ''}`} style={{ '--clean': clean } as CSSProperties}>
      <div className="room-stage">
      <svg viewBox="0 0 400 200" role="img" aria-label={`Living room, ${done} of ${total} chores done. ${message(removed)}`}>
        {/* room */}
        <rect width="400" height="146" fill="#cdbfff" />
        <rect y="136" width="400" height="10" fill="#ffffff" opacity=".55" />
        <rect y="146" width="400" height="54" fill="#e8c79a" />
        <path d="M0 166H400M0 185H400" stroke="#d6b087" strokeWidth="2" />

        {/* window */}
        <rect x="36" y="22" width="86" height="84" rx="6" fill="#fff" />
        <rect x="42" y="28" width="34" height="72" rx="3" fill="#bfe6ff" />
        <rect x="82" y="28" width="34" height="72" rx="3" fill="#bfe6ff" />
        <circle cx="59" cy="48" r="8" fill="#ffe27a" className="sun" />
        <rect x="42" y="28" width="74" height="72" rx="3" fill="#8a7a5a" className="fade-dirty" opacity=".4" />

        {/* picture frame: hangs crooked when messy */}
        <g className="frame">
          <rect x="285" y="26" width="52" height="42" rx="3" fill="#fff" stroke="#7c5cff" strokeWidth="3" />
          <path d="M311 58 l-12 -12 a7 7 0 0 1 12 -8 a7 7 0 0 1 12 8z" fill="#ff5c7a" />
        </g>

        {/* rug + table */}
        <ellipse cx="205" cy="172" rx="108" ry="19" fill="#ff9bb0" />
        <ellipse cx="205" cy="172" rx="90" ry="14" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 6" opacity=".7" />

        {/* sofa */}
        <rect x="124" y="78" width="172" height="52" rx="14" fill="#7c5cff" />
        <rect x="118" y="108" width="184" height="38" rx="12" fill="#6a4be0" />
        <rect x="108" y="96" width="24" height="50" rx="10" fill="#5a3de0" />
        <rect x="288" y="96" width="24" height="50" rx="10" fill="#5a3de0" />
        <rect x="140" y="88" width="62" height="34" rx="10" fill="#9a82ff" />
        <rect x="214" y="88" width="62" height="34" rx="10" fill="#9a82ff" className="cush2" />
        <rect x="124" y="144" width="8" height="8" rx="2" fill="#4a2fd0" />
        <rect x="288" y="144" width="8" height="8" rx="2" fill="#4a2fd0" />

        {/* coffee table */}
        <rect x="170" y="160" width="74" height="8" rx="3" fill="#b9824f" />
        <rect x="176" y="168" width="6" height="14" rx="2" fill="#8d5f34" />
        <rect x="232" y="168" width="6" height="14" rx="2" fill="#8d5f34" />

        {/* plant: perks up as the room gets clean */}
        <g className="leaves">
          <path d="M350 118 C336 108 334 92 342 82 C350 92 352 106 350 118z" fill="#22c58b" />
          <path d="M350 118 C364 110 368 94 360 84 C352 94 350 108 350 118z" fill="#17a874" />
          <path d="M350 118 C350 100 350 84 350 70 C356 86 356 104 350 118z" fill="#2ddc9f" />
        </g>
        <path d="M335 118h30l-4 28h-22z" fill="#e0795a" />

        {/* clutter 0: overflowing trash */}
        <g className={`clutter${gone(0)}`}>
          <rect x="18" y="120" width="34" height="28" rx="4" fill="#7a7a8c" />
          <circle cx="35" cy="116" r="17" fill="#2f2f3f" />
          <circle cx="24" cy="108" r="6" fill="#fff" />
          <circle cx="46" cy="110" r="5" fill="#f2f2f8" />
          <circle cx="60" cy="144" r="5" fill="#fff" />
        </g>
        {/* clutter 1: dirty dishes */}
        <g className={`clutter${gone(1)}`}>
          <ellipse cx="195" cy="157" rx="16" ry="3.5" fill="#fff" stroke="#cfcfe0" />
          <ellipse cx="195" cy="152" rx="15" ry="3.5" fill="#fff" stroke="#cfcfe0" />
          <ellipse cx="195" cy="147" rx="14" ry="3.5" fill="#fff" stroke="#cfcfe0" />
          <circle cx="198" cy="147" r="3" fill="#8a5a3a" />
          <rect x="222" y="148" width="10" height="12" rx="2" fill="#fff" stroke="#cfcfe0" />
        </g>
        {/* clutter 2: clothes on the floor */}
        <g className={`clutter${gone(2)}`}>
          <path d="M262 170 l10 -6 l8 4 l8 -4 l10 6 l-6 8 l-4 -3 v14 h-18 v-14 l-4 3z" fill="#ff7a59" />
          <rect x="298" y="184" width="14" height="6" rx="3" fill="#3bb2ff" transform="rotate(-12 305 187)" />
        </g>
        {/* clutter 3: cobweb + spider */}
        <g className={`clutter${gone(3)}`} stroke="#fff" strokeWidth="1.5" fill="none" opacity=".9">
          <path d="M0 0 L52 8 M0 0 L42 34 M0 0 L14 50 M18 4 Q22 18 12 20 M34 8 Q40 28 22 34" />
          <path d="M52 8 L62 40" stroke="#fff" />
          <circle cx="62" cy="44" r="4" fill="#2f2f3f" stroke="none" />
        </g>
        {/* clutter 4: spill + can */}
        <g className={`clutter${gone(4)}`}>
          <ellipse cx="150" cy="176" rx="20" ry="6" fill="#8a5a3a" opacity=".75" />
          <circle cx="136" cy="168" r="2" fill="#8a5a3a" />
          <circle cx="166" cy="170" r="2.5" fill="#8a5a3a" />
          <rect x="116" y="164" width="9" height="13" rx="2" fill="#ff5c7a" transform="rotate(24 120 170)" />
        </g>

        {/* grime + dust fade out as it gets clean */}
        <rect width="400" height="200" fill="#6b5a2f" className="fade-dirty" opacity=".3" />
        <g className="fade-dirty" fill="#fff">
          <circle className="mote m1" cx="90" cy="120" r="2.5" />
          <circle className="mote m2" cx="240" cy="70" r="2" />
          <circle className="mote m3" cx="320" cy="110" r="3" />
          <circle className="mote m4" cx="170" cy="60" r="2" />
        </g>

        {/* sparkles when spotless */}
        <g className="sparkles" fill="#fff7b0">
          {[[70, 40], [200, 66], [320, 90], [350, 62], [150, 140], [260, 120]].map(([x, y], i) => (
            <path key={i} className="star" style={{ animationDelay: `${i * 0.25}s` }} transform={`translate(${x} ${y})`} d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z" />
          ))}
        </g>
      </svg>
      <div className={`room-pip mood-${pipMood(removed)}`} aria-hidden>
        <Pip size={64} mood={pipMood(removed)} wave={spark} float={spark} />
      </div>
      </div>
      <figcaption className="room-cap">{message(removed)}</figcaption>
    </figure>
  )
}

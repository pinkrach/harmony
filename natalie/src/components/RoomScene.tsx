import type { CSSProperties } from 'react'
import { Pip, type Mood } from './Pip'

const N = 5 // clutter groups; each completed chore tidies one

const pipMood = (removed: number): Mood => (removed <= 1 ? 'sad' : removed === 2 ? 'meh' : removed < N ? 'happy' : 'cheer')

const message = (removed: number) =>
  removed === 0 ? 'Yikes, what a mess! Tick off chores to tidy up.'
  : removed < N / 2 ? 'Getting there. Keep it up!'
  : removed < N ? 'Almost sparkling!'
  : 'Sparkling clean! Nice work, team.'

/** Monstera leaf: heart-shaped, tip up from (0,0). Slits are cut by the #rs-slits mask. */
const MONS = 'M0 0C-6-4-25-9-25-29C-25-43-10-51 0-56C10-51 25-43 25-29C25 -9 6-4 0 0z'
const bigLeaves: [number, number][] = [[-62, 0.95], [60, 0.9], [-34, 1.2], [34, 1.15], [-10, 1.45], [13, 1.3]]
const SHADOW = '#3f2f78' // shadows are tinted purple, never black

const clay = 'url(#rs-clay)'
const clayBig = 'url(#rs-clay-big)'

/** Soft clay-toy living room that gets cleaner as chores are completed. Pip stands in the middle. */
export default function RoomScene({ done, total, bare = false }: { done: number; total: number; bare?: boolean }) {
  const p = total ? done / total : 1
  const removed = Math.min(N, Math.round(p * N))
  const clean = removed / N
  const gone = (k: number) => (k < removed ? ' gone' : '')
  const spark = removed === N

  return (
    <figure className={`room${spark ? ' spark' : ''}${bare ? ' bare' : ''}`} style={{ '--clean': clean } as CSSProperties}>
      <div className="room-stage">
        <svg viewBox="0 0 400 270" role="img" aria-label={`Living room, ${done} of ${total} chores done. ${message(removed)}`}>
          <defs>
            <linearGradient id="rs-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eaf8f0" /><stop offset="1" stopColor="#d9efe2" /></linearGradient>
            <linearGradient id="rs-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d5ecde" /><stop offset="1" stopColor="#c1dfcd" /></linearGradient>
            <radialGradient id="rs-rug" cx=".5" cy=".35" r=".75"><stop offset="0" stopColor="#e0d4f8" /><stop offset="1" stopColor="#c4b0ee" /></radialGradient>
            <linearGradient id="rs-sofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9ccf5" /><stop offset="1" stopColor="#b8a4e8" /></linearGradient>
            <linearGradient id="rs-yellow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe573" /><stop offset="1" stopColor="#ffc928" /></linearGradient>
            <linearGradient id="rs-leaf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#2a7448" /><stop offset="1" stopColor="#52ad6f" /></linearGradient>
            <linearGradient id="rs-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ebbf8e" /><stop offset="1" stopColor="#cb9560" /></linearGradient>
            <linearGradient id="rs-cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fffaf0" /><stop offset="1" stopColor="#f0e5d2" /></linearGradient>
            <radialGradient id="rs-light" cx=".15" cy="0" r="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <linearGradient id="rs-occl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SHADOW} stopOpacity=".22" /><stop offset="1" stopColor={SHADOW} stopOpacity="0" /></linearGradient>

            {/* puffy clay lighting: soft highlight + shading from the top-left */}
            <filter id="rs-clay" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="b" />
              <feDiffuseLighting in="b" surfaceScale="2.6" diffuseConstant="1.1" lightingColor="#fff" result="d"><feDistantLight azimuth="235" elevation="58" /></feDiffuseLighting>
              <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="shaded" />
              <feSpecularLighting in="b" surfaceScale="2.6" specularConstant=".5" specularExponent="26" lightingColor="#fff" result="s"><feDistantLight azimuth="235" elevation="55" /></feSpecularLighting>
              <feComposite in="s" in2="SourceAlpha" operator="in" result="sIn" />
              <feComposite in="shaded" in2="sIn" operator="arithmetic" k1="0" k2="1" k3=".5" k4="0" />
            </filter>
            <filter id="rs-clay-big" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3.6" result="b" />
              <feDiffuseLighting in="b" surfaceScale="3.6" diffuseConstant="1.1" lightingColor="#fff" result="d"><feDistantLight azimuth="235" elevation="55" /></feDiffuseLighting>
              <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="shaded" />
              <feSpecularLighting in="b" surfaceScale="3.6" specularConstant=".4" specularExponent="30" lightingColor="#fff" result="s"><feDistantLight azimuth="235" elevation="52" /></feSpecularLighting>
              <feComposite in="s" in2="SourceAlpha" operator="in" result="sIn" />
              <feComposite in="shaded" in2="sIn" operator="arithmetic" k1="0" k2="1" k3=".45" k4="0" />
            </filter>
            <filter id="rs-soft" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="3.2" /></filter>
            <filter id="rs-contact" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="1.4" /></filter>
            {/* felt: fuzzy rug edge */}
            <filter id="rs-felt" x="-5%" y="-10%" width="110%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="t" />
              <feDisplacementMap in="SourceGraphic" in2="t" scale="2.6" />
            </filter>
            {/* clay grain */}
            <filter id="rs-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="7" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer><feFuncA type="table" tableValues="0 .55" /></feComponentTransfer>
            </filter>
            <mask id="rs-slits" maskUnits="userSpaceOnUse" x="-40" y="-70" width="80" height="80">
              <rect x="-40" y="-70" width="80" height="80" fill="#fff" />
              <g stroke="#000" strokeWidth="3.4" strokeLinecap="round" fill="none">
                <path d="M-27-38L-10-33M-27-24L-11-24M-24-11L-9-15M27-38L10-33M27-24L11-24M24-11L9-15" />
              </g>
            </mask>
          </defs>

          {/* room */}
          {!bare && (
            <>
              <rect width="400" height="188" fill="url(#rs-wall)" />
              <rect y="184" width="400" height="86" fill="url(#rs-floor)" />
              <rect y="184" width="400" height="5" fill="#fff" opacity=".6" />
              <rect y="188" width="400" height="14" fill="url(#rs-occl)" />
            </>
          )}

          {/* picture frame: hangs crooked when messy */}
          <g className="frame" filter={clay}>
            <rect x="196" y="22" width="56" height="48" rx="4" fill="url(#rs-wood)" />
            <rect x="203" y="29" width="42" height="34" rx="2" fill="#fbf3e4" />
            <circle cx="236" cy="39" r="5.5" fill="#ffd23f" />
            <path d="M208 52c0-9 7-12 11-9s5 9 3 14h-12c-1-1-2-3-2-5z" fill="#cdbdf0" />
            <path d="M228 58c0-7 4-10 8-8s4 6 3 10h-9z" fill="#5a3d7a" />
          </g>

          {/* rug: felt with fuzzy edge */}
          <ellipse cx="205" cy="228" rx="134" ry="36" fill={SHADOW} opacity=".14" filter="url(#rs-soft)" />
          <g filter="url(#rs-felt)">
            <g filter={clayBig}>
              <ellipse cx="205" cy="226" rx="132" ry="34" fill="url(#rs-rug)" />
            </g>
          </g>
          <ellipse cx="205" cy="226" rx="112" ry="25" fill="none" stroke="#fff" strokeOpacity=".38" strokeWidth="2" />

          {/* sofa */}
          <ellipse cx="205" cy="208" rx="122" ry="9" fill={SHADOW} opacity=".24" filter="url(#rs-soft)" />
          <g filter={clayBig}>
            <rect x="110" y="108" width="190" height="68" rx="34" fill="url(#rs-sofa)" />
            <rect x="94" y="126" width="44" height="74" rx="22" fill="url(#rs-sofa)" />
            <rect x="272" y="126" width="44" height="74" rx="22" fill="url(#rs-sofa)" />
            <rect x="116" y="148" width="178" height="48" rx="24" fill="#cdbdf1" />
          </g>
          <rect x="132" y="150" width="146" height="14" rx="7" fill="url(#rs-occl)" />
          <g filter={clay}>
            <rect x="128" y="196" width="10" height="15" rx="5" fill="url(#rs-wood)" />
            <rect x="272" y="196" width="10" height="15" rx="5" fill="url(#rs-wood)" />
          </g>
          {/* cushions: slide off the sofa when messy */}
          <g className="cushA" filter={clay}>
            <path d="M138 120Q160 111 183 120Q191 139 183 159Q160 168 138 159Q130 139 138 120z" fill="url(#rs-yellow)" />
            <path d="M146 130Q160 144 176 150" stroke="#e6a800" strokeOpacity=".35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
          <g filter={clay}>
            <path d="M234 124Q255 116 277 124Q284 142 277 160Q255 167 234 160Q227 142 234 124z" fill="url(#rs-cream)" />
            <path d="M242 134Q256 146 270 150" stroke="#d9c9ae" strokeOpacity=".6" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          <g className="cushB" filter={clay}>
            <circle cx="268" cy="150" r="19" fill="url(#rs-yellow)" />
            <circle cx="268" cy="150" r="3.2" fill="#d9a300" />
            <path d="M268 150L254 142M268 150L282 142M268 150L254 158M268 150L282 158" stroke="#e6a800" strokeOpacity=".45" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* coffee table */}
          <g transform="translate(8 0)">
            <ellipse cx="124" cy="232" rx="48" ry="7" fill={SHADOW} opacity=".26" filter="url(#rs-soft)" />
            <g filter={clay}>
              <rect x="94" y="218" width="8" height="22" rx="4" fill="url(#rs-wood)" transform="rotate(9 98 228)" />
              <rect x="146" y="218" width="8" height="22" rx="4" fill="url(#rs-wood)" transform="rotate(-9 150 228)" />
              <rect x="107" y="214" width="7" height="20" rx="3.5" fill="#bb8450" />
              <rect x="136" y="214" width="7" height="20" rx="3.5" fill="#bb8450" />
              <ellipse cx="124" cy="215" rx="47" ry="12.5" fill="#eadfca" />
              <ellipse cx="124" cy="211" rx="47" ry="12.5" fill="url(#rs-cream)" />
            </g>
            <ellipse cx="116" cy="207" rx="20" ry="3.4" fill={SHADOW} opacity=".3" filter="url(#rs-contact)" />
            <g filter={clay}>
              <rect x="104" y="200" width="36" height="7.5" rx="2.5" fill="#f3ead8" />
              <rect x="106" y="193" width="32" height="7.5" rx="2.5" fill="#cdbdf0" />
              <rect x="110" y="195.5" width="24" height="1.4" rx=".7" fill="#fff" opacity=".6" />
              <rect x="146" y="195" width="14" height="15" rx="5" fill="#5a3d7a" />
              <path d="M159.5 199c7 0 7 9 0 9" fill="none" stroke="#5a3d7a" strokeWidth="2.6" />
              <ellipse cx="153" cy="195.5" rx="6" ry="1.8" fill="#3b2a56" />
              <rect x="91" y="198" width="13" height="10" rx="4" fill="url(#rs-cream)" />
              <path d="M97.5 198c-5-6-5-10-2-12 3 2 3 7 2 12zM97.5 198c5-6 6-9 4-12-3 2-5 6-4 12z" fill="url(#rs-leaf)" />
            </g>
          </g>

          {/* monstera */}
          <ellipse cx="62" cy="238" rx="32" ry="6" fill={SHADOW} opacity=".24" filter="url(#rs-soft)" />
          <g className="leaves">
            {bigLeaves.map(([a, s], i) => (
              <g key={i} filter={clay} transform={`translate(62 200) rotate(${a}) scale(${s})`}>
                <path d={MONS} fill="url(#rs-leaf)" mask="url(#rs-slits)" />
                <path d="M0-2V-48M0-22L-12-32M0-22L12-32M0-36L-9-43M0-36L9-43" stroke="#2a6e44" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </g>
            ))}
          </g>
          <g filter={clay}>
            <rect x="36" y="196" width="52" height="42" rx="20" fill="url(#rs-cream)" />
            <ellipse cx="62" cy="198" rx="24" ry="6" fill="#efe3cf" />
            <ellipse cx="62" cy="199" rx="21" ry="4.6" fill="#6b4a3a" />
          </g>

          {/* bookshelf */}
          <ellipse cx="352" cy="238" rx="40" ry="6" fill={SHADOW} opacity=".26" filter="url(#rs-soft)" />
          <g filter={clayBig}>
            <rect x="318" y="124" width="68" height="104" rx="8" fill="url(#rs-wood)" />
          </g>
          <rect x="324" y="130" width="56" height="42" rx="4" fill="#efd4ac" />
          <rect x="324" y="176" width="56" height="44" rx="4" fill="#efd4ac" />
          <rect x="324" y="130" width="56" height="8" rx="4" fill="url(#rs-occl)" />
          <rect x="324" y="176" width="56" height="8" rx="4" fill="url(#rs-occl)" />
          <g filter={clay}>
            <rect x="326" y="226" width="9" height="13" rx="3.5" fill="url(#rs-wood)" />
            <rect x="370" y="226" width="9" height="13" rx="3.5" fill="url(#rs-wood)" />
            <rect className="bk" style={{ '--r': '-14deg' } as CSSProperties} x="327" y="144" width="8" height="28" rx="3" fill="#bda9ea" />
            <rect x="336" y="140" width="8" height="32" rx="3" fill="#f4eee2" />
            <rect className="bk" style={{ '--r': '12deg' } as CSSProperties} x="345" y="146" width="8" height="26" rx="3" fill="#ffd84f" />
            <rect x="354" y="142" width="7" height="30" rx="3" fill="#a8d5ae" />
            <path d="M363 172v-20a6 6 0 0 1 12 0v20z" fill="#5a3d7a" />
            <rect x="328" y="200" width="9" height="20" rx="3" fill="#bda9ea" />
            <rect x="338" y="196" width="8" height="24" rx="3" fill="#f4eee2" />
            <rect x="347" y="200" width="8" height="20" rx="3" fill="#ffd84f" />
            <path d="M359 220v-4a9 9 0 0 1 18 0v4z" fill="url(#rs-cream)" />
          </g>
          <g filter={clay}>
            <rect x="338" y="111" width="19" height="15" rx="6" fill="url(#rs-cream)" />
            <g transform="translate(347.500 112)">
              <path d={MONS} transform="rotate(-42) scale(.34)" fill="url(#rs-leaf)" />
              <path d={MONS} transform="rotate(36) scale(.34)" fill="url(#rs-leaf)" />
              <path d={MONS} transform="rotate(-3) scale(.42)" fill="url(#rs-leaf)" />
            </g>
          </g>

          {/* clutter 0: overflowing trash */}
          <g className={`clutter${gone(0)}`} filter={clay}>
            <rect x="8" y="208" width="30" height="30" rx="6" fill="#9c9cb0" />
            <circle cx="23" cy="204" r="16" fill="#3b3b50" />
            <circle cx="14" cy="196" r="6" fill="#fff" />
            <circle cx="33" cy="198" r="5" fill="#f2f2f8" />
            <circle cx="44" cy="240" r="5" fill="#fff" />
          </g>
          {/* clutter 1: dirty dishes on the table */}
          <g className={`clutter${gone(1)}`} filter={clay}>
            <ellipse cx="132" cy="197" rx="17" ry="4" fill="#fff" stroke="#d2d2e4" />
            <ellipse cx="132" cy="192" rx="16" ry="4" fill="#fff" stroke="#d2d2e4" />
            <ellipse cx="132" cy="187" rx="15" ry="4" fill="#fff" stroke="#d2d2e4" />
            <circle cx="136" cy="187" r="3" fill="#8a5a3a" />
            <rect x="114" y="194" width="9" height="12" rx="3" fill="#fff" stroke="#d2d2e4" />
          </g>
          {/* clutter 2: clothes on the floor */}
          <g className={`clutter${gone(2)}`} filter={clay}>
            <path d="M296 244l10-6 8 4 8-4 10 6-6 8-4-3v13h-18v-13l-4 3z" fill="#ff7a59" />
            <rect x="338" y="256" width="14" height="6" rx="3" fill="#3bb2ff" transform="rotate(-12 345 259)" />
          </g>
          {/* clutter 3: cobweb + spider */}
          <g className={`clutter${gone(3)}`} stroke="#fff" strokeWidth="1.6" fill="none" opacity=".95">
            <path d="M0 0L58 8M0 0L46 38M0 0L16 56M20 4Q25 20 13 22M38 9Q45 31 24 38" />
            <path d="M58 8L68 44" />
            <circle cx="68" cy="48" r="4" fill="#2f2f3f" stroke="none" />
          </g>
          {/* clutter 4: toppled books + spill */}
          <g className={`clutter${gone(4)}`} filter={clay}>
            <ellipse cx="170" cy="244" rx="20" ry="6" fill="#8a5a3a" opacity=".78" />
            <rect x="268" y="244" width="26" height="8" rx="3" fill="#bda9ea" transform="rotate(-12 281 248)" />
            <rect x="274" y="252" width="26" height="8" rx="3" fill="#f4eee2" transform="rotate(8 287 256)" />
            <rect x="156" y="236" width="9" height="13" rx="3" fill="#ff5c7a" transform="rotate(24 160 242)" />
          </g>

          {/* grime + dust fade out as it gets clean */}
          {!bare && <rect width="400" height="270" fill="#6b5a2f" className="fade-dirty" opacity=".3" />}
          <g className="fade-dirty" fill="#fff">
            <circle className="mote m1" cx="90" cy="120" r="2.5" />
            <circle className="mote m2" cx="250" cy="80" r="2" />
            <circle className="mote m3" cx="310" cy="150" r="3" />
            <circle className="mote m4" cx="170" cy="90" r="2" />
          </g>

          {/* window light + clay grain */}
          {!bare && <rect width="400" height="270" fill="url(#rs-light)" />}
          <rect width="400" height="270" filter="url(#rs-grain)" opacity=".1" style={{ mixBlendMode: 'multiply' }} />

          {/* sparkles when spotless */}
          <g className="sparkles" fill="#fff7b0">
            {[[60, 70], [190, 100], [310, 100], [372, 96], [120, 180], [280, 210]].map(([x, y], i) => (
              <path key={i} className="star" style={{ animationDelay: `${i * 0.25}s` }} transform={`translate(${x} ${y})`} d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z" />
            ))}
          </g>
        </svg>
        <div className={`room-pip mood-${pipMood(removed)}`} aria-hidden>
          <Pip size={64} mood={pipMood(removed)} wave={spark} float={spark} clay />
        </div>
      </div>
      {!bare && <figcaption className="room-cap">{message(removed)}</figcaption>}
    </figure>
  )
}

import { useEffect, useState } from 'react'
import front from '../assets/pip/front.webp'
import body from '../assets/pip/body.webp'
import footL from '../assets/pip/foot-l.webp'
import footR from '../assets/pip/foot-r.webp'
import eyesBlink from '../assets/pip/eyes-blink.webp'
import eyesJoy from '../assets/pip/eyes-joy.webp'
import wavePose from '../assets/pip/wave.webp'
import grumpyPose from '../assets/pip/grumpy.webp'

export type Mood = 'happy' | 'wow' | 'cheer' | 'sad' | 'meh'
type Pose = 'front' | 'wave' | 'grumpy'

/** Which of the three clay poses fits the mood. */
const poseFor = (mood: Mood): Pose => (mood === 'sad' || mood === 'meh' ? 'grumpy' : mood === 'cheer' ? 'wave' : 'front')

/**
 * Pip, Harmony's clay house mascot.
 * - happy / wow: front pose. Blinks, breathes, squints a smile now and then, hops when poked.
 * - cheer: winking wave pose with a little bounce.
 * - sad / meh: grumpy arms-crossed pose.
 * - `wave`: front pose that greets with a wave every few seconds.
 * - `walk`: front pose with a waddling walk cycle (feet step one after the other). Use it while something loads.
 * Under 64px it renders as one still image (header, tiny spots).
 */
export function Pip({
  size = 120,
  mood = 'happy',
  wave = false,
  float = false,
  walk = false,
  poke = 0,
}: {
  size?: number
  mood?: Mood
  wave?: boolean
  float?: boolean
  walk?: boolean
  /** Change this number to make Pip hop (e.g. when the user finishes something). */
  poke?: number
  /** Kept for old call sites: the clay look is baked into the images now. */
  clay?: boolean
}) {
  const basePose: Pose = walk ? 'front' : poseFor(mood)
  const [boop, setBoop] = useState(false)
  const [greeting, setGreeting] = useState(false)
  useEffect(() => { if (poke) setBoop(true) }, [poke])
  const canGreet = wave && !walk && basePose === 'front' && size >= 64

  // `wave`: say hi with the waving pose for ~1.8s every 14s (first hello after ~1.2s).
  useEffect(() => {
    if (!canGreet) return
    let off: ReturnType<typeof setTimeout>
    const hello = () => {
      setGreeting(true)
      off = setTimeout(() => setGreeting(false), 1800)
    }
    const first = setTimeout(hello, 1200)
    const every = setInterval(hello, 14000)
    return () => { clearTimeout(first); clearInterval(every); clearTimeout(off) }
  }, [canGreet])

  const pose: Pose = canGreet && greeting ? 'wave' : basePose
  const cls = ['pip', 'pip3d', float && 'float', walk && 'walk', boop && 'boop'].filter(Boolean).join(' ')
  const style = { '--pip-size': `${size}px`, '--blink-delay': `${((size * 7) % 31) / 10}s` } as React.CSSProperties

  if (size < 64) {
    return (
      <span className={cls} style={style} data-pose={pose} role="img" aria-label="Pip, the Harmony mascot">
        <img className="pip-l pip-still" src={pose === 'grumpy' ? grumpyPose : pose === 'wave' ? wavePose : front} alt="" draggable={false} />
      </span>
    )
  }

  return (
    <span
      className={cls}
      style={style}
      data-pose={pose}
      role="img"
      aria-label="Pip, the Harmony mascot"
      onClick={() => !walk && setBoop(true)}
      onAnimationEnd={(e) => e.animationName === 'pip-boop' && setBoop(false)}
    >
      <span className="pip-rig">
        <img className="pip-l pip-foot-l" src={footL} alt="" draggable={false} />
        <img className="pip-l pip-foot-r" src={footR} alt="" draggable={false} />
        <img className="pip-l pip-body" src={body} alt="" draggable={false} />
        <img className="pip-l pip-lids" src={eyesBlink} alt="" draggable={false} />
        <img className="pip-l pip-joy" src={eyesJoy} alt="" draggable={false} />
        <img className="pip-l pip-wave" src={wavePose} alt="" draggable={false} />
        <img className="pip-l pip-grumpy" src={grumpyPose} alt="" draggable={false} />
      </span>
    </span>
  )
}

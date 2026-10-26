import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Pip, type Mood } from './Pip'
import { Rail } from './ui'
import roomDirty from '../assets/room-dirty.webp'
import roomMedium from '../assets/room-medium.webp'
import roomClean from '../assets/room-clean.webp'

const N = 5 // each completed chore moves the room one step toward clean

const pipMood = (removed: number): Mood => (removed <= 1 ? 'sad' : removed === 2 ? 'meh' : removed < N ? 'happy' : 'cheer')

const message = (removed: number) =>
  removed === 0 ? 'Yikes, what a mess! Tick off chores to tidy up.'
  : removed < N / 2 ? 'Getting there. Keep it up!'
  : removed < N ? 'Almost sparkling!'
  : 'Sparkling clean! Nice work, team.'

const clamp = (v: number) => Math.max(0, Math.min(1, v))

const sparkles: [number, number][] = [[14, 20], [38, 14], [66, 12], [86, 28], [28, 56], [78, 62]]

/**
 * Chores room built from three photos (very dirty → half clean → spotless) that cross-fade as chores get done.
 * Pip stands on the rug and changes mood.
 */
export default function RoomScene({ done, total, bare = false }: { done: number; total: number; bare?: boolean }) {
  const p = total ? done / total : 1
  const removed = Math.min(N, Math.round(p * N))
  const clean = removed / N
  const spark = removed === N
  const mood = pipMood(removed)
  const prevDone = useRef(done)
  const [poke, setPoke] = useState(0)
  useEffect(() => {
    if (done > prevDone.current) setPoke((n) => n + 1)
    prevDone.current = done
  }, [done])

  return (
    <figure className={`room${spark ? ' spark' : ''}${bare ? ' bare' : ''}`} style={{ '--clean': clean } as CSSProperties}>
      <div className="room-stage room-photo" role="img" aria-label={`Living room, ${done} of ${total} chores done. ${message(removed)}`}>
        <img className="room-img" src={roomDirty} alt="" draggable={false} />
        <img className="room-img" src={roomMedium} alt="" draggable={false} style={{ opacity: clamp(clean * 2) }} />
        <img className="room-img" src={roomClean} alt="" draggable={false} style={{ opacity: clamp(clean * 2 - 1) }} />

        <div className="sparkles" aria-hidden>
          {sparkles.map(([x, y], i) => (
            <svg key={i} className="star" viewBox="-10 -10 20 20" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.25}s` }}>
              <path d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z" fill="#fff7b0" />
            </svg>
          ))}
        </div>

        <div className={`room-pip mood-${mood}`} aria-hidden>
          <Pip size={64} mood={mood} wave={spark} float={spark} poke={poke} clay />
        </div>
      </div>
      {!bare && <Rail className="room-rail" value={p * 100} label={`${done} of ${total} chores done`} />}
      {!bare && <figcaption className="room-cap">{message(removed)}</figcaption>}
    </figure>
  )
}

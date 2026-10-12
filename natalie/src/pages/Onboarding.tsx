import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Car, ClipboardList, Copy, DoorOpen, Home, HousePlus, KeyRound, Sparkles, Trophy, Wallet } from 'lucide-react'
import { Pip } from '../components/Pip'
import { Avatar, Chip, Progress, Toggle } from '../components/ui'

const HOUSE_KEY = 'harmony-house'
const HOUSE_CODE = 'GIR-4821'

type HouseSetup = { mode: 'join' | 'create'; name: string; from: string; code?: string }

function saveHouse(setup: HouseSetup) {
  sessionStorage.setItem(HOUSE_KEY, JSON.stringify(setup))
}

function loadHouse(): HouseSetup {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HOUSE_KEY) || '')
    if (saved?.mode === 'join' || saved?.mode === 'create') return saved
  } catch { /* use the sample house */ }
  return { mode: 'join', name: 'Casa Girasol', from: '/login' }
}

function Step({ step, total = 5, place, back, say, mood = 'happy', children, cta, to, onCta, ctaDisabled }: { step: number; total?: number; place: string; back: string; say: string; mood?: 'happy' | 'wow' | 'cheer'; children: ReactNode; cta?: string; to?: string; onCta?: () => void; ctaDisabled?: boolean }) {
  const nav = useNavigate()
  return (
    <div className="ob">
      <div className="ob-top">
        <button className="ob-back" aria-label="Back" onClick={() => nav(back)}><ArrowLeft aria-hidden /></button>
        <div className="ob-where">
          <Progress value={(step / total) * 100} tone="yellow" />
          <p className="ob-place">{place}</p>
        </div>
      </div>
      <div className="ob-body page">
        <div className="ob-speech">
          <Pip size={84} mood={mood} wave />
          <div className="bubble">{say}</div>
        </div>
        {children}
      </div>
      {cta && (
        <div className="ob-foot">
          <button className="btn block yellow" disabled={ctaDisabled} onClick={() => { if (!ctaDisabled) (onCta ? onCta() : nav(to || '/')) }}>{cta}</button>
        </div>
      )}
    </div>
  )
}

export function HouseChoice() {
  const nav = useNavigate()
  const [stay, setStay] = useState(true)
  return (
    <Step step={1} total={5} place="Your house" back="/login?form=login" say="You’re already in a house." cta="Continue" onCta={() => nav(stay ? '/app/home' : '/household?from=login')}>
      <button className="choice" aria-pressed={stay} onClick={() => setStay(true)}>
        <span className="ico bg-teal"><Home size={28} aria-hidden /></span>
        <span><b>Stay in this house</b><span className="d">Casa Girasol</span></span>
      </button>
      <button className="choice" aria-pressed={!stay} onClick={() => setStay(false)}>
        <span className="ico bg-coral"><DoorOpen size={28} aria-hidden /></span>
        <span><b>Select a new house</b><span className="d">Join or create a different one</span></span>
      </button>
    </Step>
  )
}

export function Household() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') === 'login' ? 'login' : 'signup'
  const [mode, setMode] = useState<'join' | 'create'>('join')

  const continueOn = () => {
    nav(mode === 'join' ? `/join?from=${from}` : `/create?from=${from}`)
  }

  return (
    <Step step={from === 'login' ? 2 : 1} total={5} place="Join or create" back={from === 'login' ? '/house' : '/login?form=signup'} say="Join a house or start a new one." cta="Continue" onCta={continueOn}>
      <button className="choice" aria-pressed={mode === 'join'} onClick={() => setMode('join')}>
        <span className="ico bg-teal"><KeyRound size={28} aria-hidden /></span>
        <span><b>Join a household</b><span className="d">Your roommate shared a code</span></span>
      </button>
      <button className="choice" aria-pressed={mode === 'create'} onClick={() => setMode('create')}>
        <span className="ico bg-coral"><HousePlus size={28} aria-hidden /></span>
        <span><b>Create a household</b><span className="d">Start fresh and invite everyone</span></span>
      </button>
    </Step>
  )
}

export function CreateHousehold() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') === 'login' ? 'login' : 'signup'
  const [name, setName] = useState(params.get('name') || '')
  const trimmed = name.trim()

  const continueOn = () => {
    if (!trimmed) return
    saveHouse({ mode: 'create', name: trimmed, from })
    nav('/invite')
  }

  return (
    <Step step={from === 'login' ? 3 : 2} total={5} place="House name" back={`/household?from=${from}`} say="What should we call this house?" cta="Continue" onCta={continueOn} ctaDisabled={!trimmed}>
      <div className="field">
        <label htmlFor="hname">Household name</label>
        <input id="hname" className="input plain light" placeholder="Maple House" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
    </Step>
  )
}

const FOUND_HOUSE = 'Casa Girasol'

export function JoinHousehold() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') === 'login' ? 'login' : 'signup'
  const [code, setCode] = useState(params.get('code') || '')
  const [miss, setMiss] = useState(false)
  const [copied, setCopied] = useState(false)
  const trimmed = code.trim()

  const continueOn = () => {
    if (!trimmed) return
    if (trimmed.toUpperCase() !== HOUSE_CODE) {
      setMiss(true)
      return
    }
    nav(`/join/confirm?from=${from}&code=${encodeURIComponent(trimmed)}`)
  }

  const copyHint = async () => {
    try { await navigator.clipboard.writeText(HOUSE_CODE) } catch { /* still show it was copied */ }
    setCopied(true)
  }

  return (
    <Step step={from === 'login' ? 3 : 2} total={5} place="House code" back={`/household?from=${from}`} say="Enter the household code." cta="Continue" onCta={continueOn} ctaDisabled={!trimmed}>
      <div className="field">
        <label htmlFor="hcode">Household code</label>
        <input id="hcode" className="input plain light" placeholder="ABC-1234" value={code} onChange={(e) => { setCode(e.target.value); setMiss(false) }} autoCapitalize="characters" />
      </div>
      {miss && <p className="field-error">No house found.</p>}
      <p className="code-hint">The only code right now is <button type="button" onClick={copyHint}>{copied ? 'Copied' : HOUSE_CODE}</button></p>
    </Step>
  )
}

export function JoinConfirm() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') === 'login' ? 'login' : 'signup'
  const code = (params.get('code') || '').trim()

  const confirm = () => {
    if (code.toUpperCase() !== HOUSE_CODE) return
    saveHouse({ mode: 'join', name: FOUND_HOUSE, code, from })
    nav('/invite')
  }

  if (!code || code.toUpperCase() !== HOUSE_CODE) return <Navigate to={`/join?from=${from}`} replace />

  return (
    <Step step={from === 'login' ? 4 : 3} total={5} place="Confirm house" back={`/join?from=${from}&code=${encodeURIComponent(code)}`} say="Is this your house?" cta="Confirm" onCta={confirm}>
      <div className="card tint-teal">
        <div className="muted" style={{ fontWeight: 800, fontSize: 13 }}>{code.toUpperCase()}</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700 }}>{FOUND_HOUSE}</div>
      </div>
    </Step>
  )
}

const joined = [
  { id: 'sofi', name: 'Sofi' },
  { id: 'diego', name: 'Diego' },
  { id: 'mara', name: 'Mara' },
]

export function Invite() {
  const setup = loadHouse()
  const joining = setup.mode === 'join'
  const code = joining && setup.code ? setup.code : HOUSE_CODE
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(code) } catch { /* still show it was copied */ }
    setCopied(true)
  }
  const from = setup.from === 'login' ? 'login' : 'signup'
  const back = joining
    ? `/join/confirm?from=${from}&code=${encodeURIComponent(setup.code || '')}`
    : `/create?from=${from}&name=${encodeURIComponent(setup.name)}`

  return (
    <Step step={setup.from === 'login' ? 5 : 4} total={5} place="Your household" back={back} say={joining ? 'You’re in. Here’s who is already here.' : 'Your house is ready.'} mood="cheer" cta={setup.from === 'login' ? 'Open Harmony' : 'Continue'} to={setup.from === 'login' ? '/app/home' : '/preferences'}>
      <div className="card tint-teal">
        <div className="muted" style={{ fontWeight: 800, fontSize: 13 }}>{setup.name.toUpperCase()}</div>
        <div className="row between">
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 36, letterSpacing: 6, fontWeight: 700 }}>{code.toUpperCase()}</span>
          <button type="button" className="btn sm ghost" onClick={copy}><Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy'}</button>
        </div>
        <p className="muted" style={{ fontWeight: 700, margin: '8px 0 0' }}>You can send this code to roommates later in the app.</p>
      </div>

      <div>
        <div className="section-head"><h2>{setup.mode === 'join' ? 'Already signed up' : 'Roommates'}</h2></div>
        {setup.mode === 'join' ? (
          <div className="card flat stack">
            {joined.map((person) => (
              <div className="row" key={person.id}>
                <Avatar id={person.id} />
                <b className="grow">{person.name}</b>
                <Chip tone="teal">Joined</Chip>
              </div>
            ))}
          </div>
        ) : (
          <div className="card flat">
            <p className="muted" style={{ fontWeight: 700 }}>No roommates yet. You’re the first one here.</p>
          </div>
        )}
      </div>

    </Step>
  )
}

const prefs = [
  { icon: ClipboardList, tone: 'bg-teal', t: 'Chore reminders', d: 'Due soon and overdue', on: true },
  { icon: Wallet, tone: 'bg-purple', t: 'Payments', d: 'New bills and payments received', on: true },
  { icon: Sparkles, tone: 'bg-purple', t: 'Shopping lists', d: 'When roommates update a list', on: true },
  { icon: Car, tone: 'bg-coral', t: 'Parking & calendar', d: 'Permits, conflicts and events', on: false },
]

export function Preferences() {
  return (
    <Step step={5} total={5} place="Preferences" back="/invite" say="Make it yours!" mood="wow" cta="Open Harmony" to="/app/home">
      <div className="card flat stack">
        {prefs.map(({ icon: I, tone, t, d, on }) => (
          <div className="row" key={t}>
            <span className={`bubble-ico ${tone}`}><I size={22} aria-hidden /></span>
            <div className="grow"><div style={{ fontWeight: 800 }}>{t}</div><div className="muted" style={{ fontSize: 14, fontWeight: 600 }}>{d}</div></div>
            <Toggle label={t} defaultOn={on} />
          </div>
        ))}
      </div>
      <div className="card tint-purple row">
        <span className="bubble-ico bg-purple"><Trophy size={22} aria-hidden /></span>
        <div className="grow">
          <b>Fun features</b>
          <div className="muted" style={{ fontSize: 14, fontWeight: 700 }}>Points, streaks & challenges. Never blocks a task.</div>
        </div>
        <Toggle label="Fun features" defaultOn />
      </div>
      <p className="muted" style={{ fontSize: 13, fontWeight: 700 }}>You can change all of this later.</p>
    </Step>
  )
}

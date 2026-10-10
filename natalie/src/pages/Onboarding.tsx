import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bell, CalendarDays, Car, ClipboardList, Copy, DoorOpen, Home, Mail, MessageSquare, Smartphone, Sparkles, Trophy, Wallet } from 'lucide-react'
import { Pip } from '../components/Pip'
import { Avatar, Chip, Progress, Segmented, Toggle } from '../components/ui'

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

function Step({ step, total = 3, back, say, mood = 'happy', children, cta, to, onCta, cancel, ctaDisabled }: { step: number; total?: number; back: string; say: string; mood?: 'happy' | 'wow' | 'cheer'; children: ReactNode; cta?: string; to?: string; onCta?: () => void; cancel?: () => void; ctaDisabled?: boolean }) {
  const nav = useNavigate()
  return (
    <div className="ob">
      <div className="ob-top">
        <button className="ob-back" aria-label="Back" onClick={() => nav(back)}><ArrowLeft aria-hidden /></button>
        <Progress value={(step / total) * 100} />
      </div>
      <div className="ob-body page">
        <div className="ob-speech">
          <Pip size={84} mood={mood} wave />
          <div className="bubble">{say}</div>
        </div>
        {children}
      </div>
      {(cta || cancel) && (
        <div className="ob-foot" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cta && (
            <button className="btn block" disabled={ctaDisabled} onClick={() => { if (!ctaDisabled) (onCta ? onCta() : nav(to || '/')) }}>{cta}</button>
          )}
          {cancel && <button type="button" className="btn block ghost" onClick={cancel}>Cancel</button>}
        </div>
      )}
    </div>
  )
}

export function HouseChoice() {
  const nav = useNavigate()
  const [stay, setStay] = useState(true)
  return (
    <Step step={1} back="/login" say="You’re already in a house." cta="Continue" onCta={() => nav(stay ? '/app/home' : '/household?from=login')}>
      <button className="choice" aria-pressed={stay} onClick={() => setStay(true)}>
        <span className="ico bg-teal"><Home size={28} aria-hidden /></span>
        <span><b>Stay in this house</b><span className="d">Casa Girasol</span></span>
      </button>
      <button className="choice" aria-pressed={!stay} onClick={() => setStay(false)}>
        <span className="ico bg-yellow"><DoorOpen size={28} aria-hidden /></span>
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
  const [name, setName] = useState('')

  const continueOn = () => {
    if (mode === 'join') {
      nav(`/join?from=${from}`)
      return
    }
    saveHouse({
      mode,
      name: name.trim() || 'New house',
      from,
    })
    nav('/invite')
  }

  return (
    <Step step={from === 'login' ? 2 : 1} back={from === 'login' ? '/house' : '/login'} say="Join a house or start a new one." cta="Continue" onCta={continueOn}>
      <button className="choice" aria-pressed={mode === 'join'} onClick={() => setMode('join')}>
        <span className="ico bg-teal"><DoorOpen size={28} aria-hidden /></span>
        <span><b>Join a household</b><span className="d">Your roommate shared a code</span></span>
      </button>
      <button className="choice" aria-pressed={mode === 'create'} onClick={() => setMode('create')}>
        <span className="ico bg-yellow"><Home size={28} aria-hidden /></span>
        <span><b>Create a household</b><span className="d">Start fresh and invite everyone</span></span>
      </button>
      {mode === 'create' && (
        <div className="field pop">
          <label htmlFor="hname">Household name</label>
          <input id="hname" className="input plain" placeholder="Casa Girasol" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
    </Step>
  )
}

const FOUND_HOUSE = 'Casa Girasol'

export function JoinHousehold() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') === 'login' ? 'login' : 'signup'
  const [code, setCode] = useState(params.get('code') || '')
  const trimmed = code.trim()

  const continueOn = () => {
    if (!trimmed) return
    nav(`/join/confirm?from=${from}&code=${encodeURIComponent(trimmed)}`)
  }

  return (
    <Step step={from === 'login' ? 3 : 2} total={5} back={`/household?from=${from}`} say="Enter the household code." cta="Continue" onCta={continueOn} ctaDisabled={!trimmed}>
      <div className="field">
        <label htmlFor="hcode">Household code</label>
        <input id="hcode" className="input plain" placeholder="GIR-4821" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" />
      </div>
    </Step>
  )
}

export function JoinConfirm() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') === 'login' ? 'login' : 'signup'
  const code = (params.get('code') || '').trim()

  const cancel = () => nav(`/join?from=${from}&code=${encodeURIComponent(code)}`)
  const confirm = () => {
    saveHouse({ mode: 'join', name: FOUND_HOUSE, code, from })
    nav('/invite')
  }

  if (!code) return <Navigate to={`/join?from=${from}`} replace />

  return (
    <Step step={from === 'login' ? 4 : 3} total={5} back={`/join?from=${from}&code=${encodeURIComponent(code)}`} say="Is this your house?" cta="Confirm" onCta={confirm} cancel={cancel}>
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
  const householdBack = `/household?from=${from}`
  const back = joining ? `/join/confirm?from=${from}&code=${encodeURIComponent(setup.code || '')}` : householdBack

  return (
    <Step step={setup.from === 'login' ? (joining ? 5 : 3) : (joining ? 4 : 2)} total={joining ? 5 : 3} back={back} say={joining ? 'You’re in. Here’s who is already here.' : 'Your house is ready.'} mood="cheer" cta={setup.from === 'login' ? 'Open Harmony' : 'Continue'} to={setup.from === 'login' ? '/app/home' : '/preferences'}>
      <div className="card tint-teal">
        <div className="muted" style={{ fontWeight: 800, fontSize: 13 }}>{setup.name.toUpperCase()}</div>
        <div className="row between">
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 36, letterSpacing: 6, fontWeight: 700 }}>{code.toUpperCase()}</span>
          <button type="button" className="btn sm ghost" onClick={copy}><Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy'}</button>
        </div>
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

      <p className="muted" style={{ fontWeight: 700 }}>You can send this code to roommates later in the app.</p>
    </Step>
  )
}

const prefs = [
  { icon: ClipboardList, tone: 'bg-teal', t: 'Chore reminders', d: 'Due soon and overdue', on: true },
  { icon: Wallet, tone: 'bg-blue', t: 'Payments', d: 'New bills and payments received', on: true },
  { icon: Sparkles, tone: 'bg-purple', t: 'Shopping lists', d: 'When roommates update a list', on: true },
  { icon: Car, tone: 'bg-yellow', t: 'Parking & calendar', d: 'Permits, conflicts and events', on: false },
]

export function Preferences() {
  const joining = loadHouse().mode === 'join'
  return (
    <Step step={joining ? 5 : 3} total={joining ? 5 : 3} back="/invite" say="Make it yours!" mood="wow" cta="Open Harmony" to="/app/home">
      <div className="card flat stack">
        {prefs.map(({ icon: I, tone, t, d, on }) => (
          <div className="row" key={t}>
            <span className={`bubble-ico ${tone}`}><I size={22} aria-hidden /></span>
            <div className="grow"><div style={{ fontWeight: 800 }}>{t}</div><div className="muted" style={{ fontSize: 14, fontWeight: 600 }}>{d}</div></div>
            <Toggle label={t} defaultOn={on} />
          </div>
        ))}
      </div>
      <div>
        <div className="section-head"><h2>How should we reach you?</h2></div>
        <Segmented options={['In app', 'SMS', 'Email']} />
        <p className="muted row" style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}><Smartphone size={16} aria-hidden /> Roommates without the app get a text instead.</p>
        <div style={{ height: 12 }} />
        <Segmented options={['Real time', 'Daily digest']} />
      </div>
      <div className="card tint-purple row">
        <span className="bubble-ico bg-purple"><Trophy size={22} aria-hidden /></span>
        <div className="grow">
          <b>Fun features</b>
          <div className="muted" style={{ fontSize: 14, fontWeight: 700 }}>Points, streaks & challenges. Never blocks a task.</div>
        </div>
        <Toggle label="Fun features" defaultOn />
      </div>
      <p className="muted row" style={{ fontSize: 13, fontWeight: 700 }}><Bell size={16} aria-hidden /> <MessageSquare size={16} aria-hidden /> <Mail size={16} aria-hidden /> <CalendarDays size={16} aria-hidden /> You can change all of this later.</p>
    </Step>
  )
}

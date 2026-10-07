import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, CalendarDays, Car, ClipboardList, Copy, DoorOpen, Home, Mail, MessageSquare, Plus, Smartphone, Sparkles, Trophy, Wallet } from 'lucide-react'
import { Pip } from '../components/Pip'
import { Avatar, Chip, Progress, Segmented, Toggle } from '../components/ui'

function Step({ step, back, say, mood = 'happy', children, cta, to }: { step: number; back: string; say: string; mood?: 'happy' | 'wow' | 'cheer'; children: ReactNode; cta: string; to: string }) {
  const nav = useNavigate()
  return (
    <div className="ob">
      <div className="ob-top">
        <button className="ob-back" aria-label="Back" onClick={() => nav(back)}><ArrowLeft aria-hidden /></button>
        <Progress value={(step / 3) * 100} />
      </div>
      <div className="ob-body page">
        <div className="ob-speech">
          <Pip size={84} mood={mood} wave />
          <div className="bubble">{say}</div>
        </div>
        {children}
      </div>
      <div className="ob-foot">
        <button className="btn block" onClick={() => nav(to)}>{cta}</button>
      </div>
    </div>
  )
}

export function Household() {
  const [mode, setMode] = useState<'join' | 'create'>('join')
  return (
    <Step step={1} back="/login" say="Let’s find your home!" cta="Continue" to="/invite">
      <button className="choice" aria-pressed={mode === 'join'} onClick={() => setMode('join')}>
        <span className="ico bg-teal"><DoorOpen size={28} aria-hidden /></span>
        <span><b>Join a household</b><span className="d">Your roommate shared a code</span></span>
      </button>
      <button className="choice" aria-pressed={mode === 'create'} onClick={() => setMode('create')}>
        <span className="ico bg-yellow"><Home size={28} aria-hidden /></span>
        <span><b>Create a household</b><span className="d">Start fresh and invite everyone</span></span>
      </button>
      {mode === 'join' ? (
        <div className="field pop">
          <label htmlFor="code">Household code</label>
          <input id="code" className="input plain code-input" placeholder="ABC123" maxLength={6} />
        </div>
      ) : (
        <div className="field pop">
          <label htmlFor="hname">Household name</label>
          <input id="hname" className="input plain" placeholder="Casa Girasol" />
        </div>
      )}
    </Step>
  )
}

export function Invite() {
  return (
    <Step step={2} back="/household" say="Bring your roomies in!" mood="cheer" cta="Continue" to="/preferences">
      <div className="card tint-teal">
        <div className="muted" style={{ fontWeight: 800, fontSize: 13 }}>YOUR HOUSEHOLD CODE</div>
        <div className="row between">
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 36, letterSpacing: 6, fontWeight: 700 }}>GIR-4821</span>
          <button className="btn sm ghost"><Copy size={16} aria-hidden /> Copy</button>
        </div>
      </div>
      <div>
        <div className="section-head"><h2>Send an invite</h2></div>
        <Segmented options={['In app', 'Text', 'Email']} />
        <div className="row" style={{ marginTop: 12 }}>
          <input className="input plain" placeholder="Phone or email" aria-label="Phone or email" />
          <button className="btn sm yellow" aria-label="Add"><Plus size={20} aria-hidden /></button>
        </div>
      </div>
      <div className="card flat stack">
        {[
          ['sofi', 'Sofi', 'Joined', 'teal'],
          ['diego', 'Diego', 'Invited by text', 'yellow'],
          ['mara', 'Mara', 'Invited by email', 'yellow'],
        ].map(([id, name, status, tone]) => (
          <div className="row" key={id}>
            <Avatar id={id} />
            <b className="grow">{name}</b>
            <Chip tone={tone as 'teal' | 'yellow'}>{status}</Chip>
          </div>
        ))}
      </div>
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
  return (
    <Step step={3} back="/invite" say="Make it yours!" mood="wow" cta="Open Harmony" to="/app/home">
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

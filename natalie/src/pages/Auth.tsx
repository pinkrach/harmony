import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ClipboardList, Lock, Mail, User, Wallet } from 'lucide-react'
import { Pip } from '../components/Pip'
import { Segmented } from '../components/ui'

export default function Auth() {
  const nav = useNavigate()
  const [signup, setSignup] = useState(false)

  return (
    <div className="auth">
      <section className="auth-hero">
        <Pip size={150} mood="happy" wave float />
        <h1>Harmony</h1>
        <p>Chores, bills, groceries and who’s home — all in one happy place.</p>
        <div className="perks">
          <div className="perk"><ClipboardList aria-hidden /> Fair chore rotations</div>
          <div className="perk"><Wallet aria-hidden /> Split bills, pay with Venmo</div>
          <div className="perk"><CalendarDays aria-hidden /> See who’s home, claim the bathroom</div>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); nav('/household') }}>
          <Segmented options={['Log in', 'Sign up']} onChange={(i) => setSignup(i === 1)} />
          <h2>{signup ? 'Create your account' : 'Welcome back!'}</h2>

          {signup && (
            <div className="field">
              <label htmlFor="name">Your name</label>
              <div className="input-wrap"><User size={20} className="icon" aria-hidden /><input id="name" className="input" placeholder="Natalie" autoComplete="name" /></div>
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-wrap"><Mail size={20} className="icon" aria-hidden /><input id="email" type="email" className="input" placeholder="you@school.edu" autoComplete="email" /></div>
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <div className="input-wrap"><Lock size={20} className="icon" aria-hidden /><input id="pw" type="password" className="input" placeholder="••••••••" autoComplete={signup ? 'new-password' : 'current-password'} /></div>
          </div>
          {!signup && <button type="button" className="link" style={{ alignSelf: 'flex-end' }}>Forgot password?</button>}

          <button type="submit" className="btn block">{signup ? 'Create account' : 'Log in'}</button>
          <p className="muted" style={{ textAlign: 'center', fontWeight: 700 }}>
            {signup ? 'Already have an account? ' : 'New to Harmony? '}
            <button type="button" className="link" onClick={() => setSignup(!signup)}>{signup ? 'Log in' : 'Sign up'}</button>
          </p>
        </form>
      </section>
    </div>
  )
}

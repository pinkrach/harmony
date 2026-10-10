import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock, Mail, User } from 'lucide-react'
import { Pip } from '../components/Pip'

type Step = 'choose' | 'login' | 'signup' | 'forgot' | 'reset'

export default function Auth() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const requested = params.get('form')
  const [step, setStep] = useState<Step>(requested === 'login' || requested === 'signup' || requested === 'forgot' || requested === 'reset' ? requested : 'choose')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [resetNote, setResetNote] = useState('')
  const signup = step === 'signup'
  const accountReady = email.trim().length > 0 && password.trim().length > 0 && (!signup || name.trim().length > 0)

  const back = () => {
    setResetNote('')
    if (step === 'reset') setStep('forgot')
    else if (step === 'forgot') setStep('login')
    else { setStep('choose'); nav('/login', { replace: true }) }
  }

  return (
    <div className={`auth-gate${step === 'choose' ? '' : ' is-form'}`}>
      {step !== 'choose' && (
        <button type="button" className="auth-back" aria-label="Back" onClick={back}><ArrowLeft aria-hidden /></button>
      )}
      <div className="auth-mark">
        <Pip size={140} mood="happy" wave />
      </div>

      {step === 'choose' && (
        <div className="auth-gate-actions">
          <button type="button" className="btn block yellow" onClick={() => setStep('login')}>Log in</button>
          <button type="button" className="btn block gate-signup" onClick={() => setStep('signup')}>Sign up</button>
        </div>
      )}

      {(step === 'login' || step === 'signup') && (
        <form key={step} className="auth-form auth-open" onSubmit={(e) => { e.preventDefault(); if (accountReady) nav(signup ? '/household?from=signup' : '/house') }}>
          <h2>{signup ? 'Create your account' : 'Welcome back!'}</h2>
          {signup && (
            <div className="field">
              <label htmlFor="name">Your name</label>
              <div className="input-wrap"><User size={20} className="icon" aria-hidden /><input id="name" className="input" placeholder="Natalie" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-wrap"><Mail size={20} className="icon" aria-hidden /><input id="email" type="email" className="input" placeholder="you@school.edu" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <div className="input-wrap"><Lock size={20} className="icon" aria-hidden /><input id="pw" type="password" className="input" placeholder="••••••••" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {step === 'login' && <button type="button" className="link auth-forgot" onClick={() => setStep('forgot')}>Forgot password?</button>}
          </div>
          <button type="submit" className="btn block yellow" disabled={!accountReady}>{signup ? 'Create account' : 'Log in'}</button>
        </form>
      )}

      {step === 'forgot' && (
        <form className="auth-form auth-open" onSubmit={(e) => { e.preventDefault(); if (!email.trim()) return; setResetNote(''); setStep('reset') }}>
          <h2>Reset your password</h2>
          <div className="field">
            <label htmlFor="reset-email">Email</label>
            <div className="input-wrap"><Mail size={20} className="icon" aria-hidden /><input id="reset-email" type="email" className="input" placeholder="you@school.edu" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <button type="submit" className="btn block yellow" disabled={!email.trim()}>Send reset code</button>
        </form>
      )}

      {step === 'reset' && (
        <form className="auth-form auth-open" onSubmit={(e) => { e.preventDefault(); if (!code.trim()) return; setResetNote('This reset code doesn’t work yet.') }}>
          <h2>Enter your reset code</h2>
          <p className="auth-note">We sent a code to {email.trim() || 'your email'}.</p>
          <div className="field">
            <label htmlFor="reset-code">Reset code</label>
            <input id="reset-code" className="input plain" placeholder="123456" value={code} onChange={(e) => { setCode(e.target.value); setResetNote('') }} autoComplete="one-time-code" />
          </div>
          {resetNote && <p className="auth-note">{resetNote}</p>}
          <button type="submit" className="btn block yellow" disabled={!code.trim()}>Reset password</button>
        </form>
      )}

    </div>
  )
}

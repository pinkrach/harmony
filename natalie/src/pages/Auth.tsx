import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, User } from 'lucide-react'
import { Pip } from '../components/Pip'

type Step = 'choose' | 'login' | 'signup'

export default function Auth() {
  const nav = useNavigate()
  const [step, setStep] = useState<Step>('choose')
  const signup = step === 'signup'

  return (
    <div className={`auth-gate${step === 'choose' ? '' : ' is-form'}`}>
      {step !== 'choose' && (
        <button type="button" className="auth-back" onClick={() => setStep('choose')}>Back</button>
      )}
      <div className="auth-mark">
        <Pip size={140} mood="happy" wave />
      </div>

      {step === 'choose' ? (
        <div className="auth-gate-actions">
          <button type="button" className="btn block yellow" onClick={() => setStep('login')}>Log in</button>
          <button type="button" className="btn block gate-signup" onClick={() => setStep('signup')}>Sign up</button>
        </div>
      ) : (
        <form key={step} className="auth-form auth-open" onSubmit={(e) => { e.preventDefault(); nav(signup ? '/household?from=signup' : '/house') }}>
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
          <button type="submit" className="btn block yellow">{signup ? 'Create account' : 'Log in'}</button>
        </form>
      )}

      {step === 'login' && <button type="button" className="link auth-forgot">Forgot password?</button>}
    </div>
  )
}

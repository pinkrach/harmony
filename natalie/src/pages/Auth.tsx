import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Segmented } from '../components/ui'

export default function Auth() {
  const nav = useNavigate()
  const [signup, setSignup] = useState(false)

  return (
    <div className="auth">
      <div className="auth-wrap">
        <p className="auth-brand">Harmony</p>
        <form
          className="auth-card"
          onSubmit={(e) => {
            e.preventDefault()
            nav('/household')
          }}
        >
          <Segmented options={['Log in', 'Sign up']} onChange={(i) => setSignup(i === 1)} />
          <h1>{signup ? 'Create account' : 'Log in'}</h1>

          {signup && (
            <label className="auth-field">
              Name
              <input id="name" autoComplete="name" placeholder="Natalie" />
            </label>
          )}
          <label className="auth-field">
            Email
            <input id="email" type="email" autoComplete="email" placeholder="you@school.edu" />
          </label>
          <label className="auth-field">
            Password
            <input
              id="pw"
              type="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              placeholder="Password"
            />
          </label>
          {!signup && (
            <button type="button" className="auth-forgot">
              Forgot password?
            </button>
          )}
          <button type="submit" className="auth-submit">
            {signup ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}

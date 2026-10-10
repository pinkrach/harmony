import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function PhoneMode({ children }: { children: ReactNode }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const inApp = pathname.startsWith('/app')

  return (
    <>
      {children}
      {!inApp && (
        <button type="button" className="skip-home" onClick={() => nav('/app/home')}>
          Skip to home
        </button>
      )}
    </>
  )
}

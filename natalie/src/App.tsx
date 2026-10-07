import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Splash from './pages/Splash'
import Auth from './pages/Auth'
import { Household, Invite, Preferences } from './pages/Onboarding'
import Home from './pages/Home'
import Chores from './pages/Chores'
import Payments from './pages/Payments'
import Shopping from './pages/Shopping'
import Calendar from './pages/Calendar'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/household" element={<Household />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/preferences" element={<Preferences />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="chores" element={<Chores />} />
        <Route path="payments" element={<Payments />} />
        <Route path="shopping" element={<Shopping />} />
        <Route path="calendar" element={<Calendar />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

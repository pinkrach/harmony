import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Splash from './pages/Splash'
import Auth from './pages/Auth'
import { HouseChoice, Household, Invite, JoinConfirm, JoinHousehold, Preferences } from './pages/Onboarding'
import Home from './pages/Home'
import Chores from './pages/Chores'
import Payments from './pages/Payments'
import Shopping from './pages/Shopping'
import Calendar from './pages/Calendar'
import { ChoresProvider } from './chores'
import { PaymentsProvider } from './payments'

export default function App() {
  return (
    <ChoresProvider>
    <PaymentsProvider>
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/house" element={<HouseChoice />} />
      <Route path="/household" element={<Household />} />
      <Route path="/join" element={<JoinHousehold />} />
      <Route path="/join/confirm" element={<JoinConfirm />} />
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
    </PaymentsProvider>
    </ChoresProvider>
  )
}

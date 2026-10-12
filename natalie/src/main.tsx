import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import PhoneMode from './components/PhoneMode'
import './index.css'

// Harmony opens in the light theme. Dark is opt-in: localStorage.setItem('harmony-theme', 'dark')
try {
  document.documentElement.dataset.theme = localStorage.getItem('harmony-theme') === 'dark' ? 'dark' : 'light'
} catch {
  document.documentElement.dataset.theme = 'light'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PhoneMode>
        <App />
      </PhoneMode>
    </BrowserRouter>
  </StrictMode>,
)

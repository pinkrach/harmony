import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import PhoneMode from './components/PhoneMode'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PhoneMode>
        <App />
      </PhoneMode>
    </BrowserRouter>
  </StrictMode>,
)

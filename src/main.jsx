// ─── Punto de entrada de la aplicación ───────────────────────────────────────
// Inicializa React 18+ con StrictMode para detección de problemas en desarrollo
// Integra Speed Insights de Vercel para monitoreo de performance en producción
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from "@vercel/speed-insights/react"
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Explicitly register the service worker.
// The `vite-plugin-pwa` virtual module handles the registration logic.
// This ensures our custom service worker (`src/sw.ts`) is installed to handle
// caching and PWA functionality, working alongside the OneSignal worker.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

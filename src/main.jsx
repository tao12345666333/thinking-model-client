import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './tailwind.css'
import './index.css'
import { register as registerServiceWorker } from './serviceWorkerRegistration'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for PWA functionality
registerServiceWorker()
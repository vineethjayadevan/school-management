if (window.location.hostname === 'mystemgps.com') {
    window.location.replace('https://www.mystemgps.com' + window.location.pathname + window.location.search);
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </StrictMode>,
)

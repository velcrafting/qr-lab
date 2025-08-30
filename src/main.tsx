import "./tw.css";
import "./style.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Removed default Vite styles to use our minimal system styles
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

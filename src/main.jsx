import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Render the SignLearn demo directly so you can view it quickly
import SignLearn from './sign-learn.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SignLearn />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(  // root라는 id의 div를 찾아서 컴포넌트 렌더링 
  <StrictMode>
    <App />   {/* app컴포넌트 렌더링 */}
  </StrictMode>,
)

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider }  from './contexts/AuthContext'
import { GridProvider }  from './contexts/GridContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { FocusProvider } from './contexts/FocusContext'

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider>
      <GridProvider>
        <FocusProvider>
          <App />
        </FocusProvider>
      </GridProvider>
    </AuthProvider>
  </ThemeProvider>
)

import { useAuth } from './contexts/AuthContext'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `rgb(var(--color-bg))` }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: `rgb(var(--color-accent))`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return <Login />

  return <Dashboard />
}

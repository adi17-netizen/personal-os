import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function ReconnectBanner() {
  const { signInWithGoogle } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleReconnect = async () => {
    setConnecting(true)
    try {
      await signInWithGoogle()
    } catch {
      setConnecting(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-sm">
      <span className="text-amber-300/80">
        Your Google session expired. Reconnect to load live data.
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleReconnect}
          disabled={connecting}
          className="flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors font-medium disabled:opacity-60"
        >
          <RefreshCw size={13} className={connecting ? 'animate-spin' : ''} />
          {connecting ? 'Reconnecting…' : 'Reconnect'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-300 transition-colors ml-2"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

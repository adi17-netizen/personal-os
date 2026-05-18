import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
      <AlertCircle className="text-red-400 shrink-0" size={24} />
      <p className="text-sm text-gray-400 leading-snug">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-accent/50"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}

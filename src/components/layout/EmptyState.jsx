export default function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
      {Icon && <Icon size={24} className="text-gray-600" />}
      <p className="text-sm text-gray-500 leading-snug">{message}</p>
    </div>
  )
}

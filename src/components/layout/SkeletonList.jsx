export default function SkeletonList({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-3 p-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div
            className="shimmer rounded h-4"
            style={{ width: `${60 + (i % 3) * 15}%` }}
          />
          {i % 2 === 0 && (
            <div className="shimmer rounded h-3 w-2/5" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function SkeletonRow() {
  return (
    <div className="w-full bg-background-elevated animate-pulse rounded border border-border-subtle p-4 mb-2 flex items-center justify-between">
      <div className="h-4 bg-background-hover rounded w-1/3"></div>
      <div className="h-4 bg-background-hover rounded w-20"></div>
      <div className="h-4 bg-background-hover rounded w-16"></div>
      <div className="h-4 bg-background-hover rounded w-24"></div>
      <div className="h-6 bg-background-hover rounded w-6"></div>
    </div>
  );
}

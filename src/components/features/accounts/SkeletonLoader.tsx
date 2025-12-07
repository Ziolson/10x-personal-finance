export default function SkeletonLoader() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="h-16 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      ))}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="hidden md:flex items-center gap-4 py-3 border-b">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24 ml-auto" />
      </div>
      
      {/* Rows */}
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-4 border-b">
          <Skeleton className="h-4 w-24 md:w-32" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full md:w-1/2" />
            <Skeleton className="h-3 w-2/3 md:w-1/3" />
          </div>
          <Skeleton className="h-6 w-20 md:ml-auto" />
        </div>
      ))}
    </div>
  );
}


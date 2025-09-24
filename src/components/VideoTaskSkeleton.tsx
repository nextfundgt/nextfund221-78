import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function VideoTaskSkeleton() {
  return (
    <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Thumbnail skeleton */}
        <div className="relative h-32 bg-muted/20 rounded-t-2xl overflow-hidden">
          <Skeleton className="w-full h-full" />
          {/* Duration badge skeleton */}
          <div className="absolute top-2 right-2">
            <Skeleton className="h-6 w-12 rounded" />
          </div>
          {/* Category badge skeleton */}
          <div className="absolute top-2 left-2">
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          {/* Title and status skeleton */}
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          {/* Reward and action skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VideoTaskSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <VideoTaskSkeleton key={index} />
      ))}
    </div>
  );
}
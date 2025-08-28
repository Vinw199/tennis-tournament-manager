import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto max-w-4xl">
			<header className="mb-6 flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-7 w-64" />
					<Skeleton className="h-4 w-32" />
				</div>
				<Skeleton className="h-7 w-16" />
			</header>
			<div className="mb-6 rounded-md border p-4">
				<Skeleton className="h-5 w-32" />
				<div className="mt-3 space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-20 w-full" />
					))}
				</div>
			</div>
			<div className="rounded-md border p-4">
				<Skeleton className="h-5 w-24" />
				<div className="mt-3 space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-full" />
					))}
				</div>
			</div>
		</div>
	);
}



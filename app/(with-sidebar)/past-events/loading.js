import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto max-w-6xl">
			<header className="mb-6">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="mt-2 h-4 w-60" />
			</header>
			<ul className="divide-y rounded-md border bg-card">
				{Array.from({ length: 5 }).map((_, i) => (
					<li key={i} className="flex items-center justify-between px-4 py-3">
						<div className="space-y-1">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-24" />
						</div>
						<Skeleton className="h-7 w-16" />
					</li>
				))}
			</ul>
		</div>
	);
}



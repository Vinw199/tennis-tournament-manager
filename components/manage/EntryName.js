import { cn } from "@/lib/utils";

export function EntryName({ name, className }) {
    // Return null or a fallback if the name is not provided
    if (!name) {
        return null;
    }

    // Check if the name contains a separator
    if (name.includes("/")) {
        const names = name.split("/").map(n => n.trim());
        return (
            // Change: Merged the default and passed className
            <div className={cn("flex justify-center", className)}>
                <div className="text-left">
                    <div>{names[0]}</div>
                    <div>{names[1]}</div>
                </div>
            </div>
        );
    }

    // If there's only one name, render it normally
    // Change: Applied the passed className
    return <div className={cn(className)}>{name}</div>;
}
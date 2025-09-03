import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export const RosterEmptyState = ({ onAddPlayer }) => (
    <div className="text-center py-16 px-6 w-full">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">Build Your Roster</h3>
        <p className="mt-2 text-sm text-muted-foreground">
            You haven't added any players yet. Get started by adding your first player.
        </p>
        <div className="mt-6">
            <Button onClick={onAddPlayer} className='cursor-pointer'>
                Add Your First Player
            </Button>
        </div>
    </div>
);
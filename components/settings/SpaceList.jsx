import { SpaceListItem } from './SpaceListItem';
import { Table, TableBody, TableCaption } from '@/components/ui/table';

// Map over the spaces and render each item.
export function SpaceList({ spaces, activeSpaceId }) {
    return (
        <Table>
            <TableCaption>A list of your club spaces.</TableCaption>
            <TableBody>
                {spaces.map((space) => (
                    <SpaceListItem
                        key={space.id}
                        space={space}
                        isActive={activeSpaceId === space.id}
                        isLastSpace={spaces.length <= 1}
                    />
                ))}
            </TableBody>
        </Table>
    );
}
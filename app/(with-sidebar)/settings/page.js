import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  listSpaces,
  createSpace,
  renameSpace,
  deleteSpace,
  getActiveSpaceId,
  setActiveSpace,
} from '@/lib/supabase/spaces'

export default async function SpacesSettingsPage() {
  const spaces = await listSpaces()
  const activeSpaceId = await getActiveSpaceId()

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-foreground/70">
            Manage your spaces and their settings.
          </p>
        </div>
      </header>

      {/* Create New Space Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create a New Space</CardTitle>
          <CardDescription>
            Create a new, isolated space for a different club or group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSpace} className="flex items-center gap-4">
            <Input
              name="name"
              placeholder="Name for your new space..."
              required
            />
            <Button type="submit">Create Space</Button>
          </form>
        </CardContent>
      </Card>

      {/* List of Existing Spaces */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Your Spaces</h2>
        <div className="grid gap-4">
          {spaces.map((space) => (
            <Card key={space.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{space.name}</CardTitle>
                  <CardDescription>
                    Your role in this space: <strong>{space.role}</strong>
                  </CardDescription>
                </div>
                {activeSpaceId === space.id && (
                  <Badge variant="outline">Active</Badge>
                  // <span>*</span>
                )}
              </CardHeader>
              <CardContent>
                <form action={renameSpace} className="flex items-center gap-4">
                  <Input
                    name="name"
                    defaultValue={space.name}
                    required
                    disabled={space.role !== 'admin'}
                  />
                  <input type="hidden" name="spaceId" value={space.id} />
                  <Button type="submit" disabled={space.role !== 'admin'}>
                    Rename
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-3">
                {activeSpaceId !== space.id ? (
                  <form action={setActiveSpace}>
                    <input type="hidden" name="spaceId" value={space.id} />
                    <Button type="submit" variant="outline">
                      Set as Active
                    </Button>
                  </form>
                ) : (
                  <div /> // Empty div to keep alignment
                )}
                <form action={deleteSpace}>
                  <input type="hidden" name="spaceId" value={space.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={space.role !== 'admin' || spaces.length <= 1}
                  >
                    Delete Space
                  </Button>
                  {spaces.length <= 1 && (
                    <p className="ml-4 text-xs text-foreground/60">
                      You cannot delete your last space.
                    </p>
                  )}
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

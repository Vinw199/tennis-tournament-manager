import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from '@/components/ui/card'
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

// import SettingsForm from '@/components/settings/SettingsForm'
import { CreateSpaceForm } from '@/components/settings/CreateSpaceForm'
import { SpaceList } from '@/components/settings/SpaceList'

export default async function SpacesSettingsPage() {
  const spaces = await listSpaces()
  const activeSpaceId = await getActiveSpaceId()

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your club spaces and account settings.
          </p>
        </div>
      </header>



      {/* Create New Space Card */}
      {/* <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create a New Space</CardTitle>
          <CardDescription>
            Create a new, isolated space for a different club or group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card> */}

      {/* Create New Space Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create a New Space</CardTitle>
          <CardDescription>
            Create a new, isolated space for a different club or group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSpaceForm />
        </CardContent>
      </Card>

      {/* List of Existing Spaces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Your Spaces
          </CardTitle>
          <CardDescription>
            Manage your existing spaces below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpaceList spaces={spaces} activeSpaceId={activeSpaceId} />
        </CardContent>
      </Card>
      
      {/* <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Your Spaces</h2>
        <SpaceList spaces={spaces} activeSpaceId={activeSpaceId} />
      </div> */}
    </div>
  )
}
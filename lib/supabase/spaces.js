'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const COOKIE_KEY = 'sb-space-id'

/**
 * Retrieves the list of spaces a user is a member of.
 */
export async function listSpaces() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('space_members')
    .select('role, spaces (id, name)')

  if (error) {
    console.error('Error fetching spaces:', error)
    return []
  }

  return data.map((member) => ({
    id: member.spaces.id,
    name: member.spaces.name,
    role: member.role,
  }))
}

/**
 * Gets the currently active space ID from the cookie.
 */
export async function getActiveSpaceId() {
  const cookieStore = cookies()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const userSpaces = await listSpaces()
  if (userSpaces.length === 0) {
    return null
  }

  let activeSpaceId = cookieStore.get(COOKIE_KEY)?.value
  const activeSpaceIsValid = userSpaces.some((s) => s.id === activeSpaceId)

  if (!activeSpaceId || !activeSpaceIsValid) {
    activeSpaceId = userSpaces[0].id
    // cookieStore.set(COOKIE_KEY, activeSpaceId)
  }

  return activeSpaceId
}

/**
 * Sets the active space by updating the cookie.
 * Reads spaceId from formData.
 */
export async function setActiveSpace(formData) {
  const spaceId = formData.get('spaceId')
  const userSpaces = await listSpaces()
  const space = userSpaces.find((s) => s.id === spaceId)

  if (!space) {
    console.error('Attempted to set an invalid active space.')
    return
  }

  cookies().set(COOKIE_KEY, spaceId)
  revalidatePath('/', 'layout')
}

/**
 * Creates a new space and sets it as the active one.
 * Reads name from formData.
 */
export async function createSpace(formData) {
  const name = formData.get('name')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'User not authenticated' } }


  const { data, error } = await supabase
    .from('spaces')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (error) {
    console.error('Error creating space:', error)
    return { error }
  }

  // Set the new space as the active one by calling the other server action
  const newFormData = new FormData()
  newFormData.append('spaceId', data.id)
  await setActiveSpace(newFormData)

  return { data }
}

/**
 * Deletes a space, enforcing the "last space" guard rail.
 * Reads spaceId from formData.
 */
export async function deleteSpace(formData) {
  const spaceId = formData.get('spaceId')
  const supabase = await createClient()
  const userSpaces = await listSpaces()

  if (userSpaces.length <= 1) {
    return { error: { message: 'You cannot delete your last space.' } }
  }

  const { error } = await supabase.from('spaces').delete().eq('id', spaceId)
  if (error) {
    console.error('Error deleting space:', error)
    return { error }
  }

  const activeSpaceId = await getActiveSpaceId()
  if (activeSpaceId === spaceId) {
    const newActiveSpace = userSpaces.find((s) => s.id !== spaceId)
    if (newActiveSpace) {
      const newFormData = new FormData()
      newFormData.append('spaceId', newActiveSpace.id)
      await setActiveSpace(newFormData)
    }
  }

  revalidatePath('/', 'layout')
}

/**
 * Renames a space.
 * Reads spaceId and newName from formData.
 */
export async function renameSpace(formData) {
  const spaceId = formData.get('spaceId')
  const newName = formData.get('name')
  const supabase = await createClient()
  const { error } = await supabase
    .from('spaces')
    .update({ name: newName })
    .eq('id', spaceId)

  if (error) {
    console.error('Error renaming space:', error)
    return { error }
  }

  revalidatePath('/', 'layout')
}
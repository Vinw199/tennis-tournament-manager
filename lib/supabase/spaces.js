'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const COOKIE_KEY = 'sb-space-id'

/**
 * Retrieves the list of spaces a user is a member of.
 */
export async function listSpaces() {
  
  const supabase = await createClient()

  // 1. Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated' }

  const { data, error } = await supabase
    .from('space_members')
    .select('role, spaces (id, name)')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching spaces:', error)
    return { error: 'Error fetching spaces' }
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

export async function handleOnboarding(prevState, formData) {
  const spaceName = formData.get('spaceName')?.toString().trim();
  const userName = formData.get('userName')?.toString().trim();

  if (!spaceName || !userName) {
    console.error('Both club name and your name are required.')
    return { error: 'Both club name and your name are required.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated.')
    return { error: 'User not authenticated.' }
  }

  // 1. Update the user's display_name in Supabase Auth
  await supabase.auth.updateUser({
    data: { display_name: userName },
  });

  // 2. Create the space
  const { data: newSpace, error: spaceError } = await supabase
    .from('spaces')
    .insert({ name: spaceName, created_by: user.id })
    .select('id')
    .single();

  if (spaceError) {
    console.error('Error creating space:', spaceError)
    return { error: 'Error creating your space. Please try again.' };
  }
  // Note: Here, the DB trigger adds user to space_members automatically.

  // 3. Create the player profile in the roster
 const { error: playerError } = await supabase
 .from('players')
 .insert({ 
   space_id: newSpace.id, 
   name: userName, 
   default_skill_rank: 1,
   user_id: user.id // link the player to the user who created the space
 });

  if (playerError) {
    console.error('Error creating player profile:', playerError)
    return { error: 'Space created, but failed to add you to the roster.' };
  }

  redirect('/');
  return { data: newSpace }
}

/**
 * Creates a new space and sets it as the active one.
 * Reads name from formData.
 */
export async function createSpace(prevState, formData) {
  const name = formData.get('name')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'User not authenticated' } }

  // create the space
  const { data: newSpace, error } = await supabase
    .from('spaces')
    .insert({ name, created_by: user.id })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating space:', error)
    return { error: error.message }
  }

  redirect('/')
  return { message: 'Space created successfully.', isSuccess: true }
}

/**
 * Deletes a space, enforcing the "last space" guard rail.
 * Reads spaceId from formData.
 */
export async function deleteSpace(prevState, formData) {
  const spaceId = formData.get('spaceId')
  const supabase = await createClient()
  const userSpaces = await listSpaces()

  if (userSpaces.length <= 1) {
    return {
      message: 'You cannot delete your last space.',
      isSuccess: false,
    };
  }

  const { error } = await supabase.from('spaces').delete().eq('id', spaceId)

  if (error) {
    console.error('Error deleting space:', error);
    return { message: error.message, isSuccess: false };
  }

  revalidatePath('/settings');
  return { message: 'Space deleted successfully.', isSuccess: true };


  // const activeSpaceId = await getActiveSpaceId()
  // if (activeSpaceId === spaceId) {
  //   const newActiveSpace = userSpaces.find((s) => s.id !== spaceId)
  //   if (newActiveSpace) {
  //     const newFormData = new FormData()
  //     newFormData.append('spaceId', newActiveSpace.id)
  //     await setActiveSpace(newFormData)
  //   }
  // }
}

/**
 * Renames a space.
 * Reads spaceId and newName from formData.
 */
export async function renameSpace(prevState, formData) {
  const spaceId = formData.get('spaceId')
  const newName = formData.get('name')
  const supabase = await createClient()
  const { error } = await supabase
    .from('spaces')
    .update({ name: newName })
    .eq('id', spaceId)

  if (error) {
    console.error('Error renaming space:', error);
    return { message: error.message, isSuccess: false };
  }

  revalidatePath('/settings');
  return { message: 'Space renamed successfully!', isSuccess: true };

}
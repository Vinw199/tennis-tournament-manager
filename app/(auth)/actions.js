'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { createClient } from '@/utils/supabase/server'
import { createSpace, getActiveSpaceId } from '@/lib/supabase/spaces'

export async function login(prevState, formData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message };
  }

  // get the invite token
  const token = formData.get('token');

  // If an invite token exists, redirect back to the accept-invite page 
  if (token) {
    redirect(`/accept-invite/${token}`);
  }

  // Get the correct active space ID (either from a valid cookie or the default).
  const activeSpaceId = await getActiveSpaceId()

  // Explicitly set the cookie here, inside the Server Action.
  if (activeSpaceId) {
    cookies().set('sb-space-id', activeSpaceId)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// In actions.js

export async function signup(prevState, formData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // get the invite token
  const token = formData.get('token');

  // If an invite token exists, redirect back to the accept-invite page 
  if (token) {
    redirect(`/accept-invite/${token}`);
  }

  // On success, if no invite token exists, redirect them to the main page.
  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

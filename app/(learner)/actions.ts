'use server'

// DEV B — actions available across the learner area.
import { signOut } from '@/lib/auth'

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' })
}

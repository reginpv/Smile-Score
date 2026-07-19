import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN']

// Returns the current session, or null if the caller is not signed in.
async function getSession(): Promise<Session | null> {
  return (await getServerSession(authOptions)) as Session | null
}

// Guards a server action for any signed-in user. Returns the session, or an
// `unauthorized` result the caller should return as-is when null.
export async function requireUser(): Promise<Session | null> {
  const session = await getSession()
  if (!session?.user?.id) return null
  return session
}

// Guards a server action for admins (SUPERADMIN/ADMIN).
export async function requireAdmin(): Promise<Session | null> {
  const session = await getSession()
  if (!session?.user?.id) return null
  if (!ADMIN_ROLES.includes((session.user.role as string) ?? '')) return null
  return session
}

// Strips the password hash (and any other secrets) before a user row is sent
// to the client. Accepts a single row or an array.
export function sanitizeUser<T extends { password?: unknown } | null>(
  user: T
): T {
  if (!user) return user
  const { password, ...safe } = user as Record<string, unknown>
  return safe as T
}

export function sanitizeUsers<T extends { password?: unknown }>(
  users: T[] | null | undefined
): T[] {
  if (!users) return []
  return users.map((u) => sanitizeUser(u))
}

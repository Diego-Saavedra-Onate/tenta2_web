import type { H3Event } from 'h3'

export async function requireRole(event: H3Event, allowedRoles: string[]) {
  const session = await requireUserSession(event)
  const user = session.user as { id: number; rol: string; vetado?: boolean } | undefined

  if (!user || user.vetado || !allowedRoles.includes(user.rol)) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permisos para realizar esta acción'
    })
  }

  return user
}
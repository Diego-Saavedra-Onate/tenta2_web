import bcrypt from 'bcryptjs'
import { z } from 'zod'

const actualizarPerfilSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  telefono: z
    .string()
    .trim()
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => /^(\+569|569|9)?\d{8}$/.test(val), 'Ingresa 8 dígitos válidos tras +56 9')
    .transform((val) => `+569${val.slice(-8)}`),
  password: z
    .string()
    .max(100)
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined))
    .refine((val) => !val || val.length >= 6, 'La nueva contraseña debe tener al menos 6 caracteres')
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user as { id: number }

  const body = await readBody(event)
  const parsed = actualizarPerfilSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos inválidos'
    })
  }

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 10)
    : undefined

  const actualizado = await prisma.usuario.update({
    where: { id: sessionUser.id },
    data: {
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono,
      ...(passwordHash ? { password: passwordHash } : {})
    }
  })

  await setUserSession(event, {
    user: {
      id: actualizado.id,
      email: actualizado.email,
      nombre: actualizado.nombre,
      apellido: actualizado.apellido,
      rol: actualizado.rol,
      telefono: actualizado.telefono,
      vetado: actualizado.vetado
    }
  })

  return { ok: true }
})
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().trim().email('Formato de correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos de acceso inválidos'
    })
  }

  const email = parsed.data.email.toLowerCase()

  const usuario = await prisma.usuario.findUnique({
    where: { email }
  })

  if (!usuario) {
    throw createError({ statusCode: 401, message: 'Credenciales no válidas' })
  }

  const passwordValido = await bcrypt.compare(parsed.data.password, usuario.password)
  if (!passwordValido) {
    throw createError({ statusCode: 401, message: 'Credenciales no válidas' })
  }

  if (usuario.vetado) {
    throw createError({ statusCode: 403, message: 'Acceso al sistema suspendido' })
  }

  if (usuario.rol !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acceso exclusivo para administradores' })
  }

  await setUserSession(event, {
    user: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      telefono: usuario.telefono,
      vetado: usuario.vetado
    }
  })

  return { ok: true }
})
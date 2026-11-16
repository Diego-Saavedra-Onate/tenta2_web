import bcrypt from 'bcryptjs'
import { requireRole } from '../../utils/auth'
import { crearUsuarioSchema } from '../../utils/schemas'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const body = await readBody(event)
  const parsed = crearUsuarioSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos de usuario inválidos'
    })
  }

  const existente = await prisma.usuario.findUnique({
    where: { email: parsed.data.email }
  })

  if (existente) {
    throw createError({
      statusCode: 409,
      message: 'Ya existe una cuenta registrada con ese correo electrónico'
    })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)

  return await prisma.usuario.create({
    data: {
      email: parsed.data.email,
      password: passwordHash,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      rol: parsed.data.rol,
      telefono: parsed.data.telefono,
      vetado: parsed.data.vetado
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      rol: true,
      telefono: true,
      vetado: true
    }
  })
})
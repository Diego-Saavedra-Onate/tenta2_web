import bcrypt from 'bcryptjs'
import { registroClienteSchema } from '../../utils/schemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registroClienteSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos de registro inválidos'
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

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      email: parsed.data.email,
      password: passwordHash,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      rol: 'cliente',
      telefono: parsed.data.telefono,
      vetado: false
    }
  })

  await setUserSession(event, {
    user: {
      id: nuevoUsuario.id,
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      rol: nuevoUsuario.rol,
      telefono: nuevoUsuario.telefono,
      vetado: nuevoUsuario.vetado
    }
  })

  return { ok: true }
})
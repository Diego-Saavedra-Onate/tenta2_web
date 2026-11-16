import bcrypt from 'bcryptjs'
import { requireRole } from '../../utils/auth'
import { editarUsuarioSchema } from '../../utils/schemas'

export default defineEventHandler(async (event) => {
  const adminActual = await requireRole(event, ['admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID de usuario inválido' })
  }

  const usuarioObjetivo = await prisma.usuario.findUnique({
    where: { id },
    include: { _count: { select: { pedidos: true } } }
  })

  if (!usuarioObjetivo) {
    throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
  }

  const method = getMethod(event)

  if (method === 'PUT') {
    const body = await readBody(event)
    const parsed = editarUsuarioSchema.safeParse(body)

    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        message: parsed.error.issues[0]?.message || 'Datos de usuario inválidos'
      })
    }

    if (id === adminActual.id && parsed.data.vetado === true) {
      throw createError({
        statusCode: 400,
        message: 'No puedes suspender tu propia cuenta activa'
      })
    }

    if (parsed.data.email !== usuarioObjetivo.email) {
      const correoEnUso = await prisma.usuario.findUnique({
        where: { email: parsed.data.email }
      })
      if (correoEnUso) {
        throw createError({
          statusCode: 409,
          message: 'Ese correo electrónico ya pertenece a otro usuario'
        })
      }
    }

    if (
      usuarioObjetivo.rol === 'admin' &&
      !usuarioObjetivo.vetado &&
      (parsed.data.vetado === true || parsed.data.rol === 'cliente')
    ) {
      const adminsActivos = await prisma.usuario.count({
        where: { rol: 'admin', vetado: false }
      })
      if (adminsActivos <= 1) {
        throw createError({
          statusCode: 400,
          message: 'Debe existir al menos un administrador activo en el sistema'
        })
      }
    }

    const passwordHash = parsed.data.password
      ? await bcrypt.hash(parsed.data.password, 10)
      : undefined

    return await prisma.usuario.update({
      where: { id },
      data: {
        email: parsed.data.email,
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        telefono: parsed.data.telefono,
        ...(parsed.data.rol ? { rol: parsed.data.rol } : {}),
        ...(parsed.data.vetado !== undefined ? { vetado: parsed.data.vetado } : {}),
        ...(passwordHash ? { password: passwordHash } : {})
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
  }

  if (method === 'DELETE') {
    if (id === adminActual.id) {
      throw createError({
        statusCode: 400,
        message: 'No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada'
      })
    }

    if (usuarioObjetivo.rol === 'admin' && !usuarioObjetivo.vetado) {
      const adminsActivos = await prisma.usuario.count({
        where: { rol: 'admin', vetado: false }
      })
      if (adminsActivos <= 1) {
        throw createError({
          statusCode: 400,
          message: 'No se puede eliminar al último administrador activo del sistema'
        })
      }
    }

    if (usuarioObjetivo._count.pedidos > 0) {
      throw createError({
        statusCode: 400,
        message: 'El usuario tiene pedidos históricos; usa la opción de suspender/vetar en lugar de eliminar'
      })
    }

    await prisma.usuario.delete({
      where: { id }
    })

    return { ok: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
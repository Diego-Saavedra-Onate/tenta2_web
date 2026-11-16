import { requireRole } from '../../utils/auth'
import { productoSchema } from '../../utils/schemas'
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID de producto inválido' })
  }

  const method = getMethod(event)

  if (method === 'PUT') {
    const body = await readBody(event)
    const parsed = productoSchema.safeParse(body)

    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        message: parsed.error.issues[0]?.message || 'Datos del producto inválidos'
      })
    }

    return await prisma.productos.update({
      where: { id },
      data: {
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion,
        precio: parsed.data.precio,
        disponibilidad: parsed.data.disponibilidad,
        producto_visible: parsed.data.producto_visible,
        imagen: parsed.data.imagen,
        categoria_id: parsed.data.categoria_id
      }
    })
  }

  if (method === 'DELETE') {
    await prisma.productos.delete({
      where: { id }
    })
    return { ok: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
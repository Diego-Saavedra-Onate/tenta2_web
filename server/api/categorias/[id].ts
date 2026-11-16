import { requireRole } from '../../utils/auth'
import { categoriaSchema } from '../../utils/schemas'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID de categoría inválido' })
  }

  const method = getMethod(event)

  if (method === 'PUT') {
    const body = await readBody(event)
    const parsed = categoriaSchema.safeParse(body)

    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        message: parsed.error.issues[0]?.message || 'Datos de la categoría inválidos'
      })
    }

    return await prisma.categorias.update({
      where: { id },
      data: {
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion
      }
    })
  }

  if (method === 'DELETE') {
    const productosAsociados = await prisma.productos.count({
      where: { categoria_id: id }
    })

    if (productosAsociados > 0) {
      throw createError({
        statusCode: 400,
        message: `No se puede eliminar: tiene ${productosAsociados} producto(s) asociado(s)`
      })
    }

    await prisma.categorias.delete({
      where: { id }
    })
    return { ok: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
import { requireRole } from '../../utils/auth'
import { categoriaSchema } from '../../utils/schemas'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const body = await readBody(event)
  const parsed = categoriaSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos de la categoría inválidos'
    })
  }

  return await prisma.categorias.create({
    data: {
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion
    }
  })
})
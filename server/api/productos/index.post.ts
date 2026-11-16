import { requireRole } from '../../utils/auth'
import { productoSchema } from '../../utils/schemas'
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const body = await readBody(event)
  const parsed = productoSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos del producto inválidos'
    })
  }

  return await prisma.productos.create({
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
})
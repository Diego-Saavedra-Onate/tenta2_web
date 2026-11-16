import { requireRole } from '../../utils/auth'
import { actualizarPedidoAdminSchema } from '../../utils/schemas'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID de pedido inválido' })
  }

  const body = await readBody(event)
  const parsed = actualizarPedidoAdminSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos de actualización inválidos'
    })
  }

  const pedidoActual = await prisma.pedidos.findUnique({
    where: { id },
    include: { detalles: true }
  })

  if (!pedidoActual) {
    throw createError({ statusCode: 404, message: 'Pedido no encontrado' })
  }

  let nuevaFechaRetiro: Date | undefined
  if (parsed.data.fecha_retiro) {
    const f = new Date(parsed.data.fecha_retiro)
    if (!Number.isNaN(f.getTime())) {
      nuevaFechaRetiro = f
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Si pasa a RCH desde un estado activo, restituir el stock reservado
    if (parsed.data.estado === 'RCH' && pedidoActual.estado !== 'RCH') {
      for (const det of pedidoActual.detalles) {
        await tx.productos.update({
          where: { id: det.producto_id },
          data: { disponibilidad: { increment: det.cantidad } }
        })
      }
    }

    return await tx.pedidos.update({
      where: { id },
      data: {
        estado: parsed.data.estado,
        ...(nuevaFechaRetiro ? { fecha_retiro: nuevaFechaRetiro } : {}),
        ...(parsed.data.estado === 'ENT' && !pedidoActual.fecha_retiro_efectiva
          ? { fecha_retiro_efectiva: new Date() }
          : {})
      }
    })
  })
})
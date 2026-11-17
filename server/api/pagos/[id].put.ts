import { z } from 'zod'
import { requireRole } from '../../utils/auth'

const validarPagoSchema = z.object({
  estado: z.enum(['CON', 'RCH'])
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID de pago inválido' })
  }

  const body = await readBody(event)
  const parsed = validarPagoSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Estado de pago inválido' })
  }

  const pago = await prisma.pagos.findUnique({
    where: { id },
    include: { pedido: true }
  })

  if (!pago) {
    throw createError({ statusCode: 404, message: 'Comprobante de pago no encontrado' })
  }

  return await prisma.$transaction(async (tx) => {
    const pagoActualizado = await tx.pagos.update({
      where: { id },
      data: { estado: parsed.data.estado }
    })

    if (parsed.data.estado === 'CON' && pago.pedido.estado === 'ACE') {
      await tx.pedidos.update({
        where: { id: pago.pedido_id },
        data: { estado: 'PRE' }
      })
    }

    return pagoActualizado
  })
})
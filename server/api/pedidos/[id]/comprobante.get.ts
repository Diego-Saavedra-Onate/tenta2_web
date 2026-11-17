export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user as { id: number; rol?: string }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID de pedido inválido' })
  }

  const pedido = await prisma.pedidos.findUnique({
    where: { id },
    include: {
      usuario: {
        select: {
          nombre: true,
          apellido: true,
          email: true,
          telefono: true
        }
      },
      detalles: {
        include: {
          producto: {
            select: {
              nombre: true,
              categoria: { select: { nombre: true } }
            }
          }
        }
      },
      pagos: {
        where: { estado: 'CON' },
        orderBy: { id: 'desc' }
      }
    }
  })

  if (!pedido) {
    throw createError({ statusCode: 404, message: 'Pedido no encontrado' })
  }

  const esAdmin = sessionUser.rol === 'admin'
  if (!esAdmin && pedido.usuario_id !== sessionUser.id) {
    throw createError({ statusCode: 403, message: 'No tienes permiso para ver este comprobante' })
  }

  const pagoConfirmado = pedido.pagos[0]
  if (!pagoConfirmado) {
    throw createError({
      statusCode: 400,
      message: 'Este pedido aún no cuenta con un pago confirmado por la pastelería'
    })
  }

  return {
    folio: `T2-${String(pedido.id).padStart(6, '0')}`,
    pedido,
    pagoConfirmado
  }
})
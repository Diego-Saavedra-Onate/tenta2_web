import { crearPedidoSchema } from '../../utils/schemas'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user as { id: number; vetado?: boolean; rol?:string }

  if (sessionUser.vetado) {
    throw createError({
      statusCode: 403,
      message: 'Tu cuenta se encuentra suspendida para realizar pedidos'
    })
  }
  if (sessionUser.rol === 'admin') {
  throw createError({
    statusCode: 403,
    message: 'Las cuentas de administrador no pueden realizar pedidos'
  })
}

  const body = await readBody(event)
  const parsed = crearPedidoSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Datos del pedido inválidos'
    })
  }

  const fechaRetiro = new Date(parsed.data.fecha_retiro)
  if (Number.isNaN(fechaRetiro.getTime())) {
    throw createError({
      statusCode: 400,
      message: 'La fecha de retiro seleccionada no es válida'
    })
  }

  const idsProductos = parsed.data.items.map((i) => i.producto_id)
  const productosDb = await prisma.productos.findMany({
    where: {
      id: { in: idsProductos },
      producto_visible: true
    }
  })

  if (productosDb.length !== idsProductos.length) {
    throw createError({
      statusCode: 400,
      message: 'Uno o más productos del carro ya no están disponibles'
    })
  }

  const mapaProductos = new Map(productosDb.map((p) => [p.id, p]))
  let montoTotal = 0

  const detallesPreparados = parsed.data.items.map((item) => {
    const prod = mapaProductos.get(item.producto_id)!
    if (prod.disponibilidad < item.cantidad) {
      throw createError({
        statusCode: 400,
        message: `Stock insuficiente para "${prod.nombre}" (disponible: ${prod.disponibilidad})`
      })
    }

    const precioUnitario = Number(prod.precio)
    montoTotal += precioUnitario * item.cantidad

    return {
      producto_id: prod.id,
      cantidad: item.cantidad,
      precio_unitario: precioUnitario,
      personalizacion: item.personalizacion || ''
    }
  })

  const pedidoCreado = await prisma.$transaction(async (tx) => {
    for (const item of detallesPreparados) {
      await tx.productos.update({
        where: { id: item.producto_id },
        data: {
          disponibilidad: { decrement: item.cantidad }
        }
      })
    }

    return await tx.pedidos.create({
      data: {
        usuario_id: sessionUser.id,
        rut_cliente: parsed.data.rut_cliente,
        nombre_cliente: parsed.data.nombre_cliente,
        fecha_retiro: fechaRetiro,
        monto_total: montoTotal,
        estado: 'PEN',
        detalles: {
          create: detallesPreparados
        }
      },
      include: {
        detalles: {
          include: { producto: true }
        }
      }
    })
  })

  return pedidoCreado
})
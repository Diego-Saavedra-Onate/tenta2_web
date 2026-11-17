import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [
    pagosConfirmadosMes,
    pedidosActivosCount,
    comprobantesPendientesCount,
    productosStockCritico,
    proximosRetiros,
    topDetalles
  ] = await Promise.all([
    prisma.pagos.aggregate({
      where: {
        estado: 'CON',
        fecha_comprobante: { gte: inicioMes }
      },
      _sum: { monto: true }
    }),
    prisma.pedidos.count({
      where: {
        estado: { in: ['PEN', 'ACE', 'PRE', 'LIS'] }
      }
    }),
    prisma.pagos.count({
      where: { estado: 'PEN' }
    }),
    prisma.productos.findMany({
      where: {
        producto_visible: true,
        disponibilidad: { lte: 3 }
      },
      orderBy: { disponibilidad: 'asc' },
      select: {
        id: true,
        nombre: true,
        disponibilidad: true,
        categoria: { select: { nombre: true } }
      }
    }),
    prisma.pedidos.findMany({
      where: {
        estado: { in: ['PEN', 'ACE', 'PRE', 'LIS'] }
      },
      orderBy: { fecha_retiro: 'asc' },
      take: 8,
      select: {
        id: true,
        nombre_cliente: true,
        fecha_retiro: true,
        estado: true,
        monto_total: true,
        _count: { select: { detalles: true } }
      }
    }),
    prisma.detallePedido.groupBy({
      by: ['producto_id'],
      where: {
        pedido: { estado: { not: 'RCH' } }
      },
      _sum: { cantidad: true },
      orderBy: {
        _sum: { cantidad: 'desc' }
      },
      take: 5
    })
  ])

  const idsTop = topDetalles.map((t) => t.producto_id)
  const productosTopInfo = idsTop.length
    ? await prisma.productos.findMany({
        where: { id: { in: idsTop } },
        select: { id: true, nombre: true, precio: true }
      })
    : []

  const mapaTop = new Map(productosTopInfo.map((p) => [p.id, p]))
  const rankingProductos = topDetalles.map((item) => {
    const prod = mapaTop.get(item.producto_id)
    return {
      producto_id: item.producto_id,
      nombre: prod?.nombre || `Producto #${item.producto_id}`,
      unidadesVendidas: item._sum.cantidad ?? 0,
      ingresosEstimados: Number(prod?.precio ?? 0) * (item._sum.cantidad ?? 0)
    }
  })

  return {
    ingresosMes: Number(pagosConfirmadosMes._sum.monto ?? 0),
    pedidosActivos: pedidosActivosCount,
    comprobantesPendientes: comprobantesPendientesCount,
    stockCriticoCount: productosStockCritico.length,
    productosStockCritico,
    proximosRetiros,
    rankingProductos
  }
})
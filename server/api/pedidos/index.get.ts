export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user as { id: number; rol: string }

  const query = getQuery(event)
  const estado = typeof query.estado === 'string' && query.estado !== 'TODOS'
    ? query.estado
    : undefined

  const esAdmin = sessionUser.rol === 'admin'

  return await prisma.pedidos.findMany({
    where: {
      ...(esAdmin ? {} : { usuario_id: sessionUser.id }),
      ...(estado ? { estado: estado as any } : {})
    },
    orderBy: { fecha_pedido: 'desc' },
    include: {
      usuario: {
        select: {
          id: true,
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
              id: true,
              nombre: true,
              imagen: true
            }
          }
        }
      },
      pagos: {
        orderBy: { fecha_comprobante: 'desc' }
      }
    }
  })
})
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const session = await getUserSession(event)
  const user = session.user as { rol?: string } | undefined

  const mostrarTodos = query.incluirOcultos === 'true' && user?.rol === 'admin'

  return await prisma.productos.findMany({
    where: mostrarTodos ? undefined : { producto_visible: true },
    orderBy: { id: 'desc' },
    include: {
      categoria: true
    }
  })
})
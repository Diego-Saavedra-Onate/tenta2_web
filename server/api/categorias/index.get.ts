export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const session = await getUserSession(event)
  const user = session.user as { rol?: string } | undefined

  const mostrarTodos = query.incluirOcultos === 'true' && user?.rol === 'admin'

  return await prisma.categorias.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      producto: {
        where: mostrarTodos ? undefined : { producto_visible: true },
        orderBy: { nombre: 'asc' }
      }
    }
  })
})
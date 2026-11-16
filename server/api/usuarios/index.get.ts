import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const query = getQuery(event)
  const rol = typeof query.rol === 'string' && ['admin', 'cliente'].includes(query.rol)
    ? query.rol
    : undefined
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  return await prisma.usuario.findMany({
    where: {
      ...(rol ? { rol } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q } },
              { apellido: { contains: q } },
              { email: { contains: q } }
            ]
          }
        : {})
    },
    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      rol: true,
      telefono: true,
      vetado: true,
      _count: {
        select: { pedidos: true }
      }
    }
  })
})
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  return await prisma.usuario.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      rol: true,
      telefono: true,
      vetado: true
    }
  })
})
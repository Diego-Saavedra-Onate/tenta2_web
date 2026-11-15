/// <reference types="node" />
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

// Inicialización del adaptador compatible con MySQL en Prisma 7
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando sembrado de datos (Seed)...')

  // 1. Categorías base según el informe del proyecto
  const categoriasBase = [
    { nombre: 'Tortas', descripcion: 'Tortas artesanales para ocasiones especiales' },
    { nombre: 'Brownies', descripcion: 'Brownies intensos con cobertura crujiente' },
    { nombre: 'Galletas', descripcion: 'Bolsas surtidas de galletas artesanales' },
    { nombre: 'Tartaletas', descripcion: 'Tartaletas con frutas de temporada y crema' },
    { nombre: 'Pies', descripcion: 'Pies tradicionales de limón, maracuyá y frambuesa' },
    { nombre: 'Pastelitos', descripcion: 'Pasteles individuales: berlines, mil hojas y cachitos' }
  ]

  for (let i = 0; i < categoriasBase.length; i++) {
    await prisma.categorias.upsert({
      where: { id: i + 1 },
      update: {},
      create: categoriasBase[i]!
    })
  }

  // 2. Usuario Administrador por defecto (contraseña encriptada con bcryptjs)
  const hashedPassword = await bcrypt.hash('admin1234', 10)

  await prisma.usuario.upsert({
    where: { email: 'admin@tenta2.cl' },
    update: {},
    create: {
      nombre: 'Administración',
      apellido: 'Tenta2',
      email: 'admin@tenta2.cl',
      password: hashedPassword,
      rol: 'admin',
      telefono: '+56912345678',
      vetado: false
    }
  })

  // 3. Productos iniciales de prueba
  await prisma.productos.createMany({
    skipDuplicates: true,
    data: [
      {
        categoria_id: 1,
        nombre: 'Torta Amor',
        descripcion: 'Capas delgadas de masa hojarasca horneadas',
        precio: 20000,
        disponibilidad: 5,
        producto_visible: true,
        imagen: '/images/torta_A.jpg'
      },
      {
        categoria_id: 2,
        nombre: 'Brownie chocolate',
        descripcion: 'Intensamente chocolatoso con capa crujiente',
        precio: 5000,
        disponibilidad: 20,
        producto_visible: true,
        imagen: '/images/brownie_A.jpg'
      }
    ]
  })

  console.log('Sembrado de datos completado con éxito.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
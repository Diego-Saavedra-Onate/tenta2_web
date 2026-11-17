import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'

const MIME_PERMITIDOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user as { id: number; vetado?: boolean }

  if (sessionUser.vetado) {
    throw createError({ statusCode: 403, message: 'Tu cuenta se encuentra suspendida' })
  }

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibió ningún archivo ni datos de pago' })
  }

  let pedidoIdRaw = ''
  let montoRaw = ''
  let archivoPart: (typeof parts)[number] | undefined

  for (const part of parts) {
    if (part.name === 'pedido_id') {
      pedidoIdRaw = part.data.toString('utf8').trim()
    } else if (part.name === 'monto') {
      montoRaw = part.data.toString('utf8').trim()
    } else if (part.name === 'comprobante' && part.filename) {
      archivoPart = part
    }
  }

  const pedidoId = Number(pedidoIdRaw)
  const monto = Number(montoRaw)

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    throw createError({ statusCode: 400, message: 'ID de pedido inválido' })
  }

  if (!Number.isFinite(monto) || monto <= 0) {
    throw createError({ statusCode: 400, message: 'El monto transferido debe ser mayor a 0' })
  }

  if (!archivoPart || !archivoPart.data || archivoPart.data.length === 0) {
    throw createError({ statusCode: 400, message: 'Debes adjuntar el archivo del comprobante' })
  }

  if (archivoPart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, message: 'El comprobante no puede superar los 5 MB' })
  }

  const mime = archivoPart.type || ''
  const ext = MIME_PERMITIDOS[mime] || extname(archivoPart.filename || '').toLowerCase()
  if (!['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext)) {
    throw createError({
      statusCode: 400,
      message: 'Formato no permitido. Sube una imagen (JPG, PNG, WEBP) o un archivo PDF'
    })
  }

  const pedido = await prisma.pedidos.findUnique({
    where: { id: pedidoId },
    include: { pagos: true }
  })

  if (!pedido || pedido.usuario_id !== sessionUser.id) {
    throw createError({ statusCode: 404, message: 'Pedido no encontrado' })
  }

  if (pedido.estado !== 'ACE') {
    throw createError({
      statusCode: 400,
      message: 'Solo puedes subir comprobantes para pedidos en estado Aceptado (ACE)'
    })
  }

  const tienePagoActivo = pedido.pagos.some((p) => p.estado === 'PEN' || p.estado === 'CON')
  if (tienePagoActivo) {
    throw createError({
      statusCode: 400,
      message: 'Este pedido ya tiene un comprobante en revisión o confirmado'
    })
  }

  const carpetaDestino = join(process.cwd(), 'public', 'uploads', 'comprobantes')
  await mkdir(carpetaDestino, { recursive: true })

  const nombreArchivo = `pedido-${pedidoId}-${randomUUID()}${ext}`
  await writeFile(join(carpetaDestino, nombreArchivo), archivoPart.data)

  const rutaPublica = `/uploads/comprobantes/${nombreArchivo}`

  return await prisma.pagos.create({
    data: {
      pedido_id: pedidoId,
      comprobante: rutaPublica,
      monto,
      estado: 'PEN'
    }
  })
})
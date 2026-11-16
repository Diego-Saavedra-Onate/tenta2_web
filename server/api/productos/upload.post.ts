import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { requireRole } from '../../utils/auth'

const MIME_PERMITIDOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const parts = await readMultipartFormData(event)
  const archivoPart = parts?.find((p) => p.name === 'imagen' && p.filename)

  if (!archivoPart || !archivoPart.data || archivoPart.data.length === 0) {
    throw createError({ statusCode: 400, message: 'Debes seleccionar un archivo de imagen' })
  }

  if (archivoPart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, message: 'La imagen no puede superar los 5 MB' })
  }

  const mime = archivoPart.type || ''
  const ext = MIME_PERMITIDOS[mime] || extname(archivoPart.filename || '').toLowerCase()

  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    throw createError({
      statusCode: 400,
      message: 'Formato no permitido. Usa JPG, PNG o WEBP'
    })
  }

  const carpetaDestino = join(process.cwd(), 'public', 'uploads', 'productos')
  await mkdir(carpetaDestino, { recursive: true })

  const nombreArchivo = `prod-${randomUUID()}${ext}`
  await writeFile(join(carpetaDestino, nombreArchivo), archivoPart.data)

  return {
    url: `/uploads/productos/${nombreArchivo}`
  }
})
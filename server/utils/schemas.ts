import { z } from 'zod'

export const productoSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  descripcion: z.string().trim().max(200).optional().default(''),
  precio: z.coerce.number().min(1, 'El precio debe ser mayor a 0'),
  disponibilidad: z.coerce.number().int().min(0, 'El stock no puede ser negativo').default(0),
  producto_visible: z.boolean().optional().default(true),
  imagen: z.string().trim().max(255).optional().default(''),
  categoria_id: z.coerce.number().int().positive('Debes seleccionar una categoría válida')
})
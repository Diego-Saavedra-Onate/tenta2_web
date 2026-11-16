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

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(50),
  descripcion: z.string().trim().min(3, 'La descripción es obligatoria').max(200)
})

const telefonoChilenoSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ''))
  .refine(
    (val) => /^(\+569|569|9)?\d{8}$/.test(val),
    'Ingresa un teléfono móvil chileno válido (8 dígitos tras +56 9)'
  )
  .transform((val) => {
    const digitos = val.slice(-8)
    return `+569${digitos}`
  })

export const crearUsuarioSchema = z.object({
  email: z.string().trim().toLowerCase().email('Formato de correo inválido').max(250),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
  rol: z.enum(['admin', 'cliente']).default('admin'),
  telefono: telefonoChilenoSchema,
  vetado: z.boolean().optional().default(false)
})

export const editarUsuarioSchema = z.object({
  email: z.string().trim().toLowerCase().email('Formato de correo inválido').max(250),
  password: z
    .string()
    .max(100)
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined))
    .refine((val) => !val || val.length >= 6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
  rol: z.enum(['admin', 'cliente']).optional(),
  telefono: telefonoChilenoSchema,
  vetado: z.boolean().optional()
})
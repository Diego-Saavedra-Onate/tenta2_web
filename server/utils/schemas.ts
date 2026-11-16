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

export const registroClienteSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
  email: z.string().trim().toLowerCase().email('Formato de correo inválido').max(250),
  telefono: telefonoChilenoSchema,
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100)
})

export const crearPedidoSchema = z.object({
  rut_cliente: z
    .string()
    .trim()
    .transform((val) => val.replace(/\./g, '').toUpperCase())
    .refine((val) => /^\d{7,8}-[\dK]$/.test(val), 'Ingresa un RUT chileno válido (ej: 12.345.678-9)'),
  nombre_cliente: z
    .string()
    .trim()
    .min(3, 'El nombre de quien retira es obligatorio')
    .max(100),
  fecha_retiro: z
    .string()
    .trim()
    .min(1, 'Debes seleccionar una fecha de retiro'),
  items: z
    .array(
      z.object({
        producto_id: z.coerce.number().int().positive(),
        cantidad: z.coerce.number().int().min(1, 'La cantidad mínima es 1'),
        personalizacion: z.string().trim().max(500).optional().default('')
      })
    )
    .min(1, 'El carro de compras no puede estar vacío')
})

export const actualizarPedidoAdminSchema = z.object({
  estado: z.enum(['PEN', 'ACE', 'PRE', 'LIS', 'ENT', 'RCH']),
  fecha_retiro: z.string().trim().optional()
})
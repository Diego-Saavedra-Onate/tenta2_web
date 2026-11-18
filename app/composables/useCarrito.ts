import type { Productos } from '~/types/Productos'
import type { Usuario } from '~/types/Usuario'

export interface ItemCarrito {
  id: number
  nombre: string
  categoriaNombre: string
  precio: number
  imagen: string
  cantidad: number
  disponibilidad: number
  personalizacion: string
}

const STORAGE_KEY = 'tenta2_carrito_v1'

export function useCarrito() {
  const { user } = useUserSession()
  const esAdmin = computed(() => (user.value as Usuario | null)?.rol === 'admin')

  const items = useState<ItemCarrito[]>('carrito-items', () => [])
  const cargado = useState<boolean>('carrito-cargado', () => false)

  onMounted(() => {
    if (!cargado.value) {
      cargado.value = true
      try {
        const guardado = localStorage.getItem(STORAGE_KEY)
        if (guardado) {
          const parsed = JSON.parse(guardado)
          if (Array.isArray(parsed)) {
            items.value = parsed
          }
        }
      } catch {
        items.value = []
      }
    }
  })

  function guardarEnStorage() {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
      } catch {
        // Ignorar errores de almacenamiento
      }
    }
  }

  const totalUnidades = computed(() =>
    items.value.reduce((acc, item) => acc + item.cantidad, 0)
  )

  const totalMonto = computed(() =>
    items.value.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  )

  const diasPreparacionMinimos = computed(() => {
    if (items.value.length === 0) return 1
    let maxDias = 0

    const categorias3Dias = ['tortas', 'especiales', 'eventos']
    const categorias2Dias = ['brownies', 'pastelitos', 'tartaletas', 'salados']

    for (const item of items.value) {
      const cat = (item.categoriaNombre || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      if (categorias3Dias.some((c) => cat.includes(c))) {
        maxDias = Math.max(maxDias, 2)
      } else if (categorias2Dias.some((c) => cat.includes(c))) {
        maxDias = Math.max(maxDias, 1)
      }
    }

    return maxDias
  })

  function agregarProducto(producto: Productos, cantidad = 1, categoriaNombre = '') {
    if (esAdmin.value) {
      return {
        ok: false,
        message: 'Las cuentas de administración no pueden agregar productos al carro'
      }
    }

    const stockMax = Number(producto.disponibilidad ?? 0)
    if (stockMax <= 0) {
      return { ok: false, message: 'Producto sin stock disponible' }
    }

    const nombreCatResuelto =
      categoriaNombre ||
      producto.categoria?.nombre ||
      (producto as any).categoriaNombre ||
      ''

    const existente = items.value.find((i) => i.id === producto.id)

    if (existente) {
      const nuevaCantidad = Math.min(existente.cantidad + cantidad, stockMax)
      if (nuevaCantidad === existente.cantidad) {
        return { ok: false, message: `Stock máximo alcanzado (${stockMax} unid.)` }
      }
      existente.cantidad = nuevaCantidad
      existente.disponibilidad = stockMax
      if (nombreCatResuelto) existente.categoriaNombre = nombreCatResuelto
      guardarEnStorage()
      return { ok: true, message: `Cantidad actualizada (${nuevaCantidad} en el carro)` }
    }

    items.value.push({
      id: producto.id,
      nombre: producto.nombre,
      categoriaNombre: nombreCatResuelto,
      precio: Number(producto.precio),
      imagen: producto.imagen || '',
      cantidad: Math.min(cantidad, stockMax),
      disponibilidad: stockMax,
      personalizacion: ''
    })

    guardarEnStorage()
    return { ok: true, message: 'Producto agregado al carro' }
  }

  function actualizarCantidad(id: number, nuevaCantidad: number) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    if (nuevaCantidad <= 0) {
      eliminarProducto(id)
      return
    }

    item.cantidad = Math.min(nuevaCantidad, item.disponibilidad)
    guardarEnStorage()
  }

  function eliminarProducto(id: number) {
    items.value = items.value.filter((i) => i.id !== id)
    guardarEnStorage()
  }

  function vaciarCarrito() {
    items.value = []
    guardarEnStorage()
  }

  return {
    items,
    totalUnidades,
    totalMonto,
    diasPreparacionMinimos,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
    vaciarCarrito
  }
}
<script setup lang="ts">
import type { Usuario } from '~/types/Usuario'
import FechaInputChile from '~/components/FechaInputChile.vue'
import { UMBRAL_PRODUCTOS_PEQUENOS } from '~/composables/useCarrito'

const toast = useToast()
const { loggedIn, user } = useUserSession()
const usuarioActual = computed(() => user.value as Usuario | null)
const esAdmin = computed(() => usuarioActual.value?.rol === 'admin')

const {
    items,
    totalMonto,
    totalUnidadesPequenos,
    diasPreparacionMinimos,
    actualizarCantidad,
    eliminarProducto,
    vaciarCarrito
} = useCarrito()

const rutCliente = ref('')
const nombreCliente = ref('')
const fechaRetiro = ref('')
const enviandoPedido = ref(false)
const errorPedido = ref('')

watch(usuarioActual, (u) => {
    if (u && !nombreCliente.value) {
        nombreCliente.value = `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim()
    }
}, { immediate: true })

const fechaMinimaISO = computed(() => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + diasPreparacionMinimos.value)
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    const d = String(fecha.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
})

watch(fechaMinimaISO, (minVal, oldMinVal) => {
    if (!fechaRetiro.value || fechaRetiro.value < minVal || fechaRetiro.value === oldMinVal) {
        fechaRetiro.value = minVal
    }
}, { immediate: true })

const formatearFechaChile = (isoDate: string) => {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    if (!y || !m || !d) return isoDate
    return `${d}/${m}/${y}`
}

const formatPrecio = (valor: number) => {
    return '$' + Number(valor).toLocaleString('es-CL')
}

async function confirmarCompra() {
    if (esAdmin.value) return

    if (!loggedIn.value) {
        await navigateTo('/login')
        return
    }

    enviandoPedido.value = true
    errorPedido.value = ''

    try {
        await $fetch('/api/pedidos', {
            method: 'POST',
            body: {
                rut_cliente: rutCliente.value,
                nombre_cliente: nombreCliente.value,
                fecha_retiro: fechaRetiro.value,
                items: items.value.map((i) => ({
                    producto_id: i.id,
                    cantidad: i.cantidad,
                    personalizacion: i.personalizacion
                }))
            }
        })

        vaciarCarrito()
        toast.add({
            title: '¡Pedido registrado con éxito!',
            description: 'Tu solicitud quedó en estado Pendiente de aprobación (PEN).',
            color: 'primary'
        })
        await navigateTo('/mis-pedidos')
    } catch (err: any) {
        errorPedido.value = getApiErrorMessage(err, 'No se pudo procesar el pedido. Revisa los datos.')
    } finally {
        enviandoPedido.value = false
    }
}
</script>

<template>
    <div class="py-10 bg-default min-h-screen text-default">
        <UContainer class="space-y-8">

            <div>
                <h1 class="text-3xl font-extrabold tracking-tight text-highlighted">
                    Carro de Compras
                </h1>
                <p class="text-sm text-muted mt-1">
                    Revisa tus productos, añade notas de personalización y confirma tu fecha de retiro.
                </p>
            </div>

            <!-- Bloqueo exclusivo para administradores -->
            <div v-if="esAdmin"
                class="border border-dashed border-default rounded-2xl bg-elevated/40 p-12 text-center space-y-4">
                <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-primary mx-auto" />
                <div class="space-y-1">
                    <h3 class="text-lg font-bold text-highlighted">
                        Acceso restringido para administradores
                    </h3>
                    <p class="text-sm text-muted max-w-md mx-auto">
                        Las cuentas de administración están destinadas exclusivamente a la gestión del local y no pueden
                        realizar compras.
                    </p>
                </div>
                <UButton to="/admin" color="primary" icon="i-heroicons-cog-6-tooth" class="mt-2 font-medium">
                    Ir al Panel de Administración
                </UButton>
            </div>

            <div v-else-if="items.length === 0"
                class="border border-dashed border-default rounded-2xl bg-elevated/40 p-12 text-center space-y-4">
                <UIcon name="i-heroicons-shopping-cart" class="w-16 h-16 text-muted mx-auto" />
                <div class="space-y-1">
                    <h3 class="text-lg font-bold text-highlighted">
                        Tu carro está vacío
                    </h3>
                    <p class="text-sm text-muted max-w-sm mx-auto">
                        Aún no has agregado ningún producto a tu pedido. Explora nuestro catálogo para comenzar.
                    </p>
                </div>
                <UButton to="/productos" color="primary" icon="i-heroicons-arrow-left" class="mt-2 font-medium">
                    Ver productos
                </UButton>
            </div>

            <div v-else class="space-y-8">
                <div class="border border-default rounded-xl bg-elevated shadow-xs overflow-x-auto">
                    <table class="w-full text-left text-sm border-collapse min-w-187.5">
                        <thead>
                            <tr class="bg-accented/20 border-b-2 border-primary/80 text-muted font-semibold">
                                <th scope="col" class="py-3 px-4 text-center w-16">Borrar</th>
                                <th scope="col" class="py-3 px-4 text-center w-28">Foto</th>
                                <th scope="col" class="py-3 px-6">Producto y Personalización</th>
                                <th scope="col" class="py-3 px-4 text-center w-32">Precio</th>
                                <th scope="col" class="py-3 px-4 text-center w-28">Cantidad</th>
                                <th scope="col" class="py-3 px-6 text-right w-32">Total</th>
                            </tr>
                        </thead>

                        <tbody class="divide-y divide-default">
                            <tr v-for="item in items" :key="item.id" class="hover:bg-accented/10 transition-colors">
                                <td class="py-4 px-4 text-center">
                                    <UButton variant="ghost" color="neutral" icon="i-heroicons-trash" size="sm"
                                        class="text-muted hover:text-error transition-colors cursor-pointer"
                                        @click="eliminarProducto(item.id)" />
                                </td>

                                <td class="py-4 px-4 text-center">
                                    <div
                                        class="w-20 h-16 mx-auto rounded-lg overflow-hidden bg-accented/30 flex items-center justify-center border border-default">
                                        <img v-if="item.imagen" :src="item.imagen" :alt="item.nombre"
                                            class="w-full h-full object-cover" />
                                        <UIcon v-else name="i-heroicons-cake" class="w-6 h-6 text-primary" />
                                    </div>
                                </td>

                                <td class="py-4 px-6 space-y-2 max-w-md">
                                    <p class="font-bold text-highlighted">
                                        {{ item.nombre }}
                                    </p>
                                    <UInput v-model="item.personalizacion" size="xs"
                                        placeholder="Nota opcional (ej: Feliz Cumpleaños Mamá, sin nueces...)"
                                        class="w-full" />
                                </td>

                                <td class="py-4 px-4 text-center font-medium text-highlighted">
                                    {{ formatPrecio(item.precio) }}
                                </td>

                                <td class="py-4 px-4 text-center">
                                    <input :value="item.cantidad" type="number" min="1" :max="item.disponibilidad"
                                        class="w-16 text-center py-1.5 px-2 bg-default border border-default rounded-md text-highlighted text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                        @change="actualizarCantidad(item.id, Number(($event.target as HTMLInputElement).value))" />
                                    <p class="text-[11px] text-muted mt-1">
                                        Disp: {{ item.disponibilidad }}
                                    </p>
                                </td>

                                <td class="py-4 px-6 text-right font-bold text-highlighted">
                                    {{ formatPrecio(item.precio * item.cantidad) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                    <div class="lg:col-span-7 border border-default rounded-xl bg-elevated p-6 space-y-4 shadow-xs">
                        <h2 class="text-lg font-bold text-highlighted border-b border-default pb-3">
                            Datos de Retiro en Local (Algarrobo)
                        </h2>

                        <div v-if="!loggedIn"
                            class="p-4 rounded-xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <p class="text-sm text-highlighted">
                                Inicia sesión o crea una cuenta gratuita para asociar el pedido a tu historial.
                            </p>
                            <div class="flex gap-2 shrink-0">
                                <UButton to="/login" size="sm" color="primary">
                                    Iniciar sesión
                                </UButton>
                                <UButton to="/registro" size="sm" color="neutral" variant="outline">
                                    Registrarse
                                </UButton>
                            </div>
                        </div>

                        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UFormField label="Nombre de quien retira">
                                <UInput v-model="nombreCliente" placeholder="Nombre y Apellido" class="w-full" />
                            </UFormField>

                            <UFormField label="RUT del cliente">
                                <UInput v-model="rutCliente" placeholder="Ej: 12.345.678-9" class="w-full" />
                            </UFormField>

                            <UFormField label="Fecha sugerida de retiro (sujeta a confirmación)" class="sm:col-span-2">
                                <div class="space-y-1.5">
                                    <FechaInputChile v-model="fechaRetiro" :min="fechaMinimaISO" />
                                    <p class="text-xs text-muted leading-relaxed">
                                        <template v-if="diasPreparacionMinimos === 0">
                                            <span class="font-semibold text-emerald-600">
                                                ¡Disponible para retiro hoy mismo ({{
                                                    formatearFechaChile(fechaMinimaISO) }})!
                                            </span>
                                            (Pedidos menores a {{ UMBRAL_PRODUCTOS_PEQUENOS }} unidades de productos
                                            pequeños).
                                        </template>
                                        <template v-else>
                                            Disponible desde el <strong class="text-highlighted">{{
                                                formatearFechaChile(fechaMinimaISO) }}</strong>
                                            ({{ diasPreparacionMinimos }} día(s) de preparación).
                                            <span v-if="totalUnidadesPequenos >= UMBRAL_PRODUCTOS_PEQUENOS"
                                                class="text-primary font-medium">
                                                Al llevar {{ totalUnidadesPequenos }} unidades de productos pequeños (≥
                                                {{ UMBRAL_PRODUCTOS_PEQUENOS }}), el retiro pasa al día siguiente.
                                            </span>
                                        </template>
                                        Fecha seleccionada: <strong class="text-primary">{{
                                            formatearFechaChile(fechaRetiro) }}</strong>.
                                    </p>
                                </div>
                            </UFormField>
                        </div>

                        <UAlert v-if="errorPedido" color="error" variant="soft" icon="i-heroicons-exclamation-circle"
                            :title="errorPedido" />
                    </div>

                    <div class="lg:col-span-5 space-y-4">
                        <div class="border border-default rounded-xl overflow-hidden bg-elevated shadow-xs">
                            <div
                                class="bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5">
                                Resumen del Pedido
                            </div>
                            <div class="flex justify-between items-center px-6 py-5">
                                <span class="text-sm font-medium text-muted">Total a pagar:</span>
                                <span class="text-2xl font-extrabold text-highlighted">
                                    {{ formatPrecio(totalMonto) }}
                                </span>
                            </div>
                        </div>

                        <div class="flex justify-end items-center gap-3">
                            <UButton color="neutral" variant="subtle" size="md"
                                class="font-semibold px-5 cursor-pointer" @click="vaciarCarrito">
                                Limpiar Carro
                            </UButton>

                            <UButton color="primary" size="md" class="font-semibold px-6 shadow-xs cursor-pointer"
                                :loading="enviandoPedido" :disabled="!loggedIn" @click="confirmarCompra">
                                Confirmar Pedido
                            </UButton>
                        </div>
                    </div>
                </div>
            </div>

        </UContainer>
    </div>
</template>
<script setup lang="ts">
const route = useRoute()
const pedidoId = Number(route.params.id)

const { data, pending, error } = await useFetch<any>(`/api/pedidos/${pedidoId}/comprobante`)
const { generarArchivoPdf } = useComprobantePdf()

const formatearFechaChile = (fecha: string | Date | null) => {
    if (!fecha) return '-'
    const iso = typeof fecha === 'string' ? fecha.split('T')[0] : new Date(fecha).toISOString().split('T')[0]
    const [y, m, d] = (iso ?? '').split('-')
    return y && m && d ? `${d}/${m}/${y}` : '-'
}

const formatPrecio = (val: number | string) => {
    return '$' + Math.round(Number(val)).toLocaleString('es-CL')
}

const totalBruto = computed(() => Number(data.value?.pedido?.monto_total ?? 0))
const montoNeto = computed(() => Math.round(totalBruto.value / 1.19))
const montoIva = computed(() => totalBruto.value - montoNeto.value)

function imprimirComprobante() {
    if (import.meta.client) {
        window.print()
    }
}
</script>

<template>
    <div class="min-h-screen bg-default py-8 px-4 print:bg-white print:py-0 print:px-0">
        <div class="max-w-3xl mx-auto space-y-6">
            <!-- Barra de acciones -->
            <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <UButton color="neutral" variant="outline" icon="i-heroicons-arrow-left" @click="$router.back()">
                    Volver
                </UButton>

                <div v-if="data" class="flex flex-wrap items-center gap-2">
                    <UButton color="neutral" variant="outline" icon="i-heroicons-printer" @click="imprimirComprobante">
                        Imprimir
                    </UButton>
                    <UButton color="primary" icon="i-heroicons-arrow-down-tray" @click="generarArchivoPdf(data)">
                        Descargar PDF
                    </UButton>
                </div>
            </div>

            <div v-if="pending" class="text-center py-16 text-muted flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-primary" />
                Generando comprobante de venta...
            </div>

            <UAlert v-else-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-circle"
                title="Comprobante no disponible"
                :description="getApiErrorMessage(error, 'El pedido no existe o su pago aún no ha sido confirmado.')" />

            <!-- Documento Oficial Tenta2 -->
            <div v-else-if="data"
                class="bg-white text-zinc-900 border border-zinc-200 rounded-2xl p-8 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:rounded-none">
                <div
                    class="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-zinc-900 pb-6">
                    <div class="space-y-1">
                        <span class="text-xs font-bold uppercase tracking-widest text-rose-600">
                            Pastelería y Repostería Artesanal
                        </span>
                        <h1 class="text-3xl font-black tracking-tight text-zinc-900">
                            TENTA2
                        </h1>
                        <p class="text-xs text-zinc-600">RUT: 77.123.456-7 · Giro: Elaboración de productos de panadería
                            y pastelería</p>
                        <p class="text-xs text-zinc-600">Algarrobo, Región de Valparaíso, Chile · pagos@tenta2.cl</p>
                    </div>

                    <div
                        class="border-2 border-rose-600 rounded-xl px-5 py-3 text-center sm:text-right shrink-0 bg-rose-50/40">
                        <span class="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                            Comprobante de Venta
                        </span>
                        <span class="text-xl font-black font-mono text-zinc-900 block mt-0.5">
                            N° {{ data.folio }}
                        </span>
                        <span class="text-[11px] text-zinc-600 block mt-1">
                            Pedido #{{ data.pedido.id }}
                        </span>
                    </div>
                </div>

                <div
                    class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm bg-zinc-50 p-5 rounded-xl border border-zinc-200">
                    <div class="space-y-1.5">
                        <p class="text-xs font-bold uppercase tracking-wider text-zinc-500">Datos del Cliente</p>
                        <p><strong class="text-zinc-800">Retira:</strong> {{ data.pedido.nombre_cliente }}</p>
                        <p><strong class="text-zinc-800">RUT:</strong> <span class="font-mono">{{
                            data.pedido.rut_cliente }}</span></p>
                        <p><strong class="text-zinc-800">Cuenta:</strong> {{ data.pedido.usuario?.nombre }} {{
                            data.pedido.usuario?.apellido }}</p>
                        <p><strong class="text-zinc-800">Contacto:</strong> {{ data.pedido.usuario?.telefono ||
                            data.pedido.usuario?.email }}</p>
                    </div>

                    <div class="space-y-1.5 sm:text-right">
                        <p class="text-xs font-bold uppercase tracking-wider text-zinc-500">Información de Orden y Pago
                        </p>
                        <p><strong class="text-zinc-800">Fecha Pedido:</strong> {{
                            formatearFechaChile(data.pedido.fecha_pedido) }}</p>
                        <p><strong class="text-zinc-800">Fecha Retiro Comprometida:</strong> {{
                            formatearFechaChile(data.pedido.fecha_retiro) }}</p>
                        <p><strong class="text-zinc-800">Fecha Validación Pago:</strong> {{
                            formatearFechaChile(data.pagoConfirmado.fecha_comprobante) }}</p>
                        <p>
                            <strong class="text-zinc-800">Estado Pago:</strong>
                            <span
                                class="inline-block ml-1 px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                                TRANSFERENCIA CONFIRMADA
                            </span>
                        </p>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr
                                class="border-b-2 border-zinc-300 text-xs font-bold uppercase tracking-wider text-zinc-600">
                                <th class="py-3 px-2">Cant.</th>
                                <th class="py-3 px-2">Descripción del Producto</th>
                                <th class="py-3 px-2 text-right">Precio Unit.</th>
                                <th class="py-3 px-2 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-200">
                            <tr v-for="det in data.pedido.detalles" :key="det.id">
                                <td class="py-3.5 px-2 font-bold align-top">
                                    {{ det.cantidad }}
                                </td>
                                <td class="py-3.5 px-2">
                                    <span class="font-bold text-zinc-900 block">{{ det.producto?.nombre }}</span>
                                    <span v-if="det.producto?.categoria?.nombre" class="text-xs text-zinc-500 block">
                                        Categoría: {{ det.producto.categoria.nombre }}
                                    </span>
                                    <span v-if="det.personalizacion"
                                        class="text-xs text-rose-700 font-medium block mt-1">
                                        Personalización: "{{ det.personalizacion }}"
                                    </span>
                                </td>
                                <td class="py-3.5 px-2 text-right font-mono align-top">
                                    {{ formatPrecio(det.precio_unitario) }}
                                </td>
                                <td class="py-3.5 px-2 text-right font-mono font-bold align-top">
                                    {{ formatPrecio(Number(det.precio_unitario) * det.cantidad) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t-2 border-zinc-900">
                    <div class="text-xs text-zinc-500 max-w-sm space-y-1">
                        <p class="font-semibold text-zinc-700">Condiciones de retiro:</p>
                        <p>Presenta este comprobante (digital o impreso) junto con tu cédula de identidad al momento de
                            retirar tu pedido en local.</p>
                    </div>

                    <div class="w-full sm:w-64 space-y-1.5 text-sm">
                        <div class="flex justify-between text-zinc-600">
                            <span>Monto Neto:</span>
                            <span class="font-mono">{{ formatPrecio(montoNeto) }}</span>
                        </div>
                        <div class="flex justify-between text-zinc-600">
                            <span>IVA (19%):</span>
                            <span class="font-mono">{{ formatPrecio(montoIva) }}</span>
                        </div>
                        <div
                            class="flex justify-between text-lg font-black text-zinc-900 pt-2 border-t border-zinc-300">
                            <span>TOTAL PAGADO:</span>
                            <span class="font-mono text-rose-600">{{ formatPrecio(totalBruto) }}</span>
                        </div>
                    </div>
                </div>

                <div class="text-center text-xs text-zinc-400 pt-6 border-t border-zinc-200">
                    Documento generado electrónicamente por el sistema de gestión de Pastelería Tenta2 · Gracias por
                    preferirnos.
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import FechaInputChile from '~/components/FechaInputChile.vue'

const toast = useToast()

const estadoFiltro = ref<string>('TODOS')
const actualizandoId = ref<number | null>(null)
const validandoPagoId = ref<number | null>(null)
const fechasEditadas = reactive<Record<number, string>>({})

const fechaHoyISO = computed(() => {
    const hoy = new Date()
    const y = hoy.getFullYear()
    const m = String(hoy.getMonth() + 1).padStart(2, '0')
    const d = String(hoy.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
})

const estadosOpciones = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Pendientes (PEN)', value: 'PEN' },
    { label: 'Aceptados / Por Pagar (ACE)', value: 'ACE' },
    { label: 'En Preparación (PRE)', value: 'PRE' },
    { label: 'Listos para Retiro (LIS)', value: 'LIS' },
    { label: 'Entregados (ENT)', value: 'ENT' },
    { label: 'Rechazados (RCH)', value: 'RCH' }
]

const etiquetasEstado: Record<string, { texto: string; color: any }> = {
    PEN: { texto: 'Pendiente de evaluación', color: 'warning' },
    ACE: { texto: 'Aceptado (esperando pago)', color: 'info' },
    PRE: { texto: 'En preparación', color: 'primary' },
    LIS: { texto: 'Listo para retiro', color: 'success' },
    ENT: { texto: 'Entregado', color: 'neutral' },
    RCH: { texto: 'Rechazado', color: 'error' }
}

const etiquetasPago: Record<string, { texto: string; color: any }> = {
    PEN: { texto: 'Pendiente de verificación', color: 'warning' },
    CON: { texto: 'Confirmado', color: 'success' },
    RCH: { texto: 'Rechazado', color: 'error' }
}

const { data: pedidos, pending, error, refresh } = await useFetch<any[]>('/api/pedidos', {
    query: computed(() => ({
        estado: estadoFiltro.value
    }))
})

watch(pedidos, (lista) => {
    if (!lista) return
    for (const p of lista) {
        if (!fechasEditadas[p.id] && p.fecha_retiro) {
            fechasEditadas[p.id] = new Date(p.fecha_retiro).toISOString().split('T')[0] ?? ''
        }
    }
}, { immediate: true })

const formatearFechaChile = (fecha: string | Date | null) => {
    if (!fecha) return '-'
    const iso = typeof fecha === 'string' ? fecha.split('T')[0] : new Date(fecha).toISOString().split('T')[0]
    const [y, m, d] = (iso ?? '').split('-')
    return y && m && d ? `${d}/${m}/${y}` : '-'
}

const formatPrecio = (val: number | string) => {
    return '$' + Number(val).toLocaleString('es-CL')
}

async function cambiarEstado(pedidoId: number, nuevoEstado: string) {
    const fechaSeleccionada = fechasEditadas[pedidoId]
    if (fechaSeleccionada && fechaSeleccionada < fechaHoyISO.value && nuevoEstado !== 'RCH') {
        toast.add({
            title: 'Fecha inválida',
            description: `La fecha de retiro no puede ser anterior a hoy (${formatearFechaChile(fechaHoyISO.value)}).`,
            color: 'error'
        })
        return
    }

    actualizandoId.value = pedidoId
    try {
        await $fetch(`/api/pedidos/${pedidoId}`, {
            method: 'PUT',
            body: {
                estado: nuevoEstado,
                fecha_retiro: fechaSeleccionada || undefined
            }
        })
        toast.add({
            title: `Pedido #${pedidoId} actualizado`,
            description: `Nuevo estado: ${etiquetasEstado[nuevoEstado]?.texto || nuevoEstado}`,
            color: 'primary'
        })
        await refresh()
    } catch (err: any) {
        toast.add({
            title: 'Error al actualizar pedido',
            description: getApiErrorMessage(err, 'No se pudo cambiar el estado del pedido'),
            color: 'error'
        })
    } finally {
        actualizandoId.value = null
    }
}

async function validarPago(pagoId: number, nuevoEstado: 'CON' | 'RCH') {
    validandoPagoId.value = pagoId
    try {
        await $fetch(`/api/pagos/${pagoId}`, {
            method: 'PUT',
            body: { estado: nuevoEstado }
        })
        toast.add({
            title: nuevoEstado === 'CON' ? 'Pago confirmado' : 'Comprobante rechazado',
            description: nuevoEstado === 'CON'
                ? 'El pedido avanzó automáticamente a En Preparación (PRE).'
                : 'Se notificará al cliente para que suba un nuevo comprobante.',
            color: nuevoEstado === 'CON' ? 'primary' : 'neutral'
        })
        await refresh()
    } catch (err: any) {
        toast.add({
            title: 'Error al validar pago',
            description: getApiErrorMessage(err, 'No se pudo procesar la validación del comprobante'),
            color: 'error'
        })
    } finally {
        validandoPagoId.value = null
    }
}

const { descargandoPdfId, descargarComprobantePorPedido } = useComprobantePdf()

async function handleDescargarComprobante(pedidoId: number) {
    try {
        await descargarComprobantePorPedido(pedidoId)
    } catch (err: any) {
        toast.add({
            title: 'No se pudo descargar el PDF',
            description: getApiErrorMessage(err, 'No fue posible generar el archivo PDF.'),
            color: 'error'
        })
    }
}
</script>

<template>
    <div class="border border-dashed border-default rounded-2xl bg-elevated/40 p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default/70 pb-5">
            <div>
                <h2 class="text-2xl font-bold tracking-tight text-highlighted">
                    Gestión de Pedidos
                </h2>
                <p class="text-sm text-muted mt-1">
                    Evalúa solicitudes, valida transferencias y actualiza el avance en cocina.
                </p>
            </div>

            <div class="flex items-center gap-2">
                <USelect v-model="estadoFiltro" :items="estadosOpciones" value-key="value" class="w-64" />
                <UButton color="neutral" variant="outline" icon="i-heroicons-arrow-path" :loading="pending"
                    @click="refresh()" />
            </div>
        </div>

        <div v-if="pending" class="text-center py-8 text-muted flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-primary" />
            Cargando pedidos...
        </div>

        <div v-else-if="error" class="text-center py-8 text-error">
            Error al cargar los pedidos desde el servidor.
        </div>

        <div v-else-if="!pedidos || pedidos.length === 0"
            class="p-10 rounded-xl border border-dashed border-default bg-elevated/30 text-center text-muted text-sm">
            No hay pedidos registrados bajo este filtro.
        </div>

        <div v-else class="space-y-5">
            <UCard v-for="ped in pedidos" :key="ped.id"
                class="border border-default bg-elevated rounded-xl shadow-xs space-y-5">
                <!-- Cabecera del Pedido -->
                <div
                    class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-default pb-4">
                    <div class="space-y-1">
                        <div class="flex flex-wrap items-center gap-2.5">
                            <span class="text-lg font-extrabold text-highlighted">
                                Pedido #{{ ped.id }}
                            </span>
                            <UBadge :color="etiquetasEstado[ped.estado]?.color || 'neutral'" variant="subtle">
                                {{ etiquetasEstado[ped.estado]?.texto || ped.estado }}
                            </UBadge>
                            <span class="text-xs text-muted">
                                Solicitado el {{ formatearFechaChile(ped.fecha_pedido) }}
                            </span>
                        </div>
                        <p class="text-sm text-muted">
                            Retira: <strong class="text-highlighted">{{ ped.nombre_cliente }}</strong>
                            (RUT: <span class="font-mono">{{ ped.rut_cliente }}</span>) ·
                            Tel: <span class="font-mono">{{ ped.usuario?.telefono || '-' }}</span>
                        </p>
                    </div>

                    <div class="text-left md:text-right">
                        <span class="text-xs text-muted block">Monto Total</span>
                        <span class="text-2xl font-extrabold text-primary">
                            {{ formatPrecio(ped.monto_total) }}
                        </span>
                    </div>
                </div>

                <!-- Detalle Estético de Productos y Personalización -->
                <div class="space-y-2.5">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                            <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4 text-primary" />
                            Productos y Personalización ({{ ped.detalles?.length || 0 }})
                        </p>
                    </div>

                    <div class="border border-default rounded-xl bg-default/60 divide-y divide-default overflow-hidden">
                        <div v-for="det in ped.detalles" :key="det.id"
                            class="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accented/10 transition-colors">
                            <div class="flex items-start gap-3">
                                <span
                                    class="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-lg bg-primary/15 text-primary font-extrabold text-xs shrink-0 mt-0.5">
                                    {{ det.cantidad }}x
                                </span>

                                <div class="space-y-1">
                                    <p class="font-bold text-highlighted text-sm leading-snug">
                                        {{ det.producto?.nombre }}
                                    </p>

                                    <p class="text-xs text-muted">
                                        Precio unitario: {{ formatPrecio(det.precio_unitario) }}
                                    </p>

                                    <div v-if="det.personalizacion"
                                        class="inline-flex items-start gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/25 text-xs text-highlighted mt-1">
                                        <UIcon name="i-heroicons-pencil-square"
                                            class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                        <span>
                                            <strong class="text-primary">Personalización:</strong> {{
                                                det.personalizacion }}
                                        </span>
                                    </div>
                                    <p v-else class="text-[11px] text-muted/80 italic">
                                        Sin personalización adicional
                                    </p>
                                </div>
                            </div>

                            <div class="sm:text-right pl-11 sm:pl-0 shrink-0">
                                <span class="text-[11px] text-muted block sm:hidden">Subtotal</span>
                                <span class="font-extrabold text-highlighted text-sm">
                                    {{ formatPrecio(Number(det.precio_unitario) * det.cantidad) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sección de Comprobantes de Pago -->
                <div v-if="ped.pagos && ped.pagos.length > 0" class="space-y-2 pt-1">
                    <p class="text-xs font-bold uppercase tracking-wider text-muted">
                        Comprobantes de Transferencia Recibidos:
                    </p>
                    <div v-for="pg in ped.pagos" :key="pg.id"
                        class="p-3.5 rounded-xl border border-default bg-default/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <UBadge :color="etiquetasPago[pg.estado]?.color || 'neutral'" variant="subtle"
                                    size="xs">
                                    {{ etiquetasPago[pg.estado]?.texto || pg.estado }}
                                </UBadge>
                                <span class="text-xs font-semibold text-highlighted">
                                    Monto transferido: {{ formatPrecio(pg.monto) }}
                                </span>
                            </div>
                            <a :href="pg.comprobante" target="_blank" rel="noopener"
                                class="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                                <UIcon name="i-heroicons-document-magnifying-glass" class="w-4 h-4" />
                                Abrir comprobante adjunto
                            </a>
                        </div>

                        <div v-if="pg.estado === 'PEN'" class="flex gap-2 shrink-0">
                            <UButton size="xs" color="primary" icon="i-heroicons-check-circle"
                                :loading="validandoPagoId === pg.id" @click="validarPago(pg.id, 'CON')">
                                Confirmar Pago
                            </UButton>
                            <UButton size="xs" color="error" variant="subtle" icon="i-heroicons-x-circle"
                                :loading="validandoPagoId === pg.id" @click="validarPago(pg.id, 'RCH')">
                                Rechazar Pago
                            </UButton>
                        </div>

                        <div v-else-if="pg.estado === 'CON'" class="flex flex-wrap gap-2 shrink-0">
                            <UButton :to="`/comprobante/${ped.id}`" size="xs" color="neutral" variant="outline"
                                icon="i-heroicons-eye">
                                Ver Comprobante
                            </UButton>

                            <UButton size="xs" color="primary" variant="subtle" icon="i-heroicons-arrow-down-tray"
                                :loading="descargandoPdfId === ped.id" @click="handleDescargarComprobante(ped.id)">
                                Descargar PDF
                            </UButton>
                        </div>
                    </div>
                </div>

                <!-- Controles de Fecha y Estado -->
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-3 border-t border-default">
                    <div class="flex flex-wrap items-end gap-3">
                        <div class="w-64">
                            <label class="text-xs font-semibold text-muted block mb-1.5">
                                Fecha comprometida de retiro ({{ formatearFechaChile(fechasEditadas[ped.id] ||
                                    ped.fecha_retiro) }})
                            </label>
                            <FechaInputChile v-model="fechasEditadas[ped.id]" :min="fechaHoyISO" size="sm"
                                :disabled="ped.estado === 'ENT' || ped.estado === 'RCH'" />
                        </div>
                        <UButton v-if="ped.estado !== 'ENT' && ped.estado !== 'RCH'" size="sm" color="neutral"
                            variant="outline" :loading="actualizandoId === ped.id"
                            @click="cambiarEstado(ped.id, ped.estado)">
                            Guardar Fecha
                        </UButton>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <template v-if="ped.estado === 'PEN'">
                            <UButton size="sm" color="primary" icon="i-heroicons-check"
                                :loading="actualizandoId === ped.id" @click="cambiarEstado(ped.id, 'ACE')">
                                Aprobar Pedido (ACE)
                            </UButton>
                            <UButton size="sm" color="error" variant="subtle" icon="i-heroicons-x-mark"
                                :loading="actualizandoId === ped.id" @click="cambiarEstado(ped.id, 'RCH')">
                                Rechazar
                            </UButton>
                        </template>

                        <UButton v-else-if="ped.estado === 'ACE'" size="sm" color="primary" icon="i-heroicons-fire"
                            :loading="actualizandoId === ped.id" @click="cambiarEstado(ped.id, 'PRE')">
                            Pasar a Preparación (PRE)
                        </UButton>

                        <UButton v-else-if="ped.estado === 'PRE'" size="sm" color="primary" icon="i-heroicons-sparkles"
                            :loading="actualizandoId === ped.id" @click="cambiarEstado(ped.id, 'LIS')">
                            Marcar Listo para Retiro (LIS)
                        </UButton>

                        <UButton v-else-if="ped.estado === 'LIS'" size="sm" color="primary"
                            icon="i-heroicons-check-badge" :loading="actualizandoId === ped.id"
                            @click="cambiarEstado(ped.id, 'ENT')">
                            Confirmar Entrega (ENT)
                        </UButton>
                    </div>
                </div>
            </UCard>
        </div>
    </div>
</template>
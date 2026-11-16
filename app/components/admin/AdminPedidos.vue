<script setup lang="ts">
const toast = useToast()

const estadoFiltro = ref<string>('TODOS')
const actualizandoId = ref<number | null>(null)
const fechasEditadas = reactive<Record<number, string>>({})

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
    actualizandoId.value = pedidoId
    try {
        await $fetch(`/api/pedidos/${pedidoId}`, {
            method: 'PUT',
            body: {
                estado: nuevoEstado,
                fecha_retiro: fechasEditadas[pedidoId] || undefined
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
</script>

<template>
    <div class="border border-dashed border-default rounded-2xl bg-elevated/40 p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default/70 pb-5">
            <div>
                <h2 class="text-2xl font-bold tracking-tight text-highlighted">
                    Gestión de Pedidos
                </h2>
                <p class="text-sm text-muted mt-1">
                    Evalúa solicitudes, confirma fechas de retiro y actualiza el avance en cocina.
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
                class="border border-default bg-elevated rounded-xl shadow-xs space-y-4">
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

                <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wider text-muted">
                        Productos y Personalización:
                    </p>
                    <ul class="divide-y divide-default border border-default rounded-lg bg-default/50">
                        <li v-for="det in ped.detalles" :key="det.id"
                            class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                            <div>
                                <span class="font-bold text-highlighted">
                                    {{ det.cantidad }}x {{ det.producto?.nombre }}
                                </span>
                                <p v-if="det.personalizacion" class="text-xs text-primary mt-0.5">
                                    Nota: "{{ det.personalizacion }}"
                                </p>
                            </div>
                            <span class="font-semibold text-highlighted">
                                {{ formatPrecio(Number(det.precio_unitario) * det.cantidad) }}
                            </span>
                        </li>
                    </ul>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-3 border-t border-default">
                    <div class="flex items-center gap-3">
                        <div>
                            <label class="text-xs font-semibold text-muted block mb-1">
                                Fecha comprometida de retiro ({{ formatearFechaChile(fechasEditadas[ped.id] ||
                                    ped.fecha_retiro) }})
                            </label>
                            <UInput v-model="fechasEditadas[ped.id]" type="date" size="sm"
                                :disabled="ped.estado === 'ENT' || ped.estado === 'RCH'" />
                        </div>
                        <UButton v-if="ped.estado !== 'ENT' && ped.estado !== 'RCH'" size="sm" color="neutral"
                            variant="outline" class="mt-5" :loading="actualizandoId === ped.id"
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
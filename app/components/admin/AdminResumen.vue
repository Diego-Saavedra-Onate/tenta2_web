<script setup lang="ts">
interface ResumenAdmin {
    ingresosMes: number
    pedidosActivos: number
    comprobantesPendientes: number
    stockCriticoCount: number
    productosStockCritico: Array<{
        id: number
        nombre: string
        disponibilidad: number
        categoria?: { nombre: string }
    }>
    proximosRetiros: Array<{
        id: number
        nombre_cliente: string
        fecha_retiro: string
        estado: string
        monto_total: number | string
        _count?: { detalles: number }
    }>
    rankingProductos: Array<{
        producto_id: number
        nombre: string
        unidadesVendidas: number
        ingresosEstimados: number
    }>
}

const { data: resumen, pending, error, refresh } = await useFetch<ResumenAdmin>('/api/admin/resumen')

const etiquetasEstado: Record<string, { texto: string; color: any }> = {
    PEN: { texto: 'Pendiente', color: 'warning' },
    ACE: { texto: 'Aceptado', color: 'info' },
    PRE: { texto: 'En cocina', color: 'primary' },
    LIS: { texto: 'Listo retiro', color: 'success' }
}

const formatearFechaChile = (fecha: string | Date | null) => {
    if (!fecha) return '-'
    const iso = typeof fecha === 'string' ? fecha.split('T')[0] : new Date(fecha).toISOString().split('T')[0]
    const [y, m, d] = (iso ?? '').split('-')
    return y && m && d ? `${d}/${m}/${y}` : '-'
}

const formatPrecio = (val: number | string) => {
    return '$' + Number(val).toLocaleString('es-CL')
}
</script>

<template>
    <div class="border border-dashed border-default rounded-2xl bg-elevated/40 p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default/70 pb-5">
            <div>
                <h2 class="text-2xl font-bold tracking-tight text-highlighted">
                    Resumen Operativo
                </h2>
                <p class="text-sm text-muted mt-1">
                    Vista general de ventas confirmadas, retiros próximos y alertas de inventario.
                </p>
            </div>

            <UButton color="neutral" variant="outline" icon="i-heroicons-arrow-path" :loading="pending"
                @click="refresh()">
                Actualizar métricas
            </UButton>
        </div>

        <div v-if="pending" class="text-center py-8 text-muted flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-primary" />
            Calculando indicadores...
        </div>

        <div v-else-if="error" class="text-center py-8 text-error">
            No se pudieron cargar las métricas del panel.
        </div>

        <template v-else-if="resumen">
            <!-- Tarjetas KPI -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <UCard class="border border-default bg-elevated rounded-xl shadow-xs">
                    <span class="text-xs font-semibold uppercase tracking-wider text-muted block">
                        Pagos Confirmados (Mes)
                    </span>
                    <span class="text-2xl font-extrabold text-primary mt-2 block">
                        {{ formatPrecio(resumen.ingresosMes) }}
                    </span>
                </UCard>

                <UCard class="border border-default bg-elevated rounded-xl shadow-xs">
                    <span class="text-xs font-semibold uppercase tracking-wider text-muted block">
                        Pedidos Activos
                    </span>
                    <span class="text-2xl font-extrabold text-highlighted mt-2 block">
                        {{ resumen.pedidosActivos }}
                    </span>
                </UCard>

                <UCard class="border border-default bg-elevated rounded-xl shadow-xs">
                    <span class="text-xs font-semibold uppercase tracking-wider text-muted block">
                        Comprobantes por Revisar
                    </span>
                    <span class="text-2xl font-extrabold mt-2 block"
                        :class="resumen.comprobantesPendientes > 0 ? 'text-warning' : 'text-highlighted'">
                        {{ resumen.comprobantesPendientes }}
                    </span>
                </UCard>

                <UCard class="border border-default bg-elevated rounded-xl shadow-xs">
                    <span class="text-xs font-semibold uppercase tracking-wider text-muted block">
                        Productos con Stock Bajo
                    </span>
                    <span class="text-2xl font-extrabold mt-2 block"
                        :class="resumen.stockCriticoCount > 0 ? 'text-error' : 'text-highlighted'">
                        {{ resumen.stockCriticoCount }}
                    </span>
                </UCard>
            </div>

            <!-- Agenda de Retiros y Ranking / Stock Crítico -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <UCard class="lg:col-span-7 border border-default bg-elevated rounded-xl shadow-xs space-y-4">
                    <h3 class="text-base font-bold text-highlighted border-b border-default pb-3">
                        Agenda de Próximos Retiros
                    </h3>

                    <div v-if="resumen.proximosRetiros.length === 0" class="text-sm text-muted py-6 text-center">
                        No hay pedidos pendientes de entrega en agenda.
                    </div>

                    <ul v-else class="divide-y divide-default">
                        <li v-for="ped in resumen.proximosRetiros" :key="ped.id"
                            class="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <div>
                                <span class="font-bold text-highlighted">
                                    #{{ ped.id }} · {{ ped.nombre_cliente }}
                                </span>
                                <span class="text-xs text-muted block">
                                    Retiro: <strong>{{ formatearFechaChile(ped.fecha_retiro) }}</strong> ·
                                    {{ ped._count?.detalles ?? 0 }} ítem(s)
                                </span>
                            </div>

                            <div class="flex items-center gap-3">
                                <UBadge :color="etiquetasEstado[ped.estado]?.color || 'neutral'" variant="subtle"
                                    size="xs">
                                    {{ etiquetasEstado[ped.estado]?.texto || ped.estado }}
                                </UBadge>
                                <span class="font-bold text-highlighted">
                                    {{ formatPrecio(ped.monto_total) }}
                                </span>
                            </div>
                        </li>
                    </ul>
                </UCard>

                <div class="lg:col-span-5 space-y-6">
                    <UCard class="border border-default bg-elevated rounded-xl shadow-xs space-y-3">
                        <h3 class="text-base font-bold text-highlighted border-b border-default pb-3">
                            Alertas de Stock Crítico (≤ 3 unid.)
                        </h3>

                        <div v-if="resumen.productosStockCritico.length === 0"
                            class="text-sm text-muted py-4 text-center">
                            Todo el catálogo visible tiene stock saludable.
                        </div>

                        <ul v-else class="divide-y divide-default">
                            <li v-for="prod in resumen.productosStockCritico" :key="prod.id"
                                class="py-2.5 flex items-center justify-between text-sm">
                                <div>
                                    <span class="font-semibold text-highlighted block">{{ prod.nombre }}</span>
                                    <span class="text-xs text-muted">{{ prod.categoria?.nombre }}</span>
                                </div>
                                <UBadge :color="prod.disponibilidad === 0 ? 'error' : 'warning'" variant="subtle"
                                    size="xs">
                                    {{ prod.disponibilidad === 0 ? 'Agotado' : `${prod.disponibilidad} disp.` }}
                                </UBadge>
                            </li>
                        </ul>
                    </UCard>

                    <UCard class="border border-default bg-elevated rounded-xl shadow-xs space-y-3">
                        <h3 class="text-base font-bold text-highlighted border-b border-default pb-3">
                            Top Productos Más Pedidos
                        </h3>

                        <div v-if="resumen.rankingProductos.length === 0" class="text-sm text-muted py-4 text-center">
                            Aún no hay suficientes pedidos para generar el ranking.
                        </div>

                        <ul v-else class="divide-y divide-default">
                            <li v-for="(item, idx) in resumen.rankingProductos" :key="item.producto_id"
                                class="py-2.5 flex items-center justify-between text-sm">
                                <span class="font-medium text-highlighted">
                                    <strong class="text-primary mr-1.5">#{{ Number(idx) + 1 }}</strong>
                                    {{ item.nombre }}
                                </span>
                                <span class="text-xs font-bold text-muted">
                                    {{ item.unidadesVendidas }} unid.
                                </span>
                            </li>
                        </ul>
                    </UCard>
                </div>
            </div>
        </template>
    </div>
</template>
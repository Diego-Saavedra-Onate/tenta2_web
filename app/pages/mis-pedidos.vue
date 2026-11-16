<script setup lang="ts">
const { data: pedidos, pending, error, refresh } = await useFetch<any[]>('/api/pedidos')

const pasosFlujo = [
    { codigo: 'PEN', titulo: 'Pendiente', desc: 'En revisión por la pastelería' },
    { codigo: 'ACE', titulo: 'Aceptado', desc: 'Aprobado, listo para pago' },
    { codigo: 'PRE', titulo: 'Preparando', desc: 'En elaboración artesanal' },
    { codigo: 'LIS', titulo: 'Listo', desc: 'Disponible para retiro en local' },
    { codigo: 'ENT', titulo: 'Entregado', desc: 'Pedido retirado con éxito' }
]

const etiquetasEstado: Record<string, { texto: string; color: any }> = {
    PEN: { texto: 'Pendiente de evaluación', color: 'warning' },
    ACE: { texto: 'Aceptado (esperando pago)', color: 'info' },
    PRE: { texto: 'En preparación', color: 'primary' },
    LIS: { texto: 'Listo para retiro', color: 'success' },
    ENT: { texto: 'Entregado', color: 'neutral' },
    RCH: { texto: 'Rechazado', color: 'error' }
}

function indicePaso(estado: string) {
    return pasosFlujo.findIndex((p) => p.codigo === estado)
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
    <div class="py-10 bg-default min-h-[calc(100vh-5rem)] text-default">
        <UContainer class="space-y-8">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-5">
                <div>
                    <h1 class="text-3xl font-extrabold tracking-tight text-highlighted">
                        Mis Pedidos
                    </h1>
                    <p class="text-sm text-muted mt-1">
                        Revisa el estado en tiempo real y el detalle de tus solicitudes en Tenta2.
                    </p>
                </div>

                <UButton color="neutral" variant="outline" icon="i-heroicons-arrow-path" :loading="pending"
                    @click="refresh()">
                    Actualizar
                </UButton>
            </div>

            <div v-if="pending" class="text-center py-12 text-muted flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-primary" />
                Cargando tus pedidos...
            </div>

            <div v-else-if="error" class="text-center py-12 text-error">
                No fue posible cargar tus pedidos. Intenta nuevamente.
            </div>

            <div v-else-if="!pedidos || pedidos.length === 0"
                class="border border-dashed border-default rounded-2xl bg-elevated/40 p-12 text-center space-y-4">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-14 h-14 text-muted mx-auto" />
                <div class="space-y-1">
                    <h3 class="text-lg font-bold text-highlighted">
                        Aún no tienes pedidos registrados
                    </h3>
                    <p class="text-sm text-muted max-w-sm mx-auto">
                        Explora nuestro catálogo y arma tu primer pedido artesanal.
                    </p>
                </div>
                <UButton to="/productos" color="primary">
                    Ir al catálogo
                </UButton>
            </div>

            <div v-else class="space-y-6">
                <UCard v-for="ped in pedidos" :key="ped.id"
                    class="border border-default bg-elevated rounded-2xl shadow-xs space-y-5">
                    <div
                        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center gap-2.5">
                                <span class="text-xl font-extrabold text-highlighted">
                                    Pedido #{{ ped.id }}
                                </span>
                                <UBadge :color="etiquetasEstado[ped.estado]?.color || 'neutral'" variant="subtle">
                                    {{ etiquetasEstado[ped.estado]?.texto || ped.estado }}
                                </UBadge>
                            </div>
                            <p class="text-xs text-muted">
                                Solicitado el {{ formatearFechaChile(ped.fecha_pedido) }} ·
                                Retiro estimado: <strong class="text-highlighted">{{
                                    formatearFechaChile(ped.fecha_retiro) }}</strong>
                            </p>
                        </div>

                        <div class="sm:text-right">
                            <span class="text-xs text-muted block">Total del pedido</span>
                            <span class="text-2xl font-extrabold text-primary">
                                {{ formatPrecio(ped.monto_total) }}
                            </span>
                        </div>
                    </div>

                    <div v-if="ped.estado === 'RCH'"
                        class="p-4 rounded-xl bg-error/10 border border-error/30 text-sm text-error">
                        Este pedido fue rechazado por la pastelería. Si tienes dudas, contáctanos directamente.
                    </div>

                    <div v-else class="grid grid-cols-2 sm:grid-cols-5 gap-2 py-2">
                        <div v-for="(paso, idx) in pasosFlujo" :key="paso.codigo" :class="idx <= indicePaso(ped.estado)
                            ? 'border-primary bg-primary/10 text-highlighted'
                            : 'border-default bg-default/40 text-muted opacity-60'"
                            class="p-3 rounded-xl border text-center space-y-1 transition-all">
                            <span class="text-xs font-extrabold block uppercase tracking-wider">
                                {{ idx + 1 }}. {{ paso.titulo }}
                            </span>
                            <span class="text-[11px] block leading-tight">
                                {{ paso.desc }}
                            </span>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
                            Detalle de productos:
                        </p>
                        <ul class="divide-y divide-default border border-default rounded-xl bg-default/50">
                            <li v-for="det in ped.detalles" :key="det.id"
                                class="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                                <div>
                                    <span class="font-bold text-highlighted">
                                        {{ det.cantidad }}x {{ det.producto?.nombre }}
                                    </span>
                                    <p v-if="det.personalizacion" class="text-xs text-primary mt-0.5">
                                        Personalización: "{{ det.personalizacion }}"
                                    </p>
                                </div>
                                <span class="font-semibold text-highlighted">
                                    {{ formatPrecio(Number(det.precio_unitario) * det.cantidad) }}
                                </span>
                            </li>
                        </ul>
                    </div>
                </UCard>
            </div>
        </UContainer>
    </div>
</template>
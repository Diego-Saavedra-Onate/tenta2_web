<script setup lang="ts">
const toast = useToast()
const { data: pedidos, pending, error, refresh } = await useFetch<any[]>('/api/pedidos')

const archivosSeleccionados = reactive<Record<number, File | null>>({})
const montosIngresados = reactive<Record<number, number>>({})
const subiendoPagoId = ref<number | null>(null)

watch(pedidos, (lista) => {
    if (!lista) return
    for (const p of lista) {
        if (montosIngresados[p.id] === undefined) {
            montosIngresados[p.id] = Number(p.monto_total)
        }
    }
}, { immediate: true })

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

const etiquetasPago: Record<string, { texto: string; color: any }> = {
    PEN: { texto: 'Comprobante en revisión', color: 'warning' },
    CON: { texto: 'Pago confirmado', color: 'success' },
    RCH: { texto: 'Comprobante rechazado (sube uno nuevo)', color: 'error' }
}

function indicePaso(estado: string) {
    return pasosFlujo.findIndex((p) => p.codigo === estado)
}

function puedeSubirComprobante(ped: any) {
    if (ped.estado !== 'ACE') return false
    const pagos = ped.pagos ?? []
    return !pagos.some((pg: any) => pg.estado === 'PEN' || pg.estado === 'CON')
}

function seleccionarArchivo(pedidoId: number, event: Event) {
    const input = event.target as HTMLInputElement
    archivosSeleccionados[pedidoId] = input.files?.[0] ?? null
}

async function enviarComprobante(ped: any) {
    const archivo = archivosSeleccionados[ped.id]
    if (!archivo) {
        toast.add({
            title: 'Archivo requerido',
            description: 'Selecciona una imagen o PDF de tu comprobante de transferencia.',
            color: 'error'
        })
        return
    }

    subiendoPagoId.value = ped.id

    try {
        const formData = new FormData()
        formData.append('pedido_id', String(ped.id))
        formData.append('monto', String(montosIngresados[ped.id] ?? ped.monto_total))
        formData.append('comprobante', archivo)

        await $fetch('/api/pagos', {
            method: 'POST',
            body: formData
        })

        archivosSeleccionados[ped.id] = null
        toast.add({
            title: 'Comprobante enviado',
            description: 'La pastelería verificará tu transferencia a la brevedad.',
            color: 'primary'
        })
        await refresh()
    } catch (err: any) {
        toast.add({
            title: 'Error al subir comprobante',
            description: getApiErrorMessage(err, 'No se pudo cargar el comprobante.'),
            color: 'error'
        })
    } finally {
        subiendoPagoId.value = null
    }
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

const { descargandoPdfId, descargarComprobantePorPedido } = useComprobantePdf()

async function handleDescargarComprobante(pedidoId: number) {
    try {
        await descargarComprobantePorPedido(pedidoId)
    } catch (err: any) {
        toast.add({
            title: 'No se pudo descargar el PDF',
            description: getApiErrorMessage(err, 'Intenta nuevamente en unos segundos.'),
            color: 'error'
        })
    }
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
                        Revisa el estado en tiempo real, adjunta tu comprobante de pago y sigue tu pedido.
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
                                Retiro comprometido: <strong class="text-highlighted">{{
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

                    <!-- Historial de comprobantes subidos -->
                    <div v-if="ped.pagos && ped.pagos.length > 0" class="space-y-2 pt-2 border-t border-default">
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
                            Comprobantes de Transferencia:
                        </p>
                        <div v-for="pg in ped.pagos" :key="pg.id"
                            class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-default bg-default/40 text-sm">
                            <div class="flex items-center gap-2.5">
                                <UBadge :color="etiquetasPago[pg.estado]?.color || 'neutral'" variant="subtle"
                                    size="xs">
                                    {{ etiquetasPago[pg.estado]?.texto || pg.estado }}
                                </UBadge>
                                <span class="text-xs text-muted">
                                    Monto informado: <strong class="text-highlighted">{{ formatPrecio(pg.monto)
                                    }}</strong>
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-3">
                                <a :href="pg.comprobante" target="_blank" rel="noopener"
                                    class="text-xs font-semibold text-muted hover:text-highlighted inline-flex items-center gap-1">
                                    <UIcon name="i-heroicons-paper-clip" class="w-4 h-4" />
                                    Transferencia subida
                                </a>

                                <template v-if="pg.estado === 'CON'">
                                    <UButton :to="`/comprobante/${ped.id}`" size="xs" color="neutral" variant="outline"
                                        icon="i-heroicons-eye">
                                        Ver Comprobante
                                    </UButton>

                                    <UButton size="xs" color="primary" variant="subtle"
                                        icon="i-heroicons-arrow-down-tray" :loading="descargandoPdfId === ped.id"
                                        @click="handleDescargarComprobante(ped.id)">
                                        Descargar PDF
                                    </UButton>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- Formulario de transferencia cuando el pedido está en ACE -->
                    <div v-if="puedeSubirComprobante(ped)"
                        class="p-5 rounded-xl border border-primary/40 bg-primary/5 space-y-4">
                        <div class="space-y-1">
                            <h3 class="text-sm font-extrabold text-highlighted flex items-center gap-2">
                                <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary" />
                                Datos para Transferencia Bancaria
                            </h3>
                            <p class="text-xs text-muted">
                                Tu pedido fue aceptado. Transfiere el total y adjunta el comprobante para iniciar la
                                preparación en cocina:
                            </p>
                        </div>

                        <div
                            class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-default/80 p-3.5 rounded-lg border border-default">
                            <div><span class="text-muted">Titular:</span> <strong>Pastelería Tenta2</strong></div>
                            <div><span class="text-muted">Banco:</span> <strong>BancoEstado / Cuenta Vista</strong>
                            </div>
                            <div><span class="text-muted">RUT:</span> <strong class="font-mono">77.123.456-7</strong>
                            </div>
                            <div><span class="text-muted">N° Cuenta:</span> <strong
                                    class="font-mono">00123456789</strong></div>
                            <div class="sm:col-span-2"><span class="text-muted">Asunto / Correo:</span>
                                <strong>pagos@tenta2.cl (Indicar Pedido #{{ ped.id }})</strong>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div class="sm:col-span-4">
                                <label class="text-xs font-semibold text-muted block mb-1">Monto transferido
                                    (CLP)</label>
                                <UInput v-model.number="montosIngresados[ped.id]" type="number" class="w-full" />
                            </div>

                            <div class="sm:col-span-5">
                                <label class="text-xs font-semibold text-muted block mb-1">Comprobante (JPG, PNG, WEBP o
                                    PDF)</label>
                                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                                    class="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-default file:text-xs file:font-semibold file:bg-elevated file:text-highlighted hover:file:bg-accented/30 cursor-pointer"
                                    @change="seleccionarArchivo(ped.id, $event)" />
                            </div>

                            <div class="sm:col-span-3">
                                <UButton color="primary" block icon="i-heroicons-arrow-up-tray"
                                    :loading="subiendoPagoId === ped.id" @click="enviarComprobante(ped)">
                                    Subir Pago
                                </UButton>
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>
        </UContainer>
    </div>
</template>
<script setup lang="ts">
import type { Categorias } from '~/types/Categoria'

const { data: categorias, pending, error } = await useFetch<Categorias[]>('/api/categorias')

const busqueda = ref('')
const categoriaSeleccionada = ref<number | 'todas'>('todas')
const ordenPrecio = ref<'default' | 'asc' | 'desc'>('default')

const opcionesCategorias = computed(() => [
    { label: 'Todas las categorías', value: 'todas' },
    ...(categorias.value?.map(c => ({ label: c.nombre, value: c.id })) ?? [])
])

const opcionesOrden = [
    { label: 'Orden por categoría', value: 'default' },
    { label: 'Menor precio primero', value: 'asc' },
    { label: 'Mayor precio primero', value: 'desc' }
]

const categoriasFiltradas = computed(() => {
    if (!categorias.value) return []

    const termino = busqueda.value.trim().toLowerCase()

    return categorias.value
        .filter(cat => categoriaSeleccionada.value === 'todas' || cat.id === categoriaSeleccionada.value)
        .map(cat => {
            let productos = [...(cat.producto ?? [])]

            if (termino) {
                productos = productos.filter(p =>
                    p.nombre.toLowerCase().includes(termino) ||
                    (p.descripcion && p.descripcion.toLowerCase().includes(termino))
                )
            }

            return {
                ...cat,
                producto: productos
            }
        })
        .filter(cat => !termino || cat.producto.length > 0)
})

const productosOrdenados = computed(() => {
    const todos = categoriasFiltradas.value.flatMap(cat => cat.producto ?? [])

    if (ordenPrecio.value === 'asc') {
        return todos.sort((a, b) => Number(a.precio) - Number(b.precio))
    }

    if (ordenPrecio.value === 'desc') {
        return todos.sort((a, b) => Number(b.precio) - Number(a.precio))
    }

    return todos
})

function limpiarFiltros() {
    busqueda.value = ''
    categoriaSeleccionada.value = 'todas'
    ordenPrecio.value = 'default'
}
</script>

<template>
    <div class="py-8 sm:py-12 bg-default min-h-[calc(100vh-5rem)]">
        <UContainer>
            <div class="space-y-3 pb-6 mb-6 border-b border-default/60">
                <div class="flex items-center gap-2">
                    <span class="inline-block w-8 h-1 bg-primary rounded-full" />
                    <span class="text-xs uppercase tracking-widest font-bold text-primary">
                        Catálogo
                    </span>
                </div>

                <h1 class="text-4xl font-extrabold tracking-tight text-highlighted sm:text-5xl">
                    Nuestros Productos
                </h1>

                <p class="text-sm sm:text-base text-muted max-w-xl">
                    Descubre nuestras preparaciones recién horneadas y seleccionadas por categoría.
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 p-4 rounded-xl bg-elevated/50 border border-default">
                <UInput v-model="busqueda" icon="i-heroicons-magnifying-glass"
                    placeholder="Buscar torta, brownie, pie..." class="w-full" />

                <USelect v-model="categoriaSeleccionada" :items="opcionesCategorias" value-key="value" class="w-full" />

                <div class="flex gap-2">
                    <USelect v-model="ordenPrecio" :items="opcionesOrden" value-key="value" class="w-full" />
                    <UButton v-if="busqueda || categoriaSeleccionada !== 'todas' || ordenPrecio !== 'default'"
                        color="neutral" variant="outline" icon="i-heroicons-x-mark" aria-label="Limpiar filtros"
                        @click="limpiarFiltros" />
                </div>
            </div>

            <div v-if="pending" class="flex flex-col gap-10 py-6">
                <div v-for="n in 2" :key="n" class="space-y-4">
                    <div class="h-8 w-48 bg-accented rounded-lg animate-pulse" />
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <div v-for="m in 4" :key="m" class="h-64 bg-elevated rounded-xl animate-pulse" />
                    </div>
                </div>
            </div>

            <div v-else-if="error" class="text-center py-16">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 class="text-xl font-bold text-highlighted">
                    Error al cargar los productos
                </h2>
                <p class="text-sm text-muted mt-1 max-w-md mx-auto">
                    {{ getApiErrorMessage(error, 'No fue posible conectar con el servidor o la base de datos.') }}
                </p>
            </div>

            <div v-else-if="productosOrdenados.length === 0 && categoriasFiltradas.length === 0"
                class="p-10 rounded-xl border border-dashed border-default bg-elevated/40 text-center space-y-3">
                <p class="text-base font-semibold text-highlighted">
                    No encontramos productos con esos filtros
                </p>
                <UButton size="sm" color="primary" variant="subtle" @click="limpiarFiltros">
                    Mostrar todo el catálogo
                </UButton>
            </div>

            <div v-else-if="ordenPrecio !== 'default'" class="space-y-6">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-muted">
                        Mostrando <strong class="text-highlighted">{{ productosOrdenados.length }}</strong> producto(s)
                        ordenados por precio
                    </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <CardsProducto v-for="prod in productosOrdenados" :key="prod.id" :producto="prod" />
                </div>
            </div>

            <div v-else class="flex flex-col gap-12 sm:gap-16">
                <section v-for="cat in categoriasFiltradas" :key="cat.id"
                    class="flex flex-col gap-5 border-b border-muted pb-10 last:border-b-0">
                    <div class="flex items-center gap-3">
                        <div class="h-6 w-1.5 bg-primary rounded-full" />
                        <div>
                            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-highlighted">
                                {{ cat.nombre }}
                            </h2>
                            <p v-if="cat.descripcion" class="text-sm text-muted mt-0.5">
                                {{ cat.descripcion }}
                            </p>
                        </div>
                    </div>

                    <div v-if="cat.producto && cat.producto.length > 0"
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <CardsProducto v-for="prod in cat.producto" :key="prod.id" :producto="prod" />
                    </div>

                    <div v-else
                        class="p-6 rounded-xl border border-dashed border-default bg-elevated/40 text-center text-muted text-xs">
                        No hay productos disponibles en esta categoría por el momento.
                    </div>
                </section>
            </div>
        </UContainer>
    </div>
</template>
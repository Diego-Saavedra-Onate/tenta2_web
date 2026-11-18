<script setup lang="ts">
import type { Productos } from '~/types/Productos'
import type { Usuario } from '~/types/Usuario'

const props = defineProps<{
    producto: Productos
    categoriaNombre?: string
}>()

const toast = useToast()
const { loggedIn, user } = useUserSession()
const { agregarProducto } = useCarrito()

const esAdmin = computed(() => loggedIn.value && (user.value as Usuario | null)?.rol === 'admin')
const stockDisponible = computed(() => Number(props.producto.disponibilidad ?? 0))
const sinStock = computed(() => stockDisponible.value <= 0)

const formatPrice = (val: number | string) => {
    return Number(val).toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP'
    })
}

function handleAgregar() {
    const res = agregarProducto(props.producto, 1, props.categoriaNombre)
    toast.add({
        title: res.ok ? props.producto.nombre : 'No disponible',
        description: res.message,
        color: res.ok ? 'primary' : 'error'
    })
}
</script>

<template>
    <UCard
        class="border border-default bg-elevated rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
        <template #header>
            <div class="h-44 -m-4 mb-0 bg-accented/30 relative overflow-hidden flex items-center justify-center">
                <img v-if="producto.imagen" :src="producto.imagen" :alt="producto.nombre"
                    class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div
                    class="hidden absolute inset-0 flex-col items-center justify-center text-muted gap-1 bg-accented/40">
                    <UIcon name="i-heroicons-cake" class="w-10 h-10 text-primary" />
                </div>

                <span :class="sinStock ? 'bg-red-600/95 text-white' : 'bg-neutral-900/85 text-white'"
                    class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-xs shadow-sm">
                    {{ sinStock ? 'Agotado' : `Stock: ${stockDisponible}` }}
                </span>
            </div>
        </template>

        <div class="flex-1 flex flex-col">
            <h3 class="font-bold text-lg text-highlighted line-clamp-1">
                {{ producto.nombre }}
            </h3>
            <p class="text-xs sm:text-sm text-muted mt-1 line-clamp-2">
                {{ producto.descripcion || 'Sin descripción disponible.' }}
            </p>
        </div>

        <template #footer>
            <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-base sm:text-lg text-primary">
                    {{ formatPrice(producto.precio) }}
                </span>
                <UButton v-if="!esAdmin" size="sm" color="primary" icon="i-heroicons-plus"
                    class="font-medium cursor-pointer" :disabled="sinStock" @click="handleAgregar">
                    {{ sinStock ? 'Sin stock' : 'Añadir' }}
                </UButton>
            </div>
        </template>
    </UCard>
</template>
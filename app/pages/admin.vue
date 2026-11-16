<script setup lang="ts">
const itemsTabs = [
    {
        label: 'Productos',
        icon: 'i-heroicons-squares-2x2',
        slot: 'productos'
    },
    {
        label: 'Categorías',
        icon: 'i-heroicons-tag',
        slot: 'categorias'
    },
    {
        label: 'Cuentas y Usuarios',
        icon: 'i-heroicons-users',
        slot: 'usuarios'
    }
]
</script>

<template>
    <div class="min-h-screen bg-default text-default py-8">
        <UContainer class="space-y-8">
            <section class="border-b border-default pb-6">
                <h1 class="text-3xl font-extrabold tracking-tight text-highlighted sm:text-4xl">
                    Portal de Administración
                </h1>
                <p class="mt-2 text-sm text-muted">
                    Gestiona los productos, categorías y cuentas de acceso de Tenta2.
                </p>
            </section>

            <UTabs :items="itemsTabs" class="w-full">
                <template #productos>
                    <div class="pt-4">
                        <AdminProductos />
                    </div>
                </template>

                <template #categorias>
                    <div class="pt-4">
                        <AdminCategorias />
                    </div>
                </template>

                <template #usuarios>
                    <div class="pt-4">
                        <AdminUsuarios />
                    </div>
                </template>
            </UTabs>
        </UContainer>
    </div>
</template>
<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Usuario } from '~/types/Usuario'

const route = useRoute()
const { loggedIn, user, clear } = useUserSession()
const { totalUnidades } = useCarrito()

const usuarioActual = computed(() => user.value as Usuario | null)
const esAdmin = computed(() => loggedIn.value && usuarioActual.value?.rol === 'admin')

const isActive = (to: string) => route.path === to || (to !== '/' && route.path.startsWith(to))

const vista = computed(() => {
    const links = [
        { label: 'Inicio', to: '/' },
        { label: 'Productos', to: '/productos' },
    ]

    if (esAdmin.value) {
        links.push({ label: 'Administración', to: '/admin' })
    }

    return links
})

const handleLogout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/login')
}

const menuUsuario = computed<DropdownMenuItem[][]>(() => {
    const acciones: DropdownMenuItem[] = []

    if (esAdmin.value) {
        acciones.push({
            label: 'Portal de Administración',
            icon: 'i-heroicons-squares-2x2',
            to: '/admin'
        })
    } else {
        acciones.push({
            label: 'Mis Pedidos',
            icon: 'i-heroicons-clipboard-document-list',
            to: '/mis-pedidos'
        })
    }

    acciones.push({
        label: 'Mis Datos',
        icon: 'i-heroicons-user-circle',
        to: '/perfil'
    })

    return [
        acciones,
        [
            {
                label: 'Cerrar sesión',
                icon: 'i-heroicons-arrow-right-start-on-rectangle',
                color: 'error',
                onSelect: handleLogout
            }
        ]
    ]
})
</script>

<template>
    <div class="min-h-screen bg-default text-default flex flex-col font-sans">
        <nav class="sticky top-0 z-50 backdrop-blur-md bg-(--ui-bg)/90 border-b border-default shadow-xs">
            <UContainer class="flex items-center justify-between h-20">

                <NuxtLink to="/" class="flex items-center gap-2 select-none">
                    <span class="text-2xl sm:text-3xl font-extrabold tracking-tight text-highlighted">
                        Tenta2
                    </span>
                </NuxtLink>

                <div class="flex gap-6 md:gap-8 items-center">
                    <NuxtLink v-for="link in vista" :key="link.to" :to="link.to" :class="isActive(link.to)
                        ? 'text-highlighted font-semibold border-b-2 border-primary pb-1'
                        : 'text-muted hover:text-highlighted transition-colors font-medium'">
                        {{ link.label }}
                    </NuxtLink>
                </div>

                <div class="flex gap-4 md:gap-6 items-center">
                    <NuxtLink to="/carrito" class="inline-flex items-center gap-1.5" :class="isActive('/carrito')
                        ? 'text-highlighted font-semibold border-b-2 border-primary pb-1'
                        : 'text-muted hover:text-highlighted transition-colors font-medium'">
                        <span>Carrito</span>
                        <UBadge v-if="totalUnidades > 0" color="primary" size="xs" variant="solid" class="rounded-full">
                            {{ totalUnidades }}
                        </UBadge>
                    </NuxtLink>

                    <UDropdownMenu v-if="loggedIn && usuarioActual" :items="menuUsuario"
                        :content="{ align: 'end', sideOffset: 8 }">
                        <UButton color="neutral" variant="subtle" icon="i-heroicons-user"
                            trailing-icon="i-heroicons-chevron-down" class="rounded-full cursor-pointer">
                            <span class="max-w-36 truncate">
                                {{ usuarioActual.nombre }} {{ usuarioActual.apellido }}
                            </span>
                        </UButton>
                    </UDropdownMenu>

                    <NuxtLink v-else to="/login" :class="isActive('/login')
                        ? 'text-highlighted font-semibold border-b-2 border-primary pb-1'
                        : 'text-muted hover:text-highlighted transition-colors font-medium'">
                        Iniciar sesión
                    </NuxtLink>
                </div>

            </UContainer>
        </nav>

        <main class="flex-1">
            <slot />
        </main>

        <footer class="bg-muted border-t border-default py-8 mt-auto">
            <div class="max-w-7xl mx-auto flex flex-col items-center justify-center gap-2 text-center px-4">
                <span class="font-extrabold text-lg tracking-tight text-highlighted">
                    Tenta2
                </span>

                <p class="text-muted text-sm">
                    © 2026 Tenta2. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    </div>
</template>
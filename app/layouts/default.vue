<script setup lang="ts">
import type { Usuario } from '~/types/Usuario'

const route = useRoute()
const { loggedIn, user, clear } = useUserSession()

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

                <div class="flex gap-5 md:gap-6 items-center">
                    <NuxtLink to="/carrito" :class="isActive('/carrito')
                        ? 'text-highlighted font-semibold border-b-2 border-primary pb-1'
                        : 'text-muted hover:text-highlighted transition-colors font-medium'">
                        Carrito
                    </NuxtLink>

                    <template v-if="loggedIn && usuarioActual">
                        <div
                            class="hidden sm:flex items-center gap-2 text-sm text-toned bg-elevated px-3 py-1.5 rounded-full border border-default">
                            <UIcon name="i-lucide-user-check" class="size-4 text-primary" />
                            <span class="font-medium">{{ usuarioActual.nombre }} {{ usuarioActual.apellido }}</span>
                        </div>

                        <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" label="Cerrar sesión"
                            class="cursor-pointer" @click="handleLogout" />
                    </template>

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
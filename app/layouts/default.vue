<template>
    <div class="min-h-screen flex flex-col justify-between">
        <!-- Navbar arriba -->
        <AppNavbar />

        <!-- Aquí se cargan dinámicamente tus páginas (index.vue, etc.) -->
        <main class="flex-1">
            <slot />
        </main>

        <!-- Footer abajo -->
        <AppFooter />
    </div>
</template>
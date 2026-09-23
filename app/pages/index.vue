<template>
    <div>
        <!-- SECCIÓN HERO -->
        <section
            class="py-20 sm:py-28 text-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <UContainer class="max-w-3xl">
                <UBadge color="primary" variant="subtle" class="mb-4">
                    TSI - Tenta 2
                </UBadge>

                <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Sistema de Gestión y Control Web
                </h1>

                <p class="mt-6 text-lg text-gray-600 dark:text-gray-300">
                    Plataforma desarrollada con Nuxt y componentes modernos de Nuxt UI para la entrega semestral.
                </p>

                <!-- Botones de llamada a la acción (CTA) -->
                <div class="mt-10 flex justify-center gap-4">
                    <UButton size="lg" color="primary">
                        Empezar ahora
                    </UButton>
                    <UButton size="lg" color="neutral" variant="outline">
                        Ver Módulos
                    </UButton>
                </div>
            </UContainer>
        </section>

        <!-- OTRAS SECCIONES (Cards, tablas, contenido...) -->
        <UContainer class="py-12">
            <!-- Aquí van tarjetas o formularios del taller -->
        </UContainer>
    </div>
</template>
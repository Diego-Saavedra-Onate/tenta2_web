<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
    layout: 'auth'
})

const schemaRegistro = z.object({
    nombre: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    apellido: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    email: z.string().trim().email('Ingresa un correo electrónico válido'),
    telefonoDigitos: z.string().trim().regex(/^\d{8}$/, 'Ingresa los 8 dígitos de tu móvil tras +56 9'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmarPassword: z.string()
}).refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword']
})

const registrando = ref(false)
const errorForm = ref('')
const form = reactive({
    nombre: '',
    apellido: '',
    email: '',
    telefonoDigitos: '',
    password: '',
    confirmarPassword: ''
})

const { fetch: fetchSession } = useUserSession()

async function registrar() {
    registrando.value = true
    errorForm.value = ''

    try {
        await $fetch('/api/auth/register', {
            method: 'POST',
            body: {
                nombre: form.nombre,
                apellido: form.apellido,
                email: form.email,
                telefono: `+569${form.telefonoDigitos}`,
                password: form.password
            }
        })

        await fetchSession()
        await navigateTo('/productos')
    } catch (err: any) {
        errorForm.value = getApiErrorMessage(err, 'No se pudo completar el registro')
    } finally {
        registrando.value = false
    }
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-default px-4 py-10 sm:px-6 lg:px-8 relative">

        <UButton to="/" icon="i-heroicons-arrow-left" size="md" color="neutral" variant="ghost"
            class="absolute left-6 top-6 rounded-full" aria-label="Volver al inicio" />

        <div class="w-full max-w-md shrink-0">
            <div class="bg-elevated/80 border border-default rounded-2xl p-6 sm:p-8 shadow-xs backdrop-blur-xs">

                <div class="space-y-2 text-center mb-6">
                    <span class="text-3xl font-extrabold tracking-tight text-highlighted block">
                        Tenta2
                    </span>
                    <p class="text-xs font-semibold uppercase tracking-wider text-primary">
                        Pastelería & Repostería Artesanal
                    </p>
                    <h2 class="text-lg font-bold text-highlighted pt-1">
                        Crear Cuenta de Cliente
                    </h2>
                </div>

                <UForm class="flex flex-col gap-4" :state="form" :schema="schemaRegistro" @submit="registrar">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UFormField label="Nombre" name="nombre">
                            <UInput v-model="form.nombre" placeholder="Ej: Francisca" class="w-full" />
                        </UFormField>

                        <UFormField label="Apellido" name="apellido">
                            <UInput v-model="form.apellido" placeholder="Ej: Muñoz" class="w-full" />
                        </UFormField>
                    </div>

                    <UFormField label="Correo electrónico" name="email">
                        <UInput v-model="form.email" placeholder="tu@correo.com" type="email" class="w-full" />
                    </UFormField>

                    <UFormField label="Teléfono móvil" name="telefonoDigitos">
                        <div class="flex items-center gap-2">
                            <span
                                class="px-3 py-2 rounded-md border border-default bg-accented/30 text-sm font-semibold text-highlighted select-none shrink-0">
                                +56 9
                            </span>
                            <UInput v-model="form.telefonoDigitos" maxlength="8" inputmode="numeric"
                                placeholder="12345678" class="w-full" />
                        </div>
                    </UFormField>

                    <UFormField label="Contraseña" name="password">
                        <UInput v-model="form.password" placeholder="••••••••" type="password" class="w-full" />
                    </UFormField>

                    <UFormField label="Confirmar contraseña" name="confirmarPassword">
                        <UInput v-model="form.confirmarPassword" placeholder="••••••••" type="password"
                            class="w-full" />
                    </UFormField>

                    <UAlert v-if="errorForm" color="error" variant="subtle" icon="i-heroicons-exclamation-circle"
                        :title="errorForm" />

                    <UButton type="submit" :loading="registrando" color="primary" size="lg"
                        class="w-full font-semibold justify-center mt-2 shadow-xs">
                        Registrarse
                    </UButton>

                    <p class="text-center text-xs text-muted pt-1">
                        ¿Ya tienes cuenta?
                        <NuxtLink to="/login" class="font-semibold text-primary hover:underline">
                            Inicia sesión aquí
                        </NuxtLink>
                    </p>
                </UForm>

            </div>
        </div>
    </div>
</template>
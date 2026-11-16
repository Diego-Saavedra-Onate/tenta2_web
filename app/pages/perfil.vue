<script setup lang="ts">
import { z } from 'zod'
import type { Usuario } from '~/types/Usuario'

const toast = useToast()
const { user, fetch: fetchSession } = useUserSession()
const usuarioActual = computed(() => user.value as Usuario | null)

function extraerDigitos(tel?: string) {
    if (!tel) return ''
    return tel.replace(/\D/g, '').slice(-8)
}

const form = reactive({
    nombre: usuarioActual.value?.nombre ?? '',
    apellido: usuarioActual.value?.apellido ?? '',
    telefonoDigitos: extraerDigitos(usuarioActual.value?.telefono),
    password: ''
})

watch(usuarioActual, (u) => {
    if (u) {
        form.nombre = u.nombre ?? ''
        form.apellido = u.apellido ?? ''
        form.telefonoDigitos = extraerDigitos(u.telefono)
    }
}, { immediate: true })

const schemaPerfil = z.object({
    nombre: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    apellido: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    telefonoDigitos: z.string().trim().regex(/^\d{8}$/, 'Ingresa los 8 dígitos tras +56 9'),
    password: z.string().optional().refine(val => !val || val.trim().length >= 6, 'Mínimo 6 caracteres')
})

const guardando = ref(false)
const errorForm = ref('')

async function guardarPerfil() {
    guardando.value = true
    errorForm.value = ''

    try {
        await $fetch('/api/auth/perfil', {
            method: 'PUT',
            body: {
                nombre: form.nombre,
                apellido: form.apellido,
                telefono: `+569${form.telefonoDigitos}`,
                password: form.password || undefined
            }
        })
        await fetchSession()
        form.password = ''
        toast.add({ title: 'Datos actualizados correctamente', color: 'primary' })
    } catch (err: any) {
        errorForm.value = getApiErrorMessage(err, 'No se pudieron actualizar tus datos')
    } finally {
        guardando.value = false
    }
}
</script>

<template>
    <div class="py-10 bg-default min-h-[calc(100vh-5rem)]">
        <UContainer class="max-w-xl space-y-6">
            <div class="border-b border-default pb-4">
                <h1 class="text-3xl font-extrabold tracking-tight text-highlighted">
                    Mis Datos
                </h1>
                <p class="text-sm text-muted mt-1">
                    Administra tu información de contacto y seguridad en Tenta2.
                </p>
            </div>

            <div class="bg-elevated/60 border border-default rounded-2xl p-6 sm:p-8 shadow-xs">
                <UForm class="space-y-4" :state="form" :schema="schemaPerfil" @submit="guardarPerfil">
                    <UFormField label="Correo electrónico (no editable)">
                        <UInput :model-value="usuarioActual?.email ?? ''" disabled class="w-full" />
                    </UFormField>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UFormField label="Nombre" name="nombre">
                            <UInput v-model="form.nombre" class="w-full" />
                        </UFormField>

                        <UFormField label="Apellido" name="apellido">
                            <UInput v-model="form.apellido" class="w-full" />
                        </UFormField>
                    </div>

                    <UFormField label="Teléfono móvil (Chile)" name="telefonoDigitos">
                        <div class="flex items-center gap-2">
                            <span
                                class="px-3 py-2 rounded-md border border-default bg-accented/30 text-sm font-semibold text-highlighted select-none shrink-0">
                                +56 9
                            </span>
                            <UInput v-model="form.telefonoDigitos" maxlength="8" inputmode="numeric" class="w-full" />
                        </div>
                    </UFormField>

                    <UFormField label="Nueva contraseña (dejar vacío para mantener la actual)" name="password">
                        <UInput v-model="form.password" type="password" placeholder="••••••••" class="w-full" />
                    </UFormField>

                    <UAlert v-if="errorForm" color="error" variant="soft" icon="i-heroicons-exclamation-circle"
                        :title="errorForm" />

                    <div class="flex justify-end pt-3 border-t border-default">
                        <UButton type="submit" color="primary" :loading="guardando">
                            Guardar Cambios
                        </UButton>
                    </div>
                </UForm>
            </div>
        </UContainer>
    </div>
</template>
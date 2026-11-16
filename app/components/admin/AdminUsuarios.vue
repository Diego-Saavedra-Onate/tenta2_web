<script setup lang="ts">
import { z } from 'zod'
import type { Usuario } from '~/types/Usuario'

interface UsuarioConConteo extends Usuario {
    _count?: { pedidos: number }
}

const toast = useToast()
const { user: sessionUser } = useUserSession()
const adminLogueadoId = computed(() => (sessionUser.value as Usuario | null)?.id)

const rolFiltro = ref<'admin' | 'cliente'>('admin')
const busqueda = ref('')

const { data: usuarios, pending, error, refresh } = await useFetch<UsuarioConConteo[]>('/api/usuarios', {
    query: computed(() => ({
        rol: rolFiltro.value,
        q: busqueda.value.trim() || undefined
    }))
})

const mostrarModal = ref(false)
const esEdicion = ref(false)
const idEdicion = ref<number | null>(null)
const guardando = ref(false)
const errorForm = ref('')
const mostrarPassword = ref(false)

const mostrarConfirmBorrar = ref(false)
const borrando = ref(false)
const usuarioABorrar = ref<UsuarioConConteo | null>(null)

const schemaCrear = z.object({
    nombre: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    apellido: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    email: z.string().trim().email('Correo electrónico inválido'),
    telefonoDigitos: z.string().trim().regex(/^\d{8}$/, 'Ingresa los 8 dígitos de tu móvil tras +56 9'),
    password: z.string().min(6, 'Mínimo 6 caracteres')
})

const schemaEditar = z.object({
    nombre: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    apellido: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    email: z.string().trim().email('Correo electrónico inválido'),
    telefonoDigitos: z.string().trim().regex(/^\d{8}$/, 'Ingresa los 8 dígitos de tu móvil tras +56 9'),
    password: z.string().optional().refine(val => !val || val.trim().length >= 6, 'Mínimo 6 caracteres si deseas cambiarla')
})

const form = reactive({
    nombre: '',
    apellido: '',
    email: '',
    telefonoDigitos: '',
    password: '',
    vetado: false
})

function extraerDigitosMovil(telefono?: string) {
    if (!telefono) return ''
    const limpio = telefono.replace(/\D/g, '')
    return limpio.slice(-8)
}

function formatearTelefonoChile(telefono?: string) {
    const digitos = extraerDigitosMovil(telefono)
    if (digitos.length !== 8) return telefono || '-'
    return `+56 9 ${digitos.slice(0, 4)} ${digitos.slice(4)}`
}

function resetForm() {
    form.nombre = ''
    form.apellido = ''
    form.email = ''
    form.telefonoDigitos = ''
    form.password = ''
    form.vetado = false
    idEdicion.value = null
    errorForm.value = ''
    mostrarPassword.value = false
}

function abrirModalCrearAdmin() {
    esEdicion.value = false
    resetForm()
    mostrarModal.value = true
}

function abrirModalEditar(u: UsuarioConConteo) {
    esEdicion.value = true
    idEdicion.value = u.id
    form.nombre = u.nombre ?? ''
    form.apellido = u.apellido ?? ''
    form.email = u.email ?? ''
    form.telefonoDigitos = extraerDigitosMovil(u.telefono)
    form.password = ''
    form.vetado = Boolean(u.vetado)
    errorForm.value = ''
    mostrarPassword.value = false
    mostrarModal.value = true
}

function cerrarModal() {
    mostrarModal.value = false
    resetForm()
}

async function guardarUsuario() {
    guardando.value = true
    errorForm.value = ''

    const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: `+569${form.telefonoDigitos}`,
        password: form.password || undefined,
        vetado: form.vetado,
        ...(!esEdicion.value ? { rol: 'admin' } : {})
    }

    try {
        if (esEdicion.value && idEdicion.value) {
            await $fetch(`/api/usuarios/${idEdicion.value}`, {
                method: 'PUT',
                body: payload
            })
            toast.add({ title: 'Cuenta actualizada con éxito', color: 'primary' })
        } else {
            await $fetch('/api/usuarios', {
                method: 'POST',
                body: payload
            })
            toast.add({ title: 'Administrador creado con éxito', color: 'primary' })
        }
        cerrarModal()
        await refresh()
    } catch (err: any) {
        errorForm.value = getApiErrorMessage(err, 'No se pudo guardar la cuenta.')
    } finally {
        guardando.value = false
    }
}

function confirmarBorrar(u: UsuarioConConteo) {
    usuarioABorrar.value = u
    mostrarConfirmBorrar.value = true
}

function cerrarConfirmBorrar() {
    usuarioABorrar.value = null
    mostrarConfirmBorrar.value = false
}

async function borrarUsuario() {
    if (!usuarioABorrar.value) return
    borrando.value = true

    try {
        await $fetch(`/api/usuarios/${usuarioABorrar.value.id}`, { method: 'DELETE' })
        toast.add({
            title: 'Cuenta eliminada',
            description: `Se eliminó a ${usuarioABorrar.value.nombre} ${usuarioABorrar.value.apellido}`,
            color: 'neutral'
        })
        cerrarConfirmBorrar()
        await refresh()
    } catch (err: any) {
        toast.add({
            title: 'No se pudo eliminar',
            description: getApiErrorMessage(err, 'No fue posible eliminar la cuenta.'),
            color: 'error'
        })
        cerrarConfirmBorrar()
    } finally {
        borrando.value = false
    }
}
</script>

<template>
    <div class="border border-dashed border-default rounded-2xl bg-elevated/40 p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default/70 pb-5">
            <div>
                <h2 class="text-2xl font-bold tracking-tight text-highlighted">
                    Gestión de Cuentas
                </h2>
                <p class="text-sm text-muted mt-1">
                    Administra los accesos del equipo y consulta los clientes registrados.
                </p>
            </div>

            <UButton v-if="rolFiltro === 'admin'" color="primary" icon="i-heroicons-user-plus"
                @click="abrirModalCrearAdmin">
                Nuevo Administrador
            </UButton>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div class="flex gap-2">
                <UButton size="sm" :variant="rolFiltro === 'admin' ? 'solid' : 'subtle'"
                    :color="rolFiltro === 'admin' ? 'primary' : 'neutral'" icon="i-heroicons-shield-check"
                    @click="rolFiltro = 'admin'">
                    Administradores
                </UButton>

                <UButton size="sm" :variant="rolFiltro === 'cliente' ? 'solid' : 'subtle'"
                    :color="rolFiltro === 'cliente' ? 'primary' : 'neutral'" icon="i-heroicons-users"
                    @click="rolFiltro = 'cliente'">
                    Clientes
                </UButton>
            </div>

            <UInput v-model="busqueda" icon="i-heroicons-magnifying-glass"
                placeholder="Buscar por nombre, apellido o correo..." class="w-full sm:w-80" />
        </div>

        <div v-if="pending" class="text-center py-8 text-muted flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-primary" />
            Cargando cuentas...
        </div>

        <div v-else-if="error" class="text-center py-8 text-error">
            Error al cargar los usuarios desde el servidor.
        </div>

        <div v-else-if="!usuarios || usuarios.length === 0"
            class="p-8 rounded-xl border border-dashed border-default bg-elevated/30 text-center text-muted text-sm">
            No se encontraron cuentas de {{ rolFiltro === 'admin' ? 'administradores' : 'clientes' }} con ese criterio.
        </div>

        <div v-else class="border border-default rounded-xl bg-elevated shadow-xs overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse min-w-160">
                <thead>
                    <tr class="bg-accented/20 border-b border-default text-muted font-semibold">
                        <th class="py-3 px-4">Nombre</th>
                        <th class="py-3 px-4">Correo electrónico</th>
                        <th class="py-3 px-4">Teléfono</th>
                        <th class="py-3 px-4 text-center">Estado</th>
                        <th class="py-3 px-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-default">
                    <tr v-for="u in usuarios" :key="u.id" class="hover:bg-accented/10 transition-colors">
                        <td class="py-3.5 px-4 font-semibold text-highlighted">
                            {{ u.nombre }} {{ u.apellido }}
                            <UBadge v-if="u.id === adminLogueadoId" size="xs" color="primary" variant="subtle"
                                class="ml-2">
                                Tú
                            </UBadge>
                        </td>
                        <td class="py-3.5 px-4 text-muted">
                            {{ u.email }}
                        </td>
                        <td class="py-3.5 px-4 text-muted font-mono text-xs">
                            {{ formatearTelefonoChile(u.telefono) }}
                        </td>
                        <td class="py-3.5 px-4 text-center">
                            <UBadge :color="u.vetado ? 'error' : 'primary'" variant="subtle" size="xs">
                                {{ u.vetado ? 'Suspendido' : 'Activo' }}
                            </UBadge>
                        </td>
                        <td class="py-3.5 px-4 text-right">
                            <div class="flex justify-end gap-2">
                                <UButton size="xs" color="neutral" variant="outline" icon="i-heroicons-pencil-square"
                                    @click="abrirModalEditar(u)">
                                    Editar
                                </UButton>
                                <UButton v-if="u.id !== adminLogueadoId" size="xs" color="error" variant="subtle"
                                    icon="i-heroicons-trash" @click="confirmarBorrar(u)">
                                    Borrar
                                </UButton>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <UModal v-model:open="mostrarModal" :title="esEdicion ? 'Editar Cuenta' : 'Nuevo Administrador'">
            <template #body>
                <UForm class="space-y-4" :state="form" :schema="esEdicion ? schemaEditar : schemaCrear"
                    @submit="guardarUsuario">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UFormField label="Nombre" name="nombre">
                            <UInput v-model="form.nombre" placeholder="Ej: Camila" class="w-full" />
                        </UFormField>

                        <UFormField label="Apellido" name="apellido">
                            <UInput v-model="form.apellido" placeholder="Ej: Rojas" class="w-full" />
                        </UFormField>
                    </div>

                    <UFormField label="Correo electrónico" name="email">
                        <UInput v-model="form.email" type="email" placeholder="admin@tenta2.cl" class="w-full" />
                    </UFormField>

                    <UFormField label="Teléfono móvil (Chile)" name="telefonoDigitos">
                        <div class="flex items-center gap-2">
                            <span
                                class="px-3 py-2 rounded-md border border-default bg-accented/30 text-sm font-semibold text-highlighted select-none shrink-0">
                                +56 9
                            </span>
                            <UInput v-model="form.telefonoDigitos" maxlength="8" inputmode="numeric"
                                placeholder="12345678" class="w-full" />
                        </div>
                    </UFormField>

                    <UFormField :label="esEdicion ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'"
                        name="password">
                        <UInput v-model="form.password" :type="mostrarPassword ? 'text' : 'password'"
                            placeholder="••••••••" class="w-full" :ui="{ trailing: 'pe-1' }">
                            <template #trailing>
                                <UButton type="button" color="neutral" variant="link" size="sm"
                                    :icon="mostrarPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                                    :aria-label="mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                                    @click="mostrarPassword = !mostrarPassword" />
                            </template>
                        </UInput>
                    </UFormField>

                    <div v-if="esEdicion && idEdicion !== adminLogueadoId" class="pt-1">
                        <UCheckbox v-model="form.vetado" label="Suspender / vetar acceso de esta cuenta" />
                    </div>

                    <UAlert v-if="errorForm" color="error" variant="soft" icon="i-heroicons-exclamation-circle"
                        :title="errorForm" />

                    <div class="flex justify-end gap-3 pt-3 border-t border-default">
                        <UButton type="button" color="neutral" variant="subtle" @click="cerrarModal">
                            Cancelar
                        </UButton>
                        <UButton type="submit" color="primary" :loading="guardando">
                            {{ esEdicion ? 'Guardar Cambios' : 'Crear Administrador' }}
                        </UButton>
                    </div>
                </UForm>
            </template>
        </UModal>

        <UModal v-model:open="mostrarConfirmBorrar" title="Eliminar Cuenta">
            <template #body>
                <div class="space-y-4">
                    <p class="text-sm text-muted">
                        ¿Estás seguro que deseas eliminar la cuenta de
                        <strong class="text-highlighted">{{ usuarioABorrar?.nombre }} {{ usuarioABorrar?.apellido
                        }}</strong>?
                        Si tiene historial de pedidos, deberás suspenderla en lugar de eliminarla.
                    </p>

                    <div class="flex justify-end gap-3 pt-3 border-t border-default">
                        <UButton color="neutral" variant="subtle" @click="cerrarConfirmBorrar">
                            Cancelar
                        </UButton>
                        <UButton color="error" icon="i-heroicons-trash" :loading="borrando" @click="borrarUsuario">
                            Eliminar Cuenta
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
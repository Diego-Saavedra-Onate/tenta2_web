<script setup lang="ts">
import { z } from 'zod'
import type { Categorias } from '~/types/Categoria'

const toast = useToast()

const { data: categorias, pending, error, refresh } = await useFetch<Categorias[]>('/api/categorias', {
    query: { incluirOcultos: 'true' }
})

const mostrarModal = ref(false)
const esEdicion = ref(false)
const idEdicion = ref<number | null>(null)
const guardando = ref(false)
const errorForm = ref('')

const mostrarConfirmBorrar = ref(false)
const borrando = ref(false)
const categoriaABorrar = ref<Categorias | null>(null)

const schemaCategoria = z.object({
    nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(50),
    descripcion: z.string().trim().min(3, 'La descripción es obligatoria').max(200)
})

const form = reactive({
    nombre: '',
    descripcion: ''
})

function resetForm() {
    form.nombre = ''
    form.descripcion = ''
    idEdicion.value = null
    errorForm.value = ''
}

function abrirModalCrear() {
    esEdicion.value = false
    resetForm()
    mostrarModal.value = true
}

function abrirModalEditar(cat: Categorias) {
    esEdicion.value = true
    idEdicion.value = cat.id
    form.nombre = cat.nombre
    form.descripcion = cat.descripcion || ''
    errorForm.value = ''
    mostrarModal.value = true
}

function cerrarModal() {
    mostrarModal.value = false
    resetForm()
}

async function guardarCategoria() {
    guardando.value = true
    errorForm.value = ''

    try {
        if (esEdicion.value && idEdicion.value) {
            await $fetch(`/api/categorias/${idEdicion.value}`, {
                method: 'PUT',
                body: form
            })
            toast.add({ title: 'Categoría actualizada con éxito', color: 'primary' })
        } else {
            await $fetch('/api/categorias', {
                method: 'POST',
                body: form
            })
            toast.add({ title: 'Categoría creada con éxito', color: 'primary' })
        }
        cerrarModal()
        await refresh()
    } catch (err: any) {
        errorForm.value = getApiErrorMessage(err, 'No se pudo guardar la categoría.')
    } finally {
        guardando.value = false
    }
}

function confirmarBorrar(cat: Categorias) {
    categoriaABorrar.value = cat
    mostrarConfirmBorrar.value = true
}

function cerrarConfirmBorrar() {
    categoriaABorrar.value = null
    mostrarConfirmBorrar.value = false
}

async function borrarCategoria() {
    if (!categoriaABorrar.value) return
    borrando.value = true

    try {
        await $fetch(`/api/categorias/${categoriaABorrar.value.id}`, { method: 'DELETE' })
        toast.add({
            title: 'Categoría eliminada',
            description: `Se eliminó ${categoriaABorrar.value.nombre}`,
            color: 'neutral'
        })
        cerrarConfirmBorrar()
        await refresh()
    } catch (err: any) {
        toast.add({
            title: 'No se pudo eliminar',
            description: getApiErrorMessage(err, 'Verifica que no tenga productos asociados.'),
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
                    Categorías del Catálogo
                </h2>
                <p class="text-sm text-muted mt-1">
                    Organiza las líneas de productos disponibles en Tenta2.
                </p>
            </div>

            <UButton color="primary" icon="i-heroicons-plus" @click="abrirModalCrear">
                Nueva Categoría
            </UButton>
        </div>

        <div v-if="pending" class="text-center py-8 text-muted flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-primary" />
            Cargando categorías...
        </div>

        <div v-else-if="error" class="text-center py-8 text-error">
            Error al cargar las categorías desde el servidor.
        </div>

        <div v-else-if="!categorias || categorias.length === 0" class="text-center py-8 text-muted">
            No hay categorías registradas todavía.
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UCard v-for="cat in categorias" :key="cat.id"
                class="border border-default bg-elevated rounded-xl shadow-xs flex flex-col justify-between">
                <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                        <h3 class="text-lg font-bold text-highlighted">
                            {{ cat.nombre }}
                        </h3>
                        <UBadge color="primary" variant="subtle" size="xs">
                            {{ cat.producto?.length ?? 0 }} prod.
                        </UBadge>
                    </div>
                    <p class="text-xs text-muted line-clamp-3">
                        {{ cat.descripcion || 'Sin descripción' }}
                    </p>
                </div>

                <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-default">
                    <UButton size="xs" color="neutral" variant="outline" icon="i-heroicons-pencil-square"
                        @click="abrirModalEditar(cat)">
                        Editar
                    </UButton>
                    <UButton size="xs" color="error" variant="subtle" icon="i-heroicons-trash"
                        @click="confirmarBorrar(cat)">
                        Borrar
                    </UButton>
                </div>
            </UCard>
        </div>

        <UModal v-model:open="mostrarModal" :title="esEdicion ? 'Editar Categoría' : 'Nueva Categoría'">
            <template #body>
                <UForm class="space-y-4" :state="form" :schema="schemaCategoria" @submit="guardarCategoria">
                    <UFormField label="Nombre de la Categoría" name="nombre">
                        <UInput v-model="form.nombre" placeholder="Ej: Tortas, Brownies, Pies..." class="w-full" />
                    </UFormField>

                    <UFormField label="Descripción" name="descripcion">
                        <UTextarea v-model="form.descripcion" placeholder="Breve descripción de la categoría..."
                            class="w-full" />
                    </UFormField>

                    <UAlert v-if="errorForm" color="error" variant="soft" icon="i-heroicons-exclamation-circle"
                        :title="errorForm" />

                    <div class="flex justify-end gap-3 pt-3 border-t border-default">
                        <UButton type="button" color="neutral" variant="subtle" @click="cerrarModal">
                            Cancelar
                        </UButton>
                        <UButton type="submit" color="primary" :loading="guardando">
                            {{ esEdicion ? 'Guardar Cambios' : 'Crear Categoría' }}
                        </UButton>
                    </div>
                </UForm>
            </template>
        </UModal>

        <UModal v-model:open="mostrarConfirmBorrar" title="Borrar Categoría">
            <template #body>
                <div class="space-y-4">
                    <p class="text-sm text-muted">
                        ¿Estás seguro que deseas eliminar la categoría
                        <strong class="text-highlighted">{{ categoriaABorrar?.nombre }}</strong>? Solo podrás eliminarla
                        si no tiene productos asociados.
                    </p>

                    <div class="flex justify-end gap-3 pt-3 border-t border-default">
                        <UButton color="neutral" variant="subtle" @click="cerrarConfirmBorrar">
                            Cancelar
                        </UButton>
                        <UButton color="error" icon="i-heroicons-trash" :loading="borrando" @click="borrarCategoria">
                            Borrar Categoría
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
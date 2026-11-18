<script setup lang="ts">
import { CalendarDate, parseDate } from '@internationalized/date'

const props = withDefaults(defineProps<{
    modelValue?: string
    min?: string
    disabled?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
    modelValue: '',
    min: undefined,
    disabled: false,
    size: 'md'
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const abierto = ref(false)

function toCalendarDate(iso?: string): CalendarDate | undefined {
    if (!iso) return undefined
    const limpio = iso.split('T')[0] ?? ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio)) return undefined
    try {
        return parseDate(limpio)
    } catch {
        return undefined
    }
}

const fechaModelo = computed<CalendarDate | undefined>({
    get: () => toCalendarDate(props.modelValue),
    set: (val) => {
        if (val) {
            emit('update:modelValue', val.toString())
        }
    }
})

const fechaMinima = computed<CalendarDate | undefined>(() => toCalendarDate(props.min))

function alSeleccionarEnCalendario(val: any) {
    if (val && typeof val.toString === 'function') {
        emit('update:modelValue', val.toString())
        abierto.value = false
    }
}
</script>

<template>
    <UPopover v-model:open="abierto" :disabled="disabled">
        <UInputDate v-model="fechaModelo" locale="es-CL" :min-value="fechaMinima" :disabled="disabled" :size="size"
            class="w-full">
            <template #trailing>
                <UButton type="button" color="neutral" variant="link" size="xs" icon="i-heroicons-calendar-days"
                    :disabled="disabled" aria-label="Abrir calendario" @click="abierto = !abierto" />
            </template>
        </UInputDate>

        <template #content>
            <UCalendar :model-value="fechaModelo" locale="es-CL" :min-value="fechaMinima" class="p-2"
                @update:model-value="alSeleccionarEnCalendario" />
        </template>
    </UPopover>
</template>
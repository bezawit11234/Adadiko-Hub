<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    tabular?: boolean
    error?: boolean
    id?: string
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    readonly: false,
    tabular: false,
    error: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | number): void
  (e: 'blur', event: FocusEvent): void
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = props.type === 'number' ? (target.value === '' ? '' : Number(target.value)) : target.value
  emit('update:modelValue', val)
}

const borderClass = computed(() => {
  if (props.error) return 'border-status-red focus:border-status-red focus:ring-status-red/20'
  return 'border-stone-border focus:border-signal focus:ring-signal/20'
})
</script>

<template>
  <div class="relative rounded-xl shadow-xs">
    <div
      v-if="$slots.prefix"
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-light"
    >
      <slot name="prefix" />
    </div>

    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :class="[
        'block w-full rounded-xl border bg-stone-surface px-3.5 py-2 text-sm text-ink placeholder:text-ink-light/60 transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-stone-muted/50 disabled:cursor-not-allowed',
        $slots.prefix ? 'pl-9' : '',
        $slots.suffix ? 'pr-9' : '',
        tabular ? 'num-tabular' : '',
        borderClass,
      ]"
      @input="onInput"
      @blur="$emit('blur', $event)"
    />

    <div
      v-if="$slots.suffix"
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ink-light"
    >
      <slot name="suffix" />
    </div>
  </div>
</template>

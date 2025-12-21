<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()

const inputId = computed(() => attrs.id as string || `input-${Math.random().toString(36).slice(2, 9)}`)

const inputClasses = computed(() => [
  'w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
  props.error 
    ? 'border-red-300 bg-red-50' 
    : 'border-secondary-300 bg-white hover:border-secondary-400'
])

function handleInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="space-y-1">
    <label 
      v-if="label" 
      :for="inputId"
      class="block text-sm font-medium text-secondary-700"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :class="inputClasses"
      v-bind="$attrs"
      @input="handleInput"
    />

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="text-sm text-secondary-500">{{ hint }}</p>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

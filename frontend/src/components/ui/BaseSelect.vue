<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
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
  options: {
    type: Array as () => { value: string | number; label: string }[],
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()

const selectId = computed(() => attrs.id as string || `select-${Math.random().toString(36).slice(2, 9)}`)

const selectClasses = computed(() => [
  'w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-no-repeat',
  props.error 
    ? 'border-red-300 bg-red-50' 
    : 'border-secondary-300 bg-white hover:border-secondary-400'
])

function handleChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="space-y-1">
    <label 
      v-if="label" 
      :for="selectId"
      class="block text-sm font-medium text-secondary-700"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :class="selectClasses"
        v-bind="$attrs"
        @change="handleChange"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option 
          v-for="option in options" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg class="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="text-sm text-secondary-500">{{ hint }}</p>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

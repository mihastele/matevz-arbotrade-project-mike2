<script setup lang="ts">
import type { ProductImage } from '@/types'

const props = defineProps<{
  images: ProductImage[]
}>()

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'setPrimary', id: string): void
}>()
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    <div
      v-for="image in images"
      :key="image.id"
      class="relative group aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300"
      :class="image.isPrimary ? 'border-primary-500 ring-2 ring-primary-100' : 'border-secondary-100 hover:border-primary-300'"
    >
      <img
        :src="image.url"
        :alt="image.alt || 'Product image'"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
        <button
          type="button"
          class="p-2 bg-white rounded-full text-secondary-900 hover:text-primary-600 shadow-sm transition-colors"
          title="Set as featured"
          @click="emit('setPrimary', image.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          type="button"
          class="p-2 bg-white rounded-full text-secondary-900 hover:text-red-600 shadow-sm transition-colors"
          title="Remove image"
          @click="emit('remove', image.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <!-- Featured Badge -->
      <div
        v-if="image.isPrimary"
        class="absolute top-2 left-2 px-2 py-0.5 bg-primary-500 text-white text-[10px] font-bold rounded shadow-sm uppercase tracking-wider"
      >
        Featured
      </div>
    </div>
  </div>
</template>

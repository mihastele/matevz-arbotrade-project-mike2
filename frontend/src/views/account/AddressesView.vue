<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-secondary-900 mb-6">My Addresses</h1>

    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 class="text-lg font-semibold text-secondary-900 mb-2">No saved addresses</h2>
        <p class="text-secondary-500 mb-6">Add an address to make checkout faster</p>
        <BaseButton>
          Add New Address
        </BaseButton>
      </div>
    </div>
  </div>
</template>

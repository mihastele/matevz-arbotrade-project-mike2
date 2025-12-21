<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center px-4">
      <h1 class="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-secondary-900 mb-2">Page Not Found</h2>
      <p class="text-secondary-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <RouterLink to="/" class="btn-primary">
        Back to Home
      </RouterLink>
    </div>
  </div>
</template>

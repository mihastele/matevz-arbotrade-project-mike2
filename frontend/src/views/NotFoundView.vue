<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center px-4">
      <h1 class="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-secondary-900 mb-2">{{ t('notFound.title') }}</h2>
      <p class="text-secondary-600 mb-8">
        {{ t('notFound.message') }}
      </p>
      <RouterLink to="/" class="btn-primary">
        {{ t('notFound.goHome') }}
      </RouterLink>
    </div>
  </div>
</template>

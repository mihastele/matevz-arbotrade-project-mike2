<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  
  if (!email.value) {
    errors.value.email = t('loginPage.emailRequired')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = t('loginPage.emailInvalid')
  }
  
  if (!password.value) {
    errors.value.password = t('loginPage.passwordRequired')
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    toast.success(t('loginPage.welcomeBack'))
    
    // Redirect to intended page or home
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    const message = err.response?.data?.message || t('loginPage.invalidCredentials')
    toast.error(message)
    errors.value.email = ' '
    errors.value.password = message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center py-12">
    <div class="w-full max-w-md px-4">
      <div class="bg-white rounded-lg shadow-sm p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-secondary-900">{{ t('loginPage.title') }}</h1>
          <p class="text-secondary-600 mt-2">{{ t('loginPage.subtitle') }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <BaseInput
            v-model="email"
            :label="t('loginPage.email')"
            type="email"
            :placeholder="t('loginPage.emailPlaceholder')"
            autocomplete="email"
            required
            :error="errors.email"
          />

          <BaseInput
            v-model="password"
            :label="t('loginPage.password')"
            type="password"
            :placeholder="t('loginPage.passwordPlaceholder')"
            autocomplete="current-password"
            required
            :error="errors.password"
          />

          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input 
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-secondary-600">{{ t('loginPage.rememberMe') }}</span>
            </label>
            <a href="#" class="text-sm text-primary-600 hover:text-primary-700">
              {{ t('loginPage.forgotPassword') }}
            </a>
          </div>

          <BaseButton type="submit" class="w-full" :loading="loading">
            {{ t('loginPage.signIn') }}
          </BaseButton>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <hr class="flex-1 border-secondary-200" />
          <span class="px-4 text-sm text-secondary-400">{{ t('loginPage.or') }}</span>
          <hr class="flex-1 border-secondary-200" />
        </div>

        <!-- Register Link -->
        <p class="text-center text-secondary-600">
          {{ t('loginPage.noAccount') }}
          <RouterLink to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
            {{ t('loginPage.createAccount') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const errors = ref<Record<string, string>>({})
const agreeTerms = ref(false)

function validate(): boolean {
  errors.value = {}
  
  if (!form.value.firstName) {
    errors.value.firstName = t('registerPage.firstNameRequired')
  }
  
  if (!form.value.lastName) {
    errors.value.lastName = t('registerPage.lastNameRequired')
  }
  
  if (!form.value.email) {
    errors.value.email = t('registerPage.emailRequired')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = t('registerPage.emailInvalid')
  }
  
  if (!form.value.password) {
    errors.value.password = t('registerPage.passwordRequired')
  } else if (form.value.password.length < 6) {
    errors.value.password = t('registerPage.passwordTooShort')
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = t('registerPage.passwordsNoMatch')
  }
  
  if (!agreeTerms.value) {
    errors.value.terms = t('registerPage.termsRequired')
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  try {
    await authStore.register({
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      password: form.value.password
    })
    toast.success(t('registerPage.success'))
    router.push('/')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    const message = err.response?.data?.message || t('registerPage.failed')
    toast.error(message)
    
    if (message.toLowerCase().includes('email')) {
      errors.value.email = message
    }
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
          <h1 class="text-2xl font-bold text-secondary-900">{{ t('registerPage.title') }}</h1>
          <p class="text-secondary-600 mt-2">{{ t('registerPage.subtitle') }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <BaseInput
              v-model="form.firstName"
              :label="t('registerPage.firstName')"
              :placeholder="t('registerPage.firstNamePlaceholder')"
              autocomplete="given-name"
              required
              :error="errors.firstName"
            />
            <BaseInput
              v-model="form.lastName"
              :label="t('registerPage.lastName')"
              :placeholder="t('registerPage.lastNamePlaceholder')"
              autocomplete="family-name"
              required
              :error="errors.lastName"
            />
          </div>

          <BaseInput
            v-model="form.email"
            :label="t('registerPage.email')"
            type="email"
            :placeholder="t('registerPage.emailPlaceholder')"
            autocomplete="email"
            required
            :error="errors.email"
          />

          <BaseInput
            v-model="form.password"
            :label="t('registerPage.password')"
            type="password"
            :placeholder="t('registerPage.passwordPlaceholder')"
            autocomplete="new-password"
            required
            :error="errors.password"
          />

          <BaseInput
            v-model="form.confirmPassword"
            :label="t('registerPage.confirmPassword')"
            type="password"
            :placeholder="t('registerPage.confirmPasswordPlaceholder')"
            autocomplete="new-password"
            required
            :error="errors.confirmPassword"
          />

          <div>
            <label class="flex items-start">
              <input 
                v-model="agreeTerms"
                type="checkbox"
                class="w-4 h-4 mt-1 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-secondary-600">
                {{ t('registerPage.agreeTerms') }}
                <a href="#" class="text-primary-600 hover:text-primary-700">{{ t('registerPage.termsOfService') }}</a>
                {{ t('registerPage.and') }}
                <a href="#" class="text-primary-600 hover:text-primary-700">{{ t('registerPage.privacyPolicy') }}</a>
              </span>
            </label>
            <p v-if="errors.terms" class="mt-1 text-sm text-red-600">{{ errors.terms }}</p>
          </div>

          <BaseButton type="submit" class="w-full" :loading="loading">
            {{ t('registerPage.createAccount') }}
          </BaseButton>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <hr class="flex-1 border-secondary-200" />
          <span class="px-4 text-sm text-secondary-400">{{ t('registerPage.or') }}</span>
          <hr class="flex-1 border-secondary-200" />
        </div>

        <!-- Login Link -->
        <p class="text-center text-secondary-600">
          {{ t('registerPage.haveAccount') }}
          <RouterLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            {{ t('registerPage.signIn') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

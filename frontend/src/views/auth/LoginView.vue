<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

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
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = 'Please enter a valid email'
  }
  
  if (!password.value) {
    errors.value.password = 'Password is required'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    toast.success('Welcome back!')
    
    // Redirect to intended page or home
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    const message = err.response?.data?.message || 'Invalid credentials'
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
          <h1 class="text-2xl font-bold text-secondary-900">Welcome Back</h1>
          <p class="text-secondary-600 mt-2">Sign in to your account</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
            :error="errors.email"
          />

          <BaseInput
            v-model="password"
            label="Password"
            type="password"
            placeholder="••••••••"
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
              <span class="ml-2 text-sm text-secondary-600">Remember me</span>
            </label>
            <a href="#" class="text-sm text-primary-600 hover:text-primary-700">
              Forgot password?
            </a>
          </div>

          <BaseButton type="submit" class="w-full" :loading="loading">
            Sign In
          </BaseButton>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <hr class="flex-1 border-secondary-200" />
          <span class="px-4 text-sm text-secondary-400">or</span>
          <hr class="flex-1 border-secondary-200" />
        </div>

        <!-- Register Link -->
        <p class="text-center text-secondary-600">
          Don't have an account?
          <RouterLink to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
            Create one
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

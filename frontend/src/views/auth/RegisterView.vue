<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

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
    errors.value.firstName = 'First name is required'
  }
  
  if (!form.value.lastName) {
    errors.value.lastName = 'Last name is required'
  }
  
  if (!form.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email'
  }
  
  if (!form.value.password) {
    errors.value.password = 'Password is required'
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
  }
  
  if (!agreeTerms.value) {
    errors.value.terms = 'You must agree to the terms'
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
    toast.success('Account created successfully!')
    router.push('/')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    const message = err.response?.data?.message || 'Registration failed'
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
          <h1 class="text-2xl font-bold text-secondary-900">Create Account</h1>
          <p class="text-secondary-600 mt-2">Join us and start shopping</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <BaseInput
              v-model="form.firstName"
              label="First Name"
              placeholder="John"
              autocomplete="given-name"
              required
              :error="errors.firstName"
            />
            <BaseInput
              v-model="form.lastName"
              label="Last Name"
              placeholder="Doe"
              autocomplete="family-name"
              required
              :error="errors.lastName"
            />
          </div>

          <BaseInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
            :error="errors.email"
          />

          <BaseInput
            v-model="form.password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
            :error="errors.password"
          />

          <BaseInput
            v-model="form.confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
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
                I agree to the 
                <a href="#" class="text-primary-600 hover:text-primary-700">Terms of Service</a>
                and
                <a href="#" class="text-primary-600 hover:text-primary-700">Privacy Policy</a>
              </span>
            </label>
            <p v-if="errors.terms" class="mt-1 text-sm text-red-600">{{ errors.terms }}</p>
          </div>

          <BaseButton type="submit" class="w-full" :loading="loading">
            Create Account
          </BaseButton>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <hr class="flex-1 border-secondary-200" />
          <span class="px-4 text-sm text-secondary-400">or</span>
          <hr class="flex-1 border-secondary-200" />
        </div>

        <!-- Login Link -->
        <p class="text-center text-secondary-600">
          Already have an account?
          <RouterLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

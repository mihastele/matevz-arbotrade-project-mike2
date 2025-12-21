<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { usersApi } from '@/api/auth'

const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  firstName: authStore.user?.firstName || '',
  lastName: authStore.user?.lastName || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loading = ref(false)
const passwordLoading = ref(false)
const errors = ref<Record<string, string>>({})
const passwordErrors = ref<Record<string, string>>({})

async function updateProfile() {
  errors.value = {}
  
  if (!form.value.firstName) errors.value.firstName = 'First name is required'
  if (!form.value.lastName) errors.value.lastName = 'Last name is required'
  if (!form.value.email) errors.value.email = 'Email is required'
  
  if (Object.keys(errors.value).length > 0) return
  
  loading.value = true
  try {
    const response = await usersApi.updateProfile(form.value)
    authStore.user = response.data
    toast.success('Profile updated successfully')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to update profile')
  } finally {
    loading.value = false
  }
}

async function updatePassword() {
  passwordErrors.value = {}
  
  if (!passwordForm.value.currentPassword) {
    passwordErrors.value.currentPassword = 'Current password is required'
  }
  if (!passwordForm.value.newPassword) {
    passwordErrors.value.newPassword = 'New password is required'
  } else if (passwordForm.value.newPassword.length < 6) {
    passwordErrors.value.newPassword = 'Password must be at least 6 characters'
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Passwords do not match'
  }
  
  if (Object.keys(passwordErrors.value).length > 0) return
  
  passwordLoading.value = true
  try {
    await usersApi.updatePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    toast.success('Password updated successfully')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to update password')
    passwordErrors.value.currentPassword = 'Invalid current password'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-secondary-900 mb-6">Profile Settings</h1>

    <!-- Personal Information -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold text-secondary-900 mb-6">Personal Information</h2>
      
      <form @submit.prevent="updateProfile" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            v-model="form.firstName"
            label="First Name"
            required
            :error="errors.firstName"
          />
          <BaseInput
            v-model="form.lastName"
            label="Last Name"
            required
            :error="errors.lastName"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            v-model="form.email"
            label="Email"
            type="email"
            required
            :error="errors.email"
          />
          <BaseInput
            v-model="form.phone"
            label="Phone"
            type="tel"
          />
        </div>

        <div class="pt-4">
          <BaseButton type="submit" :loading="loading">
            Save Changes
          </BaseButton>
        </div>
      </form>
    </div>

    <!-- Change Password -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-secondary-900 mb-6">Change Password</h2>
      
      <form @submit.prevent="updatePassword" class="space-y-4 max-w-md">
        <BaseInput
          v-model="passwordForm.currentPassword"
          label="Current Password"
          type="password"
          required
          :error="passwordErrors.currentPassword"
        />
        
        <BaseInput
          v-model="passwordForm.newPassword"
          label="New Password"
          type="password"
          required
          :error="passwordErrors.newPassword"
        />
        
        <BaseInput
          v-model="passwordForm.confirmPassword"
          label="Confirm New Password"
          type="password"
          required
          :error="passwordErrors.confirmPassword"
        />

        <div class="pt-4">
          <BaseButton type="submit" :loading="passwordLoading">
            Update Password
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>

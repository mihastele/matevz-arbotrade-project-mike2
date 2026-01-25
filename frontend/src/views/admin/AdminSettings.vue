<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { configurationApi } from '@/api/configuration'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)

const stripePublishableKey = ref('')
const stripeSecretKey = ref('')
const stripeWebhookSecret = ref('')

async function loadSettings() {
  loading.value = true
  try {
    const configs = await configurationApi.getAll()
    stripePublishableKey.value = configs['STRIPE_PUBLISHABLE_KEY'] || ''
    stripeSecretKey.value = configs['STRIPE_SECRET_KEY'] || ''
    stripeWebhookSecret.value = configs['STRIPE_WEBHOOK_SECRET'] || ''
  } catch (error) {
    toast.error('Failed to load settings')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await Promise.all([
        configurationApi.set('STRIPE_PUBLISHABLE_KEY', stripePublishableKey.value),
        configurationApi.set('STRIPE_SECRET_KEY', stripeSecretKey.value),
        configurationApi.set('STRIPE_WEBHOOK_SECRET', stripeWebhookSecret.value),
    ])
    toast.success('Settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-secondary-900">Settings</h2>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm p-6 border border-secondary-200 text-secondary-900">
      <h3 class="text-lg font-medium text-secondary-900 mb-4">Stripe Configuration</h3>
      <p class="text-sm text-secondary-500 mb-6">
        Configure your Stripe payment gateway credentials. These settings are stored in the database.
      </p>

      <form @submit.prevent="saveSettings" class="space-y-4 max-w-2xl">
        <BaseInput
          v-model="stripePublishableKey"
          label="Publishable Key"
          placeholder="pk_test_..."
        />

        <BaseInput
          v-model="stripeSecretKey"
          label="Secret Key"
          type="password"
          placeholder="sk_test_..."
        />

        <BaseInput
          v-model="stripeWebhookSecret"
          label="Webhook Secret"
          type="password"
          placeholder="whsec_..."
        />

        <div class="pt-4">
          <BaseButton :loading="saving" type="submit">
            Save Changes
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { paymentsApi } from '@/api/payments'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

const currentStep = ref(1)
const loading = ref(false)
const paymentLoading = ref(false)

// Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
let stripe: Stripe | null = null
let elements: StripeElements | null = null
const clientSecret = ref<string | null>(null)
const paymentIntentId = ref<string | null>(null)
const paymentElementMounted = ref(false)
const paymentElementContainer = ref<HTMLDivElement | null>(null)

// Form data
const shippingAddress = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'SI'
})

const billingAddress = ref({
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'SI'
})

const sameAsShipping = ref(true)
const notes = ref('')

const errors = ref<Record<string, string>>({})
const paymentError = ref('')

const countryOptions = [
  { value: 'SI', label: 'Slovenia' },
  { value: 'AT', label: 'Austria' },
  { value: 'IT', label: 'Italy' },
  { value: 'HR', label: 'Croatia' },
  { value: 'HU', label: 'Hungary' },
  { value: 'DE', label: 'Germany' },
]

const cart = computed(() => cartStore.cart)
const isEmpty = computed(() => !cart.value?.items?.length)

// Calculate total with tax (same as backend)
const totalWithTax = computed(() => {
  const subtotal = cartStore.subtotal
  const tax = subtotal * 0.22
  return subtotal + tax
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

function validateShipping(): boolean {
  errors.value = {}
  
  if (!shippingAddress.value.firstName) errors.value.firstName = 'First name is required'
  if (!shippingAddress.value.lastName) errors.value.lastName = 'Last name is required'
  if (!shippingAddress.value.email) errors.value.email = 'Email is required'
  if (!shippingAddress.value.street) errors.value.street = 'Street address is required'
  if (!shippingAddress.value.city) errors.value.city = 'City is required'
  if (!shippingAddress.value.postalCode) errors.value.postalCode = 'Postal code is required'
  if (!shippingAddress.value.country) errors.value.country = 'Country is required'

  return Object.keys(errors.value).length === 0
}

async function goToPayment() {
  if (!validateShipping()) return
  
  loading.value = true
  paymentError.value = ''
  
  try {
    // Create payment intent from cart
    const { email, ...shippingAddressData } = shippingAddress.value
    const billingAddressData = sameAsShipping.value 
      ? shippingAddressData 
      : billingAddress.value

    const checkoutData = {
      guestEmail: email,
      shippingAddress: shippingAddressData,
      billingAddress: billingAddressData,
      notes: notes.value || undefined,
    }

    const response = await paymentsApi.createCheckoutIntent(checkoutData)
    clientSecret.value = response.clientSecret
    paymentIntentId.value = response.paymentIntentId
    
    currentStep.value = 2
    
    // Mount Stripe Payment Element after step change
    await nextTick()
    await mountPaymentElement()
    
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to initialize payment')
  } finally {
    loading.value = false
  }
}

async function mountPaymentElement() {
  if (!clientSecret.value || !stripePublishableKey) {
    paymentError.value = 'Payment configuration missing'
    return
  }

  if (!stripe) {
    stripe = await loadStripe(stripePublishableKey)
  }

  if (!stripe) {
    paymentError.value = 'Failed to load payment processor'
    return
  }

  // Create elements with the client secret
  elements = stripe.elements({
    clientSecret: clientSecret.value,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#16a34a', // Match your primary green color
      },
    },
  })

  // Create and mount the Payment Element
  const paymentElement = elements.create('payment', {
    layout: 'tabs',
  })
  
  if (paymentElementContainer.value) {
    paymentElement.mount(paymentElementContainer.value)
    paymentElementMounted.value = true
  }
}

function goBack() {
  currentStep.value = 1
  paymentError.value = ''
}

async function confirmPayment() {
  if (!stripe || !elements || !clientSecret.value) {
    paymentError.value = 'Payment not initialized'
    return
  }

  paymentLoading.value = true
  paymentError.value = ''

  try {
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation?payment_intent=${paymentIntentId.value}`,
        receipt_email: shippingAddress.value.email,
      },
    })

    // If we get here, there was an error (successful payments redirect)
    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        paymentError.value = error.message || 'Payment failed'
      } else {
        paymentError.value = 'An unexpected error occurred'
      }
    }
  } catch (error) {
    paymentError.value = 'Payment processing failed'
  } finally {
    paymentLoading.value = false
  }
}

// Handle redirect back from Stripe
async function handlePaymentRedirect() {
  const paymentIntentParam = route.query.payment_intent as string
  const redirectStatus = route.query.redirect_status as string
  
  if (paymentIntentParam && redirectStatus) {
    if (redirectStatus === 'succeeded') {
      // Clear cart and redirect to confirmation
      cartStore.resetLocalCart()
      toast.success('Payment successful!')
      router.replace(`/order-confirmation?payment_intent=${paymentIntentParam}`)
    } else if (redirectStatus === 'failed') {
      // Clear cart on failure too (backend will clear via webhook)
      cartStore.resetLocalCart()
      toast.error('Payment failed. Please try again.')
      router.replace('/cart')
    }
  }
}

onMounted(async () => {
  // Check for payment redirect
  if (route.query.payment_intent) {
    await handlePaymentRedirect()
    return
  }

  if (isEmpty.value) {
    router.push('/cart')
    return
  }

  // Pre-fill from user data if logged in
  if (authStore.user) {
    shippingAddress.value.firstName = authStore.user.firstName
    shippingAddress.value.lastName = authStore.user.lastName
    shippingAddress.value.email = authStore.user.email
    shippingAddress.value.phone = authStore.user.phone || ''
  }
})
</script>

<template>
  <div class="py-8">
    <div class="container-custom">
      <h1 class="text-3xl font-bold text-secondary-900 mb-8">Checkout</h1>

      <!-- Progress Steps -->
      <div class="flex items-center justify-center mb-12">
        <div class="flex items-center">
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-medium',
              currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-600'
            ]"
          >
            1
          </div>
          <span class="ml-2 font-medium" :class="currentStep >= 1 ? 'text-primary-600' : 'text-secondary-400'">
            Shipping
          </span>
        </div>
        
        <div class="w-24 h-0.5 mx-4" :class="currentStep >= 2 ? 'bg-primary-600' : 'bg-secondary-200'"></div>
        
        <div class="flex items-center">
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-medium',
              currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-600'
            ]"
          >
            2
          </div>
          <span class="ml-2 font-medium" :class="currentStep >= 2 ? 'text-primary-600' : 'text-secondary-400'">
            Payment
          </span>
        </div>
      </div>

      <div class="lg:flex lg:gap-8">
        <!-- Form Section -->
        <div class="lg:flex-1">
          <!-- Step 1: Shipping -->
          <div v-if="currentStep === 1" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold text-secondary-900 mb-6">Shipping Information</h2>
            
            <form @submit.prevent="goToPayment" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseInput
                  v-model="shippingAddress.firstName"
                  label="First Name"
                  required
                  :error="errors.firstName"
                />
                <BaseInput
                  v-model="shippingAddress.lastName"
                  label="Last Name"
                  required
                  :error="errors.lastName"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseInput
                  v-model="shippingAddress.email"
                  label="Email"
                  type="email"
                  required
                  :error="errors.email"
                />
                <BaseInput
                  v-model="shippingAddress.phone"
                  label="Phone"
                  type="tel"
                />
              </div>

              <BaseInput
                v-model="shippingAddress.street"
                label="Street Address"
                required
                :error="errors.street"
              />

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BaseInput
                  v-model="shippingAddress.city"
                  label="City"
                  required
                  :error="errors.city"
                />
                <BaseInput
                  v-model="shippingAddress.state"
                  label="State/Region"
                />
                <BaseInput
                  v-model="shippingAddress.postalCode"
                  label="Postal Code"
                  required
                  :error="errors.postalCode"
                />
              </div>

              <BaseSelect
                v-model="shippingAddress.country"
                label="Country"
                :options="countryOptions"
                required
                :error="errors.country"
              />

              <BaseInput
                v-model="notes"
                label="Order Notes (optional)"
                placeholder="Special delivery instructions..."
              />

              <div class="pt-4">
                <BaseButton type="submit" class="w-full md:w-auto">
                  Continue to Payment
                </BaseButton>
              </div>
            </form>
          </div>

          <!-- Step 2: Payment -->
          <div v-if="currentStep === 2" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold text-secondary-900 mb-6">Payment</h2>

            <!-- Payment Error -->
            <div v-if="paymentError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-700">{{ paymentError }}</p>
            </div>

            <!-- Stripe Payment Element Container -->
            <div class="mb-6">
              <div ref="paymentElementContainer" class="min-h-[200px]">
                <!-- Stripe Payment Element will be mounted here -->
                <div v-if="!paymentElementMounted" class="flex items-center justify-center h-48">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col-reverse sm:flex-row gap-4 pt-4">
              <BaseButton variant="outline" @click="goBack" :disabled="paymentLoading">
                Back to Shipping
              </BaseButton>
              <BaseButton :loading="paymentLoading" @click="confirmPayment">
                Pay {{ formatPrice(totalWithTax) }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:w-80 mt-8 lg:mt-0">
          <div class="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 class="text-lg font-semibold text-secondary-900 mb-4">Order Summary</h2>

            <div class="space-y-4 mb-4">
              <div 
                v-for="item in cart?.items" 
                :key="item.id"
                class="flex gap-3"
              >
                <div class="w-16 h-16 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
                  <img 
                    :src="item.product.images?.[0]?.url || '/placeholder.jpg'" 
                    :alt="item.product.name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-secondary-900 line-clamp-2">
                    {{ item.product.name }}
                  </p>
                  <p class="text-sm text-secondary-500">
                    Qty: {{ item.quantity }}
                  </p>
                </div>
                <p class="text-sm font-medium">
                  {{ formatPrice(item.price * item.quantity) }}
                </p>
              </div>
            </div>

            <hr class="my-4" />

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary-600">Subtotal</span>
                <span>{{ formatPrice(cartStore.subtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary-600">Shipping</span>
                <span>Free</span>
              </div>
            </div>

            <hr class="my-4" />

            <div class="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span class="text-primary-600">{{ formatPrice(cartStore.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

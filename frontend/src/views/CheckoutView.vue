<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { ordersApi } from '@/api/orders'
import { paymentsApi } from '@/api/payments'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

const currentStep = ref(1)
const loading = ref(false)

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
const paymentMethod = ref('stripe')
const notes = ref('')

const errors = ref<Record<string, string>>({})

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

function goToPayment() {
  if (validateShipping()) {
    currentStep.value = 2
  }
}

function goBack() {
  currentStep.value = 1
}

async function placeOrder() {
  loading.value = true
  
  try {
    
    // Extract only the fields expected by the backend AddressDto
    const { email, ...shippingAddressData } = shippingAddress.value
    // billingAddress doesn't have email, so we can use it directly
    const billingAddressData = sameAsShipping.value 
      ? shippingAddressData 
      : billingAddress.value
    
    const orderData = {
      guestEmail: email, // Pass email separately for guest checkout
      shippingAddress: shippingAddressData,
      billingAddress: billingAddressData,
      notes: notes.value || undefined
    }

    const response = await ordersApi.create(orderData)
    const order = response

    if (paymentMethod.value === 'stripe') {
      // Create payment intent
      const paymentResponse = await paymentsApi.createPaymentIntent(order.id)
      const { clientSecret } = paymentResponse
      
      // In production, integrate with Stripe.js here
      // For now, redirect to a success page
      console.log('Payment intent created:', clientSecret)
      toast.success('Order placed successfully!')
      // Use resetLocalCart since backend already cleared the cart during order creation
      cartStore.resetLocalCart()
      router.push(`/order-confirmation/${order.id}`)
    } else {
      toast.success('Order placed successfully!')
      // Use resetLocalCart since backend already cleared the cart during order creation
      cartStore.resetLocalCart()
      router.push(`/order-confirmation/${order.id}`)
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to place order')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
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
            <h2 class="text-lg font-semibold text-secondary-900 mb-6">Payment Method</h2>

            <!-- Billing Address -->
            <div class="mb-6">
              <label class="flex items-center">
                <input 
                  v-model="sameAsShipping" 
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span class="ml-2 text-secondary-700">Billing address same as shipping</span>
              </label>
            </div>

            <div v-if="!sameAsShipping" class="space-y-4 mb-6 p-4 bg-secondary-50 rounded-lg">
              <h3 class="font-medium text-secondary-900">Billing Address</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseInput
                  v-model="billingAddress.firstName"
                  label="First Name"
                  required
                />
                <BaseInput
                  v-model="billingAddress.lastName"
                  label="Last Name"
                  required
                />
              </div>

              <BaseInput
                v-model="billingAddress.street"
                label="Street Address"
                required
              />

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BaseInput
                  v-model="billingAddress.city"
                  label="City"
                  required
                />
                <BaseInput
                  v-model="billingAddress.state"
                  label="State/Region"
                />
                <BaseInput
                  v-model="billingAddress.postalCode"
                  label="Postal Code"
                  required
                />
              </div>

              <BaseSelect
                v-model="billingAddress.country"
                label="Country"
                :options="countryOptions"
                required
              />
            </div>

            <!-- Payment Options -->
            <div class="space-y-3 mb-6">
              <label class="flex items-center p-4 border border-secondary-200 rounded-lg cursor-pointer hover:bg-secondary-50">
                <input 
                  v-model="paymentMethod" 
                  type="radio" 
                  value="stripe"
                  class="w-4 h-4 text-primary-600 border-secondary-300 focus:ring-primary-500"
                />
                <span class="ml-3">
                  <span class="font-medium text-secondary-900">Credit/Debit Card</span>
                  <span class="block text-sm text-secondary-500">Pay securely with Stripe</span>
                </span>
              </label>
            </div>

            <!-- Actions -->
            <div class="flex flex-col-reverse sm:flex-row gap-4 pt-4">
              <BaseButton variant="outline" @click="goBack">
                Back to Shipping
              </BaseButton>
              <BaseButton :loading="loading" @click="placeOrder">
                Place Order - {{ formatPrice(cartStore.total) }}
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

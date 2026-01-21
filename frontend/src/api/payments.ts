import api from './index'

export interface CheckoutIntentData {
  guestEmail?: string
  shippingAddress: {
    firstName: string
    lastName: string
    street: string
    street2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    street: string
    street2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
  }
  notes?: string
  shippingMethod?: string
}

export interface CheckoutIntentResponse {
  clientSecret: string
  paymentIntentId: string
  amount: number
}

export const paymentsApi = {
  createCheckoutIntent: async (data: CheckoutIntentData): Promise<CheckoutIntentResponse> => {
    const { data: response } = await api.post<CheckoutIntentResponse>('/payments/create-checkout-intent', data)
    return response
  },

  // Legacy method for existing orders
  createPaymentIntent: async (orderId: string): Promise<{ clientSecret: string }> => {
    const { data } = await api.post<{ clientSecret: string }>(`/payments/create-payment-intent/${orderId}`)
    return data
  },
}


import api from './index'

export const paymentsApi = {
  createPaymentIntent: async (orderId: string): Promise<{ clientSecret: string }> => {
    const { data } = await api.post<{ clientSecret: string }>(`/payments/create-payment-intent/${orderId}`)
    return data
  },
}

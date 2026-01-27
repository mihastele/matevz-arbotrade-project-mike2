import api from './index'

export const configurationApi = {
    async getAll(): Promise<Record<string, string>> {
        const { data } = await api.get('/configuration')
        return data
    },

    async set(key: string, value: string): Promise<void> {
        await api.post('/configuration', { key, value })
    },

    async getPublicStripeConfig(): Promise<{ publishableKey: string }> {
        const { data } = await api.get('/configuration/public/stripe')
        return data
    }
}

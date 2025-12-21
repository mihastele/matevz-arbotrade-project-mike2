import { useToastStore } from '@/stores/toast'

export function useToast() {
  const toastStore = useToastStore()

  function showToast(options: { type: 'success' | 'error' | 'warning' | 'info'; message: string; duration?: number }) {
    toastStore.addToast(options.type, options.message, options.duration)
  }

  function success(message: string, duration?: number) {
    toastStore.addToast('success', message, duration)
  }

  function error(message: string, duration?: number) {
    toastStore.addToast('error', message, duration)
  }

  function warning(message: string, duration?: number) {
    toastStore.addToast('warning', message, duration)
  }

  function info(message: string, duration?: number) {
    toastStore.addToast('info', message, duration)
  }

  return {
    showToast,
    success,
    error,
    warning,
    info,
  }
}

import { useToastStore } from '@/stores/toast'

export function useToast() {
  const toastStore = useToastStore()

  function showToast(options: { type: 'success' | 'error' | 'warning' | 'info'; message: string; duration?: number }) {
    toastStore.addToast({ type: options.type, message: options.message, duration: options.duration })
  }

  function success(message: string, duration?: number) {
    toastStore.addToast({ type: 'success', message, duration })
  }

  function error(message: string, duration?: number) {
    toastStore.addToast({ type: 'error', message, duration })
  }

  function warning(message: string, duration?: number) {
    toastStore.addToast({ type: 'warning', message, duration })
  }

  function info(message: string, duration?: number) {
    toastStore.addToast({ type: 'info', message, duration })
  }

  return {
    showToast,
    success,
    error,
    warning,
    info,
  }
}

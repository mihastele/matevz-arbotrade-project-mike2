/**
 * Utility functions for formatting dates, prices, and other data
 */

/**
 * Format a date string to the standard display format: dd.mm.yyyy HH:MM
 * @param date - ISO date string or Date object
 * @returns Formatted date string in dd.mm.yyyy HH:MM format
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return ''
  }
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Format a date string to show only date: dd.mm.yyyy
 * @param date - ISO date string or Date object
 * @returns Formatted date string in dd.mm.yyyy format
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return ''
  }
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  return `${day}.${month}.${year}`
}

/**
 * Format price in EUR currency for Slovenian locale
 * @param price - Price number
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

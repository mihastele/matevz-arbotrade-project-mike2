// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'customer' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: string
  firstName: string
  lastName: string
  street: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  type: 'billing' | 'shipping'
  isDefault: boolean
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

// Product types
export interface ProductImage {
  id: string
  url: string
  alt?: string
  type: 'image' | 'video' | 'pdf'
  sortOrder: number
  isPrimary: boolean
  isMain?: boolean
}

export interface ProductVariant {
  id: string
  name: string
  sku?: string
  price?: number
  stock: number
  attributes?: Record<string, string>
  imageUrl?: string
  isActive: boolean
}

export interface ProductDocument {
  name: string
  link: string
}

export interface Product {
  id: string
  name: string
  slug: string
  sku?: string
  gtin?: string
  shortDescription?: string
  description?: string
  price: number
  salePrice?: number
  saleStartDate?: string
  saleEndDate?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  stock: number
  lowStockThreshold: number
  outOfStockMessage?: string // Custom message when out of stock
  trackInventory: boolean
  allowBackorder: boolean
  status: 'draft' | 'published' | 'archived'
  isFeatured: boolean
  isActive?: boolean
  category?: Category
  categoryId?: string
  categories?: Category[]
  images: ProductImage[]
  variants: ProductVariant[]
  brand?: string
  attributes?: Record<string, string>
  tags?: string[]
  videoUrls?: string[]
  documents?: ProductDocument[]
  previewLinks?: string[]
  createdAt: string
  updatedAt: string
  currentPrice?: number
  inStock?: boolean
}

export interface ProductsQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  categoryIds?: string[]
  minPrice?: number
  maxPrice?: number
  status?: string
  isFeatured?: boolean
  inStock?: boolean
  brand?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  categorySlug?: string
}

// Category types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  sortOrder: number
  isActive: boolean
  parent?: Category
  parentId?: string
  children?: Category[]
  productCount?: number
  createdAt: string
  updatedAt: string
}

// Cart types
export interface CartItem {
  id: string
  productId: string
  variantId?: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
}

export interface Cart {
  id: string
  userId?: string
  guestToken?: string
  items: CartItem[]
  subtotal: number
  total?: number
  createdAt: string
  updatedAt: string
}

export interface AddToCartData {
  productId: string
  variantId?: string
  quantity: number
}

export interface UpdateCartItemData {
  quantity: number
}

// Order types
export interface OrderAddress {
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

export interface OrderItem {
  id: string
  productId?: string
  variantId?: string
  product?: Product
  productName: string
  productSku?: string
  variantName?: string
  variantAttributes?: Record<string, string>
  quantity: number
  price: number
  unitPrice: number
  total: number
  imageUrl?: string
}

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Order {
  id: string
  orderNumber: string
  userId?: string
  user?: User
  guestEmail?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  taxAmount?: number
  shippingCost: number
  discount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: string
  paymentIntentId?: string
  shippingAddress: OrderAddress
  billingAddress?: OrderAddress
  notes?: string
  trackingNumber?: string
  shippingMethod?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
}

export interface CreateOrderData {
  guestEmail?: string
  shippingAddress: OrderAddress
  billingAddress?: OrderAddress
  shippingCost?: number
  discount?: number
  notes?: string
  shippingMethod?: string
}

export interface UpdateOrderStatusData {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  trackingNumber?: string
}

// Pagination
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// Toast types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

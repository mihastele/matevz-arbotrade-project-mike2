<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { usersApi } from '@/api/users'
import { useToast } from '@/composables/useToast'
import type { User } from '@/types'

const toast = useToast()

const users = ref<User[]>([])
const loading = ref(true)
const search = ref('')
const showEditModal = ref(false)
const editingUser = ref<User | null>(null)
const savingUser = ref(false)

// Edit form data
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'customer' as 'customer' | 'admin',
})

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const query = search.value.toLowerCase()
  return users.value.filter(
    (user) =>
      user.email.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
  )
})

async function loadUsers() {
  loading.value = true
  try {
    users.value = await usersApi.getAll()
  } catch (error) {
    toast.error('Failed to load users')
  } finally {
    loading.value = false
  }
}

function openEditModal(user: User) {
  editingUser.value = user
  editForm.value = {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email,
    phone: user.phone || '',
    role: user.role as 'customer' | 'admin',
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingUser.value = null
}

async function saveUser() {
  if (!editingUser.value) return

  savingUser.value = true
  try {
    await usersApi.update(editingUser.value.id, editForm.value)
    toast.success('User updated successfully')
    closeEditModal()
    await loadUsers()
  } catch (error) {
    toast.error('Failed to update user')
  } finally {
    savingUser.value = false
  }
}

async function deleteUser(user: User) {
  if (!confirm(`Are you sure you want to delete user "${user.email}"?`)) return

  try {
    await usersApi.delete(user.id)
    users.value = users.value.filter((u) => u.id !== user.id)
    toast.success('User deleted')
  } catch (error) {
    toast.error('Failed to delete user')
  }
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('sl-SI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Users</h1>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex gap-4">
        <div class="flex-1">
          <BaseInput v-model="search" placeholder="Search users by name or email..." />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm p-6">
      <div v-for="i in 5" :key="i" class="animate-pulse flex items-center mb-4">
        <div class="w-12 h-12 bg-secondary-200 rounded-full mr-4"></div>
        <div class="flex-1">
          <div class="h-4 bg-secondary-200 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-secondary-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full divide-y divide-secondary-200">
        <thead class="bg-secondary-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
            >
              User
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
            >
              Role
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
            >
              Registered
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-secondary-200">
          <tr v-if="filteredUsers.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-secondary-500">No users found</td>
          </tr>
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-secondary-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div
                  class="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold"
                >
                  {{ (user.firstName?.[0] || user.email[0]).toUpperCase() }}
                </div>
                <div class="ml-4">
                  <p class="font-medium text-secondary-900">
                    {{ user.firstName }} {{ user.lastName }}
                  </p>
                  <p v-if="user.phone" class="text-sm text-secondary-500">{{ user.phone }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
              {{ user.email }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-secondary-100 text-secondary-800',
                ]"
              >
                {{ user.role === 'admin' ? 'Admin' : 'User' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
              {{ formatDate(user.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="openEditModal(user)"
                class="text-primary-600 hover:text-primary-900 mr-4"
              >
                Edit
              </button>
              <button @click="deleteUser(user)" class="text-red-600 hover:text-red-900">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="closeEditModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h3 class="text-lg font-semibold text-secondary-900">Edit User</h3>
            <button
              @click="closeEditModal"
              class="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveUser" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">First Name</label>
                <BaseInput v-model="editForm.firstName" />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Last Name</label>
                <BaseInput v-model="editForm.lastName" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Email</label>
              <BaseInput v-model="editForm.email" type="email" />
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
              <BaseInput v-model="editForm.phone" />
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Role</label>
              <select
                v-model="editForm.role"
                class="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <BaseButton type="button" variant="secondary" @click="closeEditModal">
                Cancel
              </BaseButton>
              <BaseButton type="submit" :loading="savingUser"> Save Changes </BaseButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

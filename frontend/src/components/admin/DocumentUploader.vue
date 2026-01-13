<script setup lang="ts">
import { ref } from 'vue'
import { uploadsApi } from '@/api/uploads'

const props = defineProps<{
  multiple?: boolean
}>()

const emit = defineEmits<{
  (e: 'uploaded', urls: string[]): void
  (e: 'error', message: string): void
}>()

const isDragging = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await uploadFiles(Array.from(files))
  }
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await uploadFiles(Array.from(target.files))
  }
}

async function uploadFiles(files: File[]) {
  const pdfFiles = files.filter(file => file.type === 'application/pdf')
  
  if (pdfFiles.length === 0) {
    emit('error', 'Please upload PDF files only')
    return
  }

  uploading.value = true
  try {
    const urls: string[] = []
    for (const file of pdfFiles) {
      const result = await uploadsApi.uploadDocument(file)
      urls.push(result.url)
    }
    emit('uploaded', urls)
  } catch (error) {
    emit('error', 'Failed to upload documents')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div
    class="relative group cursor-pointer transition-all duration-300"
    :class="[
      isDragging ? 'scale-[1.02] border-primary-500 bg-primary-50/50' : 'border-secondary-200 hover:border-primary-400 bg-secondary-50/30',
      'border-2 border-dashed rounded-2xl p-8 text-center'
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="fileInput?.click()"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :multiple="multiple"
      accept="application/pdf"
      @change="handleFileSelect"
    />

    <div class="flex flex-col items-center gap-4">
      <div 
        class="w-16 h-16 rounded-full bg-white shadow-sm border border-secondary-100 flex items-center justify-center transition-transform duration-500"
        :class="{ 'scale-110 rotate-12': isDragging, 'animate-bounce': uploading }"
      >
        <svg 
          v-if="!uploading"
          xmlns="http://www.w3.org/2000/svg" 
          class="h-8 w-8 text-primary-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <svg 
          v-else
          class="animate-spin h-8 w-8 text-primary-600" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-secondary-900 leading-snug">
          {{ uploading ? 'Uploading documents...' : 'Upload product documents' }}
        </h3>
        <p class="text-sm text-secondary-500 mt-1">
          Drag and drop your PDF files here, or click to browse
        </p>
      </div>

      <div class="flex gap-2">
        <span class="px-3 py-1 bg-white border border-secondary-200 rounded-full text-xs font-medium text-secondary-600">PDF ONLY</span>
      </div>
    </div>

    <!-- Background Decoration -->
    <div 
      class="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
    ></div>
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce {
  animation: bounce 1s infinite ease-in-out;
}
</style>

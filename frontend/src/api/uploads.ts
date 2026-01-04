import api from './index'

export interface UploadResponse {
    url: string
    filename: string
    originalname: string
    size: number
}

export const uploadsApi = {
    uploadImage: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await api.post<UploadResponse>('/uploads/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    uploadImages: async (files: File[]): Promise<UploadResponse[]> => {
        const formData = new FormData()
        files.forEach((file) => {
            formData.append('files', file)
        })
        const { data } = await api.post<UploadResponse[]>('/uploads/images', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },
}

import api from '@/lib/bizApi'

export interface Template {
  id: number
  name: string
  category: string
  version: string
  file_path: string
  file_size: number
  downloads: number
  is_public: boolean
  description?: string
  created_at?: string
  updated_at?: string
}

export const TemplatesService = {
  list: (params?: { search?: string; category?: string }) =>
    api.get<Template[]>('/templates', { params }).then(r => r.data),

  upload: (formData: FormData) =>
    api.post<Template>('/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  download: (id: number, filename: string) =>
    api.get(`/templates/${id}/download`, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = Object.assign(document.createElement('a'), { href: url, download: filename })
      a.click()
      URL.revokeObjectURL(url)
    }),

  remove: (id: number) =>
    api.delete(`/templates/${id}`).then(() => undefined),
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

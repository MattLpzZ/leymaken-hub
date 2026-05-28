import api from '@/lib/bizApi'

export interface Task {
  id: number
  project_id: number
  title: string
  status: 'todo' | 'doing' | 'done'
  description?: string
  order: number
}

export interface Project {
  id: number
  name: string
  client_id?: number
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  budget?: number
  deadline?: string
  description?: string
  tasks?: Task[]
}

export interface TimeEntry {
  id: number
  project_id?: number
  project?: Project
  description: string
  hours: number
  date: string
  billable: boolean
  hourly_rate: number
  started_at?: string
  stopped_at?: string
}

export const ProjectsService = {
  list: () =>
    api.get<Project[]>('/projects').then((r) => r.data),

  create: (data: Partial<Project>) =>
    api.post<Project>('/projects', data).then((r) => r.data),

  update: (id: number, data: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/projects/${id}`),

  createTask: (projectId: number, data: Partial<Task>) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),

  updateTaskStatus: (taskId: number, status: Task['status']) =>
    api.patch<Task>(`/tasks/${taskId}/status`, { status }).then((r) => r.data),

  deleteTask: (taskId: number) =>
    api.delete(`/tasks/${taskId}`),
}

export const TimeEntriesService = {
  list: (params?: { project_id?: number; billable?: boolean }) =>
    api.get<TimeEntry[]>('/time-entries', { params }).then((r) => r.data),

  create: (data: Partial<TimeEntry>) =>
    api.post<TimeEntry>('/time-entries', data).then((r) => r.data),

  stop: (data: { project_id?: number; description: string; started_at: string; billable?: boolean }) =>
    api.post<TimeEntry>('/time-entries/stop', data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/time-entries/${id}`),
}

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Task, Idea, Link, CreateTaskInput, UpdateTaskInput, CreateIdeaInput, UpdateIdeaInput, CreateLinkInput, UpdateLinkInput, TaskStatus } from '@/types'

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task | null>
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>
  moveTaskToDate: (id: string, date: string) => Promise<void>
}

interface IdeaState {
  ideas: Idea[]
  loading: boolean
  error: string | null
  fetchIdeas: () => Promise<void>
  createIdea: (input: CreateIdeaInput) => Promise<Idea | null>
  updateIdea: (id: string, input: UpdateIdeaInput) => Promise<void>
  deleteIdea: (id: string) => Promise<void>
  convertIdeaToTask: (id: string) => Promise<Task | null>
}

interface LinkState {
  links: Link[]
  loading: boolean
  error: string | null
  fetchLinks: () => Promise<void>
  createLink: (input: CreateLinkInput) => Promise<Link | null>
  updateLink: (id: string, input: UpdateLinkInput) => Promise<void>
  deleteLink: (id: string) => Promise<void>
}

type AppStore = TaskState & IdeaState & {
  links: Link[]
  linkLoading: boolean
  linkError: string | null
  fetchLinks: () => Promise<void>
  createLink: (input: CreateLinkInput) => Promise<Link | null>
  updateLink: (id: string, input: UpdateLinkInput) => Promise<void>
  deleteLink: (id: string) => Promise<void>
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error ?? 'API-Fehler')
  }
  return json.data ?? json
}

export const useTaskStore = create<TaskState>()(
  immer((set, get) => ({
    tasks: [],
    loading: false,
    error: null,

    fetchTasks: async () => {
      set((state) => { state.loading = true; state.error = null })
      try {
        const tasks = await apiFetch<Task[]>('/api/tasks')
        set((state) => { state.tasks = tasks; state.loading = false })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Fehler beim Laden'
          state.loading = false
        })
      }
    },

    createTask: async (input) => {
      try {
        const task = await apiFetch<Task>('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        set((state) => { state.tasks.push(task) })
        return task
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Erstellen' })
        return null
      }
    },

    updateTask: async (id, input) => {
      try {
        const task = await apiFetch<Task>(`/api/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        })
        set((state) => {
          const idx = state.tasks.findIndex((t) => t.id === id)
          if (idx !== -1) state.tasks[idx] = task
        })
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Aktualisieren' })
      }
    },

    deleteTask: async (id) => {
      try {
        await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' })
        set((state) => { state.tasks = state.tasks.filter((t) => t.id !== id) })
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Löschen' })
      }
    },

    toggleTask: async (id) => {
      const task = get().tasks.find((t) => t.id === id)
      if (!task) return
      const currentStatus: TaskStatus = task.status ?? (task.completed ? 'done' : 'todo')
      const isDone = currentStatus === 'done' || currentStatus === 'cancelled'
      const newStatus: TaskStatus = isDone ? 'todo' : 'done'
      await get().updateTask(id, { completed: !isDone, status: newStatus })
    },

    updateTaskStatus: async (id, status) => {
      const isDone = status === 'done' || status === 'cancelled'
      await get().updateTask(id, { status, completed: isDone })
    },

    moveTaskToDate: async (id, date) => {
      await get().updateTask(id, { due_date: date })
    },
  }))
)

export const useIdeaStore = create<IdeaState>()(
  immer((set) => ({
    ideas: [],
    loading: false,
    error: null,

    fetchIdeas: async () => {
      set((state) => { state.loading = true; state.error = null })
      try {
        const ideas = await apiFetch<Idea[]>('/api/ideas')
        set((state) => { state.ideas = ideas; state.loading = false })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Fehler beim Laden'
          state.loading = false
        })
      }
    },

    createIdea: async (input) => {
      try {
        const idea = await apiFetch<Idea>('/api/ideas', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        set((state) => { state.ideas.unshift(idea) })
        return idea
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Erstellen' })
        return null
      }
    },

    updateIdea: async (id, input) => {
      try {
        const idea = await apiFetch<Idea>(`/api/ideas/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        })
        set((state) => {
          const idx = state.ideas.findIndex((i) => i.id === id)
          if (idx !== -1) state.ideas[idx] = idea
        })
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Aktualisieren' })
      }
    },

    deleteIdea: async (id) => {
      try {
        await apiFetch(`/api/ideas/${id}`, { method: 'DELETE' })
        set((state) => { state.ideas = state.ideas.filter((i) => i.id !== id) })
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Löschen' })
      }
    },

    convertIdeaToTask: async (id) => {
      try {
        const task = await apiFetch<Task>(`/api/ideas/${id}/convert`, { method: 'POST' })
        return task
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Konvertieren' })
        return null
      }
    },
  }))
)

export const useLinkStore = create<LinkState>()(
  immer((set) => ({
    links: [],
    loading: false,
    error: null,

    fetchLinks: async () => {
      set((state) => { state.loading = true; state.error = null })
      try {
        const links = await apiFetch<Link[]>('/api/links')
        set((state) => { state.links = links; state.loading = false })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Fehler beim Laden'
          state.loading = false
        })
      }
    },

    createLink: async (input) => {
      try {
        const link = await apiFetch<Link>('/api/links', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        set((state) => { state.links.unshift(link) })
        return link
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Erstellen' })
        return null
      }
    },

    updateLink: async (id, input) => {
      try {
        const link = await apiFetch<Link>(`/api/links/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        })
        set((state) => {
          const idx = state.links.findIndex((l) => l.id === id)
          if (idx !== -1) state.links[idx] = link
        })
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Aktualisieren' })
      }
    },

    deleteLink: async (id) => {
      try {
        await apiFetch(`/api/links/${id}`, { method: 'DELETE' })
        set((state) => { state.links = state.links.filter((l) => l.id !== id) })
      } catch (err) {
        set((state) => { state.error = err instanceof Error ? err.message : 'Fehler beim Löschen' })
      }
    },
  }))
)

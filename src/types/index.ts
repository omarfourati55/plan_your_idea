export type Priority = 'high' | 'medium' | 'low'
export type RecurringType = 'daily' | 'weekly' | 'custom' | null
export type ReadStatus = 'unread' | 'read' | 'later'
export type IdeaColor = 'default' | 'red' | 'yellow' | 'green' | 'blue' | 'purple'
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done' | 'cancelled'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  priority: Priority
  status: TaskStatus
  tags: string[]
  completed: boolean
  completed_at: string | null
  recurring: RecurringType
  parent_id: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface Subtask {
  id: string
  task_id: string
  user_id: string
  title: string
  completed: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface Idea {
  id: string
  user_id: string
  title: string
  content: string
  color: IdeaColor
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Link {
  id: string
  user_id: string
  url: string
  title: string | null
  description: string | null
  image: string | null
  favicon: string | null
  status: ReadStatus
  tags: string[]
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  timezone: string
  dark_mode: 'system' | 'light' | 'dark'
  ai_enabled: boolean
  notifications_enabled: boolean
  daily_briefing_time: string
  created_at: string
  updated_at: string
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  due_date?: string | null
  due_time?: string | null
  priority?: Priority
  tags?: string[]
  recurring?: RecurringType
  parent_id?: string
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completed?: boolean
  position?: number
  status?: TaskStatus
}

export interface CreateIdeaInput {
  title: string
  content?: string
  color?: IdeaColor
  tags?: string[]
}

export interface UpdateIdeaInput extends Partial<CreateIdeaInput> {}

export interface CreateLinkInput {
  url: string
  tags?: string[]
}

export interface UpdateLinkInput {
  title?: string
  description?: string
  status?: ReadStatus
  tags?: string[]
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

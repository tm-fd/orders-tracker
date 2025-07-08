import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export enum TodoStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TodoPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  due_date?: Date;
  reminder_time?: Date;
  completed_at?: Date;
  created_by: string;
  assigned_to?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  is_private?: boolean;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  priority?: TodoPriority;
  due_date?: string;
  reminder_time?: string;
  assigned_to?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  is_private?: boolean;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  reminder_time?: string;
  assigned_to?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  is_private?: boolean;
}

export interface TodoQueryDto {
  limit?: string;
  offset?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  created_by?: string;
  assigned_to?: string;
  due_after?: string;
  due_before?: string;
  tags?: string;
  search?: string;
  overdue_only?: string;
  sort_by?: string;
  sort_order?: string;
  due_after?: string;
  due_before?: string;
  userId?: string;
}

export interface TodoStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TodoStore {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  stats: TodoStats;
  adminUsers: AdminUser[];
  activeFilters: {
    todoIds?: number[];
  };

  // Actions
  fetchTodos: (query?: TodoQueryDto, userId: string) => Promise<void>;
  createTodo: (todo: CreateTodoDto & { userId: string } & { role: string }) => Promise<Todo>;
  updateTodo: (
    id: number,
    todo: UpdateTodoDto,
    userId: string,
    userRole: string,
  ) => Promise<Todo>;
  deleteTodo: (id: number, userId: string) => Promise<void>;
  getTodo: (id: number, userId: string) => Promise<Todo>;
  getStats: (userId?: string) => Promise<void>;
  clearError: () => void;
  fetchAdminUsers: (userId?: string) => Promise<void>;
  setActiveFilters: (filters: { todoIds?: number[] }) => void;
  clearActiveFilters: () => void;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: [],
      loading: false,
      error: null,
      stats: {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
      },
      adminUsers: [],
      activeFilters: {
        todoIds: undefined,
      },

      fetchAdminUsers: async (userId: string) => {
        try {
          const response = await axios.get(
            `${process.env.CLOUDRUN_DEV_URL}/auth_admin/admin-users`,
            {
              headers: {
                Authorization: `Bearer ${userId}`,
              },
            }
          );
          set({ adminUsers: response.data.data });
        } catch (error) {
          console.error("Failed to fetch admin users:", error);
          set({ adminUsers: [] });
        }
      },

      fetchTodos: async (query?: TodoQueryDto, userId: string) => {
        try {
          set({ loading: true, error: null });
          const response = await axios.get(
            `${process.env.CLOUDRUN_DEV_URL}/todos`,
            {
              headers: {
                Authorization: `Bearer ${userId}`,
              },
            },
            { params: query }
          );
          set({ todos: response.data, loading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || "Failed to fetch todos",
            loading: false,
          });
        }
      },

      createTodo: async (todo: CreateTodoDto & { userId: string } & { role: string }) => {
        try {
          const { userId, role, ...todoData } = todo;

          if (!userId) {
            throw new Error("User not authenticated");
          }

          set({ loading: true, error: null });
          const response = await axios.post(
            `${process.env.CLOUDRUN_DEV_URL}/todos`,
            todoData,
            {
              headers: {
                Authorization: `Bearer ${userId}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Add the new todo to the list
          set((state) => ({
            todos: [response.data, ...state.todos],
            loading: false,
          }));

          // Refresh stats
          await get().getStats(userId);

          return response.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Failed to create todo";
          set({ error: errorMessage, loading: false });
          // throw new Error(errorMessage);
          throw error;
        }
      },

      updateTodo: async (id: number, todo: UpdateTodoDto, userId: string, userRole: string) => {
        try {
          if (!userId) {
            throw new Error("User not authenticated");
          }

          set({ loading: true, error: null });
          const response = await axios.patch(
            `${process.env.CLOUDRUN_DEV_URL}/todos/${id}`,
            todo,
            {
              headers: {
                Authorization: `Bearer ${userId}`,
              },
            }
          );

          // Update the todo in the list
          set((state) => ({
            todos: state.todos.map((t) => (t.id === id ? response.data : t)),
            loading: false,
          }));

          // Refresh stats
          await get().getStats(userId);

          return response.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Failed to update todo";
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      deleteTodo: async (id: number, userId: string) => {
        try {
          if (!userId) {
            throw new Error("User not authenticated");
          }

          set({ loading: true, error: null });
          await axios.delete(`${process.env.CLOUDRUN_DEV_URL}/todos/${id}`, {
            headers: {
              Authorization: `Bearer ${userId}`,
            },
          });

          // Remove the todo from the list
          set((state) => ({
            todos: state.todos.filter((t) => t.id !== id),
            loading: false,
          }));

          // Refresh stats
          await get().getStats(userId);
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Failed to delete todo";
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      getTodo: async (id: number, userId: string) => {
        try {
          set({ loading: true, error: null });
          const response = await axios.get(
            `${process.env.CLOUDRUN_DEV_URL}/todos/${id}`,
            {
              headers: {
                Authorization: `Bearer ${userId}`,
              },
            }
          );
          set({ loading: false });
          return response.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Failed to fetch todo";
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      getStats: async (userId?: string) => {
        try {
          if (!userId) {
            throw new Error("User not authenticated");
          }

          const params = userId ? { user_id: userId } : {};
          const response = await axios.get(
            `${process.env.CLOUDRUN_DEV_URL}/todos/stats`,
            {
              params: { userId },
              headers: {
                Authorization: `Bearer ${userId}`,
              },
            }
          );

          set({ stats: response.data });
        } catch (error: any) {
          console.error("Failed to get todo stats:", error);
          set({
            stats: {
              total: 0,
              pending: 0,
              inProgress: 0,
              completed: 0,
              overdue: 0,
            },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setActiveFilters: (filters) => set((state) => ({
        activeFilters: {
          ...state.activeFilters,
          ...filters,
        }
      })),
      
      clearActiveFilters: () => set((state) => ({
        activeFilters: {
          todoIds: undefined,
        }
      })),
    }),
    {
      name: "todos-storage",
      partialize: (state) => ({
        todos: state.todos,
        stats: state.stats,
        adminUsers: state.adminUsers,
        activeFilters: state.activeFilters,
      }),
    }
  )
);

"use client";

/**
 * Custom hooks for API interactions
 * Provides React Query hooks for all SmartTodos API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  apiClient, 
  API_ENDPOINTS,
  type TaskResponse,
  type TaskDetailResponse,
  type CategoryResponse,
  type TagResponse,
  type ContextEntryResponse,
  type DashboardStatsResponse,
  type ContextProcessingStatsResponse,
  type AIAnalysisResponse,
  type AIContextAnalysisResponse,
  type AICapabilitiesResponse,
  type TaskCreateRequest,
  type TaskCreateWithAIRequest,
  type ContextCreateRequest,
  type AITaskAnalysisRequest,
  type AIContextAnalysisRequest
} from '@shared/api';

// Query keys for cache management
export const queryKeys = {
  tasks: ['tasks'] as const,
  taskDetail: (id: string) => ['tasks', id] as const,
  taskStats: ['tasks', 'stats'] as const,
  taskUpcoming: ['tasks', 'upcoming'] as const,
  categories: ['categories'] as const,
  tags: ['tags'] as const,
  tagSuggestions: ['tags', 'suggestions'] as const,
  context: ['context'] as const,
  contextStats: ['context', 'stats'] as const,
  contextInsights: ['context', 'insights'] as const,
  aiCapabilities: ['ai', 'capabilities'] as const,
  aiJobs: ['ai', 'jobs'] as const,
  aiInsights: ['ai', 'insights'] as const,
} as const;

// Task hooks
export const useTasks = (params?: Record<string, any>) => {
  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  
  return useQuery({
    queryKey: [...queryKeys.tasks, params],
    queryFn: () => apiClient.get<{results: TaskResponse[]}>(API_ENDPOINTS.tasks + queryParams),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTaskDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.taskDetail(id),
    queryFn: () => apiClient.get<TaskDetailResponse>(API_ENDPOINTS.taskDetail(id)),
    enabled: !!id,
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: queryKeys.taskStats,
    queryFn: () => apiClient.get<DashboardStatsResponse>(API_ENDPOINTS.taskStats),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useUpcomingTasks = () => {
  return useQuery({
    queryKey: queryKeys.taskUpcoming,
    queryFn: () => apiClient.get<TaskResponse[]>(API_ENDPOINTS.taskUpcoming),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TaskCreateRequest) => 
      apiClient.post<TaskDetailResponse>(API_ENDPOINTS.tasks, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskStats });
    },
  });
};

export const useCreateTaskWithAI = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TaskCreateWithAIRequest) => 
      apiClient.post<TaskDetailResponse>(API_ENDPOINTS.taskCreateWithAI, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskStats });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskCreateRequest> }) =>
      apiClient.put<TaskDetailResponse>(API_ENDPOINTS.taskDetail(id), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskStats });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ENDPOINTS.taskDetail(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskStats });
    },
  });
};

// Category hooks
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiClient.get<{results: CategoryResponse[]}>(API_ENDPOINTS.categories),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; color: string; description?: string }) =>
      apiClient.post<CategoryResponse>(API_ENDPOINTS.categories, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
};

// Tag hooks
export const useTags = () => {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => apiClient.get<{results: TagResponse[]}>(API_ENDPOINTS.tags),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useTagSuggestions = () => {
  return useQuery({
    queryKey: queryKeys.tagSuggestions,
    queryFn: () => apiClient.get<TagResponse[]>(API_ENDPOINTS.tagSuggestions),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Context hooks
export const useContext = (params?: Record<string, any>) => {
  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  
  return useQuery({
    queryKey: [...queryKeys.context, params],
    queryFn: () => apiClient.get<{results: ContextEntryResponse[]}>(API_ENDPOINTS.context + queryParams),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useContextStats = () => {
  return useQuery({
    queryKey: queryKeys.contextStats,
    queryFn: () => apiClient.get<ContextProcessingStatsResponse>(API_ENDPOINTS.contextStats),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useContextInsights = () => {
  return useQuery({
    queryKey: queryKeys.contextInsights,
    queryFn: () => apiClient.get<any[]>(API_ENDPOINTS.contextInsights),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateContext = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ContextCreateRequest) =>
      apiClient.post<ContextEntryResponse>(API_ENDPOINTS.context, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.context });
      queryClient.invalidateQueries({ queryKey: queryKeys.contextStats });
      // Optionally trigger task refresh if context might affect recommendations
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
};

// AI Analysis hooks
export const useAICapabilities = () => {
  return useQuery({
    queryKey: queryKeys.aiCapabilities,
    queryFn: () => apiClient.get<AICapabilitiesResponse>(API_ENDPOINTS.aiCapabilities),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useAnalyzeTask = () => {
  return useMutation({
    mutationFn: (data: AITaskAnalysisRequest) =>
      apiClient.post<AIAnalysisResponse>(API_ENDPOINTS.aiAnalyzeTask, data),
  });
};

export const useAnalyzeContext = () => {
  return useMutation({
    mutationFn: (data: AIContextAnalysisRequest) =>
      apiClient.post<AIContextAnalysisResponse>(API_ENDPOINTS.aiAnalyzeContext, data),
  });
};

export const useAsyncAnalyzeTask = () => {
  return useMutation({
    mutationFn: (taskId: string) =>
      apiClient.post<{status: string; job_id: string; message: string}>(
        API_ENDPOINTS.aiAsyncAnalyzeTask,
        { task_id: taskId }
      ),
  });
};

// Bulk operations
export const useBulkTaskAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      task_ids: string[];
      action: string;
      [key: string]: any;
    }) => apiClient.post(API_ENDPOINTS.taskBulkAction, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskStats });
    },
  });
};

// Error boundary for API hooks
export const useApiError = () => {
  return {
    handleError: (error: any) => {
      console.error('API Error:', error);
      
      // Handle specific error types
      if (error.message?.includes('401')) {
        // Handle unauthorized
        window.location.href = '/login';
      } else if (error.message?.includes('403')) {
        // Handle forbidden
        console.warn('Access denied');
      } else if (error.message?.includes('429')) {
        // Handle rate limiting
        console.warn('Rate limit exceeded');
      }
    }
  };
};

// Optimistic updates helper
export const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();
  
  return {
    updateTaskStatus: (taskId: string, newStatus: string) => {
      queryClient.setQueryData(queryKeys.taskDetail(taskId), (old: any) => {
        if (!old) return old;
        return { ...old, status: newStatus };
      });
    },
    
    updateTaskPriority: (taskId: string, newPriority: string) => {
      queryClient.setQueryData(queryKeys.taskDetail(taskId), (old: any) => {
        if (!old) return old;
        return { ...old, priority: newPriority };
      });
    }
  };
};

// Real-time updates (for future WebSocket integration)
export const useRealTimeUpdates = () => {
  const queryClient = useQueryClient();
  
  return {
    onTaskUpdate: (taskId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
    
    onContextProcessed: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.context });
      queryClient.invalidateQueries({ queryKey: queryKeys.contextStats });
    },
    
    onAIProcessingComplete: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiInsights });
    }
  };
};

// Simple imperative API helper for components that prefer direct get/post calls
export const useApi = () => {
  return {
    get: <T,>(endpoint: string) => apiClient.get<T>(endpoint),
    post: <T,>(endpoint: string, data: any) => apiClient.post<T>(endpoint, data),
    put: <T,>(endpoint: string, data: any) => apiClient.put<T>(endpoint, data),
    delete: (endpoint: string) => apiClient.delete(endpoint),
  };
};

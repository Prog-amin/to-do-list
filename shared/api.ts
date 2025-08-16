export interface DemoResponse {
  message: string;
}

// API Base URL - use Next.js API routes
export const API_BASE_URL = "/api";

// Always use real API since we now have Next.js API routes
const isFrontendOnly = false;

// API Endpoints
export const API_ENDPOINTS = {
  // Tasks
  tasks: "/tasks",
  taskDetail: (id: string) => `/tasks/${id}`,
  taskStats: "/tasks/dashboard_stats",
  taskUpcoming: "/tasks/upcoming_deadlines",
  taskBulkAction: "/tasks/bulk_action",
  taskCreateWithAI: "/tasks/create_with_ai",

  // Categories
  categories: "/tasks/categories",
  categoriesPopular: "/tasks/categories/popular",

  // Tags
  tags: "/tasks/tags",
  tagSuggestions: "/tasks/tags/suggestions",

  // Context
  context: "/tasks/context",
  contextStats: "/tasks/context/processing_stats",
  contextInsights: "/tasks/context/recent_insights",
  contextReprocess: (id: string) => `/tasks/context/${id}/reprocess`,

  // AI Analysis
  aiAnalyzeTask: "/ai/analyze/analyze_task",
  aiAnalyzeContext: "/ai/analyze/analyze_context",
  aiAsyncAnalyzeTask: "/ai/analyze/async_analyze_task",
  aiAsyncAnalyzeContext: "/ai/analyze/async_analyze_context",
  aiCapabilities: "/ai/analyze/capabilities",
  // Top-level AI convenience endpoints
  aiSuggestions: "/ai/suggestions",
  aiPrioritize: "/ai/prioritize",
  aiSuggestDeadline: "/ai/suggest-deadline",
  aiEnhanceDescription: "/ai/enhance-description",

  // AI Configuration
  aiConfig: "/ai/config",

  // AI Jobs
  aiJobs: "/ai/jobs",
  aiJobsRecent: "/ai/jobs/recent",
  aiJobsStats: "/ai/jobs/stats",

  // AI Insights
  aiInsights: "/ai/insights",
  aiInsightsUnread: "/ai/insights/unread",
  aiInsightsActionable: "/ai/insights/actionable",

  // Productivity Metrics
  metrics: "/tasks/metrics",
  metricsWeekly: "/tasks/metrics/weekly_summary",
} as const;

// Mock data for frontend-only environment
const mockData = {
  taskStats: {
    total_tasks: 24,
    completed_tasks: 18,
    urgent_tasks: 3,
    overdue_tasks: 2,
    todays_due_tasks: 5,
    in_progress_tasks: 3,
    avg_ai_score: 78.5,
  },
  tasks: {
    results: [
      {
        id: "1",
        title: "Complete Q4 project proposal",
        description:
          "Finalize the quarterly project proposal with budget estimates and timeline",
        category_name: "Work",
        category_color: "#3B82F6",
        tag_names: ["urgent", "deadline"],
        priority: "high" as const,
        status: "in_progress" as const,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_duration: 180,
        ai_priority_score: 92.5,
        is_overdue: false,
        completion_percentage: 50,
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        title: "Review team performance reports",
        description:
          "Go through quarterly performance reports and prepare feedback",
        category_name: "Work",
        category_color: "#3B82F6",
        tag_names: ["review", "team"],
        priority: "medium" as const,
        status: "todo" as const,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_duration: 120,
        ai_priority_score: 70.8,
        is_overdue: false,
        completion_percentage: 0,
        created_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: "3",
        title: "Doctor appointment checkup",
        description: "Annual health checkup with Dr. Smith",
        category_name: "Health",
        category_color: "#EF4444",
        tag_names: ["health", "appointment"],
        priority: "urgent" as const,
        status: "todo" as const,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_duration: 60,
        ai_priority_score: 95.0,
        is_overdue: false,
        completion_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        title: "Plan weekend hiking trip",
        description: "Research hiking trails and plan weekend outdoor activity",
        category_name: "Personal",
        category_color: "#10B981",
        tag_names: ["leisure", "outdoor"],
        priority: "low" as const,
        status: "todo" as const,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_duration: 90,
        ai_priority_score: 45.2,
        is_overdue: false,
        completion_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  categories: {
    results: [
      {
        id: "1",
        name: "Work",
        color: "#3B82F6",
        description: "Work-related tasks",
        usage_count: 15,
        created_by: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Personal",
        color: "#10B981",
        description: "Personal tasks",
        usage_count: 8,
        created_by: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Health",
        color: "#EF4444",
        description: "Health tasks",
        usage_count: 5,
        created_by: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Learning",
        color: "#8B5CF6",
        description: "Learning tasks",
        usage_count: 3,
        created_by: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  tags: {
    results: [
      {
        id: "1",
        name: "urgent",
        usage_count: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "deadline",
        usage_count: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "important",
        usage_count: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        name: "review",
        usage_count: 6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  context: {
    results: [
      {
        id: "1",
        content:
          "Client called about Q4 proposal - deadline moved up by 2 weeks",
        source: "email" as const,
        user_name: "Demo User",
        processed: true,
        ai_insights: ["deadline_change", "high_urgency"],
        extracted_keywords: ["deadline", "urgent", "project"],
        sentiment_score: -0.2,
        sentiment_label: "negative" as const,
        urgency_score: 0.9,
        word_count: 12,
        generated_task_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  contextStats: {
    total_entries: 15,
    processed_entries: 12,
    pending_entries: 3,
    avg_sentiment: 0.15,
    avg_urgency: 0.62,
    source_distribution: {
      email: 8,
      whatsapp: 4,
      notes: 2,
      manual: 1,
    },
  },
};

// Response types matching Django serializers
export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  category_name?: string;
  category_color?: string;
  tag_names: string[];
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed";
  deadline?: string;
  estimated_duration: number;
  ai_priority_score: number;
  is_overdue: boolean;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDetailResponse extends TaskResponse {
  category?: CategoryResponse;
  category_id?: string;
  tags: TagResponse[];
  tag_ids?: string[];
  comments: TaskCommentResponse[];
  user_name: string;
  ai_confidence_score: number;
  ai_reasoning: string;
  ai_enhanced_description: string;
  ai_suggested_tags: string[];
  ai_suggestions: {
    suggested_priority: string;
    suggested_category?: string;
    suggested_tags: string[];
    confidence_score: number;
    reasoning: string;
  };
  actual_duration?: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  color: string;
  description: string;
  usage_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TagResponse {
  id: string;
  name: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContextEntryResponse {
  id: string;
  content: string;
  source: "whatsapp" | "email" | "notes" | "manual" | "calendar" | "meeting";
  user_name: string;
  processed: boolean;
  ai_insights: string[];
  extracted_keywords: string[];
  sentiment_score: number;
  sentiment_label: "positive" | "negative" | "neutral";
  urgency_score: number;
  word_count: number;
  generated_task_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCommentResponse {
  id: string;
  content: string;
  user_name: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStatsResponse {
  total_tasks: number;
  completed_tasks: number;
  urgent_tasks: number;
  overdue_tasks: number;
  todays_due_tasks: number;
  in_progress_tasks: number;
  avg_ai_score: number;
}

export interface ContextProcessingStatsResponse {
  total_entries: number;
  processed_entries: number;
  pending_entries: number;
  avg_sentiment: number;
  avg_urgency: number;
  source_distribution: Record<string, number>;
}

export interface AIAnalysisResponse {
  suggested_category: string;
  suggested_priority: string;
  suggested_deadline?: string;
  enhanced_description: string;
  suggested_tags: string[];
  reasoning: string;
  confidence_score: number;
  analysis_timestamp: string;
}

export interface AIContextAnalysisResponse {
  insight_type: string;
  message: string;
  confidence: number;
  keywords: string[];
  urgency_score: number;
  sentiment_score: number;
  analysis_timestamp: string;
}

export interface AICapabilitiesResponse {
  ai_enabled: boolean;
  features: {
    task_prioritization: boolean;
    context_analysis: boolean;
    deadline_suggestions: boolean;
    smart_categorization: boolean;
    productivity_insights: boolean;
    keyword_extraction: boolean;
    sentiment_analysis: boolean;
  };
  model_info: {
    name: string;
    version: string;
    capabilities: string[];
  };
}

// Request types
export interface TaskCreateRequest {
  title: string;
  description?: string;
  category_id?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  deadline?: string;
  estimated_duration?: number;
  tag_ids?: string[];
}

export interface TaskCreateWithAIRequest extends TaskCreateRequest {
  use_ai_suggestions?: boolean;
  context_aware?: boolean;
}

export interface ContextCreateRequest {
  content: string;
  source: "whatsapp" | "email" | "notes" | "manual" | "calendar" | "meeting";
}

export interface AITaskAnalysisRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  include_context?: boolean;
  user_preferences?: Record<string, any>;
}

export interface AIContextAnalysisRequest {
  content: string;
  source?: string;
  extract_tasks?: boolean;
  analyze_sentiment?: boolean;
}

// Utility functions for API calls
export const buildUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

export const getAuthHeaders = (): HeadersInit => {
  return {
    "Content-Type": "application/json",
    // Add CSRF token if available
    ...(typeof window !== "undefined" && window.document
      ? {
          "X-CSRFToken": getCSRFToken(),
        }
      : {}),
  };
};

const getCSRFToken = (): string => {
  const name = "csrftoken";
  let cookieValue = "";
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Mock data provider for when backend is unavailable
const getMockData = (endpoint: string): any => {
  if (endpoint.includes("/tasks/tasks/dashboard_stats/")) {
    return mockData.taskStats;
  }
  if (endpoint.includes("/tasks/tasks/")) {
    return mockData.tasks;
  }
  if (endpoint.includes("/tasks/categories/")) {
    return mockData.categories;
  }
  if (endpoint.includes("/tasks/tags/")) {
    return mockData.tags;
  }
  if (endpoint.includes("/tasks/context/processing_stats/")) {
    return mockData.contextStats;
  }
  if (endpoint.includes("/tasks/context/")) {
    return mockData.context;
  }

  // Default response
  return { results: [], count: 0 };
};

// API client functions with fallback for frontend-only environment
export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // If we're in a frontend-only environment or backend is unavailable,
      // return mock data instead of failing
      if (
        isFrontendOnly ||
        (error as Error).message.includes("Failed to fetch")
      ) {
        console.warn(`Backend unavailable, using mock data for: ${endpoint}`);
        return getMockData(endpoint) as T;
      }
      throw error;
    }
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // For POST requests in frontend-only mode, simulate success
      if (
        isFrontendOnly ||
        (error as Error).message.includes("Failed to fetch")
      ) {
        console.warn(
          `Backend unavailable, simulating POST success for: ${endpoint}`,
        );

        // Simulate task creation
        if (endpoint.includes("/tasks/tasks/")) {
          const newTask = {
            id: Math.random().toString(36).substr(2, 9),
            ...data,
            ai_priority_score: Math.random() * 100,
            is_overdue: false,
            completion_percentage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category_name: data.category_id ? "Work" : undefined,
            category_color: data.category_id ? "#3B82F6" : undefined,
            tag_names: [],
          };
          return newTask as T;
        }

        // Default success response
        return { id: "mock-" + Date.now(), ...data } as T;
      }
      throw error;
    }
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (
        isFrontendOnly ||
        (error as Error).message.includes("Failed to fetch")
      ) {
        console.warn(
          `Backend unavailable, simulating PUT success for: ${endpoint}`,
        );
        return { ...data, updated_at: new Date().toISOString() } as T;
      }
      throw error;
    }
  },

  async delete(endpoint: string): Promise<void> {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (
        isFrontendOnly ||
        (error as Error).message.includes("Failed to fetch")
      ) {
        console.warn(
          `Backend unavailable, simulating DELETE success for: ${endpoint}`,
        );
        return;
      }
      throw error;
    }
  },
};

// Export default demo response for backward compatibility
export const demoResponse: DemoResponse = {
  message: "Hello from SmartTodos API!",
};

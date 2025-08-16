export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed';
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  aiScore?: number;
  tags: string[];
  estimatedDuration?: number; // in minutes
}

export interface ContextEntry {
  id: string;
  content: string;
  source: 'whatsapp' | 'email' | 'notes' | 'manual';
  timestamp: Date;
  processed: boolean;
  insights?: string[];
  relatedTasks?: string[]; // task IDs
}

export interface Category {
  id: string;
  name: string;
  color: string;
  usageCount: number;
}

export interface AITaskSuggestion {
  suggestedCategory: string;
  suggestedPriority: Task['priority'];
  suggestedDeadline: Date;
  enhancedDescription: string;
  suggestedTags: string[];
  reasoning: string;
  confidenceScore: number;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  urgentTasks: number;
  todaysDueTasks: number;
  productivityScore: number;
}

export interface ContextInsight {
  type: 'deadline' | 'priority' | 'category' | 'reminder';
  message: string;
  relatedContext: string;
  confidence: number;
}

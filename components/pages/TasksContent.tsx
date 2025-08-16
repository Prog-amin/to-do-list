"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDialog } from "@/components/ui/task-dialog";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { format } from "date-fns";
import {
  Plus,
  Brain,
  Sparkles,
  Clock,
  Target,
  Edit,
  Trash2,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import {
  useTasks,
  useCategories,
  useDeleteTask,
  useUpdateTask,
} from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import type { TaskResponse } from "@shared/api";

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function TasksContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    task: TaskResponse | null;
  }>({ isOpen: false, task: null });

  // API hooks - simplified to avoid parameter encoding issues
  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
  } = useTasks(); // No parameters for now

  const { data: categoriesData } = useCategories();
  const deleteTaskMutation = useDeleteTask();
  const updateTaskMutation = useUpdateTask();
  const { toast } = useToast();

  const allTasks = tasksData?.results || [];
  const categories = categoriesData?.results || [];

  // Apply client-side filtering
  const tasks = allTasks.filter((task) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(searchLower) ||
        (task.description &&
          task.description.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filterCategory !== "all" && task.category_name !== filterCategory) {
      return false;
    }

    // Priority filter
    if (filterPriority !== "all" && task.priority !== filterPriority) {
      return false;
    }

    // Status filter
    if (filterStatus !== "all" && task.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const formatDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  const getDeadlineColor = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "text-red-600 dark:text-red-400";
    if (diffDays <= 1) return "text-orange-600 dark:text-orange-400";
    if (diffDays <= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const handleDeleteTask = (task: TaskResponse) => {
    setDeleteConfirmation({ isOpen: true, task });
  };

  const confirmDeleteTask = async () => {
    if (!deleteConfirmation.task) return;

    try {
      await deleteTaskMutation.mutateAsync(deleteConfirmation.task.id);
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
      setDeleteConfirmation({ isOpen: false, task: null });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (task: TaskResponse) => {
    const newStatus =
      task.status === "completed"
        ? "todo"
        : task.status === "todo"
          ? "in_progress"
          : "completed";

    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: { status: newStatus },
      });
      toast({
        title: "Success",
        description: `Task marked as ${newStatus.replace("_", " ")}!`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            Create and manage tasks with AI assistance
          </p>
        </div>

        <Button
          className="md:w-auto w-full"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Task Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Tasks
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-prioritized task list with smart insights and management tools
          </p>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm ||
                filterCategory !== "all" ||
                filterPriority !== "all" ||
                filterStatus !== "all"
                  ? `No tasks match your current filters. Try adjusting your search criteria. (${allTasks.length} total tasks)`
                  : "Start building tasks with AI-powered suggestions for prioritization, categorization, and deadline recommendations."}
              </p>
              <Button onClick={() => setIsCreateOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task: TaskResponse) => (
                <div
                  key={task.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                      {task.ai_priority_score > 0 && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs">
                          <Brain className="h-3 w-3" />
                          {Math.round(task.ai_priority_score)}%
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={
                          priorityColors[task.priority] || priorityColors.medium
                        }
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        className={
                          statusColors[task.status] || statusColors.todo
                        }
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                      {task.category_name && (
                        <Badge variant="outline">{task.category_name}</Badge>
                      )}
                      {task.tag_names?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 mt-3 md:mt-0">
                    {task.deadline && (
                      <div
                        className={`flex items-center gap-1 text-sm ${getDeadlineColor(task.deadline)}`}
                      >
                        <Clock className="h-4 w-4" />
                        {formatDeadline(task.deadline)}
                      </div>
                    )}
                    {task.estimated_duration && (
                      <div className="text-xs text-muted-foreground">
                        ~{task.estimated_duration}min
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(task)}
                        disabled={updateTaskMutation.isPending}
                      >
                        {task.status === "completed"
                          ? "Reopen"
                          : task.status === "todo"
                            ? "Start"
                            : "Complete"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTask(task)}
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Creation Dialog */}
      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          // Tasks will be refreshed automatically via React Query
        }}
      />

      {/* Task Edit Dialog */}
      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
          onSuccess={() => {
            setEditingTask(null);
            // Tasks will be refreshed automatically via React Query
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, task: null })}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        itemName={deleteConfirmation.task?.title}
        isLoading={deleteTaskMutation.isPending}
      />
    </div>
  );
}

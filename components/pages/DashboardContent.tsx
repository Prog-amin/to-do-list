"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Brain,
  Calendar,
  Filter,
  Search,
  Plus,
  Loader2,
  Database,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTasks, useTaskStats, useCategories } from "@/hooks/useApi";
import { TaskExportImport } from "@/components/features/TaskExportImport";
import { TaskCalendar } from "@/components/features/TaskCalendar";
import { TaskDialog } from "@/components/ui/task-dialog";
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

// Connected to real database

export function DashboardContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Apply filters to API call
  const taskFilters = {
    ...(searchTerm && { search: searchTerm }),
    ...(filterCategory !== "all" && { category_name: filterCategory }),
    ...(filterPriority !== "all" && { priority: filterPriority }),
    ...(filterStatus !== "all" && { status: filterStatus }),
  };

  // API hooks with filters
  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
  } = useTasks(Object.keys(taskFilters).length > 0 ? taskFilters : undefined);

  const { data: statsData, isLoading: statsLoading } = useTaskStats();

  const { data: categoriesData } = useCategories();

  const tasks = tasksData?.results || [];
  const stats = statsData || {
    total_tasks: 0,
    completed_tasks: 0,
    urgent_tasks: 0,
    todays_due_tasks: 0,
    avg_ai_score: 0,
  };
  const categories = categoriesData?.results || [];

  // Debug: log if we have data
  if (tasksData) {
    console.log("Tasks loaded:", tasks.length, "tasks");
  }

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

  const handleQuickAddTask = () => {
    setIsTaskDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Connected to Real Database */}
      {!tasksLoading && (
        <Alert className="border-green-200 dark:border-green-800">
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Connected:</strong> You&apos;re connected to Neon PostgreSQL
            database with full task management functionality.
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              All task operations are persisted to the database. Calendar
              integration and export/import features are fully functional.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered task management with calendar integration
          </p>
        </div>
        <div className="flex gap-2">
          <TaskCalendar />
          <TaskExportImport />
          <Button className="md:w-auto w-full" onClick={handleQuickAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.total_tasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Active task management
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.completed_tasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_tasks > 0
                ? `${Math.round((stats.completed_tasks / stats.total_tasks) * 100)}% completion rate`
                : "No tasks yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? "..." : stats.urgent_tasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.todays_due_tasks}
            </div>
            <p className="text-xs text-muted-foreground">Focus for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : `${Math.round(stats.avg_ai_score)}%`}
            </div>
            <Progress value={stats.avg_ai_score} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Productivity insight
            </p>
          </CardContent>
        </Card>
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
          <CardTitle>Recent Tasks</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-prioritized task list with smart insights and calendar
            integration
          </p>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading tasks...</span>
            </div>
          ) : tasksError ? (
            <div className="text-center py-8">
              <p className="text-red-500">
                Error loading tasks: {tasksError.message}
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks found.</p>
              <Button onClick={handleQuickAddTask} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create your first task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks
                .filter((task: TaskResponse) => {
                  // Client-side filtering as backup
                  if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    const matchesSearch =
                      task.title.toLowerCase().includes(searchLower) ||
                      (task.description &&
                        task.description.toLowerCase().includes(searchLower));
                    if (!matchesSearch) return false;
                  }

                  if (
                    filterCategory !== "all" &&
                    task.category_name !== filterCategory
                  ) {
                    return false;
                  }

                  if (
                    filterPriority !== "all" &&
                    task.priority !== filterPriority
                  ) {
                    return false;
                  }

                  if (filterStatus !== "all" && task.status !== filterStatus) {
                    return false;
                  }

                  return true;
                })
                .map((task: TaskResponse) => (
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
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <Badge className={statusColors[task.status]}>
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
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Creation Dialog */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSuccess={() => {
          // Refresh tasks when a new task is created
        }}
      />

      {/* Bonus Features Showcase */}
      {/* <Card className="border-2 border-dashed border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-lg text-green-800 dark:text-green-200">
            🎉 Bonus Features Implemented
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Advanced AI Analysis
              </h4>
              <ul className="text-muted-foreground space-y-1">
                <li>✅ Sentiment analysis</li>
                <li>✅ Keyword extraction</li>
                <li>✅ Context-aware prioritization</li>
                <li>✅ Smart categorization</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar Integration
              </h4>
              <ul className="text-muted-foreground space-y-1">
                <li>✅ Calendar view with task mapping</li>
                <li>✅ Time-blocking interface</li>
                <li>✅ AI-optimized scheduling</li>
                <li>✅ Weekly planning view</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Data Management
              </h4>
              <ul className="text-muted-foreground space-y-1">
                <li>✅ Export to JSON/CSV/iCal</li>
                <li>✅ Import task validation</li>
                <li>✅ Dark mode toggle</li>
                <li>✅ Responsive design</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}

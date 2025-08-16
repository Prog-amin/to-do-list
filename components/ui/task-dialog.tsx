"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Brain, Sparkles, Clock, Tag, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAnalyzeTask,
  useCreateTask,
  useUpdateTask,
  useCategories,
} from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import type { TaskResponse } from "@shared/api";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  task?: TaskResponse;
}

export function TaskDialog({
  open,
  onOpenChange,
  onSuccess,
  task,
}: TaskDialogProps) {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    deadline: undefined as Date | undefined,
    tags: [] as string[],
    estimatedDuration: 60,
  });

  // Reset form when task prop changes
  useEffect(() => {
    if (task) {
      setNewTask({
        title: task.title || "",
        description: task.description || "",
        category: task.category_name || "",
        priority: task.priority || "medium",
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        tags: task.tag_names || [],
        estimatedDuration: task.estimated_duration || 60,
      });
    } else {
      setNewTask({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        deadline: undefined,
        tags: [],
        estimatedDuration: 60,
      });
    }
    setAiSuggestion(null);
  }, [task]);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [newTag, setNewTag] = useState("");

  const analyzeTaskMutation = useAnalyzeTask();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const { data: categoriesData } = useCategories();
  const { toast } = useToast();

  const categories = categoriesData?.results || [];

  const handleGetAISuggestions = async () => {
    if (!newTask.title && !newTask.description) return;
    setIsLoadingAI(true);
    try {
      const payload = {
        title: newTask.title || (newTask.description || "").slice(0, 120),
        description: newTask.description || "",
        include_context: true,
      };

      const res = await analyzeTaskMutation.mutateAsync(payload as any);

      const suggestion = {
        suggestedCategory: res.suggested_category || "Work",
        suggestedPriority: res.suggested_priority || "medium",
        suggestedDeadline: res.suggested_deadline
          ? new Date(res.suggested_deadline)
          : undefined,
        enhancedDescription:
          res.enhanced_description || newTask.description || "",
        suggestedTags: res.suggested_tags || [],
        reasoning: res.reasoning || "",
        confidenceScore: Math.round(res.confidence_score || 0),
      };

      setAiSuggestion(suggestion as any);
    } catch (e) {
      console.error("AI suggestion error", e);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setNewTask((prev) => ({
        ...prev,
        description: aiSuggestion.enhancedDescription,
        category: aiSuggestion.suggestedCategory,
        priority: aiSuggestion.suggestedPriority,
        deadline: aiSuggestion.suggestedDeadline,
        tags: aiSuggestion.suggestedTags,
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newTask.tags.includes(newTag.trim())) {
      setNewTask((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewTask((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleCreateTask = async () => {
    // Validation
    if (!newTask.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    if (newTask.title.trim().length < 3) {
      toast({
        title: "Validation Error",
        description: "Task title must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newTask.title.trim().length > 100) {
      toast({
        title: "Validation Error",
        description: "Task title must be less than 100 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newTask.description && newTask.description.length > 500) {
      toast({
        title: "Validation Error",
        description: "Task description must be less than 500 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newTask.estimatedDuration <= 0 || newTask.estimatedDuration > 1440) {
      toast({
        title: "Validation Error",
        description:
          "Estimated duration must be between 1 and 1440 minutes (24 hours).",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = {
        title: newTask.title,
        description: newTask.description || "",
        category_id:
          newTask.category &&
          newTask.category !== "none" &&
          newTask.category !== ""
            ? newTask.category
            : undefined,
        priority: newTask.priority,
        deadline: newTask.deadline ? newTask.deadline.toISOString() : undefined,
        estimated_duration: newTask.estimatedDuration,
        tag_ids: [], // For now, simplified
      };

      if (task) {
        await updateTaskMutation.mutateAsync({
          id: task.id,
          data: payload,
        });

        toast({
          title: "Success",
          description: "Task updated successfully!",
        });
      } else {
        await createTaskMutation.mutateAsync(payload);

        toast({
          title: "Success",
          description: "Task created successfully!",
        });
      }

      onOpenChange(false);
      setNewTask({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        deadline: undefined,
        tags: [],
        estimatedDuration: 60,
      });
      setAiSuggestion(null);
      onSuccess?.();
    } catch (e) {
      console.error(task ? "Update task failed" : "Create task failed", e);
      toast({
        title: "Error",
        description: task
          ? "Failed to update task. Please try again."
          : "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Task Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your task in detail..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* AI Suggestions Section */}
            {newTask.title && (
              <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!aiSuggestion && !isLoadingAI && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Get AI-powered suggestions for this task based on your
                        context
                      </p>
                      <Button
                        onClick={handleGetAISuggestions}
                        variant="outline"
                        className="w-full"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get AI Suggestions
                      </Button>
                    </div>
                  )}

                  {isLoadingAI && (
                    <div className="text-center py-4">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">
                        AI is analyzing your task and context...
                      </p>
                    </div>
                  )}

                  {aiSuggestion && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          >
                            Confidence: {aiSuggestion.confidenceScore}%
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-2">
                          AI Reasoning:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {aiSuggestion.reasoning}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Suggested Priority:</p>
                          <Badge
                            className={`mt-1 ${
                              aiSuggestion.suggestedPriority === "urgent"
                                ? "bg-red-100 text-red-800"
                                : aiSuggestion.suggestedPriority === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : aiSuggestion.suggestedPriority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                            }`}
                          >
                            {aiSuggestion.suggestedPriority}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">Suggested Category:</p>
                          <Badge variant="outline" className="mt-1">
                            {aiSuggestion.suggestedCategory}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-sm mb-2">
                          Enhanced Description:
                        </p>
                        <p className="text-sm text-muted-foreground bg-background p-3 rounded border">
                          {aiSuggestion.enhancedDescription}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-sm mb-2">
                          Suggested Tags:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestion.suggestedTags.map((tag: string) => (
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
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTask.category}
                onValueChange={(value) =>
                  setNewTask((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) =>
                  setNewTask((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={
                  newTask.deadline
                    ? newTask.deadline.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const dateValue = e.target.value;
                  setNewTask((prev) => ({
                    ...prev,
                    deadline: dateValue
                      ? new Date(dateValue + "T12:00:00")
                      : undefined,
                  }));
                }}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={newTask.estimatedDuration}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    estimatedDuration: parseInt(e.target.value) || 60,
                  }))
                }
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="tags"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {newTask.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newTask.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateTask} className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              {task ? "Update Task" : "Create Task"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

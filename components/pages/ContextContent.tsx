"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  StickyNote,
  Plus,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContext, useCreateContext } from "@/hooks/useApi";

interface ContextEntry {
  id: string;
  content: string;
  source: "whatsapp" | "email" | "notes" | "manual" | "calendar" | "meeting";
  user_name: string;
  processed: boolean;
  ai_insights: any[];
  extracted_keywords: string[];
  sentiment_score: number;
  sentiment_label: "positive" | "negative" | "neutral";
  urgency_score: number;
  word_count: number;
  generated_task_count: number;
  created_at: string;
  updated_at: string;
}

export function ContextContent() {
  const [newContent, setNewContent] = useState("");
  const [sourceType, setSourceType] = useState<
    "whatsapp" | "email" | "notes" | "manual" | "calendar" | "meeting"
  >("notes");
  const { toast } = useToast();

  // Use the proper context hook
  const { data: contextData, isLoading, error } = useContext();
  const contextEntries = contextData?.results || [];

  const createContextMutation = useCreateContext();

  const addContextEntry = async () => {
    // Validation
    if (!newContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter some content for the context entry.",
        variant: "destructive",
      });
      return;
    }

    if (newContent.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Context entry must be at least 10 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newContent.trim().length > 1000) {
      toast({
        title: "Validation Error",
        description: "Context entry must be less than 1000 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createContextMutation.mutateAsync({
        content: newContent,
        source: sourceType,
      } as any);

      setNewContent("");

      toast({
        title: "Success",
        description: "Context entry added successfully!",
      });
    } catch (error) {
      console.error("Error adding context entry:", error);
      toast({
        title: "Error",
        description: "Failed to add context entry.",
        variant: "destructive",
      });
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "notes":
        return <StickyNote className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "manual":
        return <StickyNote className="h-4 w-4" />;
      case "calendar":
        return <Calendar className="h-4 w-4" />;
      default:
        return <StickyNote className="h-4 w-4" />;
    }
  };

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case "whatsapp":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "email":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "notes":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "meeting":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "manual":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "calendar":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "negative":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "neutral":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Context</h1>
        <p className="text-muted-foreground">
          Add context from your daily activities to help AI understand your
          priorities and suggest relevant tasks.
        </p>
      </div>

      <Tabs defaultValue="add" className="w-full">
        <TabsList>
          <TabsTrigger value="add">Add Context</TabsTrigger>
          <TabsTrigger value="history">Context History</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Context Entry
              </CardTitle>
              <CardDescription>
                Share messages, emails, or notes from your day to improve task
                suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="source-type">Source Type</Label>
                <Select
                  value={sourceType}
                  onValueChange={(value: any) => setSourceType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp Messages
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="notes">
                      <div className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Personal Notes
                      </div>
                    </SelectItem>
                    <SelectItem value="meeting">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Meeting
                      </div>
                    </SelectItem>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Manual Entry
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your messages, email content, or notes here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={5}
                />
              </div>

              <Button
                onClick={addContextEntry}
                disabled={createContextMutation.isPending || !newContent.trim()}
                className="w-full"
              >
                {createContextMutation.isPending
                  ? "Adding..."
                  : "Add Context Entry"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Context History</h2>
            <Badge variant="outline">{contextEntries.length} entries</Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Loading context entries...
              </p>
            </div>
          ) : contextEntries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No context entries yet
                </h3>
                <p className="text-muted-foreground">
                  Start adding your daily context to get better AI-powered task
                  suggestions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contextEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getSourceColor(entry.source)}>
                          {getSourceIcon(entry.source)}
                          {entry.source.charAt(0).toUpperCase() +
                            entry.source.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()} at{" "}
                          {new Date(entry.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      {entry.urgency_score > 0.5 && (
                        <Badge variant="outline" className="text-orange-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          High Urgency
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{entry.content}</p>

                    {entry.processed && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            Sentiment:
                          </span>
                          <Badge
                            variant="outline"
                            className={getSentimentColor(entry.sentiment_label)}
                          >
                            {entry.sentiment_label}
                          </Badge>
                        </div>

                        {entry.extracted_keywords &&
                          entry.extracted_keywords.length > 0 && (
                            <div>
                              <span className="text-xs font-medium">
                                Keywords:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.extracted_keywords.map(
                                  (keyword, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {keyword}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

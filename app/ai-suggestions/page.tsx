"use client";

import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAnalyzeTask, useCreateTaskWithAI } from "@/hooks/useApi";

export default function AISuggestionsPage() {
  const { toast } = useToast();
  const analyzeTask = useAnalyzeTask();
  const createTaskWithAI = useCreateTaskWithAI();

  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const onGetSuggestions = async () => {
    if (!context.trim()) {
      toast({
        title: "Enter some context",
        description: "Describe what you need help with.",
      });
      return;
    }

    setLoading(true);
    try {
      // Split context into potential multiple tasks for better suggestions
      const contextLines = context
        .split("\n")
        .filter((line) => line.trim().length > 5);
      const sentences = context
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10);

      // Create multiple suggestions from different parts of the context
      const suggestions = [];

      // Main suggestion from full context
      const mainRes = await analyzeTask.mutateAsync({
        title: context.slice(0, 100),
        description: context,
        include_context: true,
      } as any);

      suggestions.push({
        suggested_title: mainRes.enhanced_description
          ? mainRes.enhanced_description.split(".")[0].slice(0, 60)
          : context.slice(0, 60),
        suggested_description: mainRes.enhanced_description || context,
        suggested_category: mainRes.suggested_category,
        suggested_priority: mainRes.suggested_priority,
        suggested_deadline: mainRes.suggested_deadline,
        confidence_score: mainRes.confidence_score,
        reasoning: mainRes.reasoning,
        suggested_tags: mainRes.suggested_tags || [],
      });

      // Additional suggestions if context has multiple parts
      if (contextLines.length > 1) {
        for (let i = 0; i < Math.min(contextLines.length, 3); i++) {
          const line = contextLines[i];
          if (line.length > 15) {
            try {
              const lineRes = await analyzeTask.mutateAsync({
                title: line.slice(0, 80),
                description: line + (sentences[i] ? ". " + sentences[i] : ""),
                include_context: true,
              } as any);

              suggestions.push({
                suggested_title: line.slice(0, 60),
                suggested_description: lineRes.enhanced_description || line,
                suggested_category: lineRes.suggested_category,
                suggested_priority: lineRes.suggested_priority,
                suggested_deadline: lineRes.suggested_deadline,
                confidence_score: lineRes.confidence_score,
                reasoning: lineRes.reasoning,
                suggested_tags: lineRes.suggested_tags || [],
              });
            } catch (e) {
              // Skip this suggestion if it fails
              console.log("Skipping line suggestion:", e);
            }
          }
        }
      } else if (sentences.length > 1) {
        // Try creating suggestions from sentences
        for (let i = 0; i < Math.min(sentences.length, 2); i++) {
          const sentence = sentences[i].trim();
          if (sentence.length > 20) {
            try {
              const sentRes = await analyzeTask.mutateAsync({
                title: sentence.slice(0, 80),
                description: sentence,
                include_context: false,
              } as any);

              suggestions.push({
                suggested_title: sentence.slice(0, 60),
                suggested_description: sentRes.enhanced_description || sentence,
                suggested_category: sentRes.suggested_category,
                suggested_priority: sentRes.suggested_priority,
                suggested_deadline: sentRes.suggested_deadline,
                confidence_score: sentRes.confidence_score,
                reasoning: sentRes.reasoning,
                suggested_tags: sentRes.suggested_tags || [],
              });
            } catch (e) {
              // Skip this suggestion if it fails
              console.log("Skipping sentence suggestion:", e);
            }
          }
        }
      }

      // Remove duplicates based on title similarity
      const uniqueSuggestions = suggestions.filter(
        (suggestion, index, self) =>
          index ===
          self.findIndex(
            (s) =>
              s.suggested_title.toLowerCase().slice(0, 30) ===
              suggestion.suggested_title.toLowerCase().slice(0, 30),
          ),
      );

      setSuggestions(uniqueSuggestions.slice(0, 4)); // Limit to 4 suggestions
    } catch (e) {
      toast({
        title: "Failed to fetch suggestions",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onCreateFromSuggestion = async (s: any) => {
    try {
      await createTaskWithAI.mutateAsync({
        title: s.suggested_title,
        description: s.suggested_description,
        priority: s.suggested_priority || "medium",
        deadline: s.suggested_deadline || undefined,
        use_ai_suggestions: true,
        context_aware: true,
      } as any);
      toast({ title: "Task created", description: s.suggested_title });
    } catch (e) {
      toast({
        title: "Failed to create task",
        description: String(e?.message || e),
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">AI Suggestions</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Describe your context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="E.g., Prepare for quarterly review, finish module, email John about design, schedule dentist appointment..."
              rows={6}
            />
            <div className="flex gap-2">
              <Button onClick={onGetSuggestions} disabled={loading}>
                {loading ? "Generating..." : "Get Suggestions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {suggestions.map((s, i) => (
                  <li key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm">
                          {s.suggested_title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {s.suggested_description}
                        </div>
                        <div className="text-xs mt-2 flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary">
                            Category: {s.suggested_category || "—"}
                          </Badge>
                          <Badge
                            variant={
                              s.suggested_priority === "urgent"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            Priority: {s.suggested_priority}
                          </Badge>
                          <Badge variant="outline">
                            Deadline:{" "}
                            {s.suggested_deadline
                              ? new Date(
                                  s.suggested_deadline,
                                ).toLocaleDateString()
                              : "—"}
                          </Badge>
                          <Badge variant="outline">
                            Confidence: {Math.round(s.confidence_score || 0)}%
                          </Badge>
                        </div>
                        {s.suggested_tags && s.suggested_tags.length > 0 && (
                          <div className="text-xs mt-2">
                            <span className="font-medium">Tags: </span>
                            {s.suggested_tags.map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                variant="secondary"
                                className="mr-1 text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => onCreateFromSuggestion(s)}
                        size="sm"
                      >
                        Create Task
                      </Button>
                    </div>
                    {s.reasoning && (
                      <div className="text-xs text-muted-foreground mt-3">
                        Reasoning: {s.reasoning}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

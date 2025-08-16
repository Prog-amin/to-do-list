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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  Lightbulb,
  Zap,
  Activity,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";

interface AIInsights {
  productivity_trends: {
    completion_rate: number;
    avg_priority_score: number;
    tasks_completed_today: number;
    tasks_completed_week: number;
    trend_direction: "up" | "down" | "stable";
  };
  task_analytics: {
    high_priority_tasks: number;
    overdue_tasks: number;
    upcoming_deadlines: number;
    category_distribution: { [key: string]: number };
  };
  ai_recommendations: {
    id: number;
    type: "optimization" | "scheduling" | "prioritization";
    title: string;
    description: string;
    impact_score: number;
    actionable: boolean;
  }[];
  context_insights: {
    sentiment_trend: "positive" | "negative" | "neutral";
    key_themes: string[];
    context_impact_score: number;
    recent_context_count: number;
  };
  time_analysis: {
    peak_productivity_hours: string[];
    estimated_completion_time: number;
    optimal_break_times: string[];
    workload_distribution: { [key: string]: number };
  };
}

export function InsightsContent() {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "day" | "week" | "month"
  >("week");
  const { get } = useApi();

  useEffect(() => {
    loadInsights();
  }, [selectedTimeframe]);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      console.log("Loading insights for timeframe:", selectedTimeframe);
      const data = await get<AIInsights>(
        `/ai/insights?timeframe=${selectedTimeframe}`,
      );
      console.log("Insights loaded:", data);
      setInsights(data);
    } catch (error) {
      console.error("Error loading insights:", error);
      // Set default insights on error
      setInsights({
        productivity_trends: {
          completion_rate: 65,
          avg_priority_score: 7.2,
          tasks_completed_today: 3,
          tasks_completed_week: 12,
          trend_direction: "up",
        },
        task_analytics: {
          high_priority_tasks: 5,
          overdue_tasks: 2,
          upcoming_deadlines: 4,
          category_distribution: { Work: 8, Personal: 4, Health: 2 },
        },
        ai_recommendations: [
          {
            id: 1,
            type: "optimization",
            title: "Optimize Task Scheduling",
            description:
              "Consider batching similar tasks together to improve efficiency and reduce context switching.",
            impact_score: 8,
            actionable: true,
          },
          {
            id: 2,
            type: "prioritization",
            title: "Focus on High-Impact Tasks",
            description:
              "Your upcoming deadlines suggest focusing on tasks with the highest business impact first.",
            impact_score: 7,
            actionable: true,
          },
          {
            id: 3,
            type: "scheduling",
            title: "Time Block Deep Work",
            description:
              "Schedule 2-hour blocks for complex tasks during your peak productivity hours.",
            impact_score: 6,
            actionable: true,
          },
        ],
        context_insights: {
          sentiment_trend: "positive",
          key_themes: ["productivity", "deadlines", "optimization"],
          context_impact_score: 7.5,
          recent_context_count: 6,
        },
        time_analysis: {
          peak_productivity_hours: ["09:00-11:00", "14:00-16:00"],
          estimated_completion_time: 18,
          optimal_break_times: ["12:00", "15:30"],
          workload_distribution: { morning: 40, afternoon: 35, evening: 25 },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return "text-red-600 dark:text-red-400";
    if (score >= 6) return "text-orange-600 dark:text-orange-400";
    if (score >= 4) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return <Zap className="h-4 w-4" />;
      case "scheduling":
        return <Calendar className="h-4 w-4" />;
      case "prioritization":
        return <Target className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">
            Loading your personalized insights...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">Unable to load insights data.</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              No insights available
            </h3>
            <p className="text-muted-foreground">
              Start creating tasks and adding context to generate AI insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">
            AI-powered analytics and recommendations for your productivity.
          </p>
        </div>
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.productivity_trends.completion_rate}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(insights.productivity_trends.trend_direction)}
              <span className="ml-1">vs last {selectedTimeframe}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Priority Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.productivity_trends.avg_priority_score.toFixed(1)}
            </div>
            <Progress
              value={insights.productivity_trends.avg_priority_score * 10}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks Completed
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedTimeframe === "day"
                ? insights.productivity_trends.tasks_completed_today
                : insights.productivity_trends.tasks_completed_week}
            </div>
            <p className="text-xs text-muted-foreground">
              This {selectedTimeframe}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Context Impact
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.context_insights.context_impact_score.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {insights.context_insights.recent_context_count} recent entries
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="time-analysis">Time Analysis</TabsTrigger>
          <TabsTrigger value="context">Context Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Task Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Priority</span>
                    <Badge variant="destructive">
                      {insights.task_analytics.high_priority_tasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overdue</span>
                    <Badge variant="outline" className="text-red-600">
                      {insights.task_analytics.overdue_tasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Upcoming Deadlines</span>
                    <Badge variant="outline" className="text-yellow-600">
                      {insights.task_analytics.upcoming_deadlines}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    insights.task_analytics.category_distribution,
                  ).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{category}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(count / 10) * 100} className="w-20" />
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-3">
            {insights.ai_recommendations.map((recommendation) => (
              <Card key={recommendation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {getRecommendationIcon(recommendation.type)}
                      {recommendation.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={getImpactColor(recommendation.impact_score)}
                    >
                      Impact: {recommendation.impact_score}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="time-analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Peak Productivity Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.time_analysis.peak_productivity_hours.map(
                    (hour, index) => (
                      <Badge key={index} variant="secondary" className="mr-2">
                        {hour}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Workload Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estimated Completion Time</span>
                    <Badge variant="outline">
                      {insights.time_analysis.estimated_completion_time}h
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      Optimal Break Times:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {insights.time_analysis.optimal_break_times.map(
                        (time, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {time}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Context Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sentiment Trend</span>
                <Badge
                  variant="outline"
                  className={
                    insights.context_insights.sentiment_trend === "positive"
                      ? "text-green-600"
                      : insights.context_insights.sentiment_trend === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                  }
                >
                  {insights.context_insights.sentiment_trend}
                </Badge>
              </div>

              <div>
                <span className="text-sm font-medium">Key Themes:</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {insights.context_insights.key_themes.map((theme, index) => (
                    <Badge key={index} variant="secondary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Context Impact Score
                </span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={insights.context_insights.context_impact_score * 10}
                    className="w-20"
                  />
                  <Badge variant="outline">
                    {insights.context_insights.context_impact_score.toFixed(1)}
                    /10
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

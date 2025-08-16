import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

// Demo user ID (in a real app, this would come from authentication)
const DEMO_USER_ID = 4;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "week";

    // Calculate date range based on timeframe
    let dateFilter = "";
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get basic task statistics
    const [taskStats] = await sql`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority_tasks,
        COUNT(CASE WHEN deadline < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN deadline BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 1 END) as upcoming_deadlines,
        AVG(ai_priority_score) as avg_priority_score
      FROM tasks_task 
      WHERE user_id = ${DEMO_USER_ID}
        AND created_at >= ${startDate.toISOString()}
    `;

    // Get category distribution
    const categoryStats = await sql`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category,
        COUNT(*) as count
      FROM tasks_task t
      LEFT JOIN tasks_category c ON t.category_id = c.id
      WHERE t.user_id = ${DEMO_USER_ID}
        AND t.created_at >= ${startDate.toISOString()}
      GROUP BY c.name
    `;

    // Get context insights
    const [contextStats] = (await sql`
      SELECT 
        COUNT(*) as recent_context_count,
        AVG(COALESCE(urgency_score, 0.5)) as avg_urgency,
        AVG(CASE 
          WHEN sentiment_score > 0 THEN 1 
          WHEN sentiment_score < 0 THEN -1 
          ELSE 0 
        END) as sentiment_trend_raw
      FROM tasks_contextentry 
      WHERE user_id = ${DEMO_USER_ID}
        AND created_at >= ${startDate.toISOString()}
    `) || [
      { recent_context_count: 0, avg_urgency: 0.5, sentiment_trend_raw: 0 },
    ];

    // Calculate completion rate
    const completionRate =
      taskStats.total_tasks > 0
        ? Math.round((taskStats.completed_tasks / taskStats.total_tasks) * 100)
        : 0;

    // Generate timeframe-specific data
    const tasksCompletedToday =
      timeframe === "day"
        ? taskStats.completed_tasks
        : Math.floor(
            taskStats.completed_tasks / (timeframe === "week" ? 7 : 30),
          );

    const tasksCompletedWeek =
      timeframe === "week"
        ? taskStats.completed_tasks
        : timeframe === "day"
          ? taskStats.completed_tasks * 7
          : Math.floor((taskStats.completed_tasks * 7) / 30);

    // Determine trend direction (simplified)
    const trendDirection =
      completionRate >= 70 ? "up" : completionRate >= 40 ? "stable" : "down";

    // Generate AI recommendations based on data
    const recommendations = [];

    if (taskStats.overdue_tasks > 0) {
      recommendations.push({
        id: 1,
        type: "prioritization",
        title: "Address Overdue Tasks",
        description: `You have ${taskStats.overdue_tasks} overdue task${taskStats.overdue_tasks > 1 ? "s" : ""}. Consider rescheduling or breaking them into smaller tasks.`,
        impact_score: Math.min(10, taskStats.overdue_tasks * 2),
        actionable: true,
      });
    }

    if (completionRate < 50) {
      recommendations.push({
        id: 2,
        type: "optimization",
        title: "Improve Task Completion Rate",
        description: `Your completion rate is ${completionRate}%. Try setting more realistic deadlines and breaking large tasks into smaller ones.`,
        impact_score: 8,
        actionable: true,
      });
    }

    if (taskStats.high_priority_tasks > taskStats.completed_tasks) {
      recommendations.push({
        id: 3,
        type: "scheduling",
        title: "Focus on High Priority Tasks",
        description: `You have ${taskStats.high_priority_tasks} high-priority tasks. Consider scheduling focused time blocks for these.`,
        impact_score: 7,
        actionable: true,
      });
    }

    if (contextStats.avg_urgency > 0.7) {
      recommendations.push({
        id: 4,
        type: "optimization",
        title: "Manage Context Urgency",
        description:
          "Your recent context shows high urgency levels. Consider delegation or time management techniques.",
        impact_score: 6,
        actionable: true,
      });
    }

    // Generate category distribution object
    const categoryDistribution: { [key: string]: number } = {};
    categoryStats.forEach((stat) => {
      categoryDistribution[stat.category] = stat.count;
    });

    // Determine sentiment trend
    const sentimentTrend =
      contextStats.sentiment_trend_raw > 0.2
        ? "positive"
        : contextStats.sentiment_trend_raw < -0.2
          ? "negative"
          : "neutral";

    // Generate key themes (simplified)
    const keyThemes = ["productivity", "deadlines", "planning"];
    if (taskStats.high_priority_tasks > 2) keyThemes.push("high-priority");
    if (taskStats.overdue_tasks > 0) keyThemes.push("time-management");

    const insights = {
      productivity_trends: {
        completion_rate: completionRate,
        avg_priority_score: Math.round(taskStats.avg_priority_score || 0),
        tasks_completed_today: tasksCompletedToday,
        tasks_completed_week: tasksCompletedWeek,
        trend_direction: trendDirection,
      },
      task_analytics: {
        high_priority_tasks: taskStats.high_priority_tasks,
        overdue_tasks: taskStats.overdue_tasks,
        upcoming_deadlines: taskStats.upcoming_deadlines,
        category_distribution: categoryDistribution,
      },
      ai_recommendations: recommendations,
      context_insights: {
        sentiment_trend: sentimentTrend,
        key_themes: keyThemes,
        context_impact_score: Math.round(contextStats.avg_urgency * 10) / 10,
        recent_context_count: contextStats.recent_context_count,
      },
      time_analysis: {
        peak_productivity_hours: ["09:00-11:00", "14:00-16:00"],
        estimated_completion_time: Math.round(
          (taskStats.total_tasks - taskStats.completed_tasks) * 1.5,
        ),
        optimal_break_times: ["12:00", "15:30"],
        workload_distribution: {
          morning: 40,
          afternoon: 35,
          evening: 25,
        },
      },
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error("AI Insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}

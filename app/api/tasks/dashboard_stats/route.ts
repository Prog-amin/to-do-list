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
    // Get task statistics
    const [taskStats] = await sql`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tasks,
        COUNT(CASE WHEN deadline < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN DATE(deadline) = CURRENT_DATE THEN 1 END) as todays_due_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        AVG(COALESCE(ai_priority_score, 0)) as avg_ai_score
      FROM tasks_task 
      WHERE user_id = ${DEMO_USER_ID}
    `;

    const stats = {
      total_tasks: parseInt(taskStats.total_tasks) || 0,
      completed_tasks: parseInt(taskStats.completed_tasks) || 0,
      urgent_tasks: parseInt(taskStats.urgent_tasks) || 0,
      overdue_tasks: parseInt(taskStats.overdue_tasks) || 0,
      todays_due_tasks: parseInt(taskStats.todays_due_tasks) || 0,
      in_progress_tasks: parseInt(taskStats.in_progress_tasks) || 0,
      avg_ai_score: Math.round(taskStats.avg_ai_score || 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

// Demo user ID (in a real app, this would come from authentication)
const DEMO_USER_ID = 4;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const [task] = await sql`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.deadline,
        t.estimated_duration,
        t.actual_duration,
        t.ai_priority_score,
        t.ai_confidence_score,
        t.ai_reasoning,
        t.ai_enhanced_description,
        t.ai_suggested_tags,
        t.created_at,
        t.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.id as category_id,
        COALESCE(
          ARRAY_AGG(
            CASE WHEN tag.name IS NOT NULL THEN tag.name END
          ) FILTER (WHERE tag.name IS NOT NULL), 
          '{}'::text[]
        ) as tag_names,
        CASE 
          WHEN t.deadline < NOW() AND t.status != 'completed' THEN true
          ELSE false
        END as is_overdue,
        CASE 
          WHEN t.status = 'completed' THEN 100
          WHEN t.status = 'in_progress' THEN 50
          ELSE 0
        END as completion_percentage
      FROM tasks_task t
      LEFT JOIN tasks_category c ON t.category_id = c.id
      LEFT JOIN tasks_task_tags tt ON t.id = tt.task_id
      LEFT JOIN tasks_tag tag ON tt.tag_id = tag.id
      WHERE t.id = ${id} AND t.user_id = ${DEMO_USER_ID}
      GROUP BY t.id, c.name, c.color, c.id
    `;

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      priority,
      status,
      category_id,
      deadline,
      estimated_duration,
    } = body;

    console.log("Updating task:", { id, body });

    const now = new Date().toISOString();

    // Handle category_id - convert category name to UUID if needed
    let resolvedCategoryId = category_id;
    if (
      category_id &&
      typeof category_id === "string" &&
      !category_id.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    ) {
      try {
        // It's a category name, not a UUID - look up the category ID
        const [category] = await sql`
          SELECT id FROM tasks_category
          WHERE name = ${category_id}
          LIMIT 1
        `;
        resolvedCategoryId = category ? category.id : null;
      } catch (categoryError) {
        console.log("Category lookup failed:", categoryError);
        resolvedCategoryId = null;
      }
    }

    // Simple approach: Always update all fields that are provided
    const [updatedTask] = await sql`
      UPDATE tasks_task
      SET
        title = COALESCE(${title || null}, title),
        description = COALESCE(${description || null}, description),
        priority = COALESCE(${priority || null}, priority),
        status = COALESCE(${status || null}, status),
        category_id = CASE
          WHEN ${category_id !== undefined} THEN ${resolvedCategoryId}
          ELSE category_id
        END,
        deadline = CASE
          WHEN ${deadline !== undefined} THEN ${deadline}
          ELSE deadline
        END,
        estimated_duration = COALESCE(${estimated_duration || null}, estimated_duration),
        updated_at = ${now}
      WHERE id = ${id} AND user_id = ${DEMO_USER_ID}
      RETURNING *
    `;

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch the complete task with relations
    const [taskWithRelations] = await sql`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.deadline,
        t.estimated_duration,
        t.actual_duration,
        t.ai_priority_score,
        t.ai_confidence_score,
        t.ai_reasoning,
        t.ai_enhanced_description,
        t.ai_suggested_tags,
        t.created_at,
        t.updated_at,
        c.name as category_name,
        c.color as category_color,
        COALESCE(
          ARRAY_AGG(
            CASE WHEN tag.name IS NOT NULL THEN tag.name END
          ) FILTER (WHERE tag.name IS NOT NULL), 
          '{}'::text[]
        ) as tag_names,
        CASE 
          WHEN t.deadline < NOW() AND t.status != 'completed' THEN true
          ELSE false
        END as is_overdue,
        CASE 
          WHEN t.status = 'completed' THEN 100
          WHEN t.status = 'in_progress' THEN 50
          ELSE 0
        END as completion_percentage
      FROM tasks_task t
      LEFT JOIN tasks_category c ON t.category_id = c.id
      LEFT JOIN tasks_task_tags tt ON t.id = tt.task_id
      LEFT JOIN tasks_tag tag ON tt.tag_id = tag.id
      WHERE t.id = ${id}
      GROUP BY t.id, c.name, c.color
    `;

    return NextResponse.json(taskWithRelations);
  } catch (error) {
    console.error("Database error:", error);
    console.error("Failed to update task with ID:", id);
    console.error("Update data:", body);
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // First delete task-tag relationships
    await sql`DELETE FROM tasks_task_tags WHERE task_id = ${id}`;

    // Then delete the task
    const [deletedTask] = await sql`
      DELETE FROM tasks_task 
      WHERE id = ${id} AND user_id = ${DEMO_USER_ID}
      RETURNING id
    `;

    if (!deletedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

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

    // Parse query parameters
    const search = searchParams.get("search");
    const category_name = searchParams.get("category_name");
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const ordering =
      searchParams.get("ordering") || "-ai_priority_score,-created_at";

    // Simple query that always works
    const tasks = await sql`
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
      WHERE t.user_id = ${DEMO_USER_ID}
      GROUP BY t.id, c.name, c.color
      ORDER BY t.ai_priority_score DESC, t.created_at DESC
      LIMIT 50
    `;

    // Apply client-side filtering if needed
    let filteredTasks = tasks;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description &&
            task.description.toLowerCase().includes(searchLower)),
      );
    }

    if (category_name) {
      filteredTasks = filteredTasks.filter(
        (task) => task.category_name === category_name,
      );
    }

    if (priority) {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === priority,
      );
    }

    if (status) {
      filteredTasks = filteredTasks.filter((task) => task.status === status);
    }

    return NextResponse.json({
      results: filteredTasks,
      count: filteredTasks.length,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description = "",
      priority = "medium",
      category_id,
      deadline,
      estimated_duration = 60,
      tag_ids = [],
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate UUID for the new task
    const taskId = crypto.randomUUID();
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
      // It's a category name, not a UUID - look up the category ID
      const [category] = await sql`
        SELECT id FROM tasks_category
        WHERE name = ${category_id}
        LIMIT 1
      `;
      resolvedCategoryId = category ? category.id : null;
    }

    // Create the task
    const [newTask] = await sql`
      INSERT INTO tasks_task (
        id, 
        title, 
        description, 
        priority, 
        status, 
        deadline,
        estimated_duration, 
        ai_priority_score, 
        ai_confidence_score,
        ai_reasoning,
        ai_enhanced_description,
        ai_suggested_tags,
        category_id,
        user_id,
        created_at,
        updated_at
      ) VALUES (
        ${taskId},
        ${title},
        ${description},
        ${priority},
        'todo',
        ${deadline || null},
        ${estimated_duration},
        ${Math.random() * 100}, -- Simple AI score for demo
        75.0,
        'Task created via web interface',
        ${description || title || "No description provided"},
        '[]'::jsonb,
        ${resolvedCategoryId || null},
        ${DEMO_USER_ID},
        ${now},
        ${now}
      )
      RETURNING *
    `;

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await sql`
          INSERT INTO tasks_task_tags (task_id, tag_id)
          VALUES (${taskId}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }
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
        false as is_overdue,
        0 as completion_percentage
      FROM tasks_task t
      LEFT JOIN tasks_category c ON t.category_id = c.id
      LEFT JOIN tasks_task_tags tt ON t.id = tt.task_id
      LEFT JOIN tasks_tag tag ON tt.tag_id = tag.id
      WHERE t.id = ${taskId}
      GROUP BY t.id, c.name, c.color
    `;

    return NextResponse.json(taskWithRelations, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

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
    const categories = await sql`
      SELECT 
        id,
        name,
        color,
        description,
        usage_count,
        created_by_id as created_by,
        created_at,
        updated_at
      FROM tasks_category 
      WHERE created_by_id = ${DEMO_USER_ID}
      ORDER BY usage_count DESC, name ASC
    `;

    return NextResponse.json({
      results: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, description = "" } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    // Generate UUID for the new category
    const categoryId = crypto.randomUUID();
    const now = new Date().toISOString();

    const [newCategory] = await sql`
      INSERT INTO tasks_category (
        id, 
        name, 
        color, 
        description, 
        usage_count,
        created_by_id,
        created_at,
        updated_at
      ) VALUES (
        ${categoryId},
        ${name},
        ${color || "#3B82F6"},
        ${description},
        0,
        ${DEMO_USER_ID},
        ${now},
        ${now}
      )
      RETURNING *
    `;

    const response = {
      id: newCategory.id,
      name: newCategory.name,
      color: newCategory.color,
      description: newCategory.description,
      usage_count: newCategory.usage_count,
      created_by: newCategory.created_by_id,
      created_at: newCategory.created_at,
      updated_at: newCategory.updated_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Category creation error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}

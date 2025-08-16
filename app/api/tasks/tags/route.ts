import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const tags = await sql`
      SELECT 
        id,
        name,
        usage_count,
        created_at,
        updated_at
      FROM tasks_tag 
      ORDER BY usage_count DESC, name ASC
      LIMIT 50
    `;

    return NextResponse.json({
      results: tags,
      count: tags.length,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const tagId = crypto.randomUUID();
    const now = new Date().toISOString();

    const [newTag] = await sql`
      INSERT INTO tasks_tag (
        id,
        name,
        usage_count,
        created_at,
        updated_at
      ) VALUES (
        ${tagId},
        ${name},
        0,
        ${now},
        ${now}
      )
      RETURNING *
    `;

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);

    // Handle unique constraint violation
    if (
      error.message?.includes("duplicate key") ||
      error.message?.includes("unique constraint")
    ) {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 },
    );
  }
}

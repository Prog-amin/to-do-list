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
    console.log("Context API: Starting request...");

    // First, let's check if the table exists and create it if it doesn't
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS tasks_contextentry (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          source TEXT NOT NULL DEFAULT 'manual',
          user_id INTEGER NOT NULL,
          processed BOOLEAN DEFAULT TRUE,
          extracted_keywords TEXT,
          sentiment_score REAL DEFAULT 0,
          urgency_score REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Context API: Table ensured to exist");
    } catch (createError) {
      console.log(
        "Context API: Table already exists or creation failed:",
        createError,
      );
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const processed = searchParams.get("processed");

    // Simple query without complex filtering
    let contextEntries;
    try {
      contextEntries = await sql`
        SELECT
          id,
          content,
          source,
          processed,
          extracted_keywords,
          sentiment_score,
          CASE
            WHEN sentiment_score > 0.1 THEN 'positive'
            WHEN sentiment_score < -0.1 THEN 'negative'
            ELSE 'neutral'
          END as sentiment_label,
          urgency_score,
          LENGTH(content) as word_count,
          created_at,
          updated_at
        FROM tasks_contextentry
        WHERE user_id = ${DEMO_USER_ID}
        ORDER BY created_at DESC
        LIMIT 50
      `;
    } catch (queryError) {
      console.log("Context API: Query failed:", queryError);
      contextEntries = [];
    }

    console.log("Context API: Raw entries from DB:", contextEntries.length);

    // If no entries exist, create some sample data
    if (contextEntries.length === 0) {
      console.log("Context API: No entries found, creating sample data...");

      try {
        const sampleEntries = [
          {
            id: crypto.randomUUID(),
            content:
              "Meeting with product team tomorrow at 2 PM to discuss Q1 roadmap and feature priorities",
            source: "meeting",
            user_id: DEMO_USER_ID,
            processed: true,
            extracted_keywords: JSON.stringify([
              "meeting",
              "product",
              "roadmap",
              "priorities",
            ]),
            sentiment_score: 0.2,
            urgency_score: 0.7,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: crypto.randomUUID(),
            content:
              "Client feedback: They love the new dashboard design but want faster loading times and mobile optimization",
            source: "email",
            user_id: DEMO_USER_ID,
            processed: true,
            extracted_keywords: JSON.stringify([
              "client",
              "feedback",
              "dashboard",
              "mobile",
              "optimization",
            ]),
            sentiment_score: 0.1,
            urgency_score: 0.6,
            created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            updated_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            content:
              "Reminder: Code review due by end of week. Focus on performance improvements and security updates.",
            source: "notes",
            user_id: DEMO_USER_ID,
            processed: true,
            extracted_keywords: JSON.stringify([
              "code",
              "review",
              "performance",
              "security",
            ]),
            sentiment_score: 0.0,
            urgency_score: 0.8,
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            updated_at: new Date(Date.now() - 172800000).toISOString(),
          },
        ];

        // Insert sample entries
        for (const entry of sampleEntries) {
          try {
            await sql`
              INSERT INTO tasks_contextentry (
                id, content, source, user_id, processed, extracted_keywords,
                sentiment_score, urgency_score, created_at, updated_at
              ) VALUES (
                ${entry.id}, ${entry.content}, ${entry.source}, ${entry.user_id},
                ${entry.processed}, ${entry.extracted_keywords}, ${entry.sentiment_score},
                ${entry.urgency_score}, ${entry.created_at}, ${entry.updated_at}
              )
              ON CONFLICT (id) DO NOTHING
            `;
          } catch (insertError) {
            console.log("Context API: Failed to insert entry:", insertError);
          }
        }

        // Re-fetch the data
        contextEntries = await sql`
          SELECT
            id,
            content,
            source,
            processed,
            extracted_keywords,
            sentiment_score,
            CASE
              WHEN sentiment_score > 0.1 THEN 'positive'
              WHEN sentiment_score < -0.1 THEN 'negative'
              ELSE 'neutral'
            END as sentiment_label,
            urgency_score,
            LENGTH(content) as word_count,
            created_at,
            updated_at
          FROM tasks_contextentry
          WHERE user_id = ${DEMO_USER_ID}
          ORDER BY created_at DESC
          LIMIT 50
        `;

        console.log(
          "Context API: Sample data created, new count:",
          contextEntries.length,
        );
      } catch (sampleError) {
        console.log("Context API: Failed to create sample data:", sampleError);
        // Continue with empty entries rather than failing
      }
    }

    // Format response to match expected interface
    const formattedEntries = contextEntries.map((entry) => {
      let extractedKeywords = [];
      try {
        extractedKeywords = entry.extracted_keywords
          ? JSON.parse(entry.extracted_keywords)
          : [];
      } catch (parseError) {
        console.log(
          "Context API: Failed to parse keywords for entry:",
          entry.id,
        );
        extractedKeywords = [];
      }

      return {
        id: entry.id,
        content: entry.content,
        source: entry.source,
        user_name: "Demo User",
        processed: entry.processed,
        ai_insights: entry.processed ? ["analyzed"] : [],
        extracted_keywords: extractedKeywords,
        sentiment_score: entry.sentiment_score || 0,
        sentiment_label: entry.sentiment_label || "neutral",
        urgency_score: entry.urgency_score || 0,
        word_count: entry.word_count || 0,
        generated_task_count: 0,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      };
    });

    console.log("Context API: Formatted entries:", formattedEntries.length);

    return NextResponse.json({
      results: formattedEntries,
      count: formattedEntries.length,
    });
  } catch (error) {
    console.error("Context entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch context entries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, source = "manual" } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // Generate UUID for the new context entry
    const entryId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Simple keyword extraction
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    const keywords = [...new Set(words)].slice(0, 10);

    // Simple sentiment analysis (basic)
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "awesome",
      "happy",
      "love",
      "perfect",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "hate",
      "angry",
      "frustrated",
      "urgent",
      "problem",
    ];

    const positiveCount = positiveWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;
    const sentimentScore = (positiveCount - negativeCount) * 0.2;

    // Simple urgency scoring
    const urgentKeywords = [
      "urgent",
      "asap",
      "immediately",
      "deadline",
      "critical",
      "important",
    ];
    const urgencyScore = Math.min(
      1.0,
      urgentKeywords.filter((word) => content.toLowerCase().includes(word))
        .length * 0.3,
    );

    const [newEntry] = await sql`
      INSERT INTO tasks_contextentry (
        id,
        content,
        source,
        user_id,
        processed,
        extracted_keywords,
        sentiment_score,
        urgency_score,
        created_at,
        updated_at
      ) VALUES (
        ${entryId},
        ${content},
        ${source},
        ${DEMO_USER_ID},
        true,
        ${JSON.stringify(keywords)},
        ${sentimentScore},
        ${urgencyScore},
        ${now},
        ${now}
      )
      RETURNING *
    `;

    const response = {
      id: newEntry.id,
      content: newEntry.content,
      source: newEntry.source,
      user_name: "Demo User",
      processed: newEntry.processed,
      ai_insights: ["analyzed"],
      extracted_keywords: JSON.parse(newEntry.extracted_keywords),
      sentiment_score: newEntry.sentiment_score,
      sentiment_label:
        newEntry.sentiment_score > 0.1
          ? "positive"
          : newEntry.sentiment_score < -0.1
            ? "negative"
            : "neutral",
      urgency_score: newEntry.urgency_score,
      word_count: content.split(/\s+/).length,
      generated_task_count: 0,
      created_at: newEntry.created_at,
      updated_at: newEntry.updated_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Context creation error:", error);
    return NextResponse.json(
      { error: "Failed to create context entry" },
      { status: 500 },
    );
  }
}

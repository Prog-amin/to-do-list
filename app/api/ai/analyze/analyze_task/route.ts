import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

// Demo user ID (in a real app, this would come from authentication)
const DEMO_USER_ID = 4;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      include_context = true,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get user's categories for suggestions
    const categories = await sql`
      SELECT name FROM tasks_category 
      WHERE created_by_id = ${DEMO_USER_ID}
      ORDER BY usage_count DESC
      LIMIT 5
    `;

    // Get user's recent context if requested
    let contextData = [];
    if (include_context) {
      contextData = await sql`
        SELECT content, extracted_keywords, urgency_score 
        FROM tasks_contextentry 
        WHERE user_id = ${DEMO_USER_ID}
        ORDER BY created_at DESC
        LIMIT 3
      `;
    }

    // Comprehensive AI analysis based on task content, keywords, and patterns
    const taskText = `${title} ${description || ""}`.toLowerCase();
    const taskHash = Buffer.from(title + (description || ""))
      .toString("base64")
      .slice(0, 8); // Unique identifier

    // Priority analysis based on keywords and context
    let suggestedPriority = priority || "medium";
    const urgentKeywords = [
      "urgent",
      "asap",
      "immediately",
      "emergency",
      "critical",
      "deadline today",
      "due now",
    ];
    const highKeywords = [
      "important",
      "deadline",
      "meeting",
      "client",
      "boss",
      "presentation",
      "launch",
      "deploy",
    ];
    const mediumKeywords = [
      "project",
      "task",
      "review",
      "update",
      "check",
      "follow up",
    ];
    const lowKeywords = [
      "research",
      "explore",
      "consider",
      "think about",
      "maybe",
      "someday",
    ];

    if (urgentKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedPriority = "urgent";
    } else if (highKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedPriority = "high";
    } else if (lowKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedPriority = "low";
    }

    // Smart category analysis based on content
    let suggestedCategory =
      category || (categories.length > 0 ? categories[0].name : "Work");
    const workKeywords = [
      "meeting",
      "project",
      "client",
      "report",
      "presentation",
      "code",
      "deploy",
      "release",
      "build",
      "fix",
      "bug",
      "feature",
    ];
    const personalKeywords = [
      "personal",
      "home",
      "family",
      "hobby",
      "vacation",
      "birthday",
      "anniversary",
      "buy",
      "shop",
    ];
    const healthKeywords = [
      "doctor",
      "health",
      "exercise",
      "appointment",
      "medical",
      "gym",
      "run",
      "walk",
      "diet",
      "checkup",
    ];
    const learningKeywords = [
      "learn",
      "study",
      "course",
      "tutorial",
      "read",
      "book",
      "training",
      "skill",
      "practice",
    ];
    const financeKeywords = [
      "budget",
      "money",
      "pay",
      "bill",
      "tax",
      "invoice",
      "finance",
      "bank",
      "investment",
    ];

    if (workKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedCategory = "Work";
    } else if (healthKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedCategory = "Health";
    } else if (personalKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedCategory = "Personal";
    } else if (learningKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedCategory = "Learning";
    } else if (financeKeywords.some((keyword) => taskText.includes(keyword))) {
      suggestedCategory = "Finance";
    }

    // Smart deadline suggestion based on priority, complexity, and context
    let suggestedDeadline = null;
    const urgencyFromContext =
      contextData.reduce((avg, ctx) => avg + (ctx.urgency_score || 0), 0) /
      Math.max(contextData.length, 1);
    const complexityKeywords = [
      "complex",
      "difficult",
      "research",
      "analyze",
      "design",
      "architecture",
      "plan",
    ];
    const quickKeywords = [
      "quick",
      "simple",
      "easy",
      "call",
      "email",
      "message",
      "check",
    ];
    const isComplex = complexityKeywords.some((keyword) =>
      taskText.includes(keyword),
    );
    const isQuick = quickKeywords.some((keyword) => taskText.includes(keyword));

    if (
      suggestedPriority === "urgent" ||
      taskText.includes("today") ||
      taskText.includes("asap")
    ) {
      suggestedDeadline = new Date(
        Date.now() + (isQuick ? 4 : 24) * 60 * 60 * 1000,
      ); // 4 hours or 1 day
    } else if (suggestedPriority === "high" || urgencyFromContext > 0.7) {
      suggestedDeadline = new Date(
        Date.now() + (isComplex ? 5 : 3) * 24 * 60 * 60 * 1000,
      ); // 3-5 days
    } else if (suggestedPriority === "low") {
      suggestedDeadline = new Date(
        Date.now() + (isComplex ? 21 : 14) * 24 * 60 * 60 * 1000,
      ); // 2-3 weeks
    } else {
      suggestedDeadline = new Date(
        Date.now() + (isComplex ? 10 : 7) * 24 * 60 * 60 * 1000,
      ); // 1-1.5 weeks
    }

    // Context-aware enhanced description based on task content
    let enhancedDescription = description || "";
    if (!description || description.length < 50) {
      // Generate unique enhanced descriptions based on task content
      const taskLength = title.length + (description || "").length;
      const taskComplexity = isComplex
        ? "complex"
        : isQuick
          ? "straightforward"
          : "standard";

      let enhancement = "";
      if (suggestedPriority === "urgent") {
        enhancement =
          "This urgent task requires immediate attention and should be prioritized. ";
      } else if (suggestedPriority === "high") {
        enhancement =
          "This high-priority task is important for your goals and should be tackled soon. ";
      }

      if (suggestedCategory === "Work") {
        enhancement +=
          "Consider coordinating with team members and blocking calendar time. ";
      } else if (suggestedCategory === "Health") {
        enhancement +=
          "This health-related task contributes to your well-being. ";
      } else if (suggestedCategory === "Learning") {
        enhancement += "Allocate focused time for learning and practice. ";
      }

      if (isComplex) {
        enhancement +=
          "Break this complex task into smaller, manageable subtasks. ";
      } else if (isQuick) {
        enhancement +=
          "This appears to be a quick task that can be completed efficiently. ";
      }

      enhancedDescription = `${title}. ${enhancement}Consider setting up the necessary resources and environment before starting.`;
    }

    // Smart tag extraction based on content analysis
    const taskWords = taskText.split(" ").filter((word) => word.length > 3);
    const contextKeywords = contextData.flatMap(
      (ctx) => ctx.extracted_keywords || [],
    );

    // Predefined meaningful tags based on patterns
    const smartTags = [];
    if (urgentKeywords.some((k) => taskText.includes(k)))
      smartTags.push("urgent");
    if (taskText.includes("meeting")) smartTags.push("meeting");
    if (taskText.includes("project")) smartTags.push("project");
    if (taskText.includes("deadline")) smartTags.push("deadline");
    if (isComplex) smartTags.push("complex");
    if (isQuick) smartTags.push("quick");
    if (taskText.includes("email")) smartTags.push("communication");
    if (taskText.includes("call")) smartTags.push("communication");
    if (taskText.includes("review")) smartTags.push("review");
    if (taskText.includes("fix") || taskText.includes("bug"))
      smartTags.push("bugfix");
    if (taskText.includes("feature")) smartTags.push("feature");

    // Add category-specific tags
    if (suggestedCategory === "Work") smartTags.push("work");
    if (suggestedCategory === "Health") smartTags.push("health");
    if (suggestedCategory === "Learning") smartTags.push("learning");

    // Combine with extracted keywords
    const allTags = [
      ...smartTags,
      ...taskWords.slice(0, 2),
      ...contextKeywords.slice(0, 2),
    ];
    const suggestedTags = [...new Set(allTags)]
      .slice(0, 5)
      .filter((tag) => tag && tag.length > 2 && tag.length < 15);

    // Generate personalized reasoning based on analysis
    let reasoning = `Analyzing "${title}"${description ? ` with description "${description.slice(0, 50)}..."` : ""}: `;

    // Priority reasoning
    if (suggestedPriority === "urgent") {
      reasoning +=
        "Detected urgent keywords suggesting immediate action required. ";
    } else if (suggestedPriority === "high") {
      reasoning +=
        "Contains important keywords indicating high business value. ";
    } else if (suggestedPriority === "low") {
      reasoning +=
        "Appears to be exploratory or optional, suitable for lower priority. ";
    }

    // Category reasoning
    reasoning += `Classified as ${suggestedCategory} based on content analysis. `;

    // Complexity and timing
    if (isComplex) {
      reasoning += "Identified as complex task requiring thorough planning. ";
    } else if (isQuick) {
      reasoning += "Appears to be a quick task for efficient completion. ";
    }

    // Context influence
    if (contextData.length > 0) {
      reasoning += `Recent context data (${contextData.length} entries) ${urgencyFromContext > 0.5 ? "indicates elevated urgency" : "shows normal activity levels"}. `;
    }

    reasoning += `Suggested completion: ${suggestedDeadline ? suggestedDeadline.toLocaleDateString() : "within a week"}.`;

    // Calculate dynamic confidence score based on analysis depth
    const allKeywords = urgentKeywords.concat(
      highKeywords,
      workKeywords,
      personalKeywords,
      healthKeywords,
      learningKeywords,
      financeKeywords,
    );
    const keywordMatches = allKeywords.filter((keyword) =>
      taskText.includes(keyword),
    ).length;
    const hasKeywords = keywordMatches > 0;
    const hasContext = contextData.length > 0;
    const hasDescription = description && description.length > 20;
    const titleLength = title.length;
    const hasSpecificTags = smartTags.length > 2;

    // More sophisticated confidence calculation
    let confidenceScore = 20; // base confidence
    confidenceScore += Math.min(25, keywordMatches * 5); // keyword matches (up to 25)
    confidenceScore += hasContext ? 20 : 0; // context data
    confidenceScore += hasDescription ? 15 : 0; // description quality
    confidenceScore += titleLength > 10 ? 10 : 5; // title specificity
    confidenceScore += hasSpecificTags ? 10 : 0; // tag generation success
    confidenceScore += isComplex || isQuick ? 5 : 0; // complexity detection

    confidenceScore = Math.min(95, Math.max(25, confidenceScore));

    const response = {
      suggested_category: suggestedCategory,
      suggested_priority: suggestedPriority,
      suggested_deadline: suggestedDeadline
        ? suggestedDeadline.toISOString()
        : null,
      enhanced_description: enhancedDescription,
      suggested_tags: suggestedTags,
      reasoning,
      confidence_score: confidenceScore,
      analysis_timestamp: new Date().toISOString(),
      analysis_id: taskHash, // Unique identifier for this analysis
      keywords_detected: keywordMatches,
      complexity_level: isComplex ? "high" : isQuick ? "low" : "medium",
    };

    // Log analysis for debugging (in development)
    if (process.env.NODE_ENV === "development") {
      console.log(`AI Analysis [${taskHash}]:`, {
        title: title.slice(0, 30),
        priority: suggestedPriority,
        category: suggestedCategory,
        confidence: confidenceScore,
        keywords: keywordMatches,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze task" },
      { status: 500 },
    );
  }
}

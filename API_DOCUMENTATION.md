# SmartTodos API Documentation

## Overview

The SmartTodos API is a RESTful API built with Django REST Framework that provides comprehensive task management with AI-powered features.

## Base URL

```
Development: http://localhost:8000/api/
Production: https://your-domain.com/api/
```

## Authentication

Currently using Django Session Authentication. Include session cookies with all requests.

### Headers Required
```
Content-Type: application/json
X-CSRFToken: <csrf-token> (for POST/PUT/DELETE requests)
```

## Core Endpoints

### Tasks Management

#### Get All Tasks
```http
GET /api/tasks/tasks/
```

**Query Parameters:**
- `status`: Filter by status (todo, in_progress, completed)
- `priority`: Filter by priority (low, medium, high, urgent)
- `category`: Filter by category ID
- `search`: Search in title and description
- `ordering`: Order by field (e.g., `-created_at`, `ai_priority_score`)

**Response:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/tasks/tasks/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440021",
      "title": "Complete Q4 project proposal",
      "description": "Finalize quarterly proposal...",
      "category_name": "Work",
      "category_color": "#3B82F6",
      "tag_names": ["urgent", "deadline"],
      "priority": "high",
      "status": "in_progress",
      "deadline": "2024-01-15T17:00:00Z",
      "estimated_duration": 180,
      "ai_priority_score": 92.5,
      "is_overdue": false,
      "completion_percentage": 50,
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-12T14:30:00Z"
    }
  ]
}
```

#### Create New Task
```http
POST /api/tasks/tasks/
```

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Finalize the quarterly project proposal",
  "category_id": "550e8400-e29b-41d4-a716-446655440001",
  "priority": "high",
  "deadline": "2024-01-15T17:00:00Z",
  "estimated_duration": 180,
  "tag_ids": ["550e8400-e29b-41d4-a716-446655440011"]
}
```

#### Get Task Details
```http
GET /api/tasks/tasks/{id}/
```

**Response includes AI suggestions:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440021",
  "title": "Complete Q4 project proposal",
  "ai_suggestions": {
    "suggested_priority": "high",
    "suggested_category": "Work",
    "suggested_tags": ["urgent", "deadline", "client"],
    "confidence_score": 0.892,
    "reasoning": "High priority based on deadline proximity..."
  },
  "ai_enhanced_description": "Complete the quarterly project proposal including detailed budget estimates...",
  "comments": [],
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Work",
    "color": "#3B82F6"
  }
}
```

#### Dashboard Statistics
```http
GET /api/tasks/tasks/dashboard_stats/
```

**Response:**
```json
{
  "total_tasks": 24,
  "completed_tasks": 18,
  "urgent_tasks": 3,
  "overdue_tasks": 2,
  "todays_due_tasks": 5,
  "in_progress_tasks": 3,
  "avg_ai_score": 78.5
}
```

#### Upcoming Deadlines
```http
GET /api/tasks/tasks/upcoming_deadlines/
```

#### Bulk Actions
```http
POST /api/tasks/tasks/bulk_action/
```

**Request Body:**
```json
{
  "task_ids": ["id1", "id2", "id3"],
  "action": "complete",
  "priority": "high"
}
```

### Context Management

#### Add Context Entry
```http
POST /api/tasks/context/
```

**Request Body:**
```json
{
  "content": "Client called about urgent project deadline change",
  "source": "email"
}
```

#### Get Context Entries
```http
GET /api/tasks/context/
```

**Query Parameters:**
- `source`: Filter by source (whatsapp, email, notes, manual)
- `processed`: Filter by processing status
- `sentiment_min/max`: Filter by sentiment score
- `urgency_min/max`: Filter by urgency score

#### Context Processing Statistics
```http
GET /api/tasks/context/processing_stats/
```

**Response:**
```json
{
  "total_entries": 45,
  "processed_entries": 42,
  "pending_entries": 3,
  "avg_sentiment": 0.15,
  "avg_urgency": 0.62,
  "source_distribution": {
    "email": 20,
    "whatsapp": 15,
    "notes": 8,
    "manual": 2
  }
}
```

#### Recent AI Insights
```http
GET /api/tasks/context/recent_insights/
```

### Categories & Tags

#### Get Categories
```http
GET /api/tasks/categories/
```

#### Popular Categories
```http
GET /api/tasks/categories/popular/
```

#### Get Tags
```http
GET /api/tasks/tags/
```

#### Tag Suggestions
```http
GET /api/tasks/tags/suggestions/
```

### AI Analysis

#### Analyze Task with AI
```http
POST /api/ai/analyze/analyze_task/
```

**Request Body:**
```json
{
  "title": "Project deadline meeting",
  "description": "Important client project discussion",
  "include_context": true,
  "user_preferences": {
    "work_hours_start": "09:00",
    "work_hours_end": "17:00"
  }
}
```

**Response:**
```json
{
  "suggested_category": "Work",
  "suggested_priority": "high",
  "suggested_deadline": "2024-01-18T15:00:00Z",
  "enhanced_description": "Important client project discussion including timeline review, budget considerations, and next steps planning.",
  "suggested_tags": ["meeting", "client", "project", "deadline"],
  "reasoning": "High priority due to client involvement and project timeline impact. Suggested for business hours based on meeting context.",
  "confidence_score": 0.89,
  "analysis_timestamp": "2024-01-13T14:30:00Z"
}
```

#### Analyze Context with AI
```http
POST /api/ai/analyze/analyze_context/
```

**Request Body:**
```json
{
  "content": "Urgent: Client wants to move project deadline up by 2 weeks due to budget approval meeting",
  "source": "email",
  "extract_tasks": true,
  "analyze_sentiment": true
}
```

**Response:**
```json
{
  "insight_type": "deadline_change",
  "message": "Urgent deadline change detected. High priority task creation recommended.",
  "confidence": 0.92,
  "keywords": ["urgent", "deadline", "project", "budget", "client"],
  "urgency_score": 0.95,
  "sentiment_score": -0.3,
  "analysis_timestamp": "2024-01-13T14:30:00Z"
}
```

#### Async Task Analysis
```http
POST /api/ai/analyze/async_analyze_task/
```

**Request Body:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440021"
}
```

**Response:**
```json
{
  "status": "queued",
  "job_id": "celery-job-id",
  "message": "Task analysis queued for processing"
}
```

#### AI Capabilities
```http
GET /api/ai/analyze/capabilities/
```

**Response:**
```json
{
  "ai_enabled": true,
  "features": {
    "task_prioritization": true,
    "context_analysis": true,
    "deadline_suggestions": true,
    "smart_categorization": true,
    "productivity_insights": true,
    "keyword_extraction": true,
    "sentiment_analysis": true
  },
  "model_info": {
    "name": "Gemini Pro",
    "version": "1.0",
    "capabilities": ["text_generation", "analysis", "reasoning"]
  }
}
```

### Top-level AI Convenience Endpoints

To simplify frontend integration, the following convenience endpoints are exposed at the top-level `/api/ai/` path (aliases for the analyze viewset actions):

#### Get Task Suggestions
```http
POST /api/ai/suggestions/
```

Request Body (example):
```json
{
  "context": "I have a meeting with the client next week and need to prepare the proposal",
  "include_context": true,
  "user_preferences": { "work_hours_start": "09:00", "work_hours_end": "17:00" }
}
```

Response (example):
```json
{
  "suggestions": [
    {
      "suggested_title": "Prepare client proposal",
      "suggested_description": "Draft proposal covering timeline, scope and budget",
      "suggested_category": "Work",
      "suggested_priority": "high",
      "suggested_deadline": "2024-01-18T12:00:00Z",
      "suggested_tags": ["proposal","client"],
      "confidence_score": 0.87,
      "reasoning": "Client meeting next week and budget discussion imply higher urgency"
    }
  ],
  "context_analysis": { "context_used_count": 1 }
}
```

#### Prioritize Task
```http
POST /api/ai/prioritize/
```

Request Body: same as analyze task (`title`, `description`, `include_context`, `user_preferences`).

Response (example):
```json
{
  "priority_score": 86.0,
  "suggested_priority": "high",
  "reasoning": "Close deadline and client involvement",
  "confidence_score": 0.86
}
```

#### Suggest Deadline
```http
POST /api/ai/suggest-deadline/
```

Response (example):
```json
{
  "suggested_deadline": "2024-01-18T12:00:00Z",
  "confidence_score": 0.78,
  "reasoning": "Estimated based on task complexity and upcoming events"
}
```

#### Enhance Description
```http
POST /api/ai/enhance-description/
```

Response (example):
```json
{
  "enhanced_description": "Draft a one-page proposal covering objectives, timeline, owners, and estimated budget.",
  "suggested_tags": ["proposal","client"],
  "suggested_category": "Work",
  "confidence_score": 0.8,
  "reasoning": "Added structure and actionable steps based on context"
}
```

### AI Configuration

#### Get/Update AI Configuration
```http
GET /api/ai/config/
PUT /api/ai/config/
```

**Configuration Object:**
```json
{
  "auto_prioritization": true,
  "auto_categorization": true,
  "deadline_suggestions": true,
  "context_analysis": true,
  "min_confidence_threshold": 0.7,
  "processing_frequency": "realtime"
}
```

### AI Jobs & Insights

#### Get AI Processing Jobs
```http
GET /api/ai/jobs/
```

#### Recent AI Jobs
```http
GET /api/ai/jobs/recent/
```

#### AI Job Statistics
```http
GET /api/ai/jobs/stats/
```

#### Get AI Insights
```http
GET /api/ai/insights/
```

#### Unread Insights
```http
GET /api/ai/insights/unread/
```

#### Actionable Insights
```http
GET /api/ai/insights/actionable/
```

#### Mark Insight as Read
```http
POST /api/ai/insights/{id}/mark_read/
```

### Productivity Metrics

#### Get Productivity Metrics
```http
GET /api/tasks/metrics/
```

#### Weekly Summary
```http
GET /api/tasks/metrics/weekly_summary/
```

**Response:**
```json
{
  "daily_metrics": [
    {
      "date": "2024-01-12",
      "tasks_completed": 3,
      "tasks_created": 2,
      "total_focus_time": 240,
      "overall_productivity_score": 78.2
    }
  ],
  "weekly_summary": {
    "total_tasks_completed": 18,
    "total_tasks_created": 12,
    "total_focus_time": 1680,
    "avg_productivity_score": 82.5,
    "days_tracked": 7
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message description",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

- Standard endpoints: 100 requests per minute
- AI analysis endpoints: 20 requests per minute
- Bulk operations: 10 requests per minute

## Filtering & Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `page_size`: Results per page (default: 20, max: 100)
- `ordering`: Sort field (prefix with `-` for descending)
- `search`: Search in text fields

### Example
```http
GET /api/tasks/tasks/?page=2&page_size=10&ordering=-created_at&search=project
```

## Webhooks (Future Feature)

Webhook endpoints for real-time updates:
- Task status changes
- AI processing completion
- New insights available

## SDKs & Libraries

### JavaScript/TypeScript
```javascript
import { apiClient, API_ENDPOINTS } from './shared/api';

// Get tasks
const tasks = await apiClient.get(API_ENDPOINTS.tasks);

// Create task
const newTask = await apiClient.post(API_ENDPOINTS.tasks, {
  title: "New task",
  priority: "medium"
});
```

### Python
```python
import requests

# Base configuration
API_BASE = "http://localhost:8000/api"
headers = {"Content-Type": "application/json"}

# Get tasks
response = requests.get(f"{API_BASE}/tasks/tasks/", headers=headers)
tasks = response.json()
```

## Testing

### Test Data
Use the management command to set up test data:
```bash
python manage.py setup_smarttodos --demo-user
```

### Postman Collection
Import the provided Postman collection for API testing.

## Support

For API support:
- Documentation: [API Docs Link]
- Email: api-support@smarttodos.app
- Issues: [GitHub Issues Link]

---

**Note**: This API is actively developed. Check the changelog for updates and breaking changes.

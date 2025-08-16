# SmartTodos - Next.js Application

A production-ready full-stack Next.js application with Django backend, featuring AI-powered task management, context analysis, and productivity insights.

While the application comes with a Django REST backend, the frontend uses Next.js 14 with App Router for modern React development patterns.

## Tech Stack

- **Frontend**: Next.js 14 + App Router + TypeScript + TailwindCSS 3
- **Backend**: Django REST Framework with PostgreSQL
- **AI**: Google Gemini API integration
- **UI**: Radix UI + TailwindCSS 3 + Lucide React icons

## Project Structure

```
app/                      # Next.js App Router pages
├── page.tsx             # Home/Dashboard page
├── tasks/page.tsx       # Tasks management page  
├── context/page.tsx     # Daily context input page
├── insights/page.tsx    # AI insights dashboard
├── layout.tsx           # Root layout with providers
├── providers.tsx        # Theme and query providers
└── globals.css          # TailwindCSS 3 theming and global styles

components/              # React components
├── pages/               # Page-specific components
├── features/            # Feature components (Calendar, Export/Import)
├── layout/              # Layout components
├── theme/               # Theme toggle components
└── ui/                  # Pre-built UI component library

backend/                 # Django REST API backend
├── ai_engine/           # AI processing with Gemini API
├── tasks/               # Task management models and views
├── core/                # Core Django configuration
└── smarttodos/          # Main Django project settings

shared/                  # Types used by both frontend & backend
└── api.ts               # API interfaces and mock data
```

## Core Pages

- `app/page.tsx` represents the dashboard/home page with task overview
- `app/tasks/page.tsx` handles task management and creation
- `app/context/page.tsx` manages daily context input (messages, emails, notes)
- `app/insights/page.tsx` displays AI-powered analytics and recommendations
- Routes use Next.js App Router file-based routing system

## Styling

- **Primary**: TailwindCSS 3 utility classes
- **Theme and design tokens**: Configure in `app/globals.css` 
- **UI components**: Pre-built library in `components/ui/`
- **Utility**: `cn()` function combines `clsx` + `tailwind-merge` for conditional classes

## Development Commands

```bash
npm run dev         # Start Next.js dev server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # ESLint validation
npm run typecheck   # TypeScript validation
```

## Styling Guide

Open `app/globals.css` and `tailwind.config.ts` and add new tailwind colors.

## AI Features

The application integrates with Google Gemini API for:
- **Task Prioritization**: AI scoring based on context and urgency
- **Smart Suggestions**: Deadline recommendations and task enhancements
- **Context Analysis**: Sentiment analysis and keyword extraction from daily context
- **Productivity Insights**: Analytics and optimization recommendations

## Key Features

- **Task Management**: Create, edit, and organize tasks with AI assistance
- **Context Integration**: Add daily context (messages, emails, notes) for better AI suggestions
- **Calendar Integration**: Time-blocking interface with AI-optimized scheduling
- **Export/Import**: Support for JSON, CSV, and iCal formats
- **Dark Mode**: Full theme switching with next-themes
- **Real-time Updates**: Live data synchronization with Django backend

## Navigation

- Single-port development with Next.js dev server
- TypeScript throughout (frontend, backend, shared)
- AI-powered features with graceful fallbacks
- Responsive design with mobile-first approach

### New Page Route
1. Create component in `app/my-page/page.tsx`
2. Component will be automatically available at `/my-page`
3. Add navigation link in `components/layout/Layout.tsx`

### New API Integration
1. Add endpoint in `shared/api.ts` under `API_ENDPOINTS`
2. Create corresponding Django view in appropriate backend app
3. Use `useApi` hook in React components for data fetching

This architecture provides a modern, scalable foundation for AI-powered task management with excellent developer experience and performance.

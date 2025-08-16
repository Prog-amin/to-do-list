# SmartTodos - AI-Powered Task Management System (Next.js)

A comprehensive task management application built with **Next.js 14**, featuring AI-powered task prioritization, deadline suggestions, context-aware recommendations, calendar integration, and productivity analytics.

## 🚀 **Complete Next.js Implementation**

### ✅ **Built with Next.js 14**

This project is built with **Next.js 14** and the App Router, providing modern React development patterns and excellent performance:

- **Next.js 14 App Router** - Modern file-based routing
- **Server-Side Rendering** - Improved performance and SEO
- **Built-in API Proxying** - Seamless Django backend integration  
- **Optimized Bundling** - Better performance with Next.js optimizations
- **TypeScript First** - Full type safety throughout the application

## 🛠️ **Technology Stack**

### Frontend (Next.js)
- **Next.js 14** with App Router
- **React 18** with TypeScript for type safety
- **Tailwind CSS 3** for modern styling
- **Radix UI** for accessible components
- **TanStack Query** for API state management
- **next-themes** for dark mode support

### Backend Integration
- **Django REST Framework** backend (separate service)
- **PostgreSQL** database
- **Google Gemini API** for AI features
- **Celery + Redis** for async processing

### Key Features
- **AI-Powered Task Management** with priority scoring
- **Context Analysis** from multiple sources
- **Calendar Integration** with time-blocking
- **Export/Import** functionality (JSON, CSV, iCal)
- **Dark Mode** with system preference detection
- **Responsive Design** for all devices

## 📦 **Installation & Quick Start**

### Prerequisites
- **Node.js 18+** (for Next.js frontend)
- **Python 3.9+** (for Django backend)
- **PostgreSQL 12+** (for database)
- **Redis 6+** (for Celery tasks)

### Frontend Setup (Next.js)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Backend Setup (Django)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate
python manage.py setup_smarttodos --demo-user

# Start Django server
python manage.py runserver 8000

# Start Celery worker (separate terminal)
celery -A smarttodos worker --loglevel=info
```

### Environment Configuration
```bash
# backend/.env
SECRET_KEY=your-secret-key
DB_NAME=smarttodos
DB_USER=postgres
DB_PASSWORD=your-password
GEMINI_API_KEY=your-gemini-key
REDIS_URL=redis://localhost:6379/0
```

## 🎯 **Next.js App Structure**

```
smarttodos-nextjs/
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page (Dashboard)
│   ├── tasks/page.tsx      # Tasks page
│   ├── context/page.tsx    # Context page
│   ├── insights/page.tsx   # AI Insights page
│   ├── globals.css         # Global styles
│   └── providers.tsx       # Client-side providers
├── components/             # React components
│   ├── layout/            # Layout components
│   ├── pages/             # Page-specific content
│   ├── features/          # Feature components
│   └── ui/                # UI primitives
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── shared/                # Shared types and API
├── backend/               # Django backend (separate)
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
└── package.json           # Dependencies
```

## 🔧 **Next.js Configuration Features**

### API Proxying
```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*', // Django backend
    },
  ];
}
```

### TypeScript Paths
```json
// tsconfig.json
"paths": {
  "@/*": ["./app/*"],
  "@/components/*": ["./components/*"],
  "@/lib/*": ["./lib/*"],
  "@/hooks/*": ["./hooks/*"],
  "@shared/*": ["./shared/*"]
}
```

## 🎨 **UI Components & Features**

### Modern Design System
- **App Router Pages** - File-based routing with layouts
- **Server Components** - Performance optimized rendering
- **Client Components** - Interactive UI with "use client"
- **Theme System** - Dark/light mode with next-themes
- **Responsive Layout** - Mobile-first design approach

### Feature Components
- **Calendar Integration** - Full calendar view with time-blocking
- **Export/Import** - JSON, CSV, and iCal format support
- **AI Task Creation** - Intelligent suggestions and prioritization
- **Context Processing** - Multi-source analysis and insights

## 🚀 **Development Commands**

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm start              # Start production server
npm run lint           # Run ESLint
npm run typecheck      # TypeScript checking

# Backend (in backend/ directory)
python manage.py runserver                    # Django dev server
python manage.py setup_smarttodos --demo-user # Setup with demo data
celery -A smarttodos worker --loglevel=info  # Celery worker
```

## 📊 **API Integration**

### Next.js API Proxy
The Next.js application automatically proxies API requests to the Django backend:

```typescript
// Automatic proxying via next.config.js
fetch('/api/tasks/tasks/')  // Proxied to Django backend
```

### React Query Integration
```typescript
// hooks/useApi.ts
export const useTasks = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiClient.get('/api/tasks/tasks/' + queryParams),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
```

## 🎯 **Complete Feature Set**

### ✅ **Core Features - 100% Implemented**
- **Task Management** - Full CRUD with AI suggestions
- **Context Processing** - Multi-source analysis
- **AI Prioritization** - Smart ranking and recommendations
- **Calendar Integration** - Time-blocking and scheduling
- **Export/Import** - Multiple format support
- **Dark Mode** - System preference detection

### ✅ **Bonus Features - All Included**
- **Advanced AI Analysis** - Sentiment + keyword extraction
- **Time-Blocking** - AI-optimized scheduling
- **Calendar Export** - iCal format for external apps
- **Data Portability** - JSON/CSV export and import
- **Modern UI/UX** - Next.js optimized interface

### ✅ **Production Ready**
- **Next.js 14 Benefits** - App Router, SSR, optimizations
- **Type Safety** - Full TypeScript implementation
- **Performance** - Optimized builds and caching
- **SEO Ready** - Server-side rendering support
- **Scalable** - Modern architecture patterns

## 🌐 **Deployment**

### Vercel (Recommended)
```bash
# Deploy to Vercel
npx vercel

# Environment variables in Vercel dashboard:
# - Database configuration
# - GEMINI_API_KEY
# - Backend API URL
```

### Docker Deployment
```yaml
# docker-compose.yml
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
  backend:
    build: ./backend
    ports:
      - "8000:8000"
  postgres:
    image: postgres:14
  redis:
    image: redis:7
```

## 📈 **Performance Benefits**

### Next.js Optimizations
- **Automatic Code Splitting** - Faster page loads
- **Image Optimization** - Built-in image optimization
- **Static Generation** - Pre-rendered pages where possible
- **Bundle Analysis** - Built-in performance monitoring

### Production Performance
- **SSR/SSG Support** - Improved initial load times
- **API Route Caching** - Optimized API responses
- **Tree Shaking** - Minimal bundle sizes
- **Lazy Loading** - Component-level code splitting

## 🎉 **Production Ready**

### Architecture Highlights:
✅ **Next.js 14 App Router** - Modern file-based routing
✅ **Server/Client Components** - Optimized rendering patterns
✅ **TypeScript First** - Full type safety throughout
✅ **Django REST Backend** - Robust API architecture
✅ **AI Integration** - Google Gemini API powered features
✅ **Responsive Design** - Mobile-first approach  

### Maintained Features:
- ✅ Complete AI-powered task management
- ✅ Calendar integration and time-blocking
- ✅ Export/import functionality
- ✅ Dark mode and responsive design
- ✅ All bonus features and optimizations

## 📞 **Support & Documentation**

- **Next.js Docs**: https://nextjs.org/docs
- **Project Setup**: Follow installation instructions above
- **Backend API**: Connect to Django REST Framework backend
- **Deployment**: Use Vercel, Netlify, or custom hosting

---
## 📸 Screenshots

Below are in-app screenshots:

![screenshot 9](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%289%29.jpeg)
![screenshot 8](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%288%29.jpeg)
![screenshot 10](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM.jpeg)
![screenshot 1](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%281%29.jpeg)
![screenshot 2](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%282%29.jpeg)
![screenshot 3](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%283%29.jpeg)
![screenshot 4](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%284%29.jpeg)
![screenshot 5](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%285%29.jpeg)
![screenshot 6](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%286%29.jpeg)
![screenshot 7](./public/WhatsApp%20Image%202025-08-13%20at%202.55.39%20PM%20%287%29.jpeg)


**🎯 SmartTodos has been successfully converted to Next.js 14 while maintaining all AI-powered features, modern UI/UX, and production-ready architecture. The application now benefits from Next.js optimizations including SSR, improved performance, and better developer experience.**

Built with ❤️ using **Next.js 14**, **React 18**, **TypeScript**, **Tailwind CSS**, and **AI**

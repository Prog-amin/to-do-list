"""
API Views for tasks app
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    Category, Tag, Task, ContextEntry, 
    TaskComment, ProductivityMetrics
)
from .serializers import (
    CategorySerializer, TagSerializer, TaskListSerializer,
    TaskDetailSerializer, ContextEntrySerializer, TaskCommentSerializer,
    ProductivityMetricsSerializer, TaskCreateRequestSerializer,
    BulkTaskActionSerializer
)
from .filters import TaskFilter, ContextEntryFilter
from ai_engine.tasks import process_task_creation
from ai_engine.tasks import process_context_entry


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing task categories
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'usage_count', 'created_at']
    ordering = ['-usage_count', 'name']
    
    def get_queryset(self):
        return Category.objects.filter(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular categories"""
        categories = self.get_queryset().order_by('-usage_count')[:10]
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tags
    """
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'usage_count', 'created_at']
    ordering = ['-usage_count', 'name']
    
    def get_queryset(self):
        return Tag.objects.all()
    
    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Get tag suggestions based on user's task history"""
        user_tasks = Task.objects.filter(user=request.user)
        popular_tags = Tag.objects.filter(
            task__in=user_tasks
        ).annotate(
            user_usage=Count('task')
        ).order_by('-user_usage')[:20]
        
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks with AI features
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description', 'ai_enhanced_description']
    ordering_fields = [
        'title', 'priority', 'status', 'deadline', 'created_at',
        'ai_priority_score', 'estimated_duration'
    ]
    ordering = ['-ai_priority_score', '-created_at']
    
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related(
            'category', 'user'
        ).prefetch_related('tags', 'comments')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        return TaskDetailSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        stats = {
            'total_tasks': queryset.count(),
            'completed_tasks': queryset.filter(status='completed').count(),
            'urgent_tasks': queryset.filter(priority='urgent').count(),
            'overdue_tasks': queryset.filter(
                deadline__lt=timezone.now(),
                status__in=['todo', 'in_progress']
            ).count(),
            'todays_due_tasks': queryset.filter(
                deadline__date=today
            ).count(),
            'in_progress_tasks': queryset.filter(status='in_progress').count(),
            'avg_ai_score': queryset.aggregate(
                avg_score=Avg('ai_priority_score')
            )['avg_score'] or 0,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def priority_distribution(self, request):
        """Get task priority distribution"""
        queryset = self.get_queryset()
        distribution = {}
        
        for priority, _ in Task.PRIORITY_CHOICES:
            distribution[priority] = queryset.filter(priority=priority).count()
        
        return Response(distribution)
    
    @action(detail=False, methods=['get'])
    def upcoming_deadlines(self, request):
        """Get tasks with upcoming deadlines"""
        next_week = timezone.now() + timedelta(days=7)
        upcoming_tasks = self.get_queryset().filter(
            deadline__lte=next_week,
            deadline__gte=timezone.now(),
            status__in=['todo', 'in_progress']
        ).order_by('deadline')
        
        serializer = TaskListSerializer(upcoming_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a task"""
        task = self.get_object()
        serializer = TaskCommentSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(task=task)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on tasks"""
        serializer = BulkTaskActionSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        task_ids = serializer.validated_data['task_ids']
        action_type = serializer.validated_data['action']
        
        tasks = self.get_queryset().filter(id__in=task_ids)
        
        if action_type == 'complete':
            tasks.update(status='completed')
        elif action_type == 'delete':
            tasks.delete()
        elif action_type == 'update_priority':
            priority = serializer.validated_data.get('priority')
            if priority:
                tasks.update(priority=priority)
        # Add more bulk actions as needed
        
        return Response({'message': f'Bulk action {action_type} completed'})
    
    @action(detail=False, methods=['post'])
    def create_with_ai(self, request):
        """Create a task with AI assistance"""
        serializer = TaskCreateRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # For now, create task without AI processing
        # AI processing would be implemented in ai_engine app
        task_data = serializer.validated_data
        
        # Create the task
        task_serializer = TaskDetailSerializer(
            data=task_data,
            context={'request': request}
        )
        
        if task_serializer.is_valid():
            task = task_serializer.save()

            # Trigger AI processing asynchronously
            try:
                process_task_creation.delay(str(task.id), request.user.id)
            except Exception:
                # Log/ignore - job will not be processed if Celery is not running
                pass
            
            return Response(
                TaskDetailSerializer(task, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(task_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContextEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing context entries
    """
    serializer_class = ContextEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ContextEntryFilter
    search_fields = ['content', 'extracted_keywords']
    ordering_fields = ['created_at', 'source', 'sentiment_score', 'urgency_score']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return ContextEntry.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def processing_stats(self, request):
        """Get context processing statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_entries': queryset.count(),
            'processed_entries': queryset.filter(processed=True).count(),
            'pending_entries': queryset.filter(processed=False).count(),
            'avg_sentiment': queryset.aggregate(
                avg_sentiment=Avg('sentiment_score')
            )['avg_sentiment'] or 0,
            'avg_urgency': queryset.aggregate(
                avg_urgency=Avg('urgency_score')
            )['avg_urgency'] or 0,
        }
        
        # Source distribution
        source_stats = {}
        for source, _ in ContextEntry.SOURCE_CHOICES:
            source_stats[source] = queryset.filter(source=source).count()
        
        stats['source_distribution'] = source_stats
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def recent_insights(self, request):
        """Get recent AI insights from context"""
        recent_entries = self.get_queryset().filter(
            processed=True,
            ai_insights__isnull=False
        ).order_by('-created_at')[:10]
        
        insights = []
        for entry in recent_entries:
            if entry.ai_insights:
                insights.extend([
                    {
                        'entry_id': entry.id,
                        'insight': insight,
                        'created_at': entry.created_at
                    }
                    for insight in entry.ai_insights
                ])
        
        return Response(insights)
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """Reprocess a context entry with AI"""
        context_entry = self.get_object()
        
        # Trigger AI reprocessing asynchronously
        try:
            process_context_entry.delay(str(context_entry.id))
        except Exception:
            pass
        
        return Response({
            'message': 'Context entry queued for reprocessing',
            'entry_id': context_entry.id
        })


class ProductivityMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for productivity metrics
    """
    serializer_class = ProductivityMetricsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date']
    ordering_fields = ['date', 'overall_productivity_score']
    ordering = ['-date']
    
    def get_queryset(self):
        return ProductivityMetrics.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def weekly_summary(self, request):
        """Get weekly productivity summary"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=7)
        
        metrics = self.get_queryset().filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        serializer = self.get_serializer(metrics, many=True)
        
        # Calculate weekly aggregates
        if metrics:
            weekly_stats = {
                'total_tasks_completed': sum(m.tasks_completed for m in metrics),
                'total_tasks_created': sum(m.tasks_created for m in metrics),
                'total_focus_time': sum(m.total_focus_time for m in metrics),
                'avg_productivity_score': sum(
                    m.overall_productivity_score for m in metrics
                ) / len(metrics),
                'days_tracked': len(metrics),
            }
        else:
            weekly_stats = {
                'total_tasks_completed': 0,
                'total_tasks_created': 0,
                'total_focus_time': 0,
                'avg_productivity_score': 0,
                'days_tracked': 0,
            }
        
        return Response({
            'daily_metrics': serializer.data,
            'weekly_summary': weekly_stats
        })

"""
AI Engine API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from .models import AIProcessingJob, AIInsight, AIConfiguration
from .serializers import (
    AIProcessingJobSerializer, AIInsightSerializer, 
    AIConfigurationSerializer, TaskAnalysisRequestSerializer,
    ContextAnalysisRequestSerializer
)
from .ai_core import ai_processor
from .tasks import process_task_creation, process_context_entry


class AIConfigurationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AI configuration management
    """
    serializer_class = AIConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIConfiguration.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create AI configuration for the user"""
        config, created = AIConfiguration.objects.get_or_create(
            user=self.request.user
        )
        return config


class AIProcessingJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for AI processing jobs
    """
    serializer_class = AIProcessingJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIProcessingJob.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent AI processing jobs"""
        recent_jobs = self.get_queryset().order_by('-created_at')[:20]
        serializer = self.get_serializer(recent_jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get AI processing statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_jobs': queryset.count(),
            'completed_jobs': queryset.filter(status='completed').count(),
            'failed_jobs': queryset.filter(status='failed').count(),
            'pending_jobs': queryset.filter(status='pending').count(),
            'processing_jobs': queryset.filter(status='processing').count(),
        }
        
        # Job type distribution
        job_types = {}
        for job_type, _ in AIProcessingJob.JOB_TYPES:
            job_types[job_type] = queryset.filter(job_type=job_type).count()
        
        stats['job_type_distribution'] = job_types
        
        # Recent performance
        recent_jobs = queryset.filter(
            created_at__gte=timezone.now() - timedelta(days=7),
            status='completed'
        )
        
        if recent_jobs.exists():
            avg_processing_time = sum(
                job.processing_time or 0 for job in recent_jobs
            ) / len(recent_jobs)
            avg_confidence = sum(
                job.confidence_score or 0 for job in recent_jobs
            ) / len(recent_jobs)
        else:
            avg_processing_time = 0
            avg_confidence = 0
        
        stats['recent_performance'] = {
            'avg_processing_time': avg_processing_time,
            'avg_confidence_score': avg_confidence,
            'jobs_last_week': recent_jobs.count()
        }
        
        return Response(stats)


class AIInsightViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AI insights management
    """
    serializer_class = AIInsightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIInsight.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread insights"""
        unread_insights = self.get_queryset().filter(is_read=False).order_by('-created_at')
        serializer = self.get_serializer(unread_insights, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def actionable(self, request):
        """Get actionable insights"""
        actionable_insights = self.get_queryset().filter(
            is_actionable=True,
            is_dismissed=False
        ).order_by('-impact_score', '-created_at')
        serializer = self.get_serializer(actionable_insights, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark insight as read"""
        insight = self.get_object()
        insight.is_read = True
        insight.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss insight"""
        insight = self.get_object()
        insight.is_dismissed = True
        insight.save()
        return Response({'status': 'dismissed'})
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Provide feedback on insight"""
        insight = self.get_object()
        feedback = request.data.get('feedback')
        
        if feedback in ['helpful', 'not_helpful', 'already_known']:
            insight.user_feedback = feedback
            insight.save()
            return Response({'status': 'feedback recorded'})
        
        return Response(
            {'error': 'Invalid feedback value'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AIAnalysisViewSet(viewsets.ViewSet):
    """
    ViewSet for AI analysis endpoints
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'ai_analysis'
    
    @action(detail=False, methods=['post'])
    def analyze_task(self, request):
        """Analyze a task and provide AI suggestions"""
        serializer = TaskAnalysisRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        try:
            # Get user's recent context if requested
            context_data = []
            if data.get('include_context', True):
                recent_context = request.user.context_entries.filter(
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).order_by('-created_at')[:10]
                context_data = [entry.content for entry in recent_context]
            
            # Get AI suggestions
            suggestion = ai_processor.analyze_task_priority(
                title=data['title'],
                description=data.get('description', ''),
                context_data=context_data,
                user_preferences=data.get('user_preferences')
            )
            
            # Format response
            response_data = {
                'suggested_category': suggestion.suggested_category,
                'suggested_priority': suggestion.suggested_priority,
                'suggested_deadline': suggestion.suggested_deadline,
                'enhanced_description': suggestion.enhanced_description,
                'suggested_tags': suggestion.suggested_tags,
                'reasoning': suggestion.reasoning,
                'confidence_score': suggestion.confidence_score,
                'analysis_timestamp': timezone.now().isoformat()
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': f'Analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def analyze_context(self, request):
        """Analyze context and extract insights"""
        serializer = ContextAnalysisRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        try:
            # Analyze context with AI
            insight = ai_processor.analyze_context_entry(
                content=data['content'],
                source=data.get('source', 'manual')
            )
            
            # Extract keywords
            keywords = ai_processor.extract_keywords(data['content'])
            
            # Format response
            response_data = {
                'insight_type': insight.insight_type,
                'message': insight.message,
                'confidence': insight.confidence,
                'keywords': keywords,
                'urgency_score': insight.urgency_score,
                'sentiment_score': insight.sentiment_score,
                'analysis_timestamp': timezone.now().isoformat()
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': f'Context analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def async_analyze_task(self, request):
        """Queue async task analysis"""
        task_id = request.data.get('task_id')
        
        if not task_id:
            return Response(
                {'error': 'task_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Queue the task for processing
        job = process_task_creation.delay(task_id, request.user.id)
        
        return Response({
            'status': 'queued',
            'job_id': job.id,
            'message': 'Task analysis queued for processing'
        })
    
    @action(detail=False, methods=['post'])
    def async_analyze_context(self, request):
        """Queue async context analysis"""
        context_entry_id = request.data.get('context_entry_id')
        
        if not context_entry_id:
            return Response(
                {'error': 'context_entry_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Queue the context entry for processing
        job = process_context_entry.delay(context_entry_id)
        
        return Response({
            'status': 'queued',
            'job_id': job.id,
            'message': 'Context analysis queued for processing'
        })
    
    @action(detail=False, methods=['get'])
    def capabilities(self, request):
        """Get AI capabilities and status"""
        return Response({
            'ai_enabled': ai_processor.enabled,
            'features': {
                'task_prioritization': True,
                'context_analysis': True,
                'deadline_suggestions': True,
                'smart_categorization': True,
                'productivity_insights': True,
                'keyword_extraction': True,
                'sentiment_analysis': True
            },
            'model_info': {
                'name': 'Gemini Pro' if ai_processor.enabled else 'Mock AI',
                'version': '1.0',
                'capabilities': [
                    'text_generation',
                    'analysis',
                    'reasoning'
                ]
            }
        })

    @action(detail=False, methods=['post'], url_path='suggestions')
    def suggestions(self, request):
        """Get task suggestions from free-form context (alias for analyze_task)
        Exposed as `/api/ai/suggestions/` to match documentation.
        """
        # Reuse analyze_task logic but accept a `context` field as input
        data = request.data or {}
        context_text = data.get('context') or ''
        title = data.get('title') or ''
        description = data.get('description') or ''

        try:
            # If no explicit title provided, use short context as title
            if not title and context_text:
                title = (context_text[:120])

            # Use recent context entries if requested
            context_data = []
            if data.get('include_context', True) and request.user.is_authenticated:
                recent_context = request.user.context_entries.filter(
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).order_by('-created_at')[:10]
                context_data = [entry.content for entry in recent_context]

            # Merge provided context
            if context_text:
                context_data.insert(0, context_text)

            suggestion = ai_processor.analyze_task_priority(
                title=title,
                description=description,
                context_data=context_data,
                user_preferences=data.get('user_preferences')
            )

            response_data = {
                'suggestions': [
                    {
                        'suggested_title': title or suggestion.enhanced_description[:80],
                        'suggested_description': suggestion.enhanced_description,
                        'suggested_category': suggestion.suggested_category,
                        'suggested_priority': suggestion.suggested_priority,
                        'suggested_deadline': suggestion.suggested_deadline.isoformat() if suggestion.suggested_deadline else None,
                        'suggested_tags': suggestion.suggested_tags,
                        'confidence_score': suggestion.confidence_score,
                        'reasoning': suggestion.reasoning
                    }
                ],
                'context_analysis': {
                    'context_used_count': len(context_data)
                }
            }

            return Response(response_data)

        except Exception as e:
            return Response({'error': f'Suggestions failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='prioritize')
    def prioritize(self, request):
        """Return a priority score and reasoning for a task.
        Exposed as `/api/ai/prioritize/`.
        """
        serializer = TaskAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            context_data = []
            if data.get('include_context', True) and request.user.is_authenticated:
                recent_context = request.user.context_entries.filter(
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).order_by('-created_at')[:10]
                context_data = [entry.content for entry in recent_context]

            suggestion = ai_processor.analyze_task_priority(
                title=data['title'],
                description=data.get('description', ''),
                context_data=context_data,
                user_preferences=data.get('user_preferences')
            )

            return Response({
                'priority_score': suggestion.confidence_score * 100,
                'suggested_priority': suggestion.suggested_priority,
                'reasoning': suggestion.reasoning,
                'confidence_score': suggestion.confidence_score
            })

        except Exception as e:
            return Response({'error': f'Prioritization failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='suggest-deadline')
    def suggest_deadline(self, request):
        """Suggest a deadline for a task. Exposed as `/api/ai/suggest-deadline/`.
        Uses the task analysis result to compute a suggested deadline.
        """
        serializer = TaskAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            context_data = []
            if data.get('include_context', True) and request.user.is_authenticated:
                recent_context = request.user.context_entries.filter(
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).order_by('-created_at')[:10]
                context_data = [entry.content for entry in recent_context]

            suggestion = ai_processor.analyze_task_priority(
                title=data['title'],
                description=data.get('description', ''),
                context_data=context_data,
                user_preferences=data.get('user_preferences')
            )

            suggested_deadline = suggestion.suggested_deadline
            return Response({
                'suggested_deadline': suggested_deadline.isoformat() if suggested_deadline else None,
                'confidence_score': suggestion.confidence_score,
                'reasoning': suggestion.reasoning
            })

        except Exception as e:
            return Response({'error': f'Deadline suggestion failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='enhance-description')
    def enhance_description(self, request):
        """Enhance a task description using AI. Exposed as `/api/ai/enhance-description/`.
        """
        serializer = TaskAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            context_data = []
            if data.get('include_context', True) and request.user.is_authenticated:
                recent_context = request.user.context_entries.filter(
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).order_by('-created_at')[:10]
                context_data = [entry.content for entry in recent_context]

            suggestion = ai_processor.analyze_task_priority(
                title=data['title'],
                description=data.get('description', ''),
                context_data=context_data,
                user_preferences=data.get('user_preferences')
            )

            return Response({
                'enhanced_description': suggestion.enhanced_description,
                'suggested_tags': suggestion.suggested_tags,
                'suggested_category': suggestion.suggested_category,
                'confidence_score': suggestion.confidence_score,
                'reasoning': suggestion.reasoning
            })

        except Exception as e:
            return Response({'error': f'Description enhancement failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

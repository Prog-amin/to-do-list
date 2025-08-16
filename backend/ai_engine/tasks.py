"""
Celery tasks for AI processing
Handles async AI operations to avoid blocking the main thread
"""

import logging
from celery import shared_task
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from tasks.models import Task, ContextEntry, ProductivityMetrics
from .models import AIProcessingJob, AIInsight
from .ai_core import ai_processor

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_task_creation(self, task_id: str, user_id: int = None):
    """
    Process a newly created task with AI suggestions
    """
    try:
        task = Task.objects.get(id=task_id)
        
        # Create AI job record
        ai_job = AIProcessingJob.objects.create(
            user=task.user,
            job_type='task_prioritization',
            status='processing',
            input_data={
                'task_id': str(task_id),
                'title': task.title,
                'description': task.description
            }
        )
        
        # Get recent context for the user
        recent_context = ContextEntry.objects.filter(
            user=task.user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:10]
        
        context_data = [entry.content for entry in recent_context]
        
        # Get AI suggestions
        start_time = timezone.now()
        suggestion = ai_processor.analyze_task_priority(
            title=task.title,
            description=task.description,
            context_data=context_data
        )
        processing_time = (timezone.now() - start_time).total_seconds()
        
        # Update task with AI suggestions
        task.ai_priority_score = suggestion.confidence_score * 100
        task.ai_confidence_score = suggestion.confidence_score * 100
        task.ai_reasoning = suggestion.reasoning
        task.ai_enhanced_description = suggestion.enhanced_description
        task.ai_suggested_tags = suggestion.suggested_tags
        
        # Update priority and deadline if confidence is high
        if suggestion.confidence_score > 0.7:
            task.priority = suggestion.suggested_priority
            if suggestion.suggested_deadline and not task.deadline:
                task.deadline = suggestion.suggested_deadline
        
        task.save()
        
        # Update AI job status
        ai_job.status = 'completed'
        ai_job.output_data = {
            'ai_priority_score': task.ai_priority_score,
            'suggested_priority': suggestion.suggested_priority,
            'suggested_category': suggestion.suggested_category,
            'suggested_tags': suggestion.suggested_tags
        }
        ai_job.confidence_score = suggestion.confidence_score
        ai_job.processing_time = processing_time
        ai_job.save()
        
        logger.info(f"Successfully processed task {task_id} with AI")
        return {'status': 'success', 'task_id': str(task_id)}
        
    except Task.DoesNotExist:
        logger.error(f"Task {task_id} not found")
        return {'status': 'error', 'message': 'Task not found'}
    except Exception as e:
        logger.error(f"Error processing task {task_id}: {e}")
        
        # Update AI job status
        try:
            ai_job.status = 'failed'
            ai_job.error_message = str(e)
            ai_job.retry_count = self.request.retries
            ai_job.save()
        except:
            pass
        
        # Retry the task
        if self.request.retries < 3:
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        return {'status': 'error', 'message': str(e)}


@shared_task(bind=True, max_retries=3)
def process_context_entry(self, context_entry_id: str):
    """
    Process a context entry with AI analysis
    """
    try:
        context_entry = ContextEntry.objects.get(id=context_entry_id)
        
        # Create AI job record
        ai_job = AIProcessingJob.objects.create(
            user=context_entry.user,
            job_type='context_analysis',
            status='processing',
            input_data={
                'context_entry_id': str(context_entry_id),
                'content': context_entry.content[:500],  # Store limited content
                'source': context_entry.source
            }
        )
        
        # Analyze context with AI
        start_time = timezone.now()
        insight = ai_processor.analyze_context_entry(
            content=context_entry.content,
            source=context_entry.source
        )
        processing_time = (timezone.now() - start_time).total_seconds()
        
        # Extract keywords
        keywords = ai_processor.extract_keywords(context_entry.content)
        
        # Update context entry
        context_entry.processed = True
        context_entry.ai_insights = [insight.message]
        context_entry.extracted_keywords = keywords
        context_entry.sentiment_score = insight.sentiment_score
        context_entry.urgency_score = insight.urgency_score
        context_entry.save()
        
        # Create AI insight record
        ai_insight = AIInsight.objects.create(
            user=context_entry.user,
            insight_type='context_connection',
            title=f"Context from {context_entry.get_source_display()}",
            description=insight.message,
            confidence_score=insight.confidence,
            impact_score=insight.urgency_score,
            is_actionable=insight.urgency_score > 0.5
        )
        ai_insight.related_contexts.add(context_entry)
        
        # Update AI job status
        ai_job.status = 'completed'
        ai_job.output_data = {
            'insights': [insight.message],
            'keywords': keywords,
            'sentiment_score': insight.sentiment_score,
            'urgency_score': insight.urgency_score
        }
        ai_job.confidence_score = insight.confidence
        ai_job.processing_time = processing_time
        ai_job.save()
        
        logger.info(f"Successfully processed context entry {context_entry_id}")
        return {'status': 'success', 'context_entry_id': str(context_entry_id)}
        
    except ContextEntry.DoesNotExist:
        logger.error(f"Context entry {context_entry_id} not found")
        return {'status': 'error', 'message': 'Context entry not found'}
    except Exception as e:
        logger.error(f"Error processing context entry {context_entry_id}: {e}")
        
        # Update AI job status
        try:
            ai_job.status = 'failed'
            ai_job.error_message = str(e)
            ai_job.retry_count = self.request.retries
            ai_job.save()
        except:
            pass
        
        # Retry the task
        if self.request.retries < 3:
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        return {'status': 'error', 'message': str(e)}


@shared_task
def generate_daily_productivity_insights(user_id: int = None):
    """
    Generate daily productivity insights for users
    """
    try:
        users = [User.objects.get(id=user_id)] if user_id else User.objects.filter(is_active=True)
        
        for user in users:
            try:
                # Get user's recent data
                recent_tasks = Task.objects.filter(
                    user=user,
                    created_at__gte=timezone.now() - timedelta(days=30)
                )
                
                recent_context = ContextEntry.objects.filter(
                    user=user,
                    created_at__gte=timezone.now() - timedelta(days=30)
                )
                
                recent_metrics = ProductivityMetrics.objects.filter(
                    user=user,
                    date__gte=timezone.now().date() - timedelta(days=30)
                )
                
                # Prepare data for AI analysis
                task_data = [
                    {
                        'id': str(task.id),
                        'title': task.title,
                        'priority': task.priority,
                        'status': task.status,
                        'created_at': task.created_at.isoformat(),
                        'deadline': task.deadline.isoformat() if task.deadline else None
                    }
                    for task in recent_tasks
                ]
                
                context_data = [
                    {
                        'id': str(entry.id),
                        'source': entry.source,
                        'created_at': entry.created_at.isoformat(),
                        'urgency_score': entry.urgency_score
                    }
                    for entry in recent_context
                ]
                
                metrics_summary = {
                    'avg_productivity_score': recent_metrics.aggregate(
                        avg_score=models.Avg('overall_productivity_score')
                    )['avg_score'] or 0,
                    'total_completed_tasks': sum(m.tasks_completed for m in recent_metrics),
                    'total_focus_time': sum(m.total_focus_time for m in recent_metrics),
                }
                
                # Generate insights
                insights = ai_processor.generate_productivity_insights(
                    task_data=task_data,
                    context_data=context_data,
                    metrics_data=metrics_summary
                )
                
                # Save insights
                for insight_data in insights:
                    AIInsight.objects.create(
                        user=user,
                        insight_type=insight_data.get('type', 'productivity_pattern'),
                        title=insight_data.get('title', 'Productivity Insight'),
                        description=insight_data.get('description', ''),
                        confidence_score=0.8,
                        impact_score=insight_data.get('impact_score', 0.5),
                        is_actionable=insight_data.get('actionable', True)
                    )
                
                logger.info(f"Generated {len(insights)} insights for user {user.username}")
                
            except Exception as e:
                logger.error(f"Error generating insights for user {user.username}: {e}")
                continue
        
        return {'status': 'success', 'users_processed': len(users)}
        
    except Exception as e:
        logger.error(f"Error in daily insights generation: {e}")
        return {'status': 'error', 'message': str(e)}


@shared_task
def update_productivity_metrics():
    """
    Update daily productivity metrics for all users
    """
    try:
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        active_users = User.objects.filter(is_active=True)
        
        for user in active_users:
            try:
                # Get yesterday's data
                tasks_completed = Task.objects.filter(
                    user=user,
                    status='completed',
                    updated_at__date=yesterday
                ).count()
                
                tasks_created = Task.objects.filter(
                    user=user,
                    created_at__date=yesterday
                ).count()
                
                # Calculate productivity score (simple algorithm)
                productivity_score = min(100, (tasks_completed * 20) + (tasks_created * 5))
                
                # Create or update metrics
                metrics, created = ProductivityMetrics.objects.get_or_create(
                    user=user,
                    date=yesterday,
                    defaults={
                        'tasks_completed': tasks_completed,
                        'tasks_created': tasks_created,
                        'overall_productivity_score': productivity_score,
                    }
                )
                
                if not created:
                    metrics.tasks_completed = tasks_completed
                    metrics.tasks_created = tasks_created
                    metrics.overall_productivity_score = productivity_score
                    metrics.save()
                
                logger.info(f"Updated metrics for user {user.username}: {productivity_score}")
                
            except Exception as e:
                logger.error(f"Error updating metrics for user {user.username}: {e}")
                continue
        
        return {'status': 'success', 'users_processed': len(active_users)}
        
    except Exception as e:
        logger.error(f"Error updating productivity metrics: {e}")
        return {'status': 'error', 'message': str(e)}


@shared_task
def cleanup_old_ai_jobs():
    """
    Clean up old AI processing jobs
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=30)
        old_jobs = AIProcessingJob.objects.filter(created_at__lt=cutoff_date)
        count = old_jobs.count()
        old_jobs.delete()
        
        logger.info(f"Cleaned up {count} old AI jobs")
        return {'status': 'success', 'jobs_deleted': count}
        
    except Exception as e:
        logger.error(f"Error cleaning up AI jobs: {e}")
        return {'status': 'error', 'message': str(e)}

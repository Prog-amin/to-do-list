"""
AI Engine models for storing AI processing results and configurations
"""

from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel
import json


class AIConfiguration(TimeStampedModel):
    """
    Store AI configuration and preferences per user
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_config')
    
    # AI Model preferences
    gemini_model = models.CharField(max_length=50, default='gemini-pro')
    temperature = models.FloatField(default=0.7)
    max_tokens = models.PositiveIntegerField(default=1000)
    
    # Feature toggles
    auto_prioritization = models.BooleanField(default=True)
    auto_categorization = models.BooleanField(default=True)
    deadline_suggestions = models.BooleanField(default=True)
    context_analysis = models.BooleanField(default=True)
    
    # Processing preferences
    min_confidence_threshold = models.FloatField(default=0.6)
    processing_frequency = models.CharField(
        max_length=20,
        choices=[
            ('realtime', 'Real-time'),
            ('hourly', 'Hourly'),
            ('daily', 'Daily'),
        ],
        default='realtime'
    )
    
    def __str__(self):
        return f"AI Config for {self.user.username}"
    
    class Meta:
        db_table = 'ai_configurations'


class AIProcessingJob(TimeStampedModel):
    """
    Track AI processing jobs and their status
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    JOB_TYPES = [
        ('task_prioritization', 'Task Prioritization'),
        ('context_analysis', 'Context Analysis'),
        ('deadline_suggestion', 'Deadline Suggestion'),
        ('categorization', 'Auto Categorization'),
        ('enhancement', 'Task Enhancement'),
        ('bulk_processing', 'Bulk Processing'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_jobs')
    job_type = models.CharField(max_length=30, choices=JOB_TYPES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    
    # Input data
    input_data = models.JSONField(default=dict)
    
    # Results
    output_data = models.JSONField(default=dict, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    processing_time = models.FloatField(null=True, blank=True, help_text="Time in seconds")
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.get_job_type_display()} - {self.status}"
    
    class Meta:
        db_table = 'ai_processing_jobs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['job_type', 'status']),
        ]


class AIInsight(TimeStampedModel):
    """
    Store AI-generated insights and recommendations
    """
    INSIGHT_TYPES = [
        ('productivity_pattern', 'Productivity Pattern'),
        ('time_optimization', 'Time Optimization'),
        ('priority_suggestion', 'Priority Suggestion'),
        ('deadline_warning', 'Deadline Warning'),
        ('context_connection', 'Context Connection'),
        ('workload_balance', 'Workload Balance'),
        ('focus_recommendation', 'Focus Recommendation'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_insights')
    insight_type = models.CharField(max_length=30, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Metadata
    confidence_score = models.FloatField()
    impact_score = models.FloatField(help_text="Expected impact (0-1)")
    is_actionable = models.BooleanField(default=True)
    
    # User interaction
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    user_feedback = models.CharField(
        max_length=20,
        choices=[
            ('helpful', 'Helpful'),
            ('not_helpful', 'Not Helpful'),
            ('already_known', 'Already Known'),
        ],
        blank=True
    )
    
    # Related objects
    related_tasks = models.ManyToManyField('tasks.Task', blank=True)
    related_contexts = models.ManyToManyField('tasks.ContextEntry', blank=True)
    
    def __str__(self):
        return f"{self.title} ({self.get_insight_type_display()})"
    
    class Meta:
        db_table = 'ai_insights'
        ordering = ['-confidence_score', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['insight_type']),
        ]


class AIModelPerformance(TimeStampedModel):
    """
    Track AI model performance metrics
    """
    model_name = models.CharField(max_length=100)
    model_version = models.CharField(max_length=50)
    
    # Performance metrics
    accuracy_score = models.FloatField()
    precision_score = models.FloatField()
    recall_score = models.FloatField()
    f1_score = models.FloatField()
    
    # Usage metrics
    total_requests = models.PositiveIntegerField(default=0)
    successful_requests = models.PositiveIntegerField(default=0)
    failed_requests = models.PositiveIntegerField(default=0)
    average_response_time = models.FloatField(help_text="Average response time in seconds")
    
    # Cost tracking
    total_tokens_used = models.PositiveIntegerField(default=0)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    
    # Date range for metrics
    date_from = models.DateField()
    date_to = models.DateField()
    
    def __str__(self):
        return f"{self.model_name} v{self.model_version} ({self.date_from} to {self.date_to})"
    
    @property
    def success_rate(self):
        if self.total_requests == 0:
            return 0
        return (self.successful_requests / self.total_requests) * 100
    
    class Meta:
        db_table = 'ai_model_performance'
        unique_together = ['model_name', 'model_version', 'date_from', 'date_to']
        ordering = ['-date_to']


class ContextPattern(TimeStampedModel):
    """
    Store identified patterns in user context
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='context_patterns')
    pattern_name = models.CharField(max_length=100)
    description = models.TextField()
    
    # Pattern details
    keywords = models.JSONField(default=list)
    frequency_score = models.FloatField(help_text="How often this pattern occurs")
    importance_score = models.FloatField(help_text="How important this pattern is")
    
    # Time patterns
    common_times = models.JSONField(default=list, help_text="Common times when pattern occurs")
    common_days = models.JSONField(default=list, help_text="Common days when pattern occurs")
    
    # Associated actions
    suggested_actions = models.JSONField(default=list)
    auto_generated_tasks = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.pattern_name} - {self.user.username}"
    
    class Meta:
        db_table = 'context_patterns'
        unique_together = ['user', 'pattern_name']
        ordering = ['-importance_score', '-frequency_score']

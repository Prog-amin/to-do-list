"""
Task management models for SmartTodos application.
Comprehensive models for tasks, categories, and context management.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TimeStampedModel
import json


class Category(TimeStampedModel):
    """
    Task categories with usage tracking and color coding
    """
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    description = models.TextField(blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['-usage_count', 'name']


class Tag(TimeStampedModel):
    """
    Flexible tagging system for tasks
    """
    name = models.CharField(max_length=50, unique=True)
    usage_count = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-usage_count', 'name']


class Task(TimeStampedModel):
    """
    Main task model with AI-powered features
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Basic task information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    
    # Priority and status
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='todo')
    
    # Time management
    deadline = models.DateTimeField(null=True, blank=True)
    estimated_duration = models.PositiveIntegerField(
        default=60, 
        help_text="Estimated duration in minutes"
    )
    actual_duration = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Actual completion time in minutes"
    )
    
    # AI-powered features
    ai_priority_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="AI-calculated priority score (0-100)"
    )
    ai_confidence_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="AI confidence in suggestions (0-100)"
    )
    ai_reasoning = models.TextField(blank=True, help_text="AI reasoning for suggestions")
    ai_enhanced_description = models.TextField(blank=True)
    ai_suggested_tags = models.JSONField(default=list, blank=True)
    
    # Relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    dependencies = models.ManyToManyField('self', symmetrical=False, blank=True)
    
    # Context relationship
    related_contexts = models.ManyToManyField('ContextEntry', blank=True)
    
    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"
    
    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.deadline and self.status != 'completed':
            from django.utils import timezone
            return self.deadline < timezone.now()
        return False
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage based on status"""
        status_percentages = {
            'todo': 0,
            'in_progress': 50,
            'completed': 100,
            'cancelled': 0
        }
        return status_percentages.get(self.status, 0)
    
    def update_category_usage(self):
        """Update category usage count when task is created/updated"""
        if self.category:
            self.category.usage_count += 1
            self.category.save()
    
    def update_tag_usage(self):
        """Update tag usage counts"""
        for tag in self.tags.all():
            tag.usage_count += 1
            tag.save()
    
    class Meta:
        ordering = ['-ai_priority_score', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['deadline']),
            models.Index(fields=['ai_priority_score']),
            models.Index(fields=['category']),
        ]


class ContextEntry(TimeStampedModel):
    """
    Daily context entries for AI analysis
    """
    SOURCE_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('notes', 'Notes'),
        ('manual', 'Manual Entry'),
        ('calendar', 'Calendar'),
        ('meeting', 'Meeting Notes'),
    ]
    
    content = models.TextField()
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='context_entries')
    
    # AI Processing
    processed = models.BooleanField(default=False)
    ai_insights = models.JSONField(default=list, blank=True)
    extracted_keywords = models.JSONField(default=list, blank=True)
    sentiment_score = models.FloatField(default=0.0, help_text="Sentiment analysis score (-1 to 1)")
    urgency_score = models.FloatField(default=0.0, help_text="AI-detected urgency (0-1)")
    
    # Relationships
    generated_tasks = models.ManyToManyField(Task, blank=True, related_name='source_contexts')
    
    def __str__(self):
        return f"{self.get_source_display()} - {self.content[:50]}..."
    
    @property
    def word_count(self):
        """Count words in content"""
        return len(self.content.split())
    
    @property
    def sentiment_label(self):
        """Convert sentiment score to label"""
        if self.sentiment_score > 0.1:
            return 'positive'
        elif self.sentiment_score < -0.1:
            return 'negative'
        return 'neutral'
    
    class Meta:
        verbose_name_plural = 'Context Entries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'processed']),
            models.Index(fields=['source']),
            models.Index(fields=['created_at']),
        ]


class TaskComment(TimeStampedModel):
    """
    Comments and notes on tasks
    """
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_ai_generated = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Comment on {self.task.title} by {self.user.username}"
    
    class Meta:
        ordering = ['-created_at']


class TaskHistory(TimeStampedModel):
    """
    Track task changes for analytics
    """
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    field_changed = models.CharField(max_length=50)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    change_reason = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"{self.task.title} - {self.field_changed} changed"
    
    class Meta:
        verbose_name_plural = 'Task Histories'
        ordering = ['-created_at']


class ProductivityMetrics(TimeStampedModel):
    """
    Store daily productivity metrics for users
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='productivity_metrics')
    date = models.DateField()
    
    # Task metrics
    tasks_completed = models.PositiveIntegerField(default=0)
    tasks_created = models.PositiveIntegerField(default=0)
    total_focus_time = models.PositiveIntegerField(default=0, help_text="In minutes")
    
    # AI metrics
    ai_suggestions_accepted = models.PositiveIntegerField(default=0)
    ai_accuracy_score = models.FloatField(default=0.0)
    
    # Productivity scores
    overall_productivity_score = models.FloatField(default=0.0)
    context_processing_score = models.FloatField(default=0.0)
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

"""
Django admin configuration for tasks app
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category, Tag, Task, ContextEntry, 
    TaskComment, TaskHistory, ProductivityMetrics
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'usage_count', 'created_by', 'created_at']
    list_filter = ['created_by', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']
    
    def color_display(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border-radius: 50%;"></div>',
            obj.color
        )
    color_display.short_description = 'Color'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'usage_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'priority', 'status', 'category', 'user', 
        'ai_priority_score', 'deadline', 'created_at'
    ]
    list_filter = [
        'priority', 'status', 'category', 'user', 
        'created_at', 'deadline'
    ]
    search_fields = ['title', 'description', 'ai_enhanced_description']
    readonly_fields = [
        'ai_priority_score', 'ai_confidence_score', 'ai_reasoning',
        'ai_enhanced_description', 'ai_suggested_tags',
        'created_at', 'updated_at'
    ]
    filter_horizontal = ['tags', 'dependencies', 'related_contexts']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'user', 'category', 'tags')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'deadline', 'estimated_duration', 'actual_duration')
        }),
        ('AI Features', {
            'fields': (
                'ai_priority_score', 'ai_confidence_score', 'ai_reasoning',
                'ai_enhanced_description', 'ai_suggested_tags'
            ),
            'classes': ('collapse',)
        }),
        ('Relationships', {
            'fields': ('dependencies', 'related_contexts'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ContextEntry)
class ContextEntryAdmin(admin.ModelAdmin):
    list_display = [
        'content_preview', 'source', 'user', 'processed', 
        'sentiment_label', 'urgency_score', 'created_at'
    ]
    list_filter = ['source', 'processed', 'user', 'created_at']
    search_fields = ['content', 'extracted_keywords']
    readonly_fields = [
        'processed', 'ai_insights', 'extracted_keywords',
        'sentiment_score', 'urgency_score', 'word_count',
        'created_at', 'updated_at'
    ]
    filter_horizontal = ['generated_tasks']
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content Preview'
    
    fieldsets = (
        ('Content', {
            'fields': ('content', 'source', 'user')
        }),
        ('AI Analysis', {
            'fields': (
                'processed', 'ai_insights', 'extracted_keywords',
                'sentiment_score', 'urgency_score'
            ),
            'classes': ('collapse',)
        }),
        ('Generated Tasks', {
            'fields': ('generated_tasks',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('word_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'content_preview', 'is_ai_generated', 'created_at']
    list_filter = ['is_ai_generated', 'user', 'created_at']
    search_fields = ['content', 'task__title']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = ['task', 'field_changed', 'user', 'change_reason', 'created_at']
    list_filter = ['field_changed', 'user', 'created_at']
    search_fields = ['task__title', 'field_changed', 'change_reason']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ProductivityMetrics)
class ProductivityMetricsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'date', 'tasks_completed', 'tasks_created',
        'total_focus_time', 'overall_productivity_score'
    ]
    list_filter = ['user', 'date']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'date')
        }),
        ('Task Metrics', {
            'fields': ('tasks_completed', 'tasks_created', 'total_focus_time')
        }),
        ('AI Metrics', {
            'fields': ('ai_suggestions_accepted', 'ai_accuracy_score')
        }),
        ('Scores', {
            'fields': ('overall_productivity_score', 'context_processing_score')
        })
    )

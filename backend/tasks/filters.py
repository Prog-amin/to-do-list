"""
Filters for tasks app API endpoints
"""

import django_filters
from django.db import models
from .models import Task, ContextEntry


class TaskFilter(django_filters.FilterSet):
    """
    Filter for Task model with various filtering options
    """
    # Basic filters
    status = django_filters.MultipleChoiceFilter(
        choices=Task.STATUS_CHOICES,
        field_name='status',
        lookup_expr='in'
    )
    priority = django_filters.MultipleChoiceFilter(
        choices=Task.PRIORITY_CHOICES,
        field_name='priority',
        lookup_expr='in'
    )
    category = django_filters.UUIDFilter(field_name='category__id')
    category_name = django_filters.CharFilter(
        field_name='category__name',
        lookup_expr='icontains'
    )
    
    # Date filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    deadline_after = django_filters.DateTimeFilter(
        field_name='deadline',
        lookup_expr='gte'
    )
    deadline_before = django_filters.DateTimeFilter(
        field_name='deadline',
        lookup_expr='lte'
    )
    
    # AI-related filters
    ai_score_min = django_filters.NumberFilter(
        field_name='ai_priority_score',
        lookup_expr='gte'
    )
    ai_score_max = django_filters.NumberFilter(
        field_name='ai_priority_score',
        lookup_expr='lte'
    )
    
    # Duration filters
    estimated_duration_min = django_filters.NumberFilter(
        field_name='estimated_duration',
        lookup_expr='gte'
    )
    estimated_duration_max = django_filters.NumberFilter(
        field_name='estimated_duration',
        lookup_expr='lte'
    )
    
    # Boolean filters
    has_deadline = django_filters.BooleanFilter(
        field_name='deadline',
        lookup_expr='isnull',
        exclude=True
    )
    is_overdue = django_filters.BooleanFilter(method='filter_overdue')
    has_ai_suggestions = django_filters.BooleanFilter(
        method='filter_has_ai_suggestions'
    )
    
    # Tag filters
    tags = django_filters.CharFilter(method='filter_tags')
    
    class Meta:
        model = Task
        fields = []
    
    def filter_overdue(self, queryset, name, value):
        """Filter overdue tasks"""
        from django.utils import timezone
        
        if value:
            return queryset.filter(
                deadline__lt=timezone.now(),
                status__in=['todo', 'in_progress']
            )
        else:
            return queryset.exclude(
                deadline__lt=timezone.now(),
                status__in=['todo', 'in_progress']
            )
    
    def filter_has_ai_suggestions(self, queryset, name, value):
        """Filter tasks with AI suggestions"""
        if value:
            return queryset.exclude(
                models.Q(ai_reasoning='') | models.Q(ai_reasoning__isnull=True)
            )
        else:
            return queryset.filter(
                models.Q(ai_reasoning='') | models.Q(ai_reasoning__isnull=True)
            )
    
    def filter_tags(self, queryset, name, value):
        """Filter by tag names (comma-separated)"""
        if not value:
            return queryset
        
        tag_names = [tag.strip() for tag in value.split(',')]
        return queryset.filter(tags__name__in=tag_names).distinct()


class ContextEntryFilter(django_filters.FilterSet):
    """
    Filter for ContextEntry model
    """
    # Basic filters
    source = django_filters.MultipleChoiceFilter(
        choices=ContextEntry.SOURCE_CHOICES,
        field_name='source',
        lookup_expr='in'
    )
    processed = django_filters.BooleanFilter(field_name='processed')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    
    # AI-related filters
    sentiment_min = django_filters.NumberFilter(
        field_name='sentiment_score',
        lookup_expr='gte'
    )
    sentiment_max = django_filters.NumberFilter(
        field_name='sentiment_score',
        lookup_expr='lte'
    )
    urgency_min = django_filters.NumberFilter(
        field_name='urgency_score',
        lookup_expr='gte'
    )
    urgency_max = django_filters.NumberFilter(
        field_name='urgency_score',
        lookup_expr='lte'
    )
    
    # Content filters
    has_insights = django_filters.BooleanFilter(method='filter_has_insights')
    has_keywords = django_filters.BooleanFilter(method='filter_has_keywords')
    keyword = django_filters.CharFilter(method='filter_keyword')
    
    class Meta:
        model = ContextEntry
        fields = []
    
    def filter_has_insights(self, queryset, name, value):
        """Filter entries with AI insights"""
        if value:
            return queryset.exclude(
                models.Q(ai_insights=[]) | models.Q(ai_insights__isnull=True)
            )
        else:
            return queryset.filter(
                models.Q(ai_insights=[]) | models.Q(ai_insights__isnull=True)
            )
    
    def filter_has_keywords(self, queryset, name, value):
        """Filter entries with extracted keywords"""
        if value:
            return queryset.exclude(
                models.Q(extracted_keywords=[]) | 
                models.Q(extracted_keywords__isnull=True)
            )
        else:
            return queryset.filter(
                models.Q(extracted_keywords=[]) | 
                models.Q(extracted_keywords__isnull=True)
            )
    
    def filter_keyword(self, queryset, name, value):
        """Filter by specific keyword in extracted keywords"""
        if not value:
            return queryset
        
        return queryset.filter(extracted_keywords__contains=[value])

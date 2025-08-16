"""
Serializers for AI Engine app
"""

from rest_framework import serializers
from .models import AIProcessingJob, AIInsight, AIConfiguration


class AIConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for AI Configuration"""
    
    class Meta:
        model = AIConfiguration
        fields = [
            'id', 'gemini_model', 'temperature', 'max_tokens',
            'auto_prioritization', 'auto_categorization', 'deadline_suggestions',
            'context_analysis', 'min_confidence_threshold', 'processing_frequency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AIProcessingJobSerializer(serializers.ModelSerializer):
    """Serializer for AI Processing Jobs"""
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = AIProcessingJob
        fields = [
            'id', 'job_type', 'job_type_display', 'status', 'status_display',
            'input_data', 'output_data', 'confidence_score', 'processing_time',
            'error_message', 'retry_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'output_data', 'confidence_score', 'processing_time',
            'error_message', 'retry_count', 'created_at', 'updated_at'
        ]


class AIInsightSerializer(serializers.ModelSerializer):
    """Serializer for AI Insights"""
    insight_type_display = serializers.CharField(source='get_insight_type_display', read_only=True)
    related_task_count = serializers.SerializerMethodField()
    related_context_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AIInsight
        fields = [
            'id', 'insight_type', 'insight_type_display', 'title', 'description',
            'confidence_score', 'impact_score', 'is_actionable', 'is_read',
            'is_dismissed', 'user_feedback', 'related_task_count',
            'related_context_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'confidence_score', 'impact_score', 'created_at', 'updated_at'
        ]
    
    def get_related_task_count(self, obj):
        return obj.related_tasks.count()
    
    def get_related_context_count(self, obj):
        return obj.related_contexts.count()


class TaskAnalysisRequestSerializer(serializers.Serializer):
    """Serializer for task analysis requests"""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.CharField(required=False, allow_blank=True)
    include_context = serializers.BooleanField(default=True)
    user_preferences = serializers.JSONField(required=False)


class ContextAnalysisRequestSerializer(serializers.Serializer):
    """Serializer for context analysis requests"""
    content = serializers.CharField()
    source = serializers.ChoiceField(
        choices=[
            ('whatsapp', 'WhatsApp'),
            ('email', 'Email'),
            ('notes', 'Notes'),
            ('manual', 'Manual Entry'),
            ('calendar', 'Calendar'),
            ('meeting', 'Meeting Notes'),
        ],
        default='manual'
    )
    extract_tasks = serializers.BooleanField(default=True)
    analyze_sentiment = serializers.BooleanField(default=True)


class BulkAnalysisRequestSerializer(serializers.Serializer):
    """Serializer for bulk analysis requests"""
    task_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False
    )
    context_entry_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False
    )
    analysis_type = serializers.ChoiceField(
        choices=[
            ('priority_update', 'Update Priorities'),
            ('categorization', 'Auto Categorization'),
            ('deadline_suggestion', 'Deadline Suggestions'),
            ('enhancement', 'Enhance Descriptions'),
        ]
    )
    force_reprocess = serializers.BooleanField(default=False)


class ProductivityInsightRequestSerializer(serializers.Serializer):
    """Serializer for productivity insight requests"""
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    include_context = serializers.BooleanField(default=True)
    insight_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('productivity_pattern', 'Productivity Pattern'),
            ('time_optimization', 'Time Optimization'),
            ('workload_balance', 'Workload Balance'),
            ('focus_recommendation', 'Focus Recommendation'),
        ]),
        required=False
    )

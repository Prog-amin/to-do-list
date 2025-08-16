"""
Serializers for tasks app API endpoints
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category, Tag, Task, ContextEntry, 
    TaskComment, ProductivityMetrics
)


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'color', 'description', 'usage_count',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model"""
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'usage_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for Task Comments"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = [
            'id', 'content', 'user', 'user_name', 'is_ai_generated',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    tag_names = serializers.StringRelatedField(source='tags', many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status',
            'deadline', 'estimated_duration', 'ai_priority_score',
            'category_name', 'category_color', 'tag_names',
            'is_overdue', 'completion_percentage', 'created_at', 'updated_at'
        ]


class TaskDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for task CRUD operations"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    comments = TaskCommentSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    # AI fields
    ai_suggestions = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'category_id',
            'tags', 'tag_ids', 'priority', 'status', 'deadline',
            'estimated_duration', 'actual_duration', 'user', 'user_name',
            'ai_priority_score', 'ai_confidence_score', 'ai_reasoning',
            'ai_enhanced_description', 'ai_suggested_tags', 'ai_suggestions',
            'comments', 'is_overdue', 'completion_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'ai_priority_score', 'ai_confidence_score',
            'ai_reasoning', 'ai_enhanced_description', 'ai_suggested_tags',
            'created_at', 'updated_at'
        ]
    
    def get_ai_suggestions(self, obj):
        """Get AI suggestions for this task"""
        return {
            'suggested_priority': obj.priority,
            'suggested_category': obj.category.name if obj.category else None,
            'suggested_tags': obj.ai_suggested_tags,
            'confidence_score': obj.ai_confidence_score,
            'reasoning': obj.ai_reasoning
        }
    
    def create(self, validated_data):
        # Handle category
        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except Category.DoesNotExist:
                pass
        
        # Handle tags
        tag_ids = validated_data.pop('tag_ids', [])
        
        # Set user
        validated_data['user'] = self.context['request'].user
        
        # Create task
        task = super().create(validated_data)
        
        # Set tags
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            task.tags.set(tags)
        
        return task
    
    def update(self, instance, validated_data):
        # Handle category
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            if category_id:
                try:
                    category = Category.objects.get(id=category_id)
                    validated_data['category'] = category
                except Category.DoesNotExist:
                    pass
            else:
                validated_data['category'] = None
        
        # Handle tags
        tag_ids = validated_data.pop('tag_ids', None)
        
        # Update task
        task = super().update(instance, validated_data)
        
        # Update tags
        if tag_ids is not None:
            tags = Tag.objects.filter(id__in=tag_ids)
            task.tags.set(tags)
        
        return task


class ContextEntrySerializer(serializers.ModelSerializer):
    """Serializer for Context Entries"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    word_count = serializers.ReadOnlyField()
    sentiment_label = serializers.ReadOnlyField()
    generated_task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ContextEntry
        fields = [
            'id', 'content', 'source', 'user', 'user_name',
            'processed', 'ai_insights', 'extracted_keywords',
            'sentiment_score', 'sentiment_label', 'urgency_score',
            'word_count', 'generated_task_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'processed', 'ai_insights', 'extracted_keywords',
            'sentiment_score', 'urgency_score', 'created_at', 'updated_at'
        ]
    
    def get_generated_task_count(self, obj):
        return obj.generated_tasks.count()
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ProductivityMetricsSerializer(serializers.ModelSerializer):
    """Serializer for Productivity Metrics"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ProductivityMetrics
        fields = [
            'id', 'user', 'user_name', 'date',
            'tasks_completed', 'tasks_created', 'total_focus_time',
            'ai_suggestions_accepted', 'ai_accuracy_score',
            'overall_productivity_score', 'context_processing_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class TaskCreateRequestSerializer(serializers.Serializer):
    """Serializer for task creation with AI assistance"""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False, allow_null=True)
    priority = serializers.ChoiceField(
        choices=Task.PRIORITY_CHOICES,
        default='medium'
    )
    deadline = serializers.DateTimeField(required=False, allow_null=True)
    estimated_duration = serializers.IntegerField(default=60)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False
    )
    
    # AI options
    use_ai_suggestions = serializers.BooleanField(default=True)
    context_aware = serializers.BooleanField(default=True)


class BulkTaskActionSerializer(serializers.Serializer):
    """Serializer for bulk task operations"""
    task_ids = serializers.ListField(child=serializers.UUIDField())
    action = serializers.ChoiceField(choices=[
        ('complete', 'Mark as Complete'),
        ('delete', 'Delete'),
        ('update_priority', 'Update Priority'),
        ('update_category', 'Update Category'),
        ('add_tags', 'Add Tags'),
    ])
    
    # Action-specific fields
    priority = serializers.ChoiceField(
        choices=Task.PRIORITY_CHOICES,
        required=False
    )
    category_id = serializers.UUIDField(required=False, allow_null=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False
    )

"""
Django signals for tasks app
Handles automatic processing and updates
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Task, ContextEntry, Category, Tag
from ai_engine.models import AIConfiguration
from ai_engine.tasks import process_task_creation, process_context_entry


@receiver(post_save, sender=User)
def create_ai_configuration(sender, instance, created, **kwargs):
    """Create AI configuration when user is created"""
    if created:
        AIConfiguration.objects.create(user=instance)


@receiver(post_save, sender=Task)
def handle_task_creation(sender, instance, created, **kwargs):
    """Handle task creation and updates"""
    if created:
        # Update category usage count
        if instance.category:
            instance.category.usage_count += 1
            instance.category.save()
        
        # Update tag usage counts
        for tag in instance.tags.all():
            tag.usage_count += 1
            tag.save()
        
        # Queue AI processing if enabled
        user_config = getattr(instance.user, 'ai_config', None)
        if user_config and user_config.auto_prioritization:
            process_task_creation.delay(str(instance.id))


@receiver(post_save, sender=ContextEntry)
def handle_context_entry_creation(sender, instance, created, **kwargs):
    """Handle context entry creation"""
    if created:
        # Queue AI processing if enabled
        user_config = getattr(instance.user, 'ai_config', None)
        if user_config and user_config.context_analysis:
            process_context_entry.delay(str(instance.id))


@receiver(post_delete, sender=Task)
def handle_task_deletion(sender, instance, **kwargs):
    """Handle task deletion"""
    # Decrease category usage count
    if instance.category:
        instance.category.usage_count = max(0, instance.category.usage_count - 1)
        instance.category.save()
    
    # Decrease tag usage counts
    for tag in instance.tags.all():
        tag.usage_count = max(0, tag.usage_count - 1)
        tag.save()


@receiver(post_save, sender=Tag)
def cleanup_unused_tags(sender, instance, **kwargs):
    """Clean up tags with zero usage"""
    if instance.usage_count == 0:
        # Optionally delete unused tags after some time
        pass


@receiver(post_save, sender=Category)
def cleanup_unused_categories(sender, instance, **kwargs):
    """Clean up categories with zero usage"""
    if instance.usage_count == 0:
        # Optionally handle unused categories
        pass

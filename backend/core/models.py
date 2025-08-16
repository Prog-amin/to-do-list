"""
Core models for SmartTodos application.
Base models and utilities shared across the application.
"""

from django.db import models
from django.contrib.auth.models import User
import uuid


class TimeStampedModel(models.Model):
    """
    Abstract base class with created_at and updated_at timestamps
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserProfile(TimeStampedModel):
    """
    Extended user profile for additional user preferences
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    timezone = models.CharField(max_length=50, default='UTC')
    work_hours_start = models.TimeField(default='09:00:00')
    work_hours_end = models.TimeField(default='17:00:00')
    productivity_score = models.FloatField(default=0.0)
    ai_preferences = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
        
    class Meta:
        db_table = 'user_profiles'

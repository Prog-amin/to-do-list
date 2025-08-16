"""
URL configuration for tasks app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, TagViewSet, TaskViewSet,
    ContextEntryViewSet, ProductivityMetricsViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'context', ContextEntryViewSet, basename='context')
router.register(r'metrics', ProductivityMetricsViewSet, basename='metrics')

urlpatterns = [
    path('', include(router.urls)),
]

# URL patterns will be:
# /api/tasks/categories/
# /api/tasks/tags/
# /api/tasks/tasks/
# /api/tasks/context/
# /api/tasks/metrics/

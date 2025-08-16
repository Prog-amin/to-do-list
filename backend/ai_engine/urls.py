"""
URL configuration for AI Engine app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AIConfigurationViewSet, AIProcessingJobViewSet,
    AIInsightViewSet, AIAnalysisViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'config', AIConfigurationViewSet, basename='ai-config')
router.register(r'jobs', AIProcessingJobViewSet, basename='ai-jobs')
router.register(r'insights', AIInsightViewSet, basename='ai-insights')
router.register(r'analyze', AIAnalysisViewSet, basename='ai-analyze')

urlpatterns = [
    path('', include(router.urls)),
]

# URL patterns will be:
# /api/ai/config/
# /api/ai/jobs/
# /api/ai/insights/
# /api/ai/analyze/

# Also expose top-level convenience endpoints matching documentation
from django.urls import re_path

analyze_viewset = AIAnalysisViewSet.as_view({
    'post': 'analyze_task'
})

analyze_context_view = AIAnalysisViewSet.as_view({
    'post': 'analyze_context'
})

suggestions_view = AIAnalysisViewSet.as_view({
    'post': 'suggestions'
})

prioritize_view = AIAnalysisViewSet.as_view({
    'post': 'prioritize'
})

deadline_view = AIAnalysisViewSet.as_view({
    'post': 'suggest_deadline'
})

enhance_view = AIAnalysisViewSet.as_view({
    'post': 'enhance_description'
})

urlpatterns += [
    path('suggestions/', suggestions_view, name='ai-suggestions'),
    path('analyze-context/', analyze_context_view, name='ai-analyze-context'),
    path('prioritize/', prioritize_view, name='ai-prioritize'),
    path('suggest-deadline/', deadline_view, name='ai-suggest-deadline'),
    path('enhance-description/', enhance_view, name='ai-enhance-description'),
]

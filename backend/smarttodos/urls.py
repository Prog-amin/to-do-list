"""
SmartTodos URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def api_root(request):
    """
    API Root endpoint providing information about available endpoints
    """
    return Response({
        'message': 'SmartTodos API',
        'version': '1.0.0',
        'endpoints': {
            'tasks': '/api/tasks/',
            'categories': '/api/categories/',
            'context': '/api/context/',
            'ai': '/api/ai/',
            'admin': '/admin/',
        },
        'documentation': '/api/docs/',
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/tasks/', include('tasks.urls')),
    path('api/ai/', include('ai_engine.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin site customization
admin.site.site_header = "SmartTodos Administration"
admin.site.site_title = "SmartTodos Admin"
admin.site.index_title = "Welcome to SmartTodos Administration"

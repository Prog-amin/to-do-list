"""
Management command to set up SmartTodos with sample data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from tasks.models import Category, Tag, Task, ContextEntry
from ai_engine.models import AIConfiguration
import uuid


class Command(BaseCommand):
    help = 'Set up SmartTodos with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--demo-user',
            action='store_true',
            help='Create demo user with sample data',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up SmartTodos...'))

        with transaction.atomic():
            demo_user = None
            # Ensure demo user exists first so we can attribute categories
            if options['demo_user']:
                demo_user = self.create_demo_user()

            # Create default categories and tags
            self.create_default_categories(user=demo_user)
            self.create_default_tags()

            # If demo user requested, create sample data after categories/tags
            if demo_user:
                self.create_sample_tasks(demo_user)
                self.create_sample_context(demo_user)

        self.stdout.write(
            self.style.SUCCESS('SmartTodos setup completed successfully!')
        )

    def create_demo_user(self):
        """Create or get demo user and AI configuration, return the user"""
        user, created = User.objects.get_or_create(
            username='demo_user',
            defaults={
                'email': 'demo@smarttodos.app',
                'first_name': 'Demo',
                'last_name': 'User',
                'is_active': True
            }
        )

        if created:
            user.set_password('demo123')
            user.save()
            self.stdout.write(f'Created demo user: {user.username}')

            # Create AI configuration
            AIConfiguration.objects.get_or_create(user=user)

        else:
            self.stdout.write(f'Demo user already exists: {user.username}')

        return user

    def create_default_categories(self, user=None):
        """Create default task categories. If user provided, set as created_by."""
        categories = [
            ('Work', '#3B82F6', 'Work-related tasks and projects'),
            ('Personal', '#10B981', 'Personal tasks and activities'),
            ('Health', '#EF4444', 'Health and wellness related tasks'),
            ('Learning', '#8B5CF6', 'Educational and skill development tasks'),
            ('Finance', '#F59E0B', 'Financial and money-related tasks'),
        ]

        for name, color, description in categories:
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={
                    'color': color,
                    'description': description,
                    'created_by': user if user else User.objects.order_by('id').first()
                }
            )
            if created:
                self.stdout.write(f'Created category: {name}')

    def create_default_tags(self):
        """Create default tags"""
        tags = [
            'urgent', 'deadline', 'important', 'quick', 'research',
            'meeting', 'email', 'phone', 'review', 'planning',
            'creative', 'analysis', 'documentation', 'follow-up'
        ]

        for tag_name in tags:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            if created:
                self.stdout.write(f'Created tag: {tag_name}')

    def create_sample_tasks(self, user):
        """Create sample tasks for demo user"""
        work_category = Category.objects.get(name='Work')
        personal_category = Category.objects.get(name='Personal')
        health_category = Category.objects.get(name='Health')

        tasks = [
            {
                'title': 'Complete Q4 project proposal',
                'description': 'Finalize quarterly proposal with budget and timeline',
                'category': work_category,
                'priority': 'high',
                'status': 'in_progress',
                'ai_priority_score': 92.5,
                'ai_reasoning': 'High priority due to client deadline'
            },
            {
                'title': 'Plan weekend hiking trip',
                'description': 'Research trails and plan outdoor activity',
                'category': personal_category,
                'priority': 'low',
                'status': 'todo',
                'ai_priority_score': 45.2,
                'ai_reasoning': 'Leisure activity with flexible timeline'
            },
            {
                'title': 'Doctor appointment checkup',
                'description': 'Annual health checkup appointment',
                'category': health_category,
                'priority': 'urgent',
                'status': 'todo',
                'ai_priority_score': 95.0,
                'ai_reasoning': 'Health appointment cannot be rescheduled'
            }
        ]

        for task_data in tasks:
            task = Task.objects.create(
                user=user,
                **task_data
            )
            self.stdout.write(f'Created task: {task.title}')

    def create_sample_context(self, user):
        """Create sample context entries for demo user"""
        contexts = [
            {
                'content': 'Client called about Q4 proposal - deadline moved up by 2 weeks',
                'source': 'email',
                'urgency_score': 0.9,
                'sentiment_score': -0.2
            },
            {
                'content': 'Reminder: Doctor appointment next Tuesday at 3pm',
                'source': 'notes',
                'urgency_score': 0.7,
                'sentiment_score': 0.1
            },
            {
                'content': 'Team meeting went well - need to follow up on performance reviews',
                'source': 'meeting',
                'urgency_score': 0.4,
                'sentiment_score': 0.6
            }
        ]

        for context_data in contexts:
            context = ContextEntry.objects.create(
                user=user,
                processed=True,
                **context_data
            )
            self.stdout.write(f'Created context entry: {context.content[:50]}...')

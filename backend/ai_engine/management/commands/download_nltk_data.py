"""Management command to download required NLTK data."""
from django.core.management.base import BaseCommand
import nltk


class Command(BaseCommand):
    help = 'Download required NLTK corpora (punkt, stopwords)'

    def handle(self, *args, **options):
        self.stdout.write('Downloading NLTK punkt...')
        nltk.download('punkt')
        self.stdout.write('Downloading NLTK stopwords...')
        nltk.download('stopwords')
        self.stdout.write(self.style.SUCCESS('NLTK data downloaded successfully.'))



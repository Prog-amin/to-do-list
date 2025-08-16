"""
Core AI processing module for SmartTodos
Handles all AI-powered features using Google Gemini API
"""

import logging
import json
import re
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

import google.generativeai as genai
from django.conf import settings
from django.utils import timezone
from textblob import TextBlob
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

logger = logging.getLogger(__name__)


@dataclass
class AITaskSuggestion:
    """Data class for AI task suggestions"""
    suggested_category: str
    suggested_priority: str
    suggested_deadline: Optional[datetime]
    enhanced_description: str
    suggested_tags: List[str]
    reasoning: str
    confidence_score: float


@dataclass
class ContextInsight:
    """Data class for context insights"""
    insight_type: str
    message: str
    confidence: float
    related_keywords: List[str]
    urgency_score: float
    sentiment_score: float


class GeminiAIProcessor:
    """
    Main AI processor using Google Gemini API
    """
    
    def __init__(self):
        """Initialize the Gemini AI processor"""
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            logger.warning("Gemini API key not found. AI features will be mocked.")
            self.enabled = False
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            self.enabled = True
        
        # Initialize text processing tools
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2)
        )
    
    def analyze_task_priority(
        self, 
        title: str, 
        description: str = "", 
        context_data: List[str] = None,
        user_preferences: Dict = None
    ) -> AITaskSuggestion:
        """
        Analyze task and provide AI-powered suggestions
        """
        try:
            if not self.enabled:
                return self._mock_task_analysis(title, description)
            
            # Prepare context
            context_text = "\n".join(context_data or [])
            
            # Create prompt for Gemini
            prompt = self._create_task_analysis_prompt(
                title, description, context_text, user_preferences
            )
            
            # Get AI response with retries
            response_text = self._call_model(prompt)

            # Parse response
            return self._parse_task_analysis_response(response_text)
            
        except Exception as e:
            logger.error(f"Error in task priority analysis: {e}")
            return self._mock_task_analysis(title, description)
    
    def analyze_context_entry(
        self, 
        content: str, 
        source: str = "manual"
    ) -> ContextInsight:
        """
        Analyze context entry and extract insights
        """
        try:
            if not self.enabled:
                return self._mock_context_analysis(content)
            
            # Create prompt for context analysis
            prompt = self._create_context_analysis_prompt(content, source)
            
            # Get AI response with retries
            response_text = self._call_model(prompt)

            # Parse response and combine with traditional NLP
            ai_insight = self._parse_context_analysis_response(response_text)
            nlp_insight = self._traditional_nlp_analysis(content)
            
            # Combine insights
            return self._combine_context_insights(ai_insight, nlp_insight)
            
        except Exception as e:
            logger.error(f"Error in context analysis: {e}")
            return self._mock_context_analysis(content)
    
    def generate_productivity_insights(
        self, 
        task_data: List[Dict], 
        context_data: List[Dict],
        metrics_data: Dict
    ) -> List[Dict]:
        """
        Generate productivity insights from user data
        """
        try:
            if not self.enabled:
                return self._mock_productivity_insights()
            
            # Prepare data summary
            summary = self._prepare_productivity_summary(
                task_data, context_data, metrics_data
            )
            
            # Create prompt
            prompt = self._create_productivity_insights_prompt(summary)
            
            # Get AI response with retries
            response_text = self._call_model(prompt)

            # Parse insights
            return self._parse_productivity_insights(response_text)
        except Exception as e:
            logger.error(f"Error generating productivity insights: {e}")
            return self._mock_productivity_insights()

    def _call_model(self, prompt: str, max_retries: int = 3, backoff_factor: float = 1.5) -> str:
        """Call the Gemini model with simple retry/backoff and return response text."""
        last_exc = None
        for attempt in range(1, max_retries + 1):
            try:
                if not self.enabled:
                    raise RuntimeError("AI disabled")
                response = self.model.generate_content(prompt)
                # Some model clients return an object with .text
                if hasattr(response, 'text'):
                    return response.text
                # Fallback to string conversion
                return str(response)
            except Exception as e:
                last_exc = e
                logger.warning(f"AI model call failed (attempt {attempt}/{max_retries}): {e}")
                if attempt < max_retries:
                    time.sleep(backoff_factor ** attempt)
                else:
                    logger.error("Max retries reached for AI model call")
        # If we reach here, raise the last exception
        raise last_exc
            
    def extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text using TF-IDF
        """
        try:
            # Clean text
            cleaned_text = self._clean_text(text)
            
            # Tokenize and remove stopwords
            tokens = word_tokenize(cleaned_text.lower())
            filtered_tokens = [
                word for word in tokens 
                if word.isalpha() and word not in self.stop_words and len(word) > 2
            ]
            
            if not filtered_tokens:
                return []
            
            # Use TF-IDF for keyword extraction
            text_corpus = [' '.join(filtered_tokens)]
            
            try:
                tfidf_matrix = self.vectorizer.fit_transform(text_corpus)
                feature_names = self.vectorizer.get_feature_names_out()
                scores = tfidf_matrix.toarray()[0]
                
                # Get top keywords
                keyword_scores = list(zip(feature_names, scores))
                keyword_scores.sort(key=lambda x: x[1], reverse=True)
                
                return [keyword for keyword, score in keyword_scores[:10] if score > 0]
            except:
                # Fallback to simple frequency counting
                from collections import Counter
                counter = Counter(filtered_tokens)
                return [word for word, _ in counter.most_common(10)]
                
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []
    
    def _create_task_analysis_prompt(
        self, 
        title: str, 
        description: str, 
        context: str,
        preferences: Dict = None
    ) -> str:
        """Create prompt for task analysis"""
        prompt = f"""
Analyze the following task and provide suggestions in JSON format:

Task Title: {title}
Task Description: {description}
Recent Context: {context[:1000] if context else "No context available"}

Please analyze this task and provide suggestions for:
1. Priority level (urgent, high, medium, low)
2. Suggested category (Work, Personal, Health, Learning, Finance, etc.)
3. Suggested deadline (estimate in days from now)
4. Enhanced description with more details
5. Relevant tags (3-5 tags)
6. Reasoning for your suggestions

Respond in this exact JSON format:
{{
    "suggested_priority": "medium",
    "suggested_category": "Work",
    "suggested_deadline_days": 7,
    "enhanced_description": "Enhanced description here",
    "suggested_tags": ["tag1", "tag2", "tag3"],
    "reasoning": "Explanation of suggestions",
    "confidence_score": 0.85
}}

Consider the context to understand urgency and importance. Be concise but helpful.
"""
        return prompt
    
    def _create_context_analysis_prompt(self, content: str, source: str) -> str:
        """Create prompt for context analysis"""
        prompt = f"""
Analyze the following {source} content and extract actionable insights:

Content: {content}

Please analyze this content and identify:
1. Main topics and themes
2. Any deadlines or time-sensitive information
3. Action items or tasks that could be created
4. Urgency level (0.0 to 1.0)
5. Emotional tone and sentiment
6. Key entities (people, places, projects)

Respond in this JSON format:
{{
    "main_topics": ["topic1", "topic2"],
    "deadlines_mentioned": ["deadline info"],
    "action_items": ["action1", "action2"],
    "urgency_score": 0.7,
    "sentiment": "positive",
    "sentiment_score": 0.3,
    "key_entities": ["entity1", "entity2"],
    "insights": ["insight1", "insight2"]
}}

Focus on practical insights that could help with task management.
"""
        return prompt
    
    def _create_productivity_insights_prompt(self, summary: str) -> str:
        """Create prompt for productivity insights"""
        prompt = f"""
Based on the following user productivity data, provide actionable insights:

{summary}

Analyze the patterns and provide 3-5 specific insights about:
1. Peak productivity times
2. Task completion patterns
3. Areas for improvement
4. Workload optimization suggestions
5. Context utilization effectiveness

Respond in this JSON format:
{{
    "insights": [
        {{
            "type": "productivity_pattern",
            "title": "Insight title",
            "description": "Detailed description",
            "impact_score": 0.8,
            "actionable": true
        }}
    ]
}}

Focus on actionable, data-driven insights.
"""
        return prompt
    
    def _parse_task_analysis_response(self, response_text: str) -> AITaskSuggestion:
        """Parse Gemini response for task analysis"""
        try:
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
            
            # Calculate deadline
            deadline = None
            if data.get('suggested_deadline_days'):
                deadline = timezone.now() + timedelta(days=data['suggested_deadline_days'])
            
            return AITaskSuggestion(
                suggested_category=data.get('suggested_category', 'Work'),
                suggested_priority=data.get('suggested_priority', 'medium'),
                suggested_deadline=deadline,
                enhanced_description=data.get('enhanced_description', ''),
                suggested_tags=data.get('suggested_tags', []),
                reasoning=data.get('reasoning', ''),
                confidence_score=data.get('confidence_score', 0.7)
            )
            
        except Exception as e:
            logger.error(f"Error parsing task analysis response: {e}")
            return self._mock_task_analysis("", "")
    
    def _parse_context_analysis_response(self, response_text: str) -> Dict:
        """Parse Gemini response for context analysis"""
        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {}
        except Exception as e:
            logger.error(f"Error parsing context analysis response: {e}")
            return {}
    
    def _traditional_nlp_analysis(self, content: str) -> Dict:
        """Perform traditional NLP analysis"""
        try:
            # Sentiment analysis
            blob = TextBlob(content)
            sentiment_score = blob.sentiment.polarity
            
            # Extract keywords
            keywords = self.extract_keywords(content)
            
            # Simple urgency detection
            urgency_keywords = [
                'urgent', 'asap', 'immediately', 'emergency', 'critical',
                'deadline', 'due', 'today', 'tomorrow', 'now'
            ]
            urgency_score = 0.0
            content_lower = content.lower()
            for keyword in urgency_keywords:
                if keyword in content_lower:
                    urgency_score += 0.2
            urgency_score = min(urgency_score, 1.0)
            
            return {
                'sentiment_score': sentiment_score,
                'keywords': keywords,
                'urgency_score': urgency_score,
                'word_count': len(content.split())
            }
            
        except Exception as e:
            logger.error(f"Error in traditional NLP analysis: {e}")
            return {
                'sentiment_score': 0.0,
                'keywords': [],
                'urgency_score': 0.0,
                'word_count': 0
            }
    
    def _combine_context_insights(self, ai_insight: Dict, nlp_insight: Dict) -> ContextInsight:
        """Combine AI and NLP insights"""
        return ContextInsight(
            insight_type='context_analysis',
            message=f"Analyzed {nlp_insight.get('word_count', 0)} words with {len(nlp_insight.get('keywords', []))} key topics identified.",
            confidence=0.8,
            related_keywords=nlp_insight.get('keywords', []),
            urgency_score=max(
                ai_insight.get('urgency_score', 0),
                nlp_insight.get('urgency_score', 0)
            ),
            sentiment_score=nlp_insight.get('sentiment_score', 0.0)
        )
    
    def _clean_text(self, text: str) -> str:
        """Clean text for processing"""
        # Remove extra whitespace and special characters
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s]', ' ', text)
        return text.strip()
    
    def _prepare_productivity_summary(
        self, 
        task_data: List[Dict], 
        context_data: List[Dict],
        metrics_data: Dict
    ) -> str:
        """Prepare productivity data summary"""
        summary = f"""
Task Summary:
- Total tasks: {len(task_data)}
- Completed tasks: {sum(1 for t in task_data if t.get('status') == 'completed')}
- Average completion time: {metrics_data.get('avg_completion_time', 'N/A')}

Context Summary:
- Total context entries: {len(context_data)}
- Most common source: {metrics_data.get('top_context_source', 'N/A')}

Productivity Metrics:
- Overall score: {metrics_data.get('productivity_score', 'N/A')}
- Focus time: {metrics_data.get('focus_time', 'N/A')}
"""
        return summary
    
    def _parse_productivity_insights(self, response_text: str) -> List[Dict]:
        """Parse productivity insights from AI response"""
        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return data.get('insights', [])
            return []
        except Exception as e:
            logger.error(f"Error parsing productivity insights: {e}")
            return []
    
    # Mock methods for when AI is not available
    def _mock_task_analysis(self, title: str, description: str) -> AITaskSuggestion:
        """Mock task analysis when AI is not available"""
        # Simple heuristics for demonstration
        priority = 'medium'
        if any(word in title.lower() for word in ['urgent', 'important', 'critical']):
            priority = 'high'
        elif any(word in title.lower() for word in ['sometime', 'maybe', 'consider']):
            priority = 'low'
        
        category = 'Work'
        if any(word in title.lower() for word in ['health', 'doctor', 'exercise']):
            category = 'Health'
        elif any(word in title.lower() for word in ['learn', 'study', 'course']):
            category = 'Learning'
        elif any(word in title.lower() for word in ['personal', 'family', 'home']):
            category = 'Personal'
        
        return AITaskSuggestion(
            suggested_category=category,
            suggested_priority=priority,
            suggested_deadline=timezone.now() + timedelta(days=7),
            enhanced_description=description or f"Complete the task: {title}",
            suggested_tags=['ai-suggested', 'mock'],
            reasoning="Mock analysis based on simple keyword detection",
            confidence_score=0.6
        )
    
    def _mock_context_analysis(self, content: str) -> ContextInsight:
        """Mock context analysis when AI is not available"""
        # Simple sentiment analysis
        blob = TextBlob(content)
        sentiment_score = blob.sentiment.polarity
        
        # Simple urgency detection
        urgency_score = 0.3
        if any(word in content.lower() for word in ['urgent', 'asap', 'deadline']):
            urgency_score = 0.8
        
        return ContextInsight(
            insight_type='mock_analysis',
            message="Context analyzed using mock AI processor",
            confidence=0.5,
            related_keywords=self.extract_keywords(content)[:5],
            urgency_score=urgency_score,
            sentiment_score=sentiment_score
        )
    
    def _mock_productivity_insights(self) -> List[Dict]:
        """Mock productivity insights"""
        return [
            {
                'type': 'productivity_pattern',
                'title': 'Peak Performance Hours',
                'description': 'Your productivity appears highest in the morning hours',
                'impact_score': 0.7,
                'actionable': True
            },
            {
                'type': 'workload_balance',
                'title': 'Task Distribution',
                'description': 'Consider balancing your workload across different categories',
                'impact_score': 0.6,
                'actionable': True
            }
        ]


# Singleton instance
ai_processor = GeminiAIProcessor()

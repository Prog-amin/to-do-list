# AI Setup: NLTK data and Gemini API key

This file documents required AI setup steps that are necessary to run the AI engine in production/development.

## NLTK corpora

The AI engine uses NLTK tokenizers and stopwords. Ensure the following corpora are available:

- punkt
- stopwords

Recommended: Run the management command to download required NLTK data:

```bash
# From backend/ directory
python manage.py download_nltk_data
```

You can also download NLTK data manually:

```bash
python -m nltk.downloader punkt stopwords
```

## Gemini API Key

Set `GEMINI_API_KEY` in `backend/.env` or your environment before starting the server.

## Management command

A management command `download_nltk_data` is provided in `ai_engine/management/commands/` to download required corpora automatically during setup.


